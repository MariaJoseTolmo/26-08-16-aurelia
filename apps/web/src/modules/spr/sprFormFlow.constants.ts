/**
 * Inicio del flujo SPR — especificación UX Figma 2606:5127.
 *
 * Dos formas de disponer datos:
 * 1) Mediante formulario (manual por responsable de área)
 * 2) Automático (bot / módulo Residuos / RPA SAP)
 *
 * Campos del formulario (4):
 * - Valor reportado (obligatorio)
 * - Sin consumo / No aplica (opcional; si se marca, no exige valor ni fuente)
 * - Fuente del dato (obligatorio; lista por área)
 * - Notas para el gerente de área (obligatorias si hay desviación ±10%)
 *
 * Punto importante: en áreas automáticas NO se muestra el formulario al
 * responsable (lo llena el sistema). Sí se notifica al gerente cuando hay
 * formulario listo para firmar. El consolidado ocurre al emitir, con o sin firma.
 */

export type SprFormAreaKey =
  | 'planta'
  | 'mina'
  | 'optimizacion-activos'
  | 'finanzas'
  | 'servicios-tecnicos'
  | 'servicios-operacionales'
  | 'medio-ambiente'
  | 'sustentabilidad';

export type SprFormAreaMode = 'manual' | 'automatic';

export type SprFormAreaCatalogEntry = {
  key: SprFormAreaKey;
  label: string;
  mode: SprFormAreaMode;
  /** Parámetros de referencia del diseño (demo / documentación). */
  parametersLabel: string;
  sources: readonly string[];
  /** Fuente fija cuando el dato es automático (sin desplegable). */
  automaticSource?: string;
  automaticHelper?: string;
};

export const SPR_FORM_FLOW_COPY = {
  title: 'Inicio del flujo',
  intro:
    'Cada área debe emitir los datos de cada parámetro correspondiente a su área, pero algunas áreas contarán con un sistema automatizado que disponga los datos automáticamente en el sistema sin tener que llenar un formulario. Entonces las dos formas de disponer estos datos en el sistema son los siguientes',
  manualTitle: 'Mediante formulario',
  manualIntro:
    'El formulario consta de un listado de parámetros correspondiente al área en cuestión, el cual consta de 4 campos.',
  fieldValor:
    'Valor reportado: Campo obligatorio en donde se ingresa el valor según la unidad de medida correspondiente al parámetro.',
  fieldNoAplica:
    'Selector “Sin consumo/No aplica”: Campo opcional el cual se selecciona en caso que no se hayan registrado datos durante el ciclo. Al seleccionar este campo no es necesario ingresar “valor reportado” ni “fuente del dato”.',
  fieldFuente:
    'Fuente del dato: Campo desplegable obligatorio en el cual se debe seleccionar el origen desde donde se sacó el dato.',
  fieldNotas:
    'Notas para el gerente de área: opcionales en general; obligatorias si el valor se desvía más de ±10% del promedio de los últimos 6 meses',
  automaticTitle: 'Automático',
  automaticIntro:
    'Los datos automáticos son extraídos mediante bot desde las áreas. Esto provoca que el formulario sea llenado automáticamente con los “valor reportado”, “No aplica” y fuente del dato.',
  sharedParamsNote:
    'Hay parámetros de residuos que son compartidos entre Medio Ambiente y Servicios Operacionales — por ejemplo Hydrocarbons, Chemicals y Brine Precipitate. La parte que corresponde a Medio Ambiente sería automática, pero la parte de Servicios Operacionales seguiría siendo manual.',
  importantTitle: 'Punto importante a tener en cuenta',
  importantBody:
    'Para las “áreas automáticas” no se muestra el formulario a llenar para los responsables de área (Los llena el sistema). Pero sí debe mostrar y notificar a los gerentes de área que el formulario a firmar está listo. De todas formas los datos son consolidados una vez que los datos son emitidos automáticamente o por formulario aunque la firma no se lleve a cabo.',
  responsibleAutomaticTitle: 'Tu área carga datos de forma automática',
  responsibleAutomaticBody:
    'AurelIA completa el valor reportado, “No aplica” y la fuente del dato. No necesitas llenar el formulario. Tu gerente de área será notificado cuando esté listo para firmar.',
  responsibleAutomaticHelper: 'Los datos se consolidan al emitirse, aunque la firma del gerente aún no se realice.',
  /** Notificación al gerente (Figma 2606:5127 — punto importante). */
  managerAutomaticReadyTitle: 'Formulario listo para firmar',
  managerAutomaticReadyBody:
    'Los datos de tu área fueron emitidos automáticamente por AurelIA. Revisa y firma el formulario cuando corresponda.',
  managerAutomaticReadyHelper:
    'El consolidado se actualiza al emitir (automático o por formulario), aunque la firma del gerente aún no se lleve a cabo.',
  managerAutomaticReadyCta: 'Revisar y firmar',
  notesPlaceholder: 'Anota datos relevantes para el gerente de área…',
  notesLabel: 'Notas para el gerente de área (opcional)',
  noAplicaHelper: 'Al marcar esta opción no es necesario ingresar valor reportado ni fuente del dato.',
} as const;

/** Catálogo por área — Figma 2606:5127. */
export const SPR_FORM_AREA_CATALOG: SprFormAreaCatalogEntry[] = [
  {
    key: 'planta',
    label: 'Planta',
    mode: 'manual',
    parametersLabel:
      'Cianuro, HCl, Cal/Lime, Soda cáustica, Acetileno (parte), Tailings to dams, Chemicals (parte)',
    sources: [
      'Factura de proveedor',
      'Guía de despacho',
      'Registro de consumo de reactivos',
      'Informe mensual de planta',
      'Sistema de control de inventario',
      'Registro de báscula / pesaje',
      'Otro',
    ],
  },
  {
    key: 'mina',
    label: 'Mina',
    mode: 'manual',
    parametersLabel: 'Explosivos, LPG (parte), Acetileno (parte), Waste rock to dump, Hydrocarbons (parte)',
    sources: [
      'Registro de despacho de explosivos',
      'Factura de proveedor',
      'Informe mensual de mina',
      'Registro de báscula / pesaje',
      'Guía de despacho',
      'Sistema de gestión de flota',
      'Otro',
    ],
  },
  {
    key: 'optimizacion-activos',
    label: 'Optimización de Activos',
    mode: 'manual',
    parametersLabel: 'Diesel Haulage and Other, Diesel Power Generation, Diesel Plants Electricity Generated',
    sources: [
      'Factura COPEC',
      'Registro de despacho de combustible',
      'Sistema de gestión de combustible',
      'Medidor del grupo electrógeno',
      'Informe mensual de flota',
      'Informe de empresa contratista',
      'Otro',
    ],
  },
  {
    key: 'finanzas',
    label: 'Finanzas',
    mode: 'manual',
    parametersLabel: 'Energy Costs Diesel in USD, Energy Costs Electricity in USD',
    sources: [
      'Factura COPEC',
      'Factura empresa eléctrica',
      'Estado de pago aprobado en SAP',
      'Informe de gastos mensuales',
      'Reporte financiero interno',
      'Otro',
    ],
  },
  {
    key: 'servicios-tecnicos',
    label: 'Servicios Técnicos',
    mode: 'manual',
    parametersLabel: 'Ground Water Freshwater, Total Recycled Water, Total Reused Water',
    sources: [
      'Medidor de flujo / caudalímetro',
      'Sistema SCADA',
      'Registro de bombeo',
      'Informe mensual de operaciones de agua',
      'Registro manual de terreno',
      'Informe de empresa contratista',
      'Otro',
    ],
  },
  {
    key: 'servicios-operacionales',
    label: 'Servicios Operacionales',
    mode: 'manual',
    parametersLabel:
      'LPG (parte), Road Travel Input, Short Haul Flights, Long Haul Flights, General Landfill, Hydrocarbons (parte), Chemicals (parte), Other, Brine Precipitate (parte)',
    sources: [
      'Registro de kilometraje de flota terrestre',
      'Informe de empresa de transporte',
      'Registro de vuelos charter',
      'Factura aerolínea / operador charter',
      'Registro de retiro de residuos',
      'Guía de despacho empresa gestora de residuos (ej. Resiter)',
      'Manifiesto de transporte de residuos',
      'Factura de proveedor LPG',
      'Otro',
    ],
  },
  {
    key: 'medio-ambiente',
    label: 'Medio Ambiente (automático desde módulo Residuos)',
    mode: 'automatic',
    parametersLabel:
      'Hydrocarbons (parte), Chemicals (parte), Brine Precipitate (parte), Weighed: Metal, Plastic, Batteries, General Landfill (parte)',
    sources: ['Módulo Residuos · AurelIA (automático)'],
    automaticSource: 'Módulo Residuos · AurelIA (automático)',
    automaticHelper:
      'Al ser automáticos desde el módulo de Residuos, no tienen lista desplegable de fuente — AurelIA la registra automáticamente.',
  },
  {
    key: 'sustentabilidad',
    label: 'Sustentabilidad / Octavio (bot RPA sobre SAP)',
    mode: 'automatic',
    parametersLabel: 'Pollution Prevention, Audits, Specialist Studies and EIAs, Other Operational Expenditure',
    sources: ['SAP Financiero · Bot RPA (automático)'],
    automaticSource: 'SAP Financiero · Bot RPA (automático)',
    automaticHelper:
      'Al ser automático no tienen lista desplegable de fuente — AurelIA la registra automáticamente.',
  },
];

const AREA_NAME_ALIASES: Record<string, SprFormAreaKey> = {
  planta: 'planta',
  'planta procesos': 'planta',
  mina: 'mina',
  'optimizacion de activos': 'optimizacion-activos',
  'optimización de activos': 'optimizacion-activos',
  finanzas: 'finanzas',
  'servicios tecnicos': 'servicios-tecnicos',
  'servicios técnicos': 'servicios-tecnicos',
  'servicios operacionales': 'servicios-operacionales',
  'servicios generales': 'servicios-operacionales',
  'medio ambiente': 'medio-ambiente',
  sustentabilidad: 'sustentabilidad',
};

/** Fallback demo del formulario cuando el usuario no trae área (pantallas actuales ST). */
export const SPR_FORM_DEFAULT_AREA_KEY: SprFormAreaKey = 'servicios-tecnicos';

export function resolveSprFormAreaKey(areaName: string | null | undefined): SprFormAreaKey {
  if (!areaName) return SPR_FORM_DEFAULT_AREA_KEY;
  const normalized = areaName.trim().toLowerCase();
  return AREA_NAME_ALIASES[normalized] ?? SPR_FORM_DEFAULT_AREA_KEY;
}

export function getSprFormAreaCatalog(areaKey: SprFormAreaKey): SprFormAreaCatalogEntry {
  return (
    SPR_FORM_AREA_CATALOG.find((entry) => entry.key === areaKey) ??
    SPR_FORM_AREA_CATALOG.find((entry) => entry.key === SPR_FORM_DEFAULT_AREA_KEY)!
  );
}

export function getSprFormDataSourcesForArea(areaName: string | null | undefined): readonly string[] {
  return getSprFormAreaCatalog(resolveSprFormAreaKey(areaName)).sources;
}

export function isSprFormAreaAutomatic(areaName: string | null | undefined): boolean {
  return getSprFormAreaCatalog(resolveSprFormAreaKey(areaName)).mode === 'automatic';
}

/** Unión de fuentes manuales (compat para pantallas que aún no resuelven área). */
export const SPR_DATA_SOURCE_OPTIONS = Array.from(
  new Set(
    SPR_FORM_AREA_CATALOG.filter((entry) => entry.mode === 'manual').flatMap((entry) => [...entry.sources]),
  ),
);
