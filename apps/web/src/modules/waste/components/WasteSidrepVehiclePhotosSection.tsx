import { WarehouseFormEvidenceIcon } from '../icons/WarehouseIntakeFormIcons';
import {
  SIDREP_PHOTO_ACCEPT,
  SIDREP_PHOTO_HINT,
  SIDREP_VEHICLE_VIEWS,
  type SidrepVehicleViewKey,
  type WasteSidrepSupportDocsValues,
} from '../wasteSidrepSupportDocs';
import { WarehouseFormCard } from './WarehouseFormCard';
import { WasteSidrepFileDropzone } from './WasteSidrepFileDropzone';

/**
 * Tarjeta "Fotografías del vehículo" — nodo `3765:39875`.
 *
 * Caja de `WarehouseFormCard`. El cuerpo es `pt-[16px]` y las cuatro baldosas del
 * nodo `3765:39883`, separadas por 10px.
 *
 * DOS DESVÍOS DE LAYOUT, los dos por la misma razón: el nodo se desborda.
 *
 * 1. Las baldosas miden 240 × 240 y con los tres gaps de 10px suman 990, dentro de
 *    un contenedor de 954. El diseño se pasa 36px. Se usa una grilla de cuatro
 *    columnas con `aspect-square`, que conserva la proporción y el gap y reparte el
 *    ancho real disponible (~231px por baldosa a la medida de diseño).
 * 2. El contenedor arranca en `x=-18` respecto de su padre, que es la manera en que
 *    Figma compensa ese desborde. No se reproduce: sacaría las fotos del padding de
 *    la tarjeta.
 *
 * El icono del encabezado NO es nuevo: `3765:39877` es el mismo de "Respaldo"
 * (`3564:1380`), verificado por checksum, así que se reutiliza
 * `WarehouseFormEvidenceIcon`.
 *
 * CON FOTOS CARGADAS cada baldosa muestra la vista previa y el nombre del archivo
 * (nodo `3765:40128`). No se le pasa `confirmed`: la baldosa deriva su estado del
 * archivo, porque lo que dibuja es la foto y no el resultado de una validación.
 */

/** Texto del nodo `3765:39879`. */
export const SIDREP_VEHICLE_PHOTOS_TITLE = 'Fotografías del vehículo';

/** Texto del nodo `3765:39881`. */
export const SIDREP_VEHICLE_PHOTOS_DESCRIPTION =
  'Sube una foto de cada lado del camión (frontal, posterior y ambos laterales).';

interface WasteSidrepVehiclePhotosSectionProps {
  photos: WasteSidrepSupportDocsValues['photos'];
  onPhotoChange: (key: SidrepVehicleViewKey, file: File | null) => void;
}

export function WasteSidrepVehiclePhotosSection({
  photos,
  onPhotoChange,
}: WasteSidrepVehiclePhotosSectionProps) {
  return (
    <WarehouseFormCard
      icon={<WarehouseFormEvidenceIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={SIDREP_VEHICLE_PHOTOS_TITLE}
      description={SIDREP_VEHICLE_PHOTOS_DESCRIPTION}
    >
      <div className="w-full pt-[16px]">
        <div className="grid w-full grid-cols-2 gap-[10px] md:grid-cols-4">
          {SIDREP_VEHICLE_VIEWS.map(({ key, label }) => (
            <WasteSidrepFileDropzone
              key={key}
              variant="tile"
              label={label}
              hint={SIDREP_PHOTO_HINT}
              accept={SIDREP_PHOTO_ACCEPT}
              file={photos[key]}
              onChange={(file) => onPhotoChange(key, file)}
            />
          ))}
        </div>
      </div>
    </WarehouseFormCard>
  );
}
