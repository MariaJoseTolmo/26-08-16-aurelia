import { toIsoDate } from './wasteIntakeFilters';

/**
 * Modelo de fila de "Ingresos a bodega" y los datos de muestra del nodo
 * `3729:27632`.
 *
 * Vive fuera de `components/` por la misma razón que `wasteWarehouseThresholds`
 * y `wasteMonthProgress`: es el modelo de la vista, no su presentación. Cuando la
 * vista consuma la API, este archivo es el que se reemplaza por el mapeo desde
 * los contratos, y la tabla no se toca.
 *
 * El modelo calca las columnas de `waste_receipts` en la base: `received_at`,
 * `origin_sector_id`/`origin_location_text`, `vehicle_plate`, `driver_name`.
 */

export interface WarehouseIntakeRow {
  id: string;
  /**
   * Fecha de ingreso en ISO `yyyy-mm-dd`. El diseño la muestra como `dd-mm-aaaa`
   * —eso es presentación, se formatea al renderizar— pero el dato tiene que ser
   * una fecha real para que el filtro funcione.
   */
  entryDate: string;
  category: string;
  wasteType: string;
  /**
   * Cantidad como STRING numérico, no como `number`: es lo que devuelve la API.
   * Las columnas `numeric` de Postgres llegan como texto y no hay transformer en
   * TypeORM (`WasteDecimalString` en `@aurelia/contracts`). Se formatea para
   * mostrar y se parsea para comparar.
   */
  quantity: string;
  unit: string;
  /** Lugar o sector de origen del residuo. */
  origin: string;
  /** Patente del vehículo que trajo la carga. */
  plate: string;
  driver: string;
  isHazardous: boolean;
}

/**
 * Las seis filas del nodo.
 *
 * En Figma las seis repiten el mismo texto ("Categoría del residuo", "Detalle del
 * residuo", "dd-mm-aaaa"…): son marcadores de posición, no datos. Con los filtros
 * andando eso no sirve —un selector con una sola alternativa no se puede probar—,
 * así que cada columna filtrable trae valores distintos.
 *
 * Categoría, residuo, unidad y lugar NO son inventados: salen de los catálogos que
 * ya están en la base (`waste_operational_categories`, `waste_types` con su
 * `is_hazardous`, `waste_units`, `sectors`), así que las alternativas que se
 * despliegan son las mismas que va a devolver la API.
 *
 * Cantidad, patente y conductor sí son valores de muestra —la base todavía no
 * tiene ingresos con estos datos—, pero tienen que ser distintos entre filas por
 * el mismo motivo: sus filtros son de escritura y con seis veces el mismo valor
 * no se pueden probar. `quantity` va como string numérico, incluido un decimal,
 * para ejercitar el formato es-CL ("2,5").
 *
 * `dayOffset` cuenta días desde hoy: cuatro filas caen en el día en curso —el
 * filtro por defecto— y dos quedan atrás para que se vea el efecto de mover o
 * limpiar la fecha.
 *
 * La alternancia peligroso / no peligroso reproduce la del nodo, y acá además es
 * consecuencia del residuo elegido, no un dato suelto.
 */
const SAMPLE_ROWS = [
  { dayOffset: 0, category: 'Residuos peligrosos', wasteType: 'Aceite usado', quantity: '4', unit: 'Tambor', origin: 'Centro Consolidado de Residuos', plate: 'JKPR34', driver: 'Camila Rojas', isHazardous: true },
  { dayOffset: 0, category: 'Industriales no peligrosos', wasteType: 'Chatarra metálica', quantity: '2.5', unit: 'Tonelada', origin: 'Bodega repuestos', plate: 'LTVB56', driver: 'Rodrigo Fuentes', isHazardous: false },
  { dayOffset: 0, category: 'Residuos peligrosos', wasteType: 'Huaipe contaminado', quantity: '1', unit: 'Contenedor', origin: 'Depósito de Relave', plate: 'DFHZ12', driver: 'Marcela Díaz', isHazardous: true },
  { dayOffset: 0, category: 'Domésticos', wasteType: 'Residuos domiciliarios', quantity: '320', unit: 'Kilogramo', origin: 'Campamento', plate: 'KPRS78', driver: 'Iván Torres', isHazardous: false },
  { dayOffset: -1, category: 'Residuos peligrosos', wasteType: 'Baterías de plomo ácido', quantity: '6', unit: 'Unidad', origin: 'Acceso faena', plate: 'BBCD90', driver: 'Paula Sepúlveda', isHazardous: true },
  { dayOffset: -7, category: 'Lodos', wasteType: 'Lodos de planta de tratamiento', quantity: '12', unit: 'Metro cúbico', origin: 'Barrio Cívico', plate: 'GHJK45', driver: 'Nelson Bravo', isHazardous: false },
];

export function buildWarehouseIntakeRows(today: Date): WarehouseIntakeRow[] {
  // `dayOffset` se desestructura afuera a propósito: es la receta del dato, no
  // parte de la fila, y el spread lo arrastraría al modelo.
  return SAMPLE_ROWS.map(({ dayOffset, ...row }, index) => ({
    ...row,
    id: String(index + 1),
    entryDate: toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset)),
  }));
}
