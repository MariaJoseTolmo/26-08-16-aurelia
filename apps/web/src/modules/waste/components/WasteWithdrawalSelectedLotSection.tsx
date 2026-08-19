import { WasteWithdrawalSelectedLotIcon } from '../icons/WasteWithdrawalFormIcons';
import { formatLotAvailable, WASTE_CARRIER_OPTIONS } from '../wasteWithdrawalForm';
import type { WasteWithdrawableLot } from '../wasteWithdrawableLots';
import { WarehouseFormCard } from './WarehouseFormCard';
import {
  WarehouseFormReadOnlyField,
  WarehouseFormSelect,
  WarehouseFormTextField,
} from './WarehouseFormControls';

/**
 * Tarjeta "Lote seleccionado" — nodo `3765:39024`. Aparece recién cuando hay lote
 * confirmado.
 *
 * La caja es `WarehouseFormCard` con `bodyGap`: el nodo declara `gap-[8px]` en la
 * tarjeta porque no tiene párrafo, a diferencia de las otras secciones, que ponen
 * su propio `pt`.
 *
 * Dos filas de campos, las dos `flex gap-[14px] items-start` con hijos
 * `flex-[1_0_0] min-w-px self-stretch` y un `pt-[3px]` propio:
 *
 *   fila 1  `3765:39031`  tres campos de SOLO LECTURA
 *                         → `WarehouseFormReadOnlyField`
 *   fila 2  `3765:39048`  "Cantidad a retirar" (texto) y "Empresa transportista"
 *                         (selector), los dos en la familia `dropdown`
 *
 * Los 188px de alto del nodo salen de la suma y no se fijan: py-[21px]×2 + 16 del
 * encabezado + 8 + (3+55) + 8 + (3+53).
 *
 * POR QUÉ LOS CONTROLES DE LA FILA 2 SON LOS DE `WarehouseFormControls`. Sus nodos
 * (`3765:39052` y `3765:39057`) declaran exactamente la familia `dropdown` que ya
 * existe: rótulo Inter Bold 10px `#131313`, caja `border-[1.5px] #d1d1d1`
 * `rounded-[8px]` `px-[13.5px]` de 36px de alto. No se reimplementan.
 *
 * El selector recibe un `WarehouseFormCatalogState` con las opciones ya resueltas
 * porque los transportistas todavía no vienen de la API — ver
 * `WASTE_CARRIER_OPTIONS`—. El día que exista el endpoint se le pasa el estado del
 * `useQuery` y esta tarjeta no cambia: los cuatro estados de carga ya los sabe
 * dibujar `WarehouseFormSelect`.
 *
 * EL TRANSPORTISTA ES OPCIONAL, y el nodo `3748:32789` es por qué: la misma tarjeta
 * en el camino del retirador dibuja la fila 2 con UN solo campo, "Cantidad a
 * retirar", ocupando todo el ancho. No es un recorte arbitrario —ahí el
 * transportista es la propia EECC del usuario y no hay nada que elegir; ver
 * `4085:77594`, que lo muestra como "[Nombre de la EECC]"—.
 *
 * Sin `onCarrierChange` la fila queda con un hijo `flex-1`, que es exactamente lo
 * que declara `3748:32812`. No hace falta otra maqueta ni otro componente: es la
 * misma tarjeta con un campo menos.
 */

/** Rótulo del nodo `3765:39028`. */
export const SELECTED_LOT_SECTION_TITLE = 'Lote seleccionado';

interface WasteWithdrawalSelectedLotSectionProps {
  lot: WasteWithdrawableLot;
  quantity: string;
  onQuantityChange: (value: string) => void;
  carrier?: string | null;
  /** Sin esto la tarjeta no dibuja el selector de transportista. */
  onCarrierChange?: (value: string | null) => void;
}

export function WasteWithdrawalSelectedLotSection({
  lot,
  quantity,
  onQuantityChange,
  carrier = null,
  onCarrierChange,
}: WasteWithdrawalSelectedLotSectionProps) {
  return (
    <WarehouseFormCard
      bodyGap
      icon={<WasteWithdrawalSelectedLotIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={SELECTED_LOT_SECTION_TITLE}
    >
      <div className="flex w-full flex-col items-start gap-[8px]">
        <div className="w-full pt-[3px]">
          <div className="flex w-full items-start gap-[14px]">
            {/* Nodos `3765:39034`/`3765:39036`, `3765:39039`/`3765:39041` y `3765:39044`/`3765:39046`. */}
            <WarehouseFormReadOnlyField label="Residuo" value={lot.wasteType} />
            <WarehouseFormReadOnlyField label="Categoría" value={lot.categoryCode} />
            <WarehouseFormReadOnlyField label="Disponible" value={formatLotAvailable(lot)} />
          </div>
        </div>
        <div className="w-full pt-[3px]">
          <div className="flex w-full items-start gap-[14px]">
            {/*
              El placeholder es "Ej. 2" (nodo `3765:39053`), no un "#": acá el
              diseño da un ejemplo en vez del símbolo que usan los filtros de las
              tablas. `inputMode="decimal"` porque las cantidades de residuos
              llevan decimales.
            */}
            <WarehouseFormTextField
              tone="dropdown"
              inputMode="decimal"
              label="Cantidad a retirar"
              placeholder="Ej. 2"
              value={quantity}
              onChange={onQuantityChange}
            />
            {onCarrierChange ? (
              <WarehouseFormSelect
                tone="dropdown"
                label="Empresa transportista"
                placeholder="Seleccione"
                value={carrier}
                onChange={onCarrierChange}
                state={{
                  options: WASTE_CARRIER_OPTIONS,
                  isLoading: false,
                  isError: false,
                  onRetry: () => {},
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </WarehouseFormCard>
  );
}
