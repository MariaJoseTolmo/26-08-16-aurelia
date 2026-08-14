import type { ReactNode } from 'react';

/**
 * Barra fija al pie de una vista del módulo de residuos — nodo `3830:65721`
 * ("Reporte SINADER"): a la izquierda una nota de contexto, a la derecha las
 * acciones de la pantalla.
 *
 * Geometría del design context:
 *
 *   caja   bg white · border-t #e3e3e3 · w-full
 *          interior flex items-center justify-between · px-[28px] pt-[15px] pb-[14px]
 *   nota   Inter Regular 11px · #646464
 *   grupo  flex gap-[8px] items-center
 *
 * Es la MISMA caja que ya dibuja `WasteSidrepFormActions` —mismo borde, mismos
 * `px-[28px] pt-[15px] pb-[14px]`—, pero aquella la reparte con `justify-end` y
 * trae cableados el "Volver" y el "Continuar" del flujo SIDREP. Acá el pie es un
 * armazón vacío: la nota y las acciones las pone la vista. No se refactoriza el de
 * SIDREP en esta iteración porque su valor está en los dos botones concretos, no
 * en la caja.
 *
 * Va FUERA del área que scrollea, igual que el header: es la barra de acciones de
 * la pantalla, no el final del contenido. Quien la usa la monta como hermana del
 * cuerpo desplazable, no dentro.
 *
 * `flex-wrap` y `gap-[16px]` no están en el nodo. Se agregan porque en el diseño
 * la nota mide 574px y las acciones 318.5 dentro de 1100, y a viewports angostos
 * los dos bloques se pisarían: sin envolver, el botón primario saldría de cuadro.
 */

interface WasteViewFooterBarProps {
  /** Texto de contexto a la izquierda. Opcional: no toda vista tiene qué anotar. */
  note?: ReactNode;
  /** Acciones de la derecha, ya en su orden de lectura: secundaria y luego primaria. */
  children: ReactNode;
}

export function WasteViewFooterBar({ note, children }: WasteViewFooterBarProps) {
  return (
    <div className="w-full shrink-0 border-t border-solid border-[#e3e3e3] bg-white">
      <div className="flex w-full flex-wrap items-center justify-between gap-[16px] px-[28px] pb-[14px] pt-[15px]">
        {note ? (
          <p className="font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
            {note}
          </p>
        ) : (
          /* Mantiene el grupo de acciones a la derecha cuando no hay nota. */
          <span />
        )}
        <div className="flex shrink-0 items-center gap-[8px]">{children}</div>
      </div>
    </div>
  );
}
