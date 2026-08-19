/** Monitoreo de KPIs — Especialista Sustentabilidad (Figma 2441:5221 / 2444:7912). Datos MOCK. */

export const SPR_KPI_MONITORING_ROUTE = '/spr/monitoreo-kpis';

export const SPR_KPI_MONITORING = {
  pageTitle: 'SPR — Monitoreo de KPIs',
  pageSubtitle: 'Tendencias y seguimiento · Datos al ciclo Febrero 2026',
  periodLabel: 'Período:',
  yearRangeLabel: '2025-2026',
} as const;

export type SprKpiMonitoringPeriod = 'mensual' | 'trimestral' | 'anual';
export type SprKpiMonitoringCategory = 'energia' | 'agua' | 'incidentes' | 'grafico-libre';

export const SPR_KPI_MONITORING_PERIODS: { id: SprKpiMonitoringPeriod; label: string }[] = [
  { id: 'mensual', label: 'Mensual' },
  { id: 'trimestral', label: 'Trimestral' },
  { id: 'anual', label: 'Anual' },
];

export const SPR_KPI_MONITORING_CATEGORIES: {
  id: SprKpiMonitoringCategory;
  label: string;
  dotColor: string;
}[] = [
  { id: 'energia', label: 'Energía', dotColor: '#e8720c' },
  { id: 'agua', label: 'Agua', dotColor: '#24588b' },
  { id: 'incidentes', label: 'Incidentes', dotColor: '#c4365a' },
  { id: 'grafico-libre', label: 'Gráfico libre', dotColor: '#7b4fbf' },
];

export const SPR_KPI_MONITORING_MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export type SprKpiMonitoringLegendItem = {
  label: string;
  color: string;
  kind?: 'line' | 'square' | 'dashed';
};

export type SprKpiMonitoringChartConfig = {
  id: string;
  title: string;
  subtitle: string;
  legend: SprKpiMonitoringLegendItem[];
  chartKind: 'stacked-bar' | 'line' | 'area' | 'grouped-bar';
  width?: 'full' | 'half';
};

export type SprKpiFreeKpiOption = {
  id: string;
  label: string;
  tone: 'blue' | 'amber';
};

export const SPR_KPI_FREE_KPI_OPTIONS: SprKpiFreeKpiOption[] = [
  { id: 'ground-water-freshwater', label: 'Ground Water: Freshwater', tone: 'blue' },
  { id: 'diesel-haulage-other', label: 'Diesel: Haulage & Other', tone: 'amber' },
  { id: 'diesel-power-gen', label: 'Diesel: Power Generation', tone: 'amber' },
  { id: 'freshwater-intensity', label: 'Freshwater Intensity', tone: 'blue' },
  { id: 'ghg-scope-1', label: 'GHG Emissions Scope 1', tone: 'amber' },
];

/** Valores mensuales demo para gráfico libre (índice 0 = Ene … 11 = Dic). */
export const SPR_KPI_FREE_COMPARE_DATA: Record<
  string,
  { y2025: number[]; y2026: (number | null)[] }
> = {
  'ground-water-freshwater': {
    y2025: [148, 142, 155, 160, 158, 152, 149, 151, 147, 153, 150, 145],
    y2026: [152, 148, null, null, null, null, null, null, null, null, null, null],
  },
  'diesel-haulage-other': {
    y2025: [1620, 1580, 1710, 1690, 1750, 1800, 1780, 1820, 1760, 1840, 1790, 1720],
    y2026: [1780, 1920, null, null, null, null, null, null, null, null, null, null],
  },
  'diesel-power-gen': {
    y2025: [420, 410, 435, 428, 440, 455, 448, 462, 438, 450, 445, 430],
    y2026: [445, 460, null, null, null, null, null, null, null, null, null, null],
  },
  'freshwater-intensity': {
    y2025: [0.82, 0.79, 0.85, 0.83, 0.81, 0.8, 0.84, 0.82, 0.79, 0.83, 0.8, 0.78],
    y2026: [0.8, 0.77, null, null, null, null, null, null, null, null, null, null],
  },
  'ghg-scope-1': {
    y2025: [9200, 8800, 9500, 9300, 9600, 9800, 9700, 9900, 9400, 10000, 9600, 9100],
    y2026: [9600, 10100, null, null, null, null, null, null, null, null, null, null],
  },
};

/** Series apiladas demo — Emisiones CO₂ (Figma energía). */
export const SPR_KPI_ENERGIA_CO2_SERIES = [
  { id: 'diesel-haulage', label: 'Diesel Haulage', color: '#e8720c' },
  { id: 'diesel-power', label: 'Diesel Power Gen.', color: '#f4b882' },
  { id: 'explosivos', label: 'Explosivos', color: '#c4365a' },
  { id: 'blasting', label: 'Blasting Agents', color: '#7b4fbf' },
  { id: 'lpg', label: 'LPG', color: '#24588b' },
];

export const SPR_KPI_ENERGIA_CO2_VALUES: number[][] = [
  [3.2, 2.8, 1.1, 0.6, 0.4],
  [3.5, 3.0, 1.2, 0.7, 0.5],
  [3.8, 3.2, 1.3, 0.8, 0.5],
  [4.0, 3.4, 1.4, 0.9, 0.6],
  [4.2, 3.6, 1.5, 1.0, 0.6],
  [4.5, 3.8, 1.6, 1.0, 0.7],
  [4.8, 4.0, 1.7, 1.1, 0.7],
  [5.0, 4.2, 1.8, 1.2, 0.8],
  [5.2, 4.4, 1.9, 1.2, 0.8],
  [5.5, 4.6, 2.0, 1.3, 0.9],
  [5.8, 4.8, 2.1, 1.4, 0.9],
  [6.0, 5.0, 2.2, 1.5, 1.0],
];

/** Línea demo — Intensidad CO₂/Oz. */
export const SPR_KPI_ENERGIA_INTENSITY_CO2 = [0.19, 0.18, 0.17, 0.18, 0.17, 0.16, 0.17, 0.18, 0.17, 0.16, 0.17, 0.18];
export const SPR_KPI_ENERGIA_INTENSITY_ENERGY = [1.58, 1.55, 1.52, 1.54, 1.51, 1.49, 1.5, 1.53, 1.52, 1.55, 1.54, 1.56];

/** Agua — distribución apilada (3 componentes). */
export const SPR_KPI_AGUA_WATER_SERIES = [
  { id: 'recycled', label: 'Agua reciclada (MLT)', color: '#24588b' },
  { id: 'reused', label: 'Agua reutilizada (MLT)', color: '#8fbde0' },
  { id: 'fresh', label: 'Agua fresca (MLT)', color: '#00b398' },
];

export const SPR_KPI_AGUA_WATER_VALUES: number[][] = [
  [0.3, 0.5, 1.2],
  [0.35, 0.55, 1.3],
  [0.4, 0.6, 1.4],
  [0.38, 0.58, 1.35],
  [0.42, 0.62, 1.5],
  [0.45, 0.65, 1.55],
  [0.4, 0.6, 1.45],
  [0.43, 0.63, 1.48],
  [0.41, 0.61, 1.42],
  [0.44, 0.64, 1.52],
  [0.39, 0.59, 1.38],
  [0.42, 0.62, 1.46],
];

/** Ground Water comparación simple (sin año anterior). */
export const SPR_KPI_AGUA_GROUNDWATER = [148, 152, 155, 158, 160, 162, 159, 161, 157, 163, 160, 156];

/** % Recycled line chart. */
export const SPR_KPI_AGUA_RECYCLED_PCT = [72, 74, 76, 75, 78, 80, 77, 79, 76, 81, 78, 80];

export const SPR_KPI_MONITORING_SECTIONS = {
  energia: {
    title: 'Energía',
    helper: 'Emisiones y consumo · Alcance 1',
    chartCountLabel: '3 gráficos',
    charts: [
      {
        id: 'co2-scope1',
        title: 'Emisiones CO₂ — Alcance 1',
        subtitle: 'Toneladas CO₂ equivalente · Por tipo de combustible',
        legend: SPR_KPI_ENERGIA_CO2_SERIES.map((s) => ({ label: s.label, color: s.color, kind: 'square' as const })),
        chartKind: 'stacked-bar' as const,
        width: 'full' as const,
      },
      {
        id: 'intensity-co2',
        title: 'Intensidad de Emisiones · CO₂/Oz',
        subtitle: 'KPI corporativo comprometido con stakeholders',
        legend: [
          { label: 'KPI Corp. 0,180', color: '#c4365a', kind: 'line' },
          { label: 'Prom. año', color: '#acacac', kind: 'line' },
          { label: 'Mensual', color: '#24588b', kind: 'square' },
        ],
        chartKind: 'line' as const,
        width: 'half' as const,
      },
      {
        id: 'intensity-energy',
        title: 'Intensidad de Energía · GJ/Oz',
        subtitle: 'Seguimiento interno · No comprometido con stakeholders',
        legend: [
          { label: 'KPI Corp. 1,51', color: '#c4365a', kind: 'line' },
          { label: 'Prom. año 1,55', color: '#acacac', kind: 'line' },
          { label: 'Mensual', color: '#24588b', kind: 'square' },
        ],
        chartKind: 'line' as const,
        width: 'half' as const,
      },
    ],
  },
  agua: {
    title: 'Agua',
    helper: 'Distribución y eficiencia hídrica',
    chartCountLabel: '2 gráficos',
    charts: [
      {
        id: 'water-distribution',
        title: 'Distribución agua operacional',
        subtitle: 'MLT · Por componente y mes · 2025–2026',
        legend: SPR_KPI_AGUA_WATER_SERIES.map((s) => ({ label: s.label, color: s.color, kind: 'square' as const })),
        chartKind: 'stacked-bar' as const,
        width: 'full' as const,
      },
      {
        id: 'groundwater',
        title: 'Ground Water: Freshwater',
        subtitle: 'MLT · Comparación mensual 2026',
        legend: [{ label: 'Ground Water (2026)', color: '#24588b', kind: 'square' }],
        chartKind: 'grouped-bar' as const,
        width: 'half' as const,
      },
      {
        id: 'recycled-pct',
        title: '% Total Recycled & Reused / Operational Water Use',
        subtitle: 'Comparación contra KPI Corporativo y KPI Diseño',
        legend: [
          { label: 'KPI Corp. 80%', color: '#c4365a', kind: 'line' },
          { label: 'KPI Diseño 71,4%', color: '#acacac', kind: 'line' },
          { label: 'Prom. año', color: '#646464', kind: 'line' },
          { label: 'Mensual', color: '#24588b', kind: 'square' },
        ],
        chartKind: 'area' as const,
        width: 'full' as const,
      },
    ],
  },
  incidentes: {
    title: 'Incidentes ambientales',
    helper: 'Desde módulo Incidentes · Actualización automática',
    chartCountLabel: '3 gráficos',
    charts: [
      {
        id: 'incidents-general',
        title: 'Incidentes ambientales · General',
        subtitle: 'Todos los niveles por mes',
        legend: [
          { label: 'Level 0', color: '#00b398' },
          { label: 'Level 1', color: '#8fbde0' },
          { label: 'Level 2', color: '#e8720c' },
          { label: 'Level 3-5', color: '#c4365a' },
        ],
        chartKind: 'stacked-bar' as const,
        width: 'full' as const,
      },
      {
        id: 'incidents-level1',
        title: 'Clasificación Incidentes Nivel 1',
        subtitle: 'Por tipo de impacto',
        legend: [
          { label: 'Agua', color: '#24588b' },
          { label: 'Aire', color: '#e8720c' },
          { label: 'Suelo', color: '#7b4fbf' },
        ],
        chartKind: 'stacked-bar' as const,
        width: 'half' as const,
      },
      {
        id: 'incidents-level2',
        title: 'Clasificación Incidentes Nivel 2',
        subtitle: 'Por tipo de impacto',
        legend: [
          { label: 'Agua', color: '#24588b' },
          { label: 'Aire', color: '#e8720c' },
          { label: 'Suelo', color: '#7b4fbf' },
        ],
        chartKind: 'stacked-bar' as const,
        width: 'half' as const,
      },
    ],
  },
  graficoLibre: {
    title: 'Gráfico libre',
    helper: 'Selecciona cualquier KPI del SPR para comparar tendencias',
    chartCountLabel: '',
    charts: [],
  },
} as const;
