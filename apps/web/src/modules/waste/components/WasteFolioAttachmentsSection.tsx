import { WasteFolioSupportDocIcon } from '../icons/WasteFolioSupportIcons';
import { WasteFieldLabel } from './WasteFieldLabel';

/**
 * "Documentos adjuntos" del panel de detalle de una SOLICITUD pendiente de revisión
 * — nodo `3073:6022`, dentro del panel `3073:5971`.
 *
 * Los respaldos que el transportista subió con la solicitud. Es lo que el aprobador
 * mira antes de decidir, así que la lista es LARGA —siete piezas en el nodo, contra
 * las tres de un folio ya cerrado— y cada una se lee de un vistazo: qué es, con qué
 * archivo llegó y cuánto pesa.
 *
 * Geometría del design context:
 *
 *   rótulo   `3073:6023`  h-[19.5px] · texto en top-[6px]
 *                         → `WasteFieldLabel` (Inter Semi Bold 10px #646464)
 *   lista    `3073:6025`  pt-[8px] · `3073:6026` gap-[6px]
 *   fila     `3073:6027`  bg #f9fafb · rounded-[6px]
 *                         flex gap-[7px] items-center · px-[8px] py-[6px]
 *   casilla  `3073:6028`  bg #e6f3ff · rounded-[5px] · size-[24px]
 *                         glifo centrado de 13.75 × 11 en #24588b
 *   nombre   `3073:6032`  Inter Semi Bold 10px · #131313
 *   tamaño   `3073:6034`  Inter Regular 9px · var(--gray/500, #acacac)
 *
 * Las alturas salen del contenido y coinciden: la fila mide 6 + 24 + 6 = 36, y siete
 * filas con seis `gap-[6px]` dan los 288px del nodo `3073:6026`. Con el rótulo de
 * 19.5 y el `pt-[8px]` de la lista, el bloque cierra en 315.5. ✅
 *
 * El `pb-[1.5px]` del rótulo es el resto de los 19.5px del nodo después del
 * `pt-[6px]` y de la línea de 12px, igual que en `WasteFolioClosureDocsSection`.
 *
 * NO ES `WasteFolioClosureDocsSection`, y comparten sólo el encabezado: aquélla es
 * una lista DESNUDA de tres líneas de texto con un tilde al lado —la constancia de
 * qué llegó en un folio que ya cerró—, y ésta son tarjetas con superficie, casilla
 * de icono y peso del archivo. Meter esto allá como una variante habría dejado un
 * componente donde la variante decide la fila entera.
 *
 * TAMPOCO ES `WasteSidrepAttachedDocsSection`, que son las tarjetas VERDES del
 * formulario de carga, con borde, detalle en dos líneas y acción de quitar. Acá no
 * se adjunta ni se quita nada: la solicitud llegó así.
 *
 * EL ANCHO DE 434px DE LA FILA NO SE REPRODUCE —es la caja de Figma, y coincide con
 * el interior del panel— ni el `flex-[154.656_0_0]` del nombre, que es el reparto que
 * Figma calculó para ese texto. Con `flex-1` y `truncate` el nombre ocupa lo que le
 * dejan la casilla y el peso, sale la misma medida y un archivo de nombre largo
 * recorta en vez de empujar el peso fuera de la tarjeta.
 *
 * Sale como `<ul>` para que el lector de pantalla anuncie cuántos adjuntos hay.
 */

/** Texto del nodo `3073:6024`. */
export const WASTE_FOLIO_ATTACHMENTS_LABEL = 'Documentos adjuntos';

export interface WasteFolioAttachment {
  /**
   * Qué es y con qué archivo llegó, tal como lo une el nodo: "Ticket de pesaje-
   * ticket_pesaje_0847.pdf".
   *
   * EL SEPARADOR ES UN GUION CORTO PEGADO AL RÓTULO, no el guion largo con espacios
   * de `WasteFolioClosureDocsSection`. Se reproduce como está: los siete nodos lo
   * escriben así, y "corregirlo" sería inventar una convención que el diseño no tiene.
   */
  name: string;
  /**
   * Peso del archivo ya formateado: "128 KB".
   *
   * EL NODO ESCRIBE "XX KB" EN LAS SIETE FILAS. Es un marcador de la maqueta —Figma
   * no conoce el tamaño de un archivo— y no un dato del diseño, así que el campo
   * existe y el valor lo pone quien arma la lista.
   */
  size: string;
}

interface WasteFolioAttachmentsSectionProps {
  attachments: WasteFolioAttachment[];
  /** Rótulo de la sección. Por defecto, el del nodo. */
  label?: string;
}

export function WasteFolioAttachmentsSection({
  attachments,
  label = WASTE_FOLIO_ATTACHMENTS_LABEL,
}: WasteFolioAttachmentsSectionProps) {
  return (
    <div className="flex w-full flex-col items-start" data-name="Container">
      <div className="w-full pb-[1.5px] pt-[6px]" data-name="Container">
        <WasteFieldLabel>{label}</WasteFieldLabel>
      </div>
      <div className="w-full pt-[8px]" data-name="Container:margin">
        <ul className="flex w-full flex-col items-start gap-[6px]" data-name="Container">
          {attachments.map((attachment) => (
            <li
              key={attachment.name}
              className="flex w-full items-center gap-[7px] rounded-[6px] bg-[#f9fafb] px-[8px] py-[6px]"
              data-name="Container"
            >
              <span
                className="flex size-[24px] shrink-0 items-center justify-center rounded-[5px] bg-[#e6f3ff]"
                data-name="Container"
              >
                {/*
                  MISMO ASSET que el documento del modal de respaldo (`3085:13344`):
                  misma caja de 13.75 × 11 y mismo `fill` #24588b, idéntico al que
                  exporta este nodo.
                */}
                <WasteFolioSupportDocIcon className="block h-[11px] w-[13.75px] shrink-0 text-[#24588b]" />
              </span>
              <span className="min-w-px flex-1 truncate font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold not-italic leading-[normal] text-[#131313]">
                {attachment.name}
              </span>
              <span className="shrink-0 whitespace-nowrap font-['Inter:Regular',sans-serif] text-[9px] font-normal not-italic leading-[normal] text-[#acacac]">
                {attachment.size}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
