import { useRef, type KeyboardEvent } from 'react';

/**
 * Tira de pestañas del módulo de residuos — nodo Figma `3430:2325`, la tira de
 * "Histórico de retiros" con "Detalle de retiros" y "Desempeño por empresa".
 *
 * Geometría del design context:
 *
 *   contenedor  flex flex-col items-start pt-[4px] w-full
 *   tira        border-b #e3e3e3 · flex gap-[4px] items-start pb-px w-full
 *   pestaña     border-b-2 · flex items-center px-[14px] pt-[9px] pb-[11px]
 *               activa    borde #c8a064 · texto Inter Semi Bold 12px #001e39
 *               inactiva  borde transparente · texto Inter Semi Bold 12px #646464
 *
 * El `pb-px` de la tira es lo que hace que el subrayado de 2px de la pestaña
 * activa se monte sobre el borde de 1px de la tira en vez de empujarlo: sin él,
 * la línea gris se corre un píxel al cambiar de pestaña.
 *
 * La pestaña inactiva lleva `rgba(200,160,100,0)` en el nodo —el MISMO #c8a064
 * con alfa 0, no `border: none`—, así las dos miden igual y el texto no salta.
 * Acá se reproduce con `border-transparent`.
 *
 * Va con el patrón `tablist` de ARIA: un solo punto de tabulación en la tira
 * (roving tabindex) y flechas para moverse, que es lo que un lector de pantalla
 * espera de algo que se ve como pestañas. Los `id` los arma el componente a
 * partir de `baseId`; el panel se enlaza con `wasteTabPanelId` y
 * `aria-labelledby={wasteTabId(...)}`.
 *
 * "Folios SIDREP" (`3083:10776`) trajo la MISMA tira con otra geometría y con un
 * contador por pestaña, así que el componente pasó a tener dos variantes en vez de
 * duplicar la lógica de teclado en otro archivo. Ver `WasteTabsVariant`.
 */

export interface WasteTab<Id extends string = string> {
  id: Id;
  label: string;
  /**
   * Cuántos elementos hay en la pestaña — los "3", "12" y "48" de los nodos
   * `3083:10781`, `3083:10906` y `3083:10903`. Sin esto la pastilla no se dibuja,
   * que es lo que hacen las pestañas de "Histórico de retiros".
   */
  count?: number;
}

/**
 * Las dos tiras que dibuja el diseño. Cada una sale de un nodo concreto y difieren
 * de verdad —en el padding, en la separación y en quién dibuja la línea gris—, así
 * que se preservan las dos en vez de unificar por cuenta propia:
 *
 *   `section` `3430:2325`  la tira vive DENTRO del cuerpo de la vista, con su
 *                          propio `border-b` y `pt-[4px]` arriba
 *                          pestaña px-[14px] pt-[9px] pb-[11px] · gap-[4px]
 *   `band`    `3083:10776` la tira vive en la FRANJA blanca de abajo del header,
 *                          que ya trae su `border-b` (`3083:10772`)
 *                          pestaña px-[16px] pt-[11px] pb-[9px] · sin gap
 *
 * EL NODO DE `band` ESTÁ INCONSISTENTE Y NO SE REPRODUCE TAL CUAL: reparte el
 * estado activo entre DOS pestañas. Pone el texto azul marino `#001e39` en
 * "Pendientes de revisión" (`3083:10779`) y el subrayado dorado con la pastilla
 * dorada en "Cerrados" (`3083:10788` / `3083:10902`), que es la pestaña realmente
 * activa —la vista es la de folios cerrados—. El texto marino de la primera es un
 * resto de otro estado de la maqueta. Acá los tres rasgos van juntos en la pestaña
 * activa, que es además lo que ya hacía `section`.
 *
 * En `band` la tira se monta 2px sobre la línea de la franja (`-mb-[2px]`), que es
 * lo que hace el truco de "Container (negative margin)" de los nodos `3083:10777`,
 * `3083:10782` y `3083:10787`: sus cajas interiores miden 37px dentro de ranuras de
 * 35, así que el subrayado dorado de 2px cae encima del borde gris en vez de
 * empujarlo. Es el equivalente del `pb-px` de `section`.
 */
export type WasteTabsVariant = 'section' | 'band';

const TABS_VARIANT: Record<WasteTabsVariant, { wrapper: string; strip: string; tab: string }> = {
  section: {
    wrapper: 'pt-[4px]',
    strip: 'items-start gap-[4px] border-b border-solid border-[#e3e3e3] pb-px',
    tab: 'px-[14px] pb-[11px] pt-[9px]',
  },
  band: {
    wrapper: '',
    strip: 'items-center -mb-[2px]',
    /*
     * ALTO FIJO Y CONTENIDO CENTRADO, y no el `pt-[11px]` literal del nodo, por dos
     * razones. Una: el nodo se contradice: pone el texto en `top-[11px]` en las dos
     * pestañas inactivas y en `top-[13px]` en la activa, siendo cajas idénticas —2px
     * de ruido de maqueta, no una diferencia de diseño—. Dos: la pastilla del
     * contador mide 18px contra los 15 del rótulo, así que con padding vertical
     * crecería la pestaña y el subrayado dejaría de coincidir con la línea de la
     * franja. Con `h-[37px]` —35 de contenido más el `border-b-2`— el rótulo cae en
     * `y=10`, dentro del propio margen de error del nodo.
     */
    tab: 'h-[37px] px-[16px]',
  },
};

/**
 * Pastilla del contador. Los dos pares salen de los nodos, y NO son el mismo
 * componente que `WastePill`: esa cápsula va `rounded-[5px]`/`rounded-[20px]` con
 * texto de 10px en Inter Bold, y ésta es `rounded-[10px]` con Inter Semi Bold y dos
 * paddings distintos según el estado.
 *
 *   inactiva `3083:10780`  bg var(--gray/100_surf, #f7f7f7) · border #e3e3e3
 *                          px-[7px] py-[2px] · texto #646464
 *   activa   `3083:10902`  bg #c8a064 · sin borde
 *                          px-[6px] py-px · texto #131313
 *
 * El dorado `#c8a064` es el MISMO del subrayado de la pestaña activa: el contador
 * no introduce un color, repite el del estado.
 */
const TAB_COUNT_TONE = {
  active: 'bg-[#c8a064] px-[6px] py-px text-[#131313]',
  inactive: 'border border-solid border-[#e3e3e3] bg-[#f7f7f7] px-[7px] py-[2px] text-[#646464]',
} as const;

/** `id` del botón de una pestaña, para el `aria-labelledby` de su panel. */
export function wasteTabId(baseId: string, tabId: string): string {
  return `${baseId}-tab-${tabId}`;
}

/** `id` del panel de una pestaña, para el `aria-controls` de su botón. */
export function wasteTabPanelId(baseId: string, tabId: string): string {
  return `${baseId}-panel-${tabId}`;
}

interface WasteTabsProps<Id extends string> {
  /** Prefijo de los `id` que enlazan cada pestaña con su panel. */
  baseId: string;
  /** Nombre accesible de la tira. No se dibuja: el diseño no le pone rótulo. */
  label: string;
  tabs: readonly WasteTab<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  /** Ver `WasteTabsVariant`. Por defecto la tira de cuerpo, que es la primera que existió. */
  variant?: WasteTabsVariant;
}

export function WasteTabs<Id extends string>({
  baseId,
  label,
  tabs,
  value,
  onChange,
  variant = 'section',
}: WasteTabsProps<Id>) {
  const buttons = useRef(new Map<Id, HTMLButtonElement>());

  /**
   * En el patrón `tablist` con activación automática, mover el foco YA cambia de
   * pestaña: por eso las flechas seleccionan y enfocan en el mismo paso.
   */
  function selectAndFocus(tab: WasteTab<Id> | undefined) {
    if (!tab) return;
    onChange(tab.id);
    buttons.current.get(tab.id)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Home') {
      event.preventDefault();
      selectAndFocus(tabs[0]);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      selectAndFocus(tabs[tabs.length - 1]);
      return;
    }

    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (offset === 0) return;

    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === value);
    if (index === -1) return;
    // El recorrido es circular, como pide el patrón de ARIA.
    selectAndFocus(tabs[(index + offset + tabs.length) % tabs.length]);
  }

  const geometry = TABS_VARIANT[variant];

  return (
    <div className={`flex w-full flex-col items-start ${geometry.wrapper}`}>
      <div role="tablist" aria-label={label} className={`flex w-full ${geometry.strip}`}>
        {tabs.map((tab) => {
          const selected = tab.id === value;

          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) buttons.current.set(tab.id, node);
                else buttons.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              id={wasteTabId(baseId, tab.id)}
              aria-controls={wasteTabPanelId(baseId, tab.id)}
              aria-selected={selected}
              /* Roving tabindex: solo la pestaña activa entra en el orden de tabulación. */
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={handleKeyDown}
              className={`flex shrink-0 items-center gap-[8px] whitespace-nowrap border-b-2 border-solid font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] transition-colors ${geometry.tab} ${
                selected ? 'border-[#c8a064] text-[#001e39]' : 'border-transparent text-[#646464]'
              }`}
            >
              {tab.label}
              {/*
                `count === undefined` esconde la pastilla; un `0` SE DIBUJA. "Ningún
                folio pendiente" es información, y taparla dejaría la pestaña
                indistinguible de una que todavía no cargó.
              */}
              {tab.count === undefined ? null : (
                <span
                  className={`flex shrink-0 items-center rounded-[10px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold not-italic leading-[normal] ${
                    selected ? TAB_COUNT_TONE.active : TAB_COUNT_TONE.inactive
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
