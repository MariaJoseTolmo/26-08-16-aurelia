import { useId } from 'react';
import {
  WarehouseFormAttachedCheckIcon,
  WarehouseFormCloseIcon,
  WarehouseFormEvidenceIcon,
  WarehouseFormUploadIcon,
} from '../icons/WarehouseIntakeFormIcons';
import { WarehouseFormCard } from './WarehouseFormCard';

/**
 * Tarjeta "Respaldo" con sus dos estados: nodo `3564:1378` sin archivo y nodo
 * `3713:27341` con archivo adjunto.
 *
 * LO QUE CAMBIA AL ADJUNTAR, y solo eso:
 *
 *                    vacío (`3564:1387`)        adjunto (`3713:27393`)
 *   borde            1.5px punteado #d1d1d1     1.5px SÓLIDO #a8dfa8
 *   fondo            transparente               #e0ffd3
 *   borde del icono  #e3e3e3                    #a8dfa8
 *   icono            nube de subida             check, #006153
 *   título           12px Semi Bold             10px Semi Bold
 *   subtítulo        texto de ayuda, #646464    nombre del archivo, #2a5c16
 *   a la derecha     —                          botón de 24px para quitarlo
 *
 * El alto no cambia: 15.5 + 34 + 15.5 = 65 en los dos, y la tarjeta mide 156 en
 * los dos nodos. El `px-[2px]` del contenedor reproduce el inset del nodo
 * `3564:1386`, igual que en "Origen del ingreso".
 *
 * EL TÍTULO "(Obligatorio)" NO DEPENDE DEL ARCHIVO. El nodo `3713:27341` lo trae
 * porque pertenece a la variante RESPEL del formulario (`3713:27249`), donde
 * cambian dos cosas a la vez: la categoría peligrosa Y la foto ya cargada. Se
 * atan por separado porque un campo no se vuelve obligatorio POR haberlo
 * llenado: `required` viene de la categoría, el estado verde viene del archivo.
 * Si el diseño quiso decir otra cosa, es un cambio de una línea acá.
 *
 * LA ZONA ES UN `<label>` con un `<input type="file">` oculto, no un elemento
 * decorativo: el nodo la dibuja estática pero su propio texto dice "Sube una
 * foto de la etiqueta". Con archivo adjunto el `<label>` deja de envolver todo
 * —si no, el botón de quitar abriría el selector de archivos— y queda solo sobre
 * el bloque de icono y textos.
 *
 * El archivo NO se sube todavía: falta el endpoint de recepción. Queda en el
 * estado del formulario para la iteración que conecte el envío.
 */

export const WAREHOUSE_INTAKE_EVIDENCE_TITLE = 'Respaldo';

/** Nodo `3713:27345`: el mismo encabezado cuando el respaldo es requisito. */
export const WAREHOUSE_INTAKE_EVIDENCE_TITLE_REQUIRED = 'Respaldo (Obligatorio)';

export const WAREHOUSE_INTAKE_EVIDENCE_DESCRIPTION =
  'Sube una foto de la etiqueta del lote con la fecha de ingreso rotulada.';

const EVIDENCE_HINT = 'Debe mostrar tipo de residuo y fecha de ingreso legible';

const ZONE_CLASS = 'flex w-full items-center gap-[12px] rounded-[9px] border-[1.5px] px-[17.5px] py-[15.5px]';

interface WarehouseIntakeEvidenceSectionProps {
  photo: File | null;
  onPhotoChange: (photo: File | null) => void;
  /** Si el respaldo es requisito: agrega "(Obligatorio)" al encabezado. */
  required?: boolean;
}

export function WarehouseIntakeEvidenceSection({
  photo,
  onPhotoChange,
  required = false,
}: WarehouseIntakeEvidenceSectionProps) {
  const inputId = useId();

  return (
    <WarehouseFormCard
      icon={<WarehouseFormEvidenceIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={required ? WAREHOUSE_INTAKE_EVIDENCE_TITLE_REQUIRED : WAREHOUSE_INTAKE_EVIDENCE_TITLE}
      description={WAREHOUSE_INTAKE_EVIDENCE_DESCRIPTION}
    >
      <div className="w-full px-[2px] pt-[16px]">
        {photo ? (
          <div className={`${ZONE_CLASS} border-solid border-[#a8dfa8] bg-[#e0ffd3]`}>
            <label
              htmlFor={inputId}
              className="flex min-w-px flex-1 cursor-pointer items-center gap-[12px]"
              title="Reemplazar la fotografía"
            >
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[8px] border border-solid border-[#a8dfa8] bg-white p-px">
                <WarehouseFormAttachedCheckIcon className="block h-[14px] w-[17.5px] shrink-0 text-[#006153]" />
              </span>
              <span className="flex min-w-px flex-col items-start gap-[2px]">
                <span className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold not-italic leading-[normal] text-[#131313]">
                  Fotografía de la etiqueta
                </span>
                {/* `truncate`: el nodo muestra "imagen_123.jpg", pero un nombre real puede ser larguísimo. */}
                <span className="max-w-full truncate font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#2a5c16]">
                  {photo.name}
                </span>
              </span>
            </label>
            <button
              type="button"
              aria-label="Quitar la fotografía de la etiqueta"
              onClick={() => onPhotoChange(null)}
              className="flex size-[24px] shrink-0 items-center justify-center rounded-[5px] transition-colors hover:bg-[#a8dfa8]"
            >
              <WarehouseFormCloseIcon className="block size-[13.3333px] shrink-0 text-black" />
            </button>
          </div>
        ) : (
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
              <span className="font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#646464]">
                {EVIDENCE_HINT}
              </span>
            </span>
          </label>
        )}
        {/*
          El input vive FUERA de los dos bloques y no adentro del `<label>`: al
          cambiar de estado React desmontaría el nodo y el archivo elegido se
          perdería del elemento. Acá el `<input>` es el mismo en los dos estados.

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
