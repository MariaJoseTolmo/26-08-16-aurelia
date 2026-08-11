import { WasteSidrepRequiredDocsIcon } from '../icons/WasteSidrepDocumentsIcons';
import {
  SIDREP_DOC_ACCEPT,
  SIDREP_DOC_HINT,
  SIDREP_REQUIRED_DOCS,
  type SidrepRequiredDocKey,
  type WasteSidrepSupportDocsValues,
} from '../wasteSidrepSupportDocs';
import { WarehouseFormCard } from './WarehouseFormCard';
import { WasteSidrepFileDropzone } from './WasteSidrepFileDropzone';

/**
 * Tarjeta "Documentos obligatorios" — nodo `3765:39845`.
 *
 * Caja de `WarehouseFormCard` sin cambios. El cuerpo es `pt-[16px]` y una fila
 * `flex gap-[12px] items-start` con dos zonas de carga `flex-[1_0_0] min-w-px`.
 *
 * OJO CON EL GAP: acá es 12px (`3765:39853`) y no 14px como en las filas de campos
 * de las otras tarjetas. Es lo que declara el nodo y se respeta.
 *
 * Las dos zonas son `WasteSidrepFileDropzone` en variante fila: el nodo declara
 * exactamente la misma caja que el "Ticket de pesaje" del paso 1, verificado
 * incluso a nivel de asset —el glifo de la nube es el mismo archivo—.
 */

/** Texto del nodo `3765:39849`. */
export const SIDREP_REQUIRED_DOCS_TITLE = 'Documentos obligatorios';

/** Texto del nodo `3765:39851`. */
export const SIDREP_REQUIRED_DOCS_DESCRIPTION =
  'Adjunta los documentos requeridos por el Instructivo SIDREP.';

interface WasteSidrepRequiredDocsSectionProps {
  docs: WasteSidrepSupportDocsValues['docs'];
  onDocChange: (key: SidrepRequiredDocKey, file: File | null) => void;
}

export function WasteSidrepRequiredDocsSection({
  docs,
  onDocChange,
}: WasteSidrepRequiredDocsSectionProps) {
  return (
    <WarehouseFormCard
      icon={<WasteSidrepRequiredDocsIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={SIDREP_REQUIRED_DOCS_TITLE}
      description={SIDREP_REQUIRED_DOCS_DESCRIPTION}
    >
      <div className="w-full pt-[16px]">
        <div className="flex w-full items-start gap-[12px]">
          {SIDREP_REQUIRED_DOCS.map(({ key, label }) => (
            <WasteSidrepFileDropzone
              key={key}
              label={label}
              hint={SIDREP_DOC_HINT}
              accept={SIDREP_DOC_ACCEPT}
              file={docs[key]}
              confirmed={docs[key] !== null}
              onChange={(file) => onDocChange(key, file)}
            />
          ))}
        </div>
      </div>
    </WarehouseFormCard>
  );
}
