import { WarehouseFormLotIcon } from '../icons/WarehouseIntakeFormIcons';
import { WarehouseFormCard } from './WarehouseFormCard';
import {
  WarehouseFormDateField,
  WarehouseFormSelect,
  WarehouseFormTextField,
  type WarehouseFormCatalogState,
} from './WarehouseFormControls';

/**
 * Tarjeta "Datos del lote" — nodo `3713:26849`.
 *
 * Dos filas separadas, con `pt` distinto cada una (16px la primera, 14px la
 * segunda) tal como declaran los nodos `3713:26856` y `3713:26864`.
 *
 * La primera fila tiene UN campo de 322px en un contenedor de 994. No es un
 * ancho arbitrario: 994 = 3 × 322 + 2 × 14, o sea un tercio exacto de la
 * segunda fila. Por eso se implementa como una grilla de tres columnas con un
 * solo hijo —así queda alineado con "Cantidad" y sigue siendo relativo— en vez
 * de fijar 322px, que el brief prohíbe.
 *
 * "Cantidad" usa la caja del dropdown pero es un input de texto: el nodo
 * `3713:26869` no dibuja caret y su placeholder es "Ej. 5". Va con
 * `inputMode="decimal"` y no `type="number"` porque las cantidades del módulo
 * llevan coma decimal en es-CL y el input numérico rechaza la coma según el
 * locale del navegador.
 */

export const WAREHOUSE_INTAKE_LOT_TITLE = 'Datos del lote';

export const WAREHOUSE_INTAKE_LOT_DESCRIPTION =
  'Un registro representa un lote/evento de recepción (ej. varios contenedores del mismo residuo, origen y fecha).';

interface WarehouseIntakeLotSectionProps {
  entryDate: string;
  onEntryDateChange: (value: string) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
  unitId: string | null;
  onUnitChange: (value: string | null) => void;
  units: WarehouseFormCatalogState;
  originSectorId: string | null;
  onOriginSectorChange: (value: string | null) => void;
  sectors: WarehouseFormCatalogState;
}

export function WarehouseIntakeLotSection({
  entryDate,
  onEntryDateChange,
  quantity,
  onQuantityChange,
  unitId,
  onUnitChange,
  units,
  originSectorId,
  onOriginSectorChange,
  sectors,
}: WarehouseIntakeLotSectionProps) {
  return (
    <WarehouseFormCard
      icon={<WarehouseFormLotIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={WAREHOUSE_INTAKE_LOT_TITLE}
      description={WAREHOUSE_INTAKE_LOT_DESCRIPTION}
    >
      <div className="w-full pt-[16px]">
        <div className="grid w-full grid-cols-1 items-start gap-[14px] md:grid-cols-3">
          <WarehouseFormDateField label="Fecha de ingreso" value={entryDate} onChange={onEntryDateChange} />
        </div>
      </div>
      <div className="w-full pt-[14px]">
        <div className="grid w-full grid-cols-1 items-start gap-[14px] md:grid-cols-3">
          <WarehouseFormTextField
            label="Cantidad"
            value={quantity}
            onChange={onQuantityChange}
            placeholder="Ej. 5"
            tone="dropdown"
            inputMode="decimal"
          />
          <WarehouseFormSelect
            label="Unidad de medida"
            value={unitId}
            onChange={onUnitChange}
            state={units}
          />
          <WarehouseFormSelect
            label="Lugar/sector proveniente"
            value={originSectorId}
            onChange={onOriginSectorChange}
            state={sectors}
          />
        </div>
      </div>
    </WarehouseFormCard>
  );
}
