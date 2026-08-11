import { toIsoDate } from './wasteIntakeFilters';
import { formatQuantity, matchesSearch } from './wasteFilterPrimitives';
import { WASTE_MONTH_SHORT_LABELS } from './wasteMonthFilter';

/**
 * Modelo de los lotes que se pueden retirar y los datos de muestra del modal
 * "Seleccionar residuo a retirar" (nodo `3765:40585`).
 *
 * Vive fuera de `components/` por lo mismo que `wasteWithdrawalRows`: es el modelo
 * de la vista, no su presentación. Cuando exista el endpoint, este archivo es el
 * que se reemplaza por el mapeo desde los contratos y el modal no se toca.
 *
 * Un lote acá es una RECEPCIÓN con saldo: el subtítulo del modal dice "Solo se
 * muestran lotes con cantidad disponible mayor a 0", así que `availableQuantity`
 * es el saldo y no la cantidad ingresada.
 */

export interface WasteWithdrawableLot {
  id: string;
  /** Residuo específico. Nodo `3765:40610`. */
  wasteType: string;
  /**
   * Sigla de la categoría que va en la pastilla: RESPEL, LODOS, GRASAS.
   *
   * Es la SIGLA y no el `name` completo del catálogo. El nodo escribe "RESPEL" en
   * una pastilla de 52px, no "RESPEL Residuos peligrosos"; el rótulo largo es el
   * de los selectores de las tablas.
   */
  categoryCode: string;
  /**
   * Decide la paleta de la pastilla y de la caja del icono.
   *
   * En el nodo, RESPEL va en rojo (`#ffd0db`/`#570b1d`) y LODOS y GRASAS en azul
   * (`#e6f3ff`/`#0d3862`) — exactamente los dos colores de `WasteHazardBadge`. O
   * sea: el color NO depende de la categoría, depende de si el residuo es
   * peligroso. Por eso el modelo guarda la bandera y no un color.
   */
  isHazardous: boolean;
  /** Fecha de ingreso a bodega, en ISO `yyyy-mm-dd`. */
  entryDate: string;
  /** Lugar de origen. Nodo `3765:40615` ("Truckshop", "PTAS Barrio Cívico"). */
  origin: string;
  /**
   * Meses en bodega, o `null` cuando la categoría no tiene plazo de
   * almacenamiento. El nodo distingue los dos casos con texto distinto:
   * "5,2 meses en bodega" contra "sin plazo asociado".
   */
  elapsedMonths: number | null;
  /** Saldo disponible, como string numérico igual que en el resto del módulo. */
  availableQuantity: string;
  /** Unidad en plural para el rótulo: "contenedores", "m³". Nodo `3765:40620`. */
  unitLabel: string;
}

/**
 * `2026-07-05` → `05 jul 2026`, el formato del nodo `3765:40615`.
 *
 * NO se usa `Intl.DateTimeFormat` con `month: 'short'`: según la versión de ICU
 * devuelve "05 jul 2026", "5 jul 2026" o "05 de jul. de 2026", y el nodo pide una
 * sola de esas tres. Las abreviaturas salen de `WASTE_MONTH_SHORT_LABELS`, que ya
 * existe para el selector de período, en minúscula como el diseño.
 */
export function formatLotEntryDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;

  const label = WASTE_MONTH_SHORT_LABELS[Number(month) - 1];
  if (!label) return iso;

  return `${day} ${label.toLowerCase()} ${year}`;
}

/** Línea de detalle del lote — nodo `3765:40615`, con "·" como separador. */
export function formatLotMeta(lot: WasteWithdrawableLot): string {
  const elapsed =
    lot.elapsedMonths === null
      ? 'sin plazo asociado'
      : `${formatQuantity(String(lot.elapsedMonths))} meses en bodega`;

  return `Ingresó ${formatLotEntryDate(lot.entryDate)} · ${lot.origin} · ${elapsed}`;
}

/**
 * Lotes que pasan el buscador del modal.
 *
 * El placeholder del nodo `3765:40601` dice "Buscar por residuo, categoría u
 * origen", así que se busca en esos TRES campos y en ningún otro: la fecha y el
 * saldo no son texto que el usuario vaya a tipear.
 */
export function filterWithdrawableLots(lots: WasteWithdrawableLot[], query: string): WasteWithdrawableLot[] {
  if (query.trim() === '') return lots;

  return lots.filter(
    (lot) =>
      matchesSearch(lot.wasteType, query) ||
      matchesSearch(lot.categoryCode, query) ||
      matchesSearch(lot.origin, query),
  );
}

/**
 * Quince lotes de muestra. Los CUATRO PRIMEROS son los del nodo, textuales
 * —"Aceite usado", "Baterías de plomo", "Lodos de planta de tratamiento",
 * "Mezclas de grasas y aceites"— con sus orígenes, saldos y unidades.
 *
 * Los once restantes existen para que el modal se pueda probar de verdad: con
 * cuatro filas la lista nunca desborda, y justamente el alto fijo del diálogo
 * —688px, con la lista scrolleando y el pie quieto— es lo que hay que verificar.
 * También le dan material al buscador, que filtra por residuo, categoría y origen.
 *
 * TRES REGLAS QUE CUMPLEN LAS QUINCE:
 *
 * 1. Los nombres son CORTOS, como en el diseño. El nodo escribe "Aceite usado" y
 *    no "Aceite usado / Aceites minerales usados", que es el `name` del catálogo:
 *    el rótulo largo es el de los selectores de las tablas, no el de esta lista.
 * 2. `isHazardous` es `true` solo en RESPEL, que es lo que dice `wasteCatalogs`:
 *    las otras siete categorías tienen `hazardous: false`. De ahí sale la paleta.
 * 3. `elapsedMonths` va con valor en los peligrosos y en `null` en el resto. Es la
 *    regla del negocio —el plazo de 6 meses aplica a RESPEL— y es lo que el nodo
 *    muestra: "5,2 meses en bodega" contra "sin plazo asociado".
 *
 * `dayOffset` cuenta días hacia atrás desde hoy para que las fechas no queden
 * congeladas en 2026. Los meses transcurridos se escriben a mano en vez de
 * derivarse, pero CADA PAR ES COHERENTE (`dayOffset / 30,4 ≈ elapsedMonths`), así
 * que la fecha y el plazo nunca se contradicen en pantalla. Ninguno cae en un
 * entero exacto a propósito: "1 meses en bodega" se leería mal.
 *
 * Los orígenes son los que ya usa `wasteIntakeRows` más "Truckshop" y "PTAS
 * Barrio Cívico", que salen del nodo.
 */
const SAMPLE_LOTS = [
  // Las cuatro filas del nodo `3765:40585`.
  { dayOffset: -12, wasteType: 'Aceite usado', categoryCode: 'RESPEL', isHazardous: true, origin: 'Truckshop', elapsedMonths: 0.4, availableQuantity: '4', unitLabel: 'contenedores' },
  { dayOffset: -158, wasteType: 'Baterías de plomo', categoryCode: 'RESPEL', isHazardous: true, origin: 'Plataforma 18', elapsedMonths: 5.2, availableQuantity: '4', unitLabel: 'contenedores' },
  { dayOffset: -37, wasteType: 'Lodos de planta de tratamiento', categoryCode: 'LODOS', isHazardous: false, origin: 'PTAS Barrio Cívico', elapsedMonths: null, availableQuantity: '30', unitLabel: 'm³' },
  { dayOffset: -9, wasteType: 'Mezclas de grasas y aceites', categoryCode: 'GRASAS', isHazardous: false, origin: 'Plataforma 18', elapsedMonths: null, availableQuantity: '25', unitLabel: 'm³' },
  // Peligrosos: llevan plazo, así que muestran meses en bodega.
  { dayOffset: -64, wasteType: 'Filtros de aceite', categoryCode: 'RESPEL', isHazardous: true, origin: 'Truckshop', elapsedMonths: 2.1, availableQuantity: '12', unitLabel: 'unidades' },
  { dayOffset: -21, wasteType: 'Solventes halogenados', categoryCode: 'RESPEL', isHazardous: true, origin: 'Centro Consolidado de Residuos', elapsedMonths: 0.7, availableQuantity: '3', unitLabel: 'tambores' },
  { dayOffset: -95, wasteType: 'Envases contaminados', categoryCode: 'RESPEL', isHazardous: true, origin: 'Bodega repuestos', elapsedMonths: 3.1, availableQuantity: '48', unitLabel: 'unidades' },
  { dayOffset: -140, wasteType: 'Tubos fluorescentes', categoryCode: 'RESPEL', isHazardous: true, origin: 'Barrio Cívico', elapsedMonths: 4.6, availableQuantity: '120', unitLabel: 'unidades' },
  { dayOffset: -172, wasteType: 'Sólidos contaminados con HC', categoryCode: 'RESPEL', isHazardous: true, origin: 'Depósito de Relave', elapsedMonths: 5.7, availableQuantity: '2.5', unitLabel: 'ton' },
  { dayOffset: -46, wasteType: 'Refrigerante usado', categoryCode: 'RESPEL', isHazardous: true, origin: 'Truckshop', elapsedMonths: 1.5, availableQuantity: '6', unitLabel: 'tambores' },
  { dayOffset: -36, wasteType: 'Chatarra eléctrica y electrónica', categoryCode: 'RESPEL', isHazardous: true, origin: 'Centro Consolidado de Residuos', elapsedMonths: 1.2, availableQuantity: '85', unitLabel: 'kg' },
  { dayOffset: -113, wasteType: 'Tóner y cartuchos', categoryCode: 'RESPEL', isHazardous: true, origin: 'Barrio Cívico', elapsedMonths: 3.7, availableQuantity: '32', unitLabel: 'unidades' },
  // No peligrosos: sin plazo asociado.
  { dayOffset: -53, wasteType: 'Chatarra ferrosa', categoryCode: 'CHATARRA', isHazardous: false, origin: 'Bodega repuestos', elapsedMonths: null, availableQuantity: '8', unitLabel: 'ton' },
  { dayOffset: -18, wasteType: 'Madera no contaminada', categoryCode: 'MADERA', isHazardous: false, origin: 'Acceso faena', elapsedMonths: null, availableQuantity: '4.5', unitLabel: 'ton' },
  { dayOffset: -5, wasteType: 'Residuos domésticos', categoryCode: 'RSD', isHazardous: false, origin: 'Campamento', elapsedMonths: null, availableQuantity: '320', unitLabel: 'kg' },
];

export function buildWasteWithdrawableLots(today: Date): WasteWithdrawableLot[] {
  return SAMPLE_LOTS.map(({ dayOffset, ...lot }, index) => ({
    ...lot,
    id: String(index + 1),
    entryDate: toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset)),
  }));
}
