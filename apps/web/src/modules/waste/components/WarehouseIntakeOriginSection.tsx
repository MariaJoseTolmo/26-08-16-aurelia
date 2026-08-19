import { WarehouseFormOriginIcon } from '../icons/WarehouseIntakeFormIcons';
import { WarehouseFormCard } from './WarehouseFormCard';
import { WarehouseFormTextField } from './WarehouseFormControls';

/**
 * Tarjeta "Origen del ingreso" — nodo `3564:1361`.
 *
 * Única sección sin párrafo, y por eso su cuerpo arranca con `pt-[3px]` en vez
 * de los 16px de las otras (nodo `3564:1366`).
 *
 * Los dos campos usan la familia `text` de `WarehouseFormControls` —rótulo Semi
 * Bold 11.5px #333, caja `border` de 1px y `rounded-[7px]`—, distinta de la de
 * las otras tarjetas. Está así en el diseño; ver la nota de ese archivo.
 *
 * `px-[2px]` reproduce el inset del nodo: `3564:1367` mide 990 dentro de un
 * contenedor de 994 y arranca en x=2. Sin él las dos columnas quedarían 2px más
 * anchas que en Figma.
 *
 * `maxLength` sale del esquema, no del diseño: `waste_receipts.vehicle_plate` es
 * `varchar(30)` y `driver_name` `varchar(180)`. Cortar en el cliente evita un
 * 500 al enviar algo que la columna no acepta.
 */

export const WAREHOUSE_INTAKE_ORIGIN_TITLE = 'Origen del ingreso';

interface WarehouseIntakeOriginSectionProps {
  plate: string;
  onPlateChange: (value: string) => void;
  driver: string;
  onDriverChange: (value: string) => void;
}

export function WarehouseIntakeOriginSection({
  plate,
  onPlateChange,
  driver,
  onDriverChange,
}: WarehouseIntakeOriginSectionProps) {
  return (
    <WarehouseFormCard
      icon={<WarehouseFormOriginIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={WAREHOUSE_INTAKE_ORIGIN_TITLE}
    >
      <div className="w-full px-[2px] pt-[3px]">
        <div className="grid w-full grid-cols-1 items-start gap-[14px] md:grid-cols-2">
          <WarehouseFormTextField
            label="Patente del vehículo"
            value={plate}
            onChange={onPlateChange}
            placeholder="Ej. TPDK84"
            maxLength={30}
          />
          <WarehouseFormTextField
            label="Conductor"
            value={driver}
            onChange={onDriverChange}
            placeholder="Nombre completo"
            maxLength={180}
          />
        </div>
      </div>
    </WarehouseFormCard>
  );
}
