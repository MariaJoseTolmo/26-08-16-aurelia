import { useId } from 'react';
import { WarehouseFormEvidenceIcon, WarehouseFormUploadIcon } from '../icons/WarehouseIntakeFormIcons';
import { WarehouseFormCard } from './WarehouseFormCard';

/**
 * Tarjeta "Respaldo" — nodo `3564:1378`.
 *
 * Zona punteada del nodo `3564:1387`: `border-[1.5px] border-dashed #d1d1d1`,
 * `rounded-[9px]`, `px-[17.5px] py-[15.5px]`, gap 12px. El alto de 65px del nodo
 * sale de esa suma (15.5 + 34 + 15.5), no se fija.
 *
 * El `px-[2px]` del contenedor reproduce el inset del nodo `3564:1386`, igual
 * que en "Origen del ingreso".
 *
 * LA ZONA ES UN `<label>` con un `<input type="file">` oculto, no un elemento
 * decorativo: el nodo la dibuja estática pero su propio texto dice "Sube una
 * foto de la etiqueta". Una caja punteada que no acepta el archivo es una
 * promesa incumplida. No se agrega ningún elemento visual nuevo — el `<label>`
 * es la misma caja.
 *
 * El archivo NO se sube todavía: falta el endpoint de recepción. Queda en el
 * estado del formulario para la iteración que conecte el envío.
 */

export const WAREHOUSE_INTAKE_EVIDENCE_TITLE = 'Respaldo';

export const WAREHOUSE_INTAKE_EVIDENCE_DESCRIPTION =
  'Sube una foto de la etiqueta del lote con la fecha de ingreso rotulada.';

const EVIDENCE_HINT = 'Debe mostrar tipo de residuo y fecha de ingreso legible';

const ZONE_CLASS = 'flex w-full items-center gap-[12px] rounded-[9px] border-[1.5px] px-[17.5px] py-[15.5px]';

interface WarehouseIntakeEvidenceSectionProps {
  photo: File | null;
  onPhotoChange: (photo: File | null) => void;
}

export function WarehouseIntakeEvidenceSection({
  photo,
  onPhotoChange,
}: WarehouseIntakeEvidenceSectionProps) {
  const inputId = useId();

  return (
    <WarehouseFormCard
      icon={<WarehouseFormEvidenceIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={WAREHOUSE_INTAKE_EVIDENCE_TITLE}
      description={WAREHOUSE_INTAKE_EVIDENCE_DESCRIPTION}
    >
      <div className="w-full px-[2px] pt-[16px]">
        <label
          htmlFor={inputId}
          className={`${ZONE_CLASS} cursor-pointer border-dashed border-[#d1d1d1] transition-colors hover:border-[#24588b]`}
        >
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[8px] border border-solid border-[#e3e3e3] bg-white p-px">
            <WarehouseFormUploadIcon className="block h-[14px] w-[17.5px] shrink-0 text-[#24588b]" />
          </span>
          <span className="flex min-w-px flex-col items-start gap-[2px]">
            <span className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#131313]">
              Fotografía de la etiqueta
            </span>
            {/* Con archivo elegido el nombre reemplaza al texto de ayuda: es el único acuse sin inventar chrome. */}
            <span className="max-w-full truncate font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#646464]">
              {photo ? photo.name : EVIDENCE_HINT}
            </span>
          </span>
        </label>
        {/*
          `value` se limpia en cada apertura para que elegir DOS VECES el mismo
          archivo vuelva a disparar `change`; sin eso, quitar la foto y volver a
          elegir la misma no hace nada.
        */}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onClick={(event) => {
            event.currentTarget.value = '';
          }}
          onChange={(event) => onPhotoChange(event.target.files?.[0] ?? null)}
        />
      </div>
    </WarehouseFormCard>
  );
}
