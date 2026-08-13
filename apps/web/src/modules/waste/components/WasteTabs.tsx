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
 */

export interface WasteTab<Id extends string = string> {
  id: Id;
  label: string;
}

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
}

export function WasteTabs<Id extends string>({
  baseId,
  label,
  tabs,
  value,
  onChange,
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

  return (
    <div className="flex w-full flex-col items-start pt-[4px]">
      <div
        role="tablist"
        aria-label={label}
        className="flex w-full items-start gap-[4px] border-b border-solid border-[#e3e3e3] pb-px"
      >
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
              className={`flex shrink-0 items-center whitespace-nowrap border-b-2 border-solid px-[14px] pb-[11px] pt-[9px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] transition-colors ${
                selected ? 'border-[#c8a064] text-[#001e39]' : 'border-transparent text-[#646464]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
