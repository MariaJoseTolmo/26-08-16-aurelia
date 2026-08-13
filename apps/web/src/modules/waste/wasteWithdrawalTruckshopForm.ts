/**
 * Campos de la tarjeta "Lote seleccionado" que aparece al elegir Truckshop —
 * nodo `4223:9920`.
 *
 * VIVEN APARTE DE `WasteWithdrawalFormValues` por lo mismo que
 * `WasteWithdrawalDirectValues`: ese modelo es el tronco común del flujo que
 * arranca por el RESIDUO y lo consume la cadena SIDREP entera. Este arranca por
 * el SECTOR y todavía no desemboca en ninguna pantalla, así que mezclarlos
 * obligaría a las tres vistas SIDREP a arrastrar cuatro campos que nunca leen.
 *
 * NO SON LOS MISMOS CAMPOS QUE `3765:39024`, la otra tarjeta "Lote seleccionado"
 * del módulo, aunque compartan título e icono. Allá el lote ya está elegido y sus
 * datos son de SOLO LECTURA —`WarehouseFormReadOnlyField`—; acá los cuatro son
 * editables y el lote todavía no existe. Por eso son dos componentes y no uno con
 * un `readOnly`.
 */

import type {
  WasteOperationalCategoryResponse,
  WasteTypeResponse,
  WasteUnitResponse,
} from '@aurelia/contracts';
import type { WithdrawerCompany } from './wasteWithdrawalSectorDraft';
import type { WasteWithdrawalFormValues } from './wasteWithdrawalForm';
import type { WasteWithdrawableLot } from './wasteWithdrawableLots';

export interface WasteWithdrawalTruckshopValues {
  /** Selector "Residuo". Nodo `4223:9966`. */
  wasteTypeId: string | null;
  /** Selector "Categoría". Nodo `4223:9974`. */
  categoryId: string | null;
  /** Campo "Cantidad a retirar". Nodo `4223:10011`. */
  quantity: string;
  /** Selector "Unidad de medida". Nodo `4223:10004`. */
  unitId: string | null;
}

export function createWasteWithdrawalTruckshopValues(): WasteWithdrawalTruckshopValues {
  return { wasteTypeId: null, categoryId: null, quantity: '', unitId: null };
}

/**
 * `true` con los cuatro campos de la tarjeta completos.
 *
 * Es lo que habilita el CTA del aviso SIDREP: el nodo `4230:10232` lo dibuja
 * ACTIVO sobre una tarjeta con los cuatro campos llenos, mientras que el
 * `3765:39068` —el mismo aviso sin datos— lo dibuja deshabilitado.
 *
 * La cantidad se valida solo por "hay algo escrito" y no contra un saldo: acá el
 * lote todavía no existe, así que no hay disponible contra el cual comparar. Es
 * la diferencia con `isWasteWithdrawalFormComplete`, que sí parte de un lote.
 */
export function isWasteWithdrawalTruckshopComplete(values: WasteWithdrawalTruckshopValues): boolean {
  return (
    values.wasteTypeId !== null &&
    values.categoryId !== null &&
    values.unitId !== null &&
    values.quantity.trim().length > 0
  );
}

interface TruckshopDraftInput {
  values: WasteWithdrawalTruckshopValues;
  sectorLabel: string;
  /** Ver `resolveWithdrawerCompany`, que es de dónde sale. */
  company: WithdrawerCompany;
  wasteTypes: WasteTypeResponse[];
  categories: WasteOperationalCategoryResponse[];
  units: WasteUnitResponse[];
}

/**
 * Arma el borrador que el paso 1 de SIDREP espera, a partir de lo que describió
 * esta pantalla.
 *
 * ES UNA TRADUCCIÓN, NO UN LOTE REAL, y el punto entero de esta función es dejar
 * eso explícito en un solo lugar. `WasteSidrepDocumentsPage` está tipada alrededor
 * de `WasteWithdrawableLot` porque el otro camino ELIGE un lote ya recepcionado del
 * modal `3765:40585`; el del retirador lo DESCRIBE contra los catálogos, así que
 * hay tres campos del modelo que este camino no puede conocer:
 *
 *   `id`                el lote no existe en bodega todavía
 *   `entryDate`         nunca ingresó, así que no hay fecha de ingreso
 *   `availableQuantity` no hay saldo contra el cual comparar
 *
 * Los tres van VACÍOS y no inventados. Es lo que deja que el resumen dibuje
 * "2 contenedores" en vez de un "2 de 4" con un 4 salido de la nada, y lo que hace
 * que un `lotId` vacío se note el día que exista el endpoint de validación en vez
 * de viajar un id plausible y equivocado.
 *
 * `elapsedMonths` va en `null`, que en el modelo ya significa "sin plazo asociado"
 * y es la lectura correcta acá: no hay estadía en bodega que contar.
 */
export function createTruckshopWithdrawalDraft({
  values,
  sectorLabel,
  company,
  wasteTypes,
  categories,
  units,
}: TruckshopDraftInput): WasteWithdrawalFormValues {
  const wasteType = wasteTypes.find((type) => type.id === values.wasteTypeId);
  const category = categories.find((item) => item.id === values.categoryId);
  const unit = units.find((item) => item.id === values.unitId);

  const lot: WasteWithdrawableLot = {
    id: '',
    wasteType: wasteType?.name ?? '',
    wasteTypeName: wasteType?.name ?? '',
    /* La pastilla del resumen escribe la SIGLA ("RESPEL"), que es el `code` del catálogo. */
    categoryCode: category?.code ?? '',
    isHazardous: wasteType?.isHazardous ?? false,
    entryDate: '',
    origin: sectorLabel,
    elapsedMonths: null,
    availableQuantity: '',
    unitLabel: unit?.name ?? '',
    unitName: unit?.name ?? '',
  };

  return {
    lot,
    quantity: values.quantity,
    /*
     * EL TRANSPORTISTA ES LA PROPIA EECC. Esta pantalla no lo pide porque el nodo
     * `4085:77594` no dibuja un selector sino "[Nombre de la EECC]": el dato sale
     * del usuario logueado.
     *
     * NO ES COSMÉTICO Y NO PUEDE QUEDAR EN `null`. El paso 1 de SIDREP arma su
     * `ValidateWithdrawalTransportRequest` solo si hay `carrier`; sin él la query
     * queda deshabilitada, `transportValid` nunca pasa a `true` y "Continuar" no se
     * habilita aunque el formulario esté completo.
     *
     * Va el ID en `carrier` —que es lo que viaja como `carrierId`— y el nombre en
     * `carrierLabel`, que es lo que se muestra.
     */
    carrier: company.id,
    carrierLabel: company.name,
    sector: sectorLabel,
  };
}
