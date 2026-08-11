import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Desplegable de alternativa única con el lenguaje visual del Dashboard.
 *
 * DE DÓNDE SALE: `DashboardCompanyFilter` y `DashboardPeriodLite` tenían el mismo
 * menú escrito a mano, dos veces. Este componente es esa pieza extraída, para no
 * escribir una tercera copia al llevarla al formulario de ingreso a bodega.
 *
 * Panel y opciones son los de esos dos archivos, literales:
 *
 *   panel    absolute · z-50 · bg white · border #d1d1d1 · rounded-[12px]
 *            p-[8px] · shadow-[0px_4px_8px_rgba(19,19,19,0.24)] · overflow-y-auto
 *   opción   h-[40px] · rounded-[8px] · px-[8px] py-[12px] · text-left
 *            Inter Regular 13px · leading-[22.7px] · #131313
 *            elegida `bg-[#e3e3e3]`, resto `hover:bg-[#e3e3e3]`
 *            deshabilitada `opacity-40 cursor-not-allowed`
 *
 * La CAJA DEL DISPARADOR no viene de acá: entra por `triggerClassName` y
 * `valueClassName`. Las dos vistas que lo usan la dibujan distinto —el Dashboard
 * con borde de 1px y texto de 13px, el formulario de bodega con 1.5px y 12px
 * porque así está el nodo `3713:26897`— y unificarla a ojo rompería uno de los
 * dos. El componente aporta comportamiento y menú, no la geometría del campo.
 *
 * QUÉ SE AGREGA RESPECTO DE LOS DOS ORIGINALES: teclado y semántica. Aquellos
 * solo se abren con click y no exponen ningún rol, así que un lector de pantalla
 * ve dos botones sueltos y con Tab no se puede elegir nada. Acá va el patrón
 * combobox de la APG:
 *
 *   - `role="combobox"` + `aria-expanded` + `aria-controls` en el disparador,
 *     `role="listbox"` en el panel y `role="option"` en cada alternativa.
 *   - El foco NO se mueve al panel: se queda en el disparador y la alternativa
 *     activa se anuncia con `aria-activedescendant`. Así Escape y Tab siguen
 *     funcionando sin tener que devolver el foco a mano.
 *   - ↑ ↓ Home End mueven, Enter y Espacio eligen, Escape cierra, Tab cierra y
 *     sigue de largo. Las deshabilitadas se saltan.
 *
 * El placeholder es la PRIMERA alternativa del menú, no un texto muerto: es la
 * forma de volver a "sin elegir" una vez que se eligió algo. Es lo que hace
 * "Todas las empresas" en `DashboardCompanyFilter`.
 *
 * DOS FORMAS DE COLGAR EL PANEL (`portal`):
 *
 * Por defecto el panel es `absolute` y cuelga del propio componente. Alcanza
 * mientras ningún ancestro recorte, que es el caso del Dashboard y del
 * formulario de bodega.
 *
 * Dentro de una tabla NO alcanza: las dos tablas de residuos envuelven el
 * `<table>` en `overflow-hidden` —lo necesitan para que el borde redondeado
 * recorte las celdas— y la de ingresos suma `overflow-x-auto`, que según CSS
 * convierte el eje vertical en `auto` y recorta también hacia abajo. Un panel
 * anclado ahí adentro se corta o empuja scroll. Con `portal` el panel se dibuja
 * en `document.body` con `position: fixed` y la geometría medida del
 * disparador, el mismo recurso que ya usa `InspectionTableActionMenuBridge`
 * para el menú de acciones de la tabla de inspecciones.
 */

export interface SelectMenuOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectMenuProps {
  /** Id del disparador, para que un `<label htmlFor>` externo lo apunte. */
  id?: string;
  options: SelectMenuOption[];
  /** Valor elegido, o `null` cuando no hay ninguno. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Texto sin elección. También es la primera alternativa, que limpia. */
  placeholder: string;
  disabled?: boolean;
  /** Clases de la caja del disparador. Cada vista impone su geometría. */
  triggerClassName?: string;
  /** Clases del texto del disparador. */
  valueClassName?: string;
  /** Caret ya dimensionado y coloreado por quien lo usa. */
  caret?: ReactNode;
  /** Clases extra del panel, p. ej. un ancho fijo. Por defecto sigue al disparador. */
  menuClassName?: string;
  ariaLabel?: string;
  /** Dibuja el panel en `document.body` para que ningún ancestro lo recorte. */
  portal?: boolean;
}

const MENU_CLASS =
  'z-50 flex flex-col items-start overflow-y-auto rounded-[12px] border border-solid border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)]';

/** Panel anclado: el contenedor `relative` del componente es su referencia. */
const ANCHORED_MENU_CLASS = 'absolute left-0 right-0 top-[calc(100%+8px)] max-h-[280px]';

/** Panel en portal: la posición entra por `style`, medida del disparador. */
const PORTAL_MENU_CLASS = 'fixed';

const OPTION_CLASS =
  "flex h-[40px] min-h-[40px] w-full shrink-0 items-center overflow-hidden rounded-[8px] px-[8px] py-[12px] text-left font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[22.7px] text-[#131313]";

/** Separación disparador–panel del diseño y margen mínimo contra el borde. */
const MENU_GAP = 8;
const VIEWPORT_MARGIN = 8;
const MAX_MENU_HEIGHT = 280;
/**
 * Bajo esta altura el panel deja de mostrar alternativas suficientes para
 * elegir sin scrollear a ciegas: es el umbral para abrir hacia arriba.
 */
const MIN_MENU_HEIGHT = 140;

/**
 * Geometría del panel en portal. Se ancla por `top` o por `bottom` según hacia
 * dónde abra: anclar siempre por `top` obligaría a conocer el alto del panel
 * ANTES de renderizarlo, que es justo lo que no se sabe.
 */
interface MenuAnchor {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

function measureAnchor(trigger: HTMLElement): MenuAnchor {
  const rect = trigger.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_MARGIN;
  const above = rect.top - MENU_GAP - VIEWPORT_MARGIN;
  // Solo se voltea si abajo no entra Y arriba hay más lugar: cerca del borde
  // inferior de la ventana el panel se saldría de cuadro.
  const opensUp = below < MIN_MENU_HEIGHT && above > below;
  const available = opensUp ? above : below;

  return {
    left: rect.left,
    width: rect.width,
    maxHeight: Math.min(MAX_MENU_HEIGHT, Math.max(MIN_MENU_HEIGHT, available)),
    ...(opensUp ? { bottom: window.innerHeight - rect.top + MENU_GAP } : { top: rect.bottom + MENU_GAP }),
  };
}

/** Siguiente alternativa elegible en la dirección dada, saltando deshabilitadas. */
function nextEnabledIndex(items: SelectMenuOption[], from: number, step: number): number {
  for (let index = from; index >= 0 && index < items.length; index += step) {
    const item = items[index];
    if (item && !item.disabled) return index;
  }
  return -1;
}

export function SelectMenu({
  id,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  triggerClassName = '',
  valueClassName = '',
  caret,
  menuClassName = '',
  ariaLabel,
  portal = false,
}: SelectMenuProps) {
  const generatedId = useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const menuId = `${generatedId}-menu`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);

  const items = useMemo<SelectMenuOption[]>(
    () => [{ value: '', label: placeholder }, ...options],
    [options, placeholder],
  );

  const selectedIndex = items.findIndex((item) => item.value === (value ?? ''));
  /*
   * Con un valor que ya no está en el catálogo —una categoría que dejó de
   * existir entre dos cargas— se muestra el placeholder en vez de una casilla en
   * blanco. Es la única lectura honesta: el valor guardado ya no se puede rotular.
   */
  const selectedLabel = items[selectedIndex]?.label ?? placeholder;

  useEffect(() => {
    if (!open) return undefined;
    function close(event: PointerEvent) {
      const target = event.target as Node;
      // El panel en portal NO es descendiente de `rootRef`: sin este segundo
      // chequeo, tocarlo contaría como click afuera y lo cerraría.
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  /**
   * Posición del panel en portal.
   *
   * `useLayoutEffect` y no `useEffect`: se mide antes de pintar, así el panel
   * nunca se ve un cuadro en la esquina superior izquierda.
   *
   * El `scroll` va en fase de CAPTURA porque el disparador vive dentro de
   * contenedores que scrollean por su cuenta —la tabla de ingresos, el cuerpo de
   * "Control de bodega"— y esos eventos no burbujean hasta `window`. El `rAF`
   * evita recalcular más de una vez por cuadro durante el scroll.
   */
  useLayoutEffect(() => {
    if (!portal || !open) return undefined;

    let frame: number | null = null;

    function place() {
      const trigger = triggerRef.current;
      if (trigger) setAnchor(measureAnchor(trigger));
    }

    function schedule() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        place();
      });
    }

    place();
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    return () => {
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [portal, open]);

  /**
   * En portal el panel monta un ciclo DESPUÉS de abrirse, cuando ya hay medida.
   * Sin esta bandera el efecto de abajo correría contra opciones que todavía no
   * existen y la alternativa elegida no quedaría a la vista en catálogos largos.
   */
  const menuMounted = open && (!portal || anchor !== null);

  // La alternativa activa tiene que quedar visible cuando se llega con teclado.
  useEffect(() => {
    if (!menuMounted) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [menuMounted, activeIndex]);

  function openMenu(startIndex: number) {
    if (disabled) return;
    setActiveIndex(startIndex);
    setOpen(true);
  }

  function choose(index: number) {
    const item = items[index];
    if (!item || item.disabled) return;
    onChange(item.value === '' ? null : item.value);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (event.key === 'Escape') {
      if (!open) return;
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }

    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMenu(selectedIndex >= 0 ? selectedIndex : 0);
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(activeIndex);
      return;
    }

    const moves: Record<string, number> = {
      ArrowDown: nextEnabledIndex(items, activeIndex + 1, 1),
      ArrowUp: nextEnabledIndex(items, activeIndex - 1, -1),
      Home: nextEnabledIndex(items, 0, 1),
      End: nextEnabledIndex(items, items.length - 1, -1),
    };

    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    // -1 significa que no hay nada elegible en esa dirección: no se mueve.
    if (target >= 0) setActiveIndex(target);
  }

  const menu = (
    <div
      id={menuId}
      ref={menuRef}
      role="listbox"
      aria-labelledby={triggerId}
      style={
        portal && anchor
          ? { left: anchor.left, width: anchor.width, maxHeight: anchor.maxHeight, top: anchor.top, bottom: anchor.bottom }
          : undefined
      }
      className={`${MENU_CLASS} ${portal ? PORTAL_MENU_CLASS : ANCHORED_MENU_CLASS} ${menuClassName}`}
    >
      {items.map((item, index) => (
        <div
          key={item.value === '' ? '__placeholder__' : item.value}
          id={`${menuId}-${index}`}
          ref={(node) => {
            optionRefs.current[index] = node;
          }}
          role="option"
          aria-selected={index === selectedIndex}
          aria-disabled={item.disabled}
          onPointerDown={(event) => {
            // El `pointerdown` no debe llegar al listener que cierra por
            // click afuera, que corre antes que el `click` de la opción.
            event.stopPropagation();
          }}
          onClick={() => choose(index)}
          onMouseEnter={() => !item.disabled && setActiveIndex(index)}
          className={`${OPTION_CLASS} ${
            item.disabled
              ? 'cursor-not-allowed bg-white opacity-40'
              : index === selectedIndex || index === activeIndex
                ? 'cursor-pointer bg-[#e3e3e3]'
                : 'cursor-pointer bg-white'
          }`}
        >
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={open ? `${menuId}-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu(selectedIndex >= 0 ? selectedIndex : 0))}
        onKeyDown={handleKeyDown}
        className={triggerClassName}
      >
        <span className={valueClassName}>{selectedLabel}</span>
        {caret}
      </button>
      {/*
        En portal se espera a tener la medida: renderizar antes dejaría ver el
        panel un cuadro en (0, 0) antes de saltar a su lugar.
      */}
      {open ? (portal ? (anchor ? createPortal(menu, document.body) : null) : menu) : null}
    </div>
  );
}
