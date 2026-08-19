// Trazabilidad completa del ciclo SPR — Especialista (Figma 1831:51316). Datos MOCK.

export const SPR_CYCLE_TRACEABILITY_ROUTE = '/spr/reporte/trazabilidad';

export const SPR_CYCLE_TRACEABILITY = {
  pageTitle: 'SPR — Reporte SPR',
  pageSubtitle: (cycleLabel: string) => `Ciclo ${cycleLabel} · Consolidado automático en curso`,
  title: (cycleLabel: string) => `Ciclo ${cycleLabel} · Trazabilidad completa`,
  rangeSubtitle: '28-05-2026 → 14-06-2026 · Ciclo cerrado con discrepancia resuelta',
  filterLabel: 'Mostrar solo:',
  exportLabel: 'Exportar',
} as const;

export type SprCycleTraceabilityFilterId = 'all' | 'system' | 'people' | 'incidents';

/** Opciones del selector Mostrar solo (Figma 1836:53944). */
export const SPR_CYCLE_TRACEABILITY_FILTER_OPTIONS: {
  id: SprCycleTraceabilityFilterId;
  label: string;
}[] = [
  { id: 'all', label: 'Todos los eventos' },
  { id: 'system', label: 'Solo AurelIA · Sistema' },
  { id: 'people', label: 'Solo acciones de personas' },
  { id: 'incidents', label: 'Solo alertas de incidentes' },
];

export type SprCycleTraceabilityEventTone =
  | 'success'
  | 'system'
  | 'alert'
  | 'rejection'
  | 'correction'
  | 'regulatory'
  | 'pending';

export type SprCycleTraceabilityLegendItem = {
  id: SprCycleTraceabilityEventTone;
  label: string;
};

export const SPR_CYCLE_TRACEABILITY_LEGEND: SprCycleTraceabilityLegendItem[] = [
  { id: 'success', label: 'Exitoso' },
  { id: 'system', label: 'AurelIA · Sistema' },
  { id: 'alert', label: 'Alerta / Desviación' },
  { id: 'rejection', label: 'Rechazo / Discrepancia' },
  { id: 'correction', label: 'Corrección' },
  { id: 'regulatory', label: 'Proceso regulatorio' },
  { id: 'pending', label: 'Pendiente' },
];

export type SprCycleTraceabilityKpi = {
  value: string;
  label: string;
  helper: string;
  valueTone?: 'teal' | 'navy';
};

export const SPR_CYCLE_TRACEABILITY_KPIS: SprCycleTraceabilityKpi[] = [
  {
    value: '8',
    valueTone: 'teal',
    label: 'Áreas participantes',
    helper: '5 completas · 2 estimadas · 1 corregida',
  },
  {
    value: '2',
    valueTone: 'teal',
    label: 'Rechazos del Gerente',
    helper: 'Ambos resueltos con corrección',
  },
  {
    value: '2',
    valueTone: 'teal',
    label: 'Áreas estimadas día 9',
    helper: 'Promedio histórico 6 meses',
  },
  {
    value: '1',
    valueTone: 'teal',
    label: 'Discrepancia SOX',
    helper: 'Resuelta · Ref. CHG-2026-0847',
  },
  {
    value: '17 días',
    valueTone: 'navy',
    label: 'Duración del ciclo',
    helper: '28-05 → 14-06-2026',
  },
];

export type SprCycleTraceabilityTimelineItem =
  | { kind: 'phase'; id: string; label: string }
  | {
      kind: 'event';
      id: string;
      timestamp: string;
      actor: string;
      tone: SprCycleTraceabilityEventTone;
      areaTag?: string;
      title: string;
      note?: string;
    };

export const SPR_CYCLE_TRACEABILITY_TIMELINE: SprCycleTraceabilityTimelineItem[] = [
  { kind: 'phase', id: 'p1', label: 'Fase 1 · Inicio del ciclo' },
  {
    kind: 'event',
    id: 'e1',
    timestamp: '28-05-2026 · 09:00',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    title: 'Aviso de inicio de ciclo enviado a todas las áreas',
  },
  {
    kind: 'event',
    id: 'e2',
    timestamp: '01-06-2026 · 09:00',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    title: 'Solicitud formal de datos enviada a todas las áreas',
    note: '8 áreas notificadas · Fecha límite de entrega: 05-06-2026',
  },
  { kind: 'phase', id: 'p2', label: 'Fase 2 · Entrega de formularios · Días 1–5' },
  {
    kind: 'event',
    id: 'e3',
    timestamp: '02-06-2026 · 16:00',
    actor: 'Responsable · Planta',
    tone: 'success',
    areaTag: 'Planta',
    title: 'Completó el formulario · Firmó y envió al Gerente de Área',
  },
  {
    kind: 'event',
    id: 'e4',
    timestamp: '02-06-2026 · 16:00',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    areaTag: 'Planta',
    title: 'Datos de Planta agregados automáticamente al consolidado',
    note: 'AurelIA consolida al recibir el formulario firmado por el Responsable',
  },
  {
    kind: 'event',
    id: 'e5',
    timestamp: '03-06-2026 · 09:30',
    actor: 'AurelIA · Sistema',
    tone: 'alert',
    areaTag: 'Serv. Generales + Sustentabilidad',
    title: 'Recordatorio automático enviado · Servicios Generales y Sustentabilidad',
    note: '2 días para la fecha límite · Sin respuesta del área',
  },
  {
    kind: 'event',
    id: 'e6',
    timestamp: '03-06-2026 · 10:22',
    actor: 'Responsable · Servicios Técnicos',
    tone: 'pending',
    areaTag: 'Servicios Técnicos',
    title: 'Inició el formulario · Guardó borrador',
  },
  {
    kind: 'event',
    id: 'e7',
    timestamp: '03-06-2026 · 10:30',
    actor: 'Gerente de Área · Planta',
    tone: 'rejection',
    areaTag: 'Planta',
    title: 'Rechazó el formulario · Dato de Combustible Diesel incorrecto',
    note: '"El dato debería ser 3.241.000 L, no 3.841.000 L. Verificar con informe de Haulage."',
  },
  {
    kind: 'event',
    id: 'e8',
    timestamp: '03-06-2026 · 10:31',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    areaTag: 'Planta',
    title: 'Notificación de rechazo enviada al Responsable de Planta',
  },
  {
    kind: 'event',
    id: 'e9',
    timestamp: '03-06-2026 · 11:04',
    actor: 'AurelIA · Sistema',
    tone: 'alert',
    areaTag: 'Servicios Técnicos',
    title: 'Desviación histórica detectada · Servicios Técnicos',
    note: 'Valor ingresado: 55,9 MLT · Promedio 6 meses: 44,2 MLT · Desviación: +26,5%',
  },
  {
    kind: 'event',
    id: 'e10',
    timestamp: '03-06-2026 · 14:15',
    actor: 'Responsable · Planta',
    tone: 'correction',
    areaTag: 'Planta',
    title: 'Corrigió el dato de Combustible Diesel · 3.841.000 → 3.241.000 L',
    note: 'Dato verificado contra informe mensual de Haulage',
  },
  {
    kind: 'event',
    id: 'e11',
    timestamp: '03-06-2026 · 14:22',
    actor: 'Responsable · Planta',
    tone: 'success',
    areaTag: 'Planta',
    title: 'Firmó y reenvió el formulario corregido · Segundo intento',
  },
  {
    kind: 'event',
    id: 'e12',
    timestamp: '03-06-2026 · 14:22',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    areaTag: 'Planta',
    title: 'Dato corregido actualizado automáticamente en el consolidado',
    note: 'El valor corregido reemplazó el anterior',
  },
  {
    kind: 'event',
    id: 'e13',
    timestamp: '03-06-2026 · 18:00',
    actor: 'Responsable · Sustentabilidad',
    tone: 'success',
    areaTag: 'Sustentabilidad',
    title: 'Completó el formulario · Firmó y envió al Gerente de Área',
  },
  {
    kind: 'event',
    id: 'e14',
    timestamp: '03-06-2026 · 18:00',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    areaTag: 'Sustentabilidad',
    title: 'Datos de Sustentabilidad agregados automáticamente al consolidado',
  },
  {
    kind: 'event',
    id: 'e15',
    timestamp: '04-06-2026 · 09:00',
    actor: 'Gerente de Área · Planta',
    tone: 'success',
    areaTag: 'Planta',
    title: 'Aprobó el formulario corregido · Firmó · Segundo intento',
  },
  {
    kind: 'event',
    id: 'e16',
    timestamp: '04-06-2026 · 16:33',
    actor: 'Responsable · Servicios Técnicos',
    tone: 'success',
    areaTag: 'Servicios Técnicos',
    title: 'Completó todos los parámetros · Justificó la desviación histórica',
    note: '"Valor validado contra DGEA. El incremento se debe a mayor extracción en el período."',
  },
  {
    kind: 'event',
    id: 'e17',
    timestamp: '04-06-2026 · 16:33',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    areaTag: 'Servicios Técnicos',
    title: 'Datos de Servicios Técnicos agregados automáticamente al consolidado',
  },
  {
    kind: 'event',
    id: 'e18',
    timestamp: '04-06-2026 · 16:45',
    actor: 'Gerente de Área · Sustentabilidad',
    tone: 'rejection',
    areaTag: 'Sustentabilidad',
    title: 'Rechazó el formulario · Datos de costos no desglosados',
    note: '"Falta separar: prevención de contaminación, auditorías externas y capacitaciones."',
  },
  {
    kind: 'event',
    id: 'e19',
    timestamp: '04-06-2026 · 16:46',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    areaTag: 'Sustentabilidad',
    title: 'Notificación de rechazo enviada al Responsable de Sustentabilidad',
  },
  {
    kind: 'event',
    id: 'e20',
    timestamp: '05-06-2026 · 09:00',
    actor: 'AurelIA · Sistema',
    tone: 'alert',
    title: 'Alerta de vencimiento de fecha límite · Servicios Generales sin respuesta',
    note: 'Fecha límite: hoy · Escalamiento automático ejecutado',
  },
  {
    kind: 'event',
    id: 'e21',
    timestamp: '05-06-2026 · 18:45',
    actor: 'Gerente de Área · Servicios Técnicos',
    tone: 'success',
    areaTag: 'Servicios Técnicos',
    title: 'Revisó la justificación de la desviación histórica · Aprobó y firmó',
  },
  { kind: 'phase', id: 'p3', label: 'Fase 3 · Estimación día 9 · Áreas sin datos' },
  {
    kind: 'event',
    id: 'e22',
    timestamp: '09-06-2026 · 00:00',
    actor: 'AurelIA · Sistema',
    tone: 'alert',
    title: 'Día 9 alcanzado · Servicios Generales y Sustentabilidad sin formulario',
    note: 'El Responsable de Sustentabilidad no corrigió el formulario rechazado a tiempo',
  },
  {
    kind: 'event',
    id: 'e23',
    timestamp: '09-06-2026 · 00:01',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    title: 'Estimación automática aplicada · Promedio de los últimos 6 meses',
    note: 'Servicios Generales: 7 parámetros estimados (KM chancado, agua, energía, etc.) · Sustentabilidad: 3 parámetros estimados',
  },
  { kind: 'phase', id: 'p4', label: 'Fase 4 · Envío al SAC y firma oficial' },
  {
    kind: 'event',
    id: 'e24',
    timestamp: '09-06-2026 · 00:02',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    title: 'Consolidado enviado al SAC corporativo vía API · Automático día 9',
    note: '38 parámetros · 34 datos reales · 4 estimados por promedio histórico',
  },
  {
    kind: 'event',
    id: 'e25',
    timestamp: '09-06-2026 · 18:20',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    title: 'Reporte SAC descargado automáticamente',
    note: '51 parámetros · 22 KPIs calculados por el SAC con datos del consolidado',
  },
  {
    kind: 'event',
    id: 'e26',
    timestamp: '09-06-2026 · 18:42',
    actor: 'Tania Galarce · Especialista Sustentabilidad',
    tone: 'success',
    title: 'Firmó el reporte oficial · Paso 1 de 2',
  },
  {
    kind: 'event',
    id: 'e27',
    timestamp: '09-06-2026 · 19:05',
    actor: 'Gabriel Fuenzalida · Gerente Sustentabilidad',
    tone: 'success',
    title: 'Firmó el reporte · Alta oficial · Paso 2 de 2',
    note: 'Reporte oficial del ciclo Mayo 2026 generado y archivado',
  },
  {
    kind: 'event',
    id: 'e28',
    timestamp: '09-06-2026 · 19:06',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    title: 'Reporte enviado a Servicios Técnicos y Optimización de Activos para validación SOX',
  },
  { kind: 'phase', id: 'p5', label: 'Fase 5 · Validación SOX por Responsables' },
  {
    kind: 'event',
    id: 'e29',
    timestamp: '10-06-2026 · 09:02',
    actor: 'Responsable · Servicios Técnicos',
    tone: 'success',
    areaTag: 'Servicios Técnicos',
    title: 'Confirmó: Ground Water: Freshwater · Valor correcto',
  },
  {
    kind: 'event',
    id: 'e30',
    timestamp: '10-06-2026 · 09:04',
    actor: 'Responsable · Servicios Técnicos',
    tone: 'success',
    areaTag: 'Servicios Técnicos',
    title: 'Confirmó: % Water Recycled · Valor correcto',
  },
  {
    kind: 'event',
    id: 'e31',
    timestamp: '10-06-2026 · 09:15',
    actor: 'Responsable · Servicios Técnicos',
    tone: 'rejection',
    areaTag: 'Servicios Técnicos',
    title: 'Reportó discrepancia: Freshwater Intensity no coincide con el SAC',
  },
  {
    kind: 'event',
    id: 'e32',
    timestamp: '10-06-2026 · 09:16',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    title: 'Tania Galarce notificada · Discrepancia registrada',
  },
  {
    kind: 'event',
    id: 'e33',
    timestamp: '10-06-2026 · 10:15',
    actor: 'Responsable · Optimización de Activos',
    tone: 'success',
    areaTag: 'Optimización Activos',
    title: 'Confirmó: GHG Scope 1 y Scope 2 · Valores correctos',
  },
  { kind: 'phase', id: 'p6', label: 'Fase 6 · Proceso regulatorio y corrección' },
  {
    kind: 'event',
    id: 'e34',
    timestamp: '12-06-2026 · 14:00',
    actor: 'Tania Galarce',
    tone: 'regulatory',
    title: 'Inició proceso regulatorio corporativo fuera de AurelIA',
    note: 'Formulario corporativo de cambio CHG-2026-0847 enviado a Gold Fields Corporativo',
  },
  {
    kind: 'event',
    id: 'e35',
    timestamp: '14-06-2026 · 10:30',
    actor: 'Gold Fields Corporativo',
    tone: 'regulatory',
    title: 'Autorización de cambio aprobada · Ref: CHG-2026-0847',
    note: 'Se autoriza la corrección de Freshwater Intensity: 0,89 → 0,72 m³/t (dato validado por SAC)',
  },
  {
    kind: 'event',
    id: 'e36',
    timestamp: '14-06-2026 · 11:00',
    actor: 'Tania Galarce',
    tone: 'regulatory',
    title: 'Reabrió el flujo en AurelIA con referencia de autorización corporativa',
    note: 'Ref: CHG-2026-0847 · El Responsable de Servicios Técnicos puede corregir el dato',
  },
  {
    kind: 'event',
    id: 'e37',
    timestamp: '14-06-2026 · 14:30',
    actor: 'Responsable · Servicios Técnicos',
    tone: 'correction',
    areaTag: 'Servicios Técnicos',
    title: 'Corrigió Freshwater Intensity en el formulario · 0,89 → 0,72 m³/t',
  },
  {
    kind: 'event',
    id: 'e38',
    timestamp: '14-06-2026 · 14:30',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    title: 'Consolidado actualizado con el dato corregido',
  },
  {
    kind: 'event',
    id: 'e39',
    timestamp: '14-06-2026 · 16:00',
    actor: 'Gerente de Área · Servicios Técnicos',
    tone: 'success',
    areaTag: 'Servicios Técnicos',
    title: 'Revisó el formulario corregido · Aprobó y firmó',
  },
  {
    kind: 'event',
    id: 'e40',
    timestamp: '14-06-2026 · 16:01',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    title: 'Segundo envío del consolidado corregido al SAC corporativo',
    note: 'Envío con el dato de Freshwater Intensity corregido',
  },
  {
    kind: 'event',
    id: 'e41',
    timestamp: '14-06-2026 · 18:00',
    actor: 'AurelIA · Sistema',
    tone: 'system',
    title: 'Nuevo reporte SAC con datos corregidos descargado automáticamente',
  },
  {
    kind: 'event',
    id: 'e42',
    timestamp: '14-06-2026 · 18:30',
    actor: 'Tania Galarce · Especialista Sustentabilidad',
    tone: 'success',
    title: 'Firmó el nuevo reporte corregido · Paso 1 de 2',
  },
  {
    kind: 'event',
    id: 'e43',
    timestamp: '14-06-2026 · 18:45',
    actor: 'Gabriel Fuenzalida · Gerente Sustentabilidad',
    tone: 'success',
    title: 'Firmó el nuevo reporte corregido · Alta oficial · Paso 2 de 2',
    note: 'Discrepancia resuelta · Reporte corregido archivado como versión oficial',
  },
  { kind: 'phase', id: 'p7', label: 'Fase 7 · Ciclo cerrado' },
  {
    kind: 'event',
    id: 'e44',
    timestamp: '14-06-2026 · 18:46',
    actor: 'AurelIA · Sistema',
    tone: 'success',
    title: 'Ciclo Mayo 2026 completado y cerrado · Trazabilidad completa',
    note: '5 áreas completas · 2 áreas estimadas por promedio histórico · 1 área corregida tras discrepancia SOX',
  },
];

function eventMatchesTraceabilityFilter(
  event: Extract<SprCycleTraceabilityTimelineItem, { kind: 'event' }>,
  filter: SprCycleTraceabilityFilterId,
) {
  if (filter === 'all') return true;
  if (filter === 'system') return event.actor.startsWith('AurelIA');
  if (filter === 'people') return !event.actor.startsWith('AurelIA');
  return event.tone === 'alert';
}

export function filterSprCycleTraceabilityTimeline(
  items: SprCycleTraceabilityTimelineItem[],
  filter: SprCycleTraceabilityFilterId,
): SprCycleTraceabilityTimelineItem[] {
  if (filter === 'all') return items;

  const result: SprCycleTraceabilityTimelineItem[] = [];
  let pendingPhase: Extract<SprCycleTraceabilityTimelineItem, { kind: 'phase' }> | null = null;
  let phaseEvents: Extract<SprCycleTraceabilityTimelineItem, { kind: 'event' }>[] = [];

  const flushPhase = () => {
    const visible = phaseEvents.filter((event) => eventMatchesTraceabilityFilter(event, filter));
    if (visible.length > 0 && pendingPhase) {
      result.push(pendingPhase);
      result.push(...visible);
    }
    pendingPhase = null;
    phaseEvents = [];
  };

  for (const item of items) {
    if (item.kind === 'phase') {
      flushPhase();
      pendingPhase = item;
    } else {
      phaseEvents.push(item);
    }
  }
  flushPhase();

  return result;
}
