import { WasteSinaderMarkDeclaredIcon } from '../icons/WasteSinaderReportIcons';
import { WasteFieldLabel } from './WasteFieldLabel';

/**
 * "Documentos de cierre" del panel de detalle de un folio SIDREP — nodo
 * `3083:11014`.
 *
 * Los respaldos con los que el folio quedó cerrado. NO se pueden adjuntar ni quitar
 * acá: el folio ya cerró, esto es la constancia de qué llegó.
 *
 * Geometría del design context:
 *
 *   rótulo  `3083:11015`  h-[19.5px] · texto en top-[6px]
 *                         → `WasteFieldLabel` (Inter Semi Bold 10px #646464)
 *   lista   `3083:11017`  pt-[8px] · `3083:11018` gap-[6px]
 *   fila    flex gap-[8px] items-center · alto 15px
 *   tilde   15 × 12 · var(--gray/800, #333)
 *   texto   Inter Regular 12px · var(--gray/800, #333)
 *
 * Las alturas salen del contenido y coinciden: tres filas de 15 con dos gaps de 6
 * dan los 57px del nodo `3083:11018`. ✅
 *
 * El `pb-[1.5px]` del rótulo es el resto de los 19.5px del nodo después del
 * `pt-[6px]` y de la línea de 12px. Se conserva porque es lo que deja los 8px de la
 * lista medidos desde donde el diseño los mide.
 *
 * NO ES UNA LISTA DE ADJUNTOS COMO `WasteSidrepAttachedDocsSection`: aquélla son
 * tarjetas verdes con caja, borde y detalle en dos líneas dentro de un
 * `WarehouseFormCard`. Esto es una lista desnuda de tres líneas de texto. Son dos
 * bloques distintos del sistema de diseño.
 *
 * Sale como `<ul>` para que el lector de pantalla anuncie cuántos respaldos hay.
 *
 * EL TILDE NO ES UN ICONO NUEVO: es el MISMO path que el tilde de "Marcar como
 * declarado" del Reporte SINADER (`3830:65731`), misma caja de 15 × 12 y sólo otro
 * `fill` —#333 acá, #acacac allá—, que el componente ya resuelve con
 * `currentColor`. Se comparó path por path antes de descartar versionar otro asset.
 */

/** Texto del nodo `3083:11016`. */
export const WASTE_FOLIO_CLOSURE_DOCS_LABEL = 'Documentos de cierre';

interface WasteFolioClosureDocsSectionProps {
  /**
   * Cada respaldo como lo escribe el nodo: qué es y con qué archivo llegó, unidos
   * por el guion largo — "Ticket de recepción — ticket_recepcion_04710.pdf".
   */
  docs: string[];
  /** Rótulo de la sección. Por defecto, el del nodo. */
  label?: string;
}

export function WasteFolioClosureDocsSection({
  docs,
  label = WASTE_FOLIO_CLOSURE_DOCS_LABEL,
}: WasteFolioClosureDocsSectionProps) {
  return (
    <div className="flex w-full flex-col items-start" data-name="Container">
      <div className="w-full pb-[1.5px] pt-[6px]" data-name="Container">
        <WasteFieldLabel>{label}</WasteFieldLabel>
      </div>
      <div className="w-full pt-[8px]" data-name="Container:margin">
        <ul className="flex w-full flex-col items-start gap-[6px]" data-name="Container">
          {docs.map((doc) => (
            <li key={doc} className="flex w-full items-center gap-[8px]" data-name="Container">
              <WasteSinaderMarkDeclaredIcon className="block h-[12px] w-[15px] shrink-0 text-[#333333]" />
              <span className="min-w-px truncate font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#333333]">
                {doc}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
