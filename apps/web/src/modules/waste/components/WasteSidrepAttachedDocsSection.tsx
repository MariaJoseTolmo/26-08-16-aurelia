import { WarehouseFormAttachedCheckIcon } from '../icons/WarehouseIntakeFormIcons';
import { WasteSidrepRequiredDocsIcon } from '../icons/WasteSidrepDocumentsIcons';
import { WarehouseFormCard } from './WarehouseFormCard';

/**
 * Tarjeta "Documentos adjuntos" del paso 3 — nodo `3765:35743`.
 *
 * Lista los seis respaldos que la solicitud lleva, en dos columnas. No hay nada que
 * adjuntar acá: es la última mirada antes de firmar.
 *
 * Geometría del nodo:
 *
 *   grilla  `3765:35749` dos columnas de 489 con gap de 12 —el `x=-18` del
 *           contenedor es un desprolijo de la maqueta y no se reproduce—
 *   fila    `3765:35750` bg #e0ffd3 · border-[1.5px] #a8dfa8 · rounded-[9px]
 *           flex gap-[12px] items-center · px-[17.5px] py-[15.5px]
 *   check   caja 34 × 34 · bg white · border #a8dfa8 · rounded-[8px]
 *           glifo 17.5 × 14
 *   título  Inter Semi Bold 12px #131313
 *   detalle Inter Regular 10.5px #2a5c16
 *
 * EL VERDE ES EL MISMO PAR QUE YA USA EL MÓDULO para "esto quedó adjunto":
 * `#e0ffd3` con borde `#a8dfa8` es lo que dibujan las filas de archivo cargado del
 * paso 2, y `#2a5c16` es el verde de texto que comparte con las tarjetas `success`.
 *
 * NINGUNO DE LOS DOS ICONOS ES NUEVO: el check es `3713:27396` —el mismo de los
 * adjuntos del paso 2— y el del encabezado es `3765:39847`, el de "Documentos
 * obligatorios". Se compararon contra los assets versionados.
 *
 * LAS FILAS SON UNA LISTA, no seis divs sueltos: sale como `<ul>` porque eso es lo
 * que un lector de pantalla necesita para anunciar "6 elementos".
 */

export const SIDREP_ATTACHED_DOCS_TITLE = 'Documentos adjuntos';

export interface SidrepAttachedDoc {
  /** Qué es. Nodo `3765:35756` y hermanos. */
  label: string;
  /**
   * Nombre del archivo, o la aclaración que lo reemplaza cuando no hay uno —"vigente
   * · Hidronor Chile S.A.", "frontal, posterior, ambos laterales"—.
   */
  detail: string;
}

interface WasteSidrepAttachedDocsSectionProps {
  docs: SidrepAttachedDoc[];
}

export function WasteSidrepAttachedDocsSection({ docs }: WasteSidrepAttachedDocsSectionProps) {
  return (
    <WarehouseFormCard
      icon={<WasteSidrepRequiredDocsIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={SIDREP_ATTACHED_DOCS_TITLE}
    >
      <div className="w-full pt-[3px]">
        <ul className="grid w-full grid-cols-1 gap-[12px] md:grid-cols-2">
          {docs.map((doc) => (
            <li
              key={doc.label}
              className="flex items-center gap-[12px] rounded-[9px] border-[1.5px] border-solid border-[#a8dfa8] bg-[#e0ffd3] px-[17.5px] py-[15.5px]"
            >
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[8px] border border-solid border-[#a8dfa8] bg-white">
                <WarehouseFormAttachedCheckIcon className="block h-[14px] w-[17.5px] shrink-0 text-[#2a5c16]" />
              </span>
              <span className="flex min-w-px flex-col items-start gap-[2px]">
                <span className="truncate font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#131313]">
                  {doc.label}
                </span>
                <span className="truncate font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#2a5c16]">
                  {doc.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </WarehouseFormCard>
  );
}
