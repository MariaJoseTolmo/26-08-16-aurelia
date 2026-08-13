import { WasteWithdrawalSelectedLotIcon } from '../icons/WasteWithdrawalFormIcons';
import type { WasteWithdrawalTruckshopValues } from '../wasteWithdrawalTruckshopForm';
import { WarehouseFormCard } from './WarehouseFormCard';
import {
  WarehouseFormSelect,
  WarehouseFormTextField,
  type WarehouseFormCatalogState,
} from './WarehouseFormControls';

/**
 * Tarjeta "Lote seleccionado" de la solicitud del retirador — nodo `4223:9920`.
 *
 * Aparece SOLO con Truckshop elegido: es el nodo `4223:9770`, que es la misma
 * pantalla de `4217:7111` con esta tarjeta agregada debajo de "Sector". Con
 * Bodega (Plataforma 18) el diseño todavía no dibuja nada, así que no aparece.
 *
 * COMPARTE TÍTULO E ICONO CON `WasteWithdrawalSelectedLotSection` Y NO ES LA
 * MISMA TARJETA. Allá (`3765:39024`) el lote ya está elegido y sus datos se
 * muestran en campos de solo lectura; acá los cuatro son editables y el lote
 * todavía no existe. Fusionarlas detrás de un `readOnly` daría un componente que
 * cambia de propósito según un booleano.
 *
 * El glifo SÍ es el mismo: se comparó el `path` del asset de `4223:9922` contra
 * el de `3765:39026` y son idénticos carácter por carácter, así que se reusa
 * `WasteWithdrawalSelectedLotIcon` en vez de versionar un segundo archivo.
 *
 * Geometría del nodo:
 *
 *   tarjeta   la de `WarehouseFormCard` con `gap-[8px]` — no tiene párrafo, que
 *             es justo el caso para el que existe `bodyGap`
 *   filas     `4223:9925` y `4223:9992`, cada una con `pt-[3px]` y dos columnas
 *             iguales separadas 14px sobre 954 de ancho
 *   campos    familia `dropdown` de `WarehouseFormControls`: rótulo Inter Bold
 *             10px #131313, caja h-36 `border-[1.5px]` #d1d1d1 `rounded-[8px]`
 *
 * Los 186px de alto del nodo NO se fijan: son 21 + 16 del encabezado, más dos
 * veces (8 de gap + 3 de `pt` + 53 de fila), más los 21 de abajo.
 *
 * LOS DOS PRIMEROS SELECTORES NO ESTÁN ENCADENADOS, al revés de "Categoría y
 * residuo específico" en la recepción a bodega (`3713:26885`). Allá la propia
 * tarjeta enuncia la regla —"La categoría operativa determina automáticamente si
 * el residuo es peligroso"— y por eso elegir categoría acota el catálogo de
 * residuos. Acá el nodo no dice nada de eso, muestra los dos con "Seleccione" y
 * pone "Residuo" PRIMERO. Encadenarlos sería invertir el orden que dibuja el
 * diseño por una regla que este nodo no declara.
 *
 * Las columnas van en `grid-cols-2` fraccionario y colapsan bajo `md`, igual que
 * el resto de las filas de dos campos del módulo: los 470px del nodo son la
 * mitad de 954, no una medida fija.
 */

/** Texto del nodo `4223:9924`. */
export const WASTE_WITHDRAWAL_TRUCKSHOP_LOT_TITLE = 'Lote seleccionado';

interface WasteWithdrawalTruckshopLotSectionProps {
  values: WasteWithdrawalTruckshopValues;
  onChange: (values: WasteWithdrawalTruckshopValues) => void;
  wasteTypes: WarehouseFormCatalogState;
  categories: WarehouseFormCatalogState;
  units: WarehouseFormCatalogState;
}

export function WasteWithdrawalTruckshopLotSection({
  values,
  onChange,
  wasteTypes,
  categories,
  units,
}: WasteWithdrawalTruckshopLotSectionProps) {
  return (
    <WarehouseFormCard
      icon={<WasteWithdrawalSelectedLotIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={WASTE_WITHDRAWAL_TRUCKSHOP_LOT_TITLE}
      bodyGap
    >
      <div className="w-full pt-[3px]">
        <div className="grid w-full grid-cols-1 items-start gap-[14px] md:grid-cols-2">
          <WarehouseFormSelect
            label="Residuo"
            value={values.wasteTypeId}
            onChange={(value) => onChange({ ...values, wasteTypeId: value })}
            state={wasteTypes}
          />
          <WarehouseFormSelect
            label="Categoría"
            value={values.categoryId}
            onChange={(value) => onChange({ ...values, categoryId: value })}
            state={categories}
          />
        </div>
      </div>
      <div className="w-full pt-[3px]">
        <div className="grid w-full grid-cols-1 items-start gap-[14px] md:grid-cols-2">
          {/*
            El único campo tecleable de la tarjeta. Va con la familia `dropdown`
            —no `text`— porque el nodo `4223:10011` declara su misma caja:
            `border-[1.5px]`, `rounded-[8px]` y `px-[13.5px]`.
          */}
          <WarehouseFormTextField
            label="Cantidad a retirar"
            value={values.quantity}
            onChange={(value) => onChange({ ...values, quantity: value })}
            placeholder="Ej. 2"
            tone="dropdown"
            inputMode="decimal"
          />
          <WarehouseFormSelect
            label="Unidad de medida"
            value={values.unitId}
            onChange={(value) => onChange({ ...values, unitId: value })}
            state={units}
          />
        </div>
      </div>
    </WarehouseFormCard>
  );
}
