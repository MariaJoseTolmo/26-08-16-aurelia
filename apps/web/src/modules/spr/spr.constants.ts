// Constantes de la primera pantalla del modulo SPR (formulario de carga mensual).
//
// IMPORTANTE — CAMPOS SIN RESPALDO EN BACKEND (gaps conocidos):
// Los valores marcados como MOCK/PLACEHOLDER no tienen fuente en la API actual
// (apps/api/src/modules/spr) ni contrato en @aurelia/contracts. Se muestran solo
// para respetar el diseno de Figma y quedan pendientes de definicion con backend.

// MOCK: el backend no modela un "ciclo activo" con fecha limite. Se usa un periodo
// fijo de referencia para consultar los registros mensuales del formulario.
export const SPR_ACTIVE_CYCLE = {
  periodYear: 2026,
  periodMonth: 5,
  label: 'Mayo 2026',
  rangeLabel: '01 mayo — 31 mayo',
  // MOCK: no existe deadline en el modelo de datos.
  deadlineLabel: '10-06-2026',
  deadlineHelper: '5 días restantes',
  cycleStatusLabel: 'En curso',
} as const;

// PLACEHOLDER: estado post-envio del formulario (Figma 1666:2149). Parte de los textos
// no tienen endpoint dedicado; se derivan del status de registros cuando es posible.
export const SPR_SUBMITTED_STATUS = {
  formStatusLabel: 'Aprobación pendiente',
  formStatusHelper: 'Pendiente por gerente del área',
  reportStatusLabel: 'Aún no disponible',
  // MOCK: fallback si submittedAt no viene en los registros.
  signDateFallbackLabel: '09-06-2026',
  processStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} de tu área ha sido emitido`,
  processStepHelper: 'A la espera de la aprobación y firma de tu gerente de área',
} as const;

// PLACEHOLDER: estado post-reenvio tras correccion (Figma 1672:8557).
export const SPR_CORRECTED_STATUS = {
  correctedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} ha sido corregido`,
  correctedStepHelper: 'A la espera de la aprobación y firma de tu gerente de área.',
  emittedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} de tu área ha sido emitido`,
  emittedStepHelper: 'A la espera de la aprobación y firma de tu gerente de área.',
} as const;

// PLACEHOLDER: estado post-aprobacion del responsable (Figma 1672:10996).
export const SPR_APPROVED_STATUS = {
  formStatusLabel: 'Completado ✓',
  formStatusHelper: 'Aprobado por tu Gerente',
  reportStatusLabel: 'Aún no disponible',
  // MOCK: fallback si approvedAt no viene en los registros.
  managerApprovalDateFallback: '05-06-2026',
  kpiPendingStepTitle: (cycleLabel: string) => `A la espera de Validación de KPIs — Reporte SPR ${cycleLabel}`,
  kpiPendingStepHelper:
    'Cuándo el reporte sea firmado por Especialistas de Sustentabilidad recibirás una notificación para validar tus datos',
  kpiPendingBadgeLabel: 'A la espera de firma de Especialistas de Sustentabilidad',
  approvedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} aprobado`,
  approvedStepHelper: (dateLabel: string) => `Tu Gerente de Área aprobó y firmó el formulario el ${dateLabel}`,
} as const;

// Áreas SOX (únicas que validan KPIs del reporte SPR):
// - Servicios técnicos
// - Optimización de activos
// Ninguna otra área revisa el reporte. Si ambas aprueban → ciclo puede cerrar (hito 4).
// Si una o ambas reportan discrepancia → se reabre el proceso solo para esas áreas.
//
// Responsable de area — reporte firmado, validacion KPI pendiente (Figma 1672:14978).
// Conectado con especialista Figma 1942:63546 (?estado=firmas-completas en /spr/reporte/consolidado).
// Revision de datos: Figma 1760:19794 → /spr?estado=validacion-kpis&vista=revision
// Post-envio revision: Figma 1760:21616 → /spr?estado=validacion-kpis-enviada
export const SPR_RESPONSIBLE_KPI_VALIDATION_STATUS = {
  cycleStatusLabel: 'Cerrado y reportado',
  formStatusLabel: 'Completado ✓',
  formStatusHelper: 'Aprobado por tu Gerente',
  reportStatusLabel: 'Firmado oficialmente',
  reportSignDateFallback: '09-06-2026',
  reportSignerFallback: 'Gabriel Fuenzalida',
  reportSignHelper: (dateLabel: string, signerLabel: string) => `${dateLabel} · ${signerLabel}`,
  kpiValidationStepTitle: (cycleLabel: string) => `Validación de KPIs — Reporte SPR ${cycleLabel}`,
  kpiValidationStepHelper:
    'El reporte fue firmado oficialmente. Por favor confirma que los KPIs calculados de tu área son correctos.',
  kpiValidationBadgeLabel: 'Pendiente',
} as const;

// Responsable — revision KPI enviada con discrepancia pendiente (Figma 1760:21616).
// Conectado con gerente Figma 1760:22435 → /spr/mi-area?estado=aprobado
export const SPR_RESPONSIBLE_KPI_REVIEW_SUBMITTED_STATUS = {
  cycleStatusLabel: 'Cerrado y reportado',
  formStatusLabel: 'Completado ✓',
  formStatusHelper: 'Aprobado por tu Gerente',
  reportStatusLabel: 'Firmado oficialmente',
  reportSignDateFallback: '09-06-2026',
  reportSignerFallback: 'Gabriel Fuenzalida',
  reportSignHelper: (dateLabel: string, signerLabel: string) => `${dateLabel} · ${signerLabel}`,
  discrepancyStepTitle: (cycleLabel: string) =>
    `Formulario SPR ${cycleLabel} - Has reportado una discrepancia`,
  discrepancyStepHelper: 'A la espera de la decisión de Especialista de Sustentabilidad',
  discrepancyBadgeLabel: 'Pendiente',
  kpiValidationStepTitle: (cycleLabel: string) => `Validación de KPIs — Reporte SPR ${cycleLabel}`,
  kpiValidationStepHelper:
    'El reporte fue firmado oficialmente. Por favor confirma que los KPIs calculados de tu área son correctos.',
  kpiValidationBadgeLabel: 'Completado',
} as const;

// Responsable — correccion solicitada por especialista (Figma 1760:27156).
// Conectado con especialista Figma 1760:24201 → /spr/reporte/consolidado?estado=validacion-discrepancia
export const SPR_RESPONSIBLE_CORRECTION_REQUESTED_STATUS = {
  cycleStatusLabel: 'En curso',
  formStatusLabel: 'Corrección solicitada',
  formStatusHelper: 'A la espera de tu corrección',
  reportStatusLabel: 'Aún no disponible',
  reportStatusHelper: 'A la espera de tu corrección',
  urgentStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} debe ser corregido`,
  urgentStepHelper: 'Corrige el formulario de tu área lo antes posible',
  urgentBadgeLabel: 'Urgente',
  submittedHistoryStepTitle: (dateLabel: string) => `Formulario enviado el ${dateLabel}`,
  submittedHistoryStepHelper: 'Esperando la aprobación del gerente de área',
  emittedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} emitido`,
  emittedStepHelper: (creationDate: string) => `Fecha de creación: ${creationDate}`,
  emittedDateFallback: '01-05-2026',
} as const;

// Responsable — formulario de corrección tras reapertura por discrepancia (Figma 1760:27773).
// Conectado con 1760:27156 (estado) y 1760:24201 (reapertura especialista).
export const SPR_DISCREPANCY_CORRECTION = {
  bannerTitle: 'El proceso para tu área ha sido re-abierto',
  bannerHelper: 'Corrige esta discrepancia y emite el formulario lo antes posible',
  toolbarTitle: (cycleLabel: string) => `Ingresa los datos de tu área para el período ${cycleLabel}`,
  toolbarRequiredHint: '· Todos los campos son obligatorios',
  parametersTitle: 'Parámetros a corregir',
  kpiToCorrect: {
    name: 'Freshwater Intensity',
    valueLabel: '55,9 MLT',
  },
  uploadTip: 'Reemplaza o sube nuevas fuentes',
  summaryTitle: 'Discrepancia a corregir',
  yourDataLabel: 'Datos que tú ingresaste',
  sacCalculatedLabel: 'Calculado por el SAC',
  parameterCode: 'ESG_SD_C06_WMA',
  parameterToEdit: {
    name: 'Ground Water: Freshwater',
    subtitle: 'Agua subterránea extraída · Control SOX: ESG_SD_C06_WMA',
    unit: 'MLT',
    defaultSource: 'Sistema Monitoreo de Extracciones DGEA',
    valuePlaceholder: 'Ingresa el valor medido',
  },
  inputs: [
    { label: 'Ground Water: Freshwater', value: '55,9 MLT' },
    { label: 'Producción Au (SAC)', value: '499 ktAu' },
  ],
  formula: 'Fórmula: 55,9 / 499',
  sacValue: '0,112',
  sacUnit: 'MLT/ktAu',
  discrepancyReportedLabel: (dateLabel: string, timeLabel: string) =>
    `Discrepancia reportada · ${dateLabel} · ${timeLabel}`,
  reportedDate: '10-06-2026',
  reportedTime: '09:15',
  comment:
    'Ej: Esperaba un porcentaje más cercano al 12%. Creo que uno de mis datos base fue mal ingresado...',
  soxNotice:
    'Este parámetro está asociado al control SOX ESG_SD_C06_WMA. Una vez que el Gerente de Área apruebe el formulario, AurelIA generará automáticamente la evidencia SOX correspondiente para firma del Gerente MA.',
  footerIncomplete: 'Completa el parámetro para poder firmar y enviar',
  footerReady: 'Parámetro completado. Puedes firmar y enviar.',
  demoHref: '/spr?estado=correccion-solicitada&vista=corregir',
  submittedDemoHref: '/spr?estado=correccion-reenviada',
} as const;

// Responsable — tras corregir y reenviar formulario (Figma 1760:29093).
// Conectado con 1760:27773 (formulario) → validacion KPI de nuevo.
export const SPR_RESPONSIBLE_CORRECTION_RESUBMITTED_STATUS = {
  cycleStatusLabel: 'En curso',
  formStatusLabel: 'Formulario corregido y reenviado',
  formStatusHelper: 'A la espera de nueva revisión KPI',
  reportStatusLabel: 'Pendiente de revisión KPI',
  reportStatusHelper: 'A la espera de tu validación',
  kpiValidationUrgentStepTitle: 'El reporte necesita tu validación KPI de nuevo',
  kpiValidationUrgentStepHelper: 'Revisa que los KPIs calculados de tu área sean correctos',
  kpiValidationUrgentBadgeLabel: 'Urgente',
  correctedStepTitle: 'Formulario corregido y reenviado',
  correctedStepHelper: 'El especialista de sustentabilidad revisará tus datos',
  resubmittedDateFallback: '10-06-2026',
  submittedHistoryStepTitle: (dateLabel: string) => `Formulario enviado el ${dateLabel}`,
  submittedHistoryStepHelper: 'Esperando la aprobación del gerente de área',
  emittedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} emitido`,
  emittedStepHelper: (creationDate: string) => `Fecha de creación: ${creationDate}`,
  emittedDateFallback: '01-05-2026',
} as const;

/** Query mock para forzar validacion KPI en `/spr` (par con firmas-completas del especialista). */
export const SPR_FORM_DEMO_STATE_QUERY = 'estado';
export const SPR_FORM_DEMO_KPI_VALIDATION_STATE = 'validacion-kpis';
export const SPR_FORM_DEMO_KPI_VALIDATION_SUBMITTED_STATE = 'validacion-kpis-enviada';
/** Demo Figma 1672:14978 — responsable SOX (Servicios técnicos) con validación KPI pendiente. */
export const SPR_FORM_KPI_VALIDATION_DEMO_HREF = '/spr?estado=validacion-kpis';
/** Demo Figma 1760:19794 — revisión de KPIs (aprobar / reportar discrepancia). */
export const SPR_FORM_KPI_REVIEW_DEMO_HREF = '/spr?estado=validacion-kpis&vista=revision';
/** Tras reapertura del especialista (Figma 1760:27156). Conecta con 1760:24201. */
export const SPR_FORM_DEMO_CORRECTION_REQUESTED_STATE = 'correccion-solicitada';
/** Formulario de corrección post-reapertura (Figma 1760:27773). */
export const SPR_FORM_DEMO_DISCREPANCY_CORRECTION_VIEW = 'corregir';
/** Tras corregir y reenviar (Figma 1760:29093). */
export const SPR_FORM_DEMO_CORRECTION_RESUBMITTED_STATE = 'correccion-reenviada';
export const SPR_FORM_DEMO_VIEW_QUERY = 'vista';
export const SPR_FORM_DEMO_KPI_REVIEW_VIEW = 'revision';
/** Abre el formulario de discrepancia en una tarjeta (mock Figma 1760:20947). */
export const SPR_FORM_DEMO_DISCREPANCY_QUERY = 'discrepancia';
/** Precarga respuestas revisadas (mock Figma 1760:20600). */
export const SPR_FORM_DEMO_REVIEW_PRESET_QUERY = 'preset';
export const SPR_FORM_DEMO_REVIEW_PRESET_REVIEWED = 'revisado';
/** Abre el modal de finalizar revision (mock Figma 1831:52699). */
export const SPR_FORM_DEMO_MODAL_QUERY = 'modal';
export const SPR_FORM_DEMO_FINALIZE_MODAL = 'finalizar-revision';

export type SprKpiReviewCardType = 'direct' | 'calculated';

export type SprKpiReviewCardConfig =
  | {
      id: string;
      type: 'direct';
      title: string;
      subtitle: string;
      youEntered: { value: string; unit: string };
      sacReceived: { value: string; unit: string };
      matchMessage: string;
    }
  | {
      id: string;
      type: 'calculated';
      title: string;
      subtitle: string;
      inputs: { label: string; value: string }[];
      formula: string;
      sacValue: string;
      sacUnit: string;
      infoMessage: string;
    };

// Responsable de area — revision de KPIs vs SAC (Figma 1760:19794).
// Formulario inline de discrepancia: Figma 1760:20947 → ?discrepancia=freshwater-intensity
// Respuestas con resumen + Editar: Figma 1760:20600 → ?preset=revisado
// Modal confirmacion envio: Figma 1831:52699 → ?modal=finalizar-revision (con preset=revisado)
// Conectado con 1672:14978 (entrada) y especialista 1942:63546 (firmas-completas).
export const SPR_KPI_REVIEW = {
  pageTitle: (cycleLabel: string) => `Revisión de datos SPR — ${cycleLabel}`,
  metaLabel: 'Servicios Técnicos · Enviado por Tania Galarce · 09-06-2026',
  reportBannerTitle: (cycleLabel: string) => `Reporte SPR ${cycleLabel} — Firmado oficialmente`,
  reportBannerDescription:
    'Revisa que los valores de tu área son correctos y descarga el PDF como evidencia para tus controles SOX.',
  downloadPdfLabel: 'Descargar PDF firmado',
  footerHint: 'Revisa los 3 datos antes de finalizar · Puedes editar tus respuestas antes de enviar',
  finalizeLabel: 'Finalizar revisión',
  confirmLabel: 'El número es correcto',
  reportDiscrepancyLabel: 'Reportar discrepancia',
  discrepancyExplanationLabel: 'Explica qué número esperabas y por qué',
  discrepancyExplanationPlaceholder:
    'Ej: Esperaba un porcentaje más cercano al 12%. Creo que uno de mis datos base fue mal ingresado...',
  cancelLabel: 'Cancelar',
  submitDiscrepancyLabel: 'Reportar discrepancia',
  pendingBadge: 'Pendiente',
  confirmedBadge: 'Confirmado',
  discrepancyBadge: 'Discrepancia',
  discrepancyReportedBadge: 'Discrepancia reportada',
  editLabel: 'Editar',
  confirmedSummaryLabel: (dateLabel: string) => `Confirmado como correcto · ${dateLabel}`,
  discrepancyReportedSummaryLabel: (dateLabel: string, timeLabel: string) =>
    `Discrepancia reportada · ${dateLabel} · ${timeLabel}`,
  responseDateFallback: '10-06-2026',
  discrepancyTimeFallback: '09:15',
  demoDiscrepancyCommentFallback:
    'Ej: Esperaba un porcentaje más cercano al 12%. Creo que uno de mis datos base fue mal ingresado...',
  cards: [
    {
      id: 'ground-water-freshwater',
      type: 'direct',
      title: 'Ground Water: Freshwater',
      subtitle: 'Agua GRI 303 · Referencia SOX en SAC · Dato ingresado directamente por ti',
      youEntered: { value: '55,9', unit: 'MLT' },
      sacReceived: { value: '55,9', unit: 'MLT' },
      matchMessage: 'El valor que ingresaste llegó exactamente igual al SAC',
    },
    {
      id: 'water-recycled',
      type: 'calculated',
      title: '% Water Recycled',
      subtitle: 'Agua GRI 303 · Referencia SOX en SAC · Calculado por el SAC usando tus datos',
      inputs: [
        { label: 'Total Recycled Water', value: '9,4 MLT' },
        { label: 'Operational Water Use', value: '122,4 MLT' },
      ],
      formula: 'Fórmula: (9,4 / 122,4) × 100',
      sacValue: '7,69',
      sacUnit: '%',
      infoMessage:
        'Tú no ingresaste este porcentaje. El SAC lo calculó automáticamente usando los datos que sí reportaste. Si el resultado no te parece correcto, repórtalo.',
    },
    {
      id: 'freshwater-intensity',
      type: 'calculated',
      title: 'Freshwater Intensity',
      subtitle: 'Agua GRI 303 · Calculado por el SAC usando tus datos',
      inputs: [
        { label: 'Ground Water: Freshwater', value: '55,9 MLT' },
        { label: 'Producción Au (SAC)', value: '499 ktAu' },
      ],
      formula: 'Fórmula: 55,9 / 499',
      sacValue: '0,112',
      sacUnit: 'MLT/ktAu',
      infoMessage:
        'Tú no ingresaste este indicador. El SAC lo calculó usando tu Ground Water y la producción de Au del período.',
    },
  ] satisfies SprKpiReviewCardConfig[],
} as const;

// Modal de confirmacion al finalizar revision KPI (Figma 1831:52699).
export const SPR_KPI_REVIEW_FINALIZE_MODAL = {
  title: 'Finalizar revisión de KPIs',
  description: (kpiCount: number, areaLabel: string, specialistLabel: string) =>
    `Estás a punto de enviar tu revisión de los ${kpiCount} KPIs de ${areaLabel} a ${specialistLabel}. Una vez enviada, podrás seguir viendo el estado pero no podrás editar tus respuestas.`,
  summaryTitle: 'Resumen de tu revisión',
  confirmedCountLabel: 'KPIs confirmados',
  discrepancyCountLabel: 'Discrepancias reportadas',
  continueReviewLabel: 'Seguir revisando',
  submitLabel: 'Enviar revisión',
  submittingLabel: 'Enviando…',
  areaLabelFallback: 'Servicios Técnicos',
  specialistLabelFallback: 'Tania Galarce',
  kpiCount: 3,
} as const;

// PLACEHOLDER: estado pendiente de revision del gerente (Figma 1672:4994).
export const SPR_MANAGER_PENDING_REVIEW_STATUS = {
  pendingStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} pendiente de aprobación`,
  pendingStepHelper: 'A la espera de tu firma y aprobación',
  pendingBadgeLabel: 'Pendiente',
  deliveredStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} entregado por el responsable del área`,
  deliveredStepHelper: 'El responsable de área ha emitido el formulario',
} as const;

// PLACEHOLDER: pantalla de revision del gerente (Figma 1395:12112 / 1399:13951).
export const SPR_AREA_REVIEW = {
  responsibleNameFallback: 'Responsable de área',
  dataSourcePlaceholder: 'Sin fuente declarada',
  submittedDateFallback: '08-06-2026',
  signedDateFallback: '05-06-2026',
  signedTimeFallback: '14:23',
  entryDateFallback: '05-06-2026 · 14:08',
  footerInfo:
    'Al aprobar y firmar, AurelIA generará automáticamente las evidencias SOX y notificará al Gerente MA.',
  rejectLabel: 'Rechazar',
  approveLabel: 'Aprobar y firmar',
  pendingReviewBadge: 'Pendiente tu revisión',
  areaStatusLabel: 'Esperando tu firma',
  processStatusLabel: 'Pendiente tu firma',
  formSentTitle: (responsibleLabel: string) => `Formulario enviado por ${responsibleLabel}`,
  readOnlyHint: 'Solo lectura · Selecciona un parámetro para revisar',
  pageSubtitle: (cycleLabel: string) =>
    `Ciclo ${cycleLabel} · Formulario recibido · Pendiente de tu revisión y firma`,
  parametersCompletedLabel: (completed: number, total: number) => `${completed} de ${total}`,
  attachmentsCountLabel: (count: number) => `${count} ${count === 1 ? 'archivo' : 'archivos'}`,
  historicalAlertTitle: 'Valor fuera del rango histórico — detectado por AurelIA',
  historicalAlertDescription:
    'Este parámetro presenta una desviación superior al 10% respecto al promedio de los últimos 6 meses. Revisa el valor y la nota explicativa del Responsable antes de aprobar o rechazar.',
  responsibleNoteSectionTitle: 'Nota del Responsable de Área',
  justificationHeader: 'Justificación del Responsable · En respuesta a la alerta detectada',
  soxApprovalNotice: (controlCode: string) =>
    `Al aprobar este formulario, AurelIA generará automáticamente la evidencia SOX ${controlCode} para firma del Gerente MA. Esta evidencia incluirá el valor reportado y la alerta de desviación como antecedente.`,
} as const;

// Modal de rechazo del gerente (Figma 1399:14360).
export const SPR_AREA_REJECT_MODAL = {
  title: 'Rechazar formulario',
  description:
    'El Responsable de Área recibirá una notificación con tu motivo y podrá corregir el formulario desde AurelIA antes del plazo de cierre.',
  reasonLabel: 'Motivo del rechazo',
  reasonPlaceholder: (responsibleLabel: string) =>
    `Describe qué debe corregir ${responsibleLabel}. Sé específico para facilitar la corrección...`,
  cancelLabel: 'Cancelar',
  submitLabel: 'Enviar rechazo',
} as const;

// Modal de aprobación/firma del gerente (Figma 1672:10058 overlay + 1672:10110).
export const SPR_AREA_APPROVE_MODAL = {
  title: 'Aprobar y firmar formulario',
  description: (responsibleLabel: string) =>
    `Al firmar confirmas que revisaste los datos reportados por ${responsibleLabel} y la documentación de respaldo.`,
  summaryTitle: 'Resumen del formulario',
  digitalSignatureLabel: 'Firma digital',
  signCtaLabel: 'Haz clic para firmar digitalmente',
  signedLabel: 'Firmado digitalmente',
  roleLabel: 'Gerente de Área',
  cancelLabel: 'Cancelar',
  confirmLabel: 'Confirmar aprobación',
  soxNotice: (soxEvidenceCount: number) =>
    soxEvidenceCount === 1
      ? 'Al aprobar, AurelIA generará automáticamente 1 evidencia SOX y notificará al Gerente MA para su firma.'
      : `Al aprobar, AurelIA generará automáticamente ${soxEvidenceCount} evidencias SOX y notificará al Gerente MA para su firma.`,
} as const;

// PLACEHOLDER: estado pre-envio del gerente de area (Figma 1672:4446).
export const SPR_MANAGER_WAITING_STATUS = {
  formStatusLabel: 'A la espera',
  formStatusHelper: 'Pendiente por responsable del área',
  reportStatusLabel: 'Aún no disponible',
  unavailableStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} de tu área todavía no está disponible`,
  unavailableStepHelper: 'A la espera de emisión por el responsable de área',
  pendingBadgeLabel: 'Pendiente',
} as const;

// PROVISIONAL: Figma 1672:5531 cableado; copy KPI pendiente de confirmar con Alexis (pregunta C1).
// Espejo gerente de 1672:5810. Layout/timeline razonables; el helper "Pendiente por gerente del área" puede ser incorrecto.
export const SPR_MANAGER_REJECTED_WAITING_STATUS = {
  formStatusLabel: 'Correcciones pendientes',
  formStatusHelper: 'Pendiente por gerente del área',
  reportStatusLabel: 'Aún no disponible',
  rejectedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} ha sido rechazado por tí`,
  rejectedStepHelper: 'A la espera de correcciones del responsable del área',
  rejectedBadgeLabel: 'Pendiente',
  deliveredStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} entregado por el responsable del área`,
  deliveredStepHelper: 'El responsable de área ha emitido el formulario',
} as const;

// Gerente de área — formulario aprobado (sin mock de discrepancia KPI / Especialista).
// La discrepancia Figma 1760:22435 queda fuera hasta que exista flujo real de Especialista.
export const SPR_MANAGER_APPROVED_STATUS = {
  cycleStatusLabel: 'En curso',
  formStatusLabel: 'Completado ✓',
  formStatusHelper: 'Aprobado',
  reportStatusLabel: 'Aún no disponible',
  managerApprovalDateFallback: '05-06-2026',
  approvedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} aprobado`,
  approvedStepHelper: (dateLabel: string) => `Formulario firmado y aprobado el ${dateLabel}.`,
  rejectedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} ha sido rechazado por tí`,
  rejectedStepHelper: 'A la espera de correcciones del responsable del área.',
  deliveredStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} entregado por el responsable del área`,
  deliveredStepHelper: 'El responsable de área ha emitido el formulario.',
} as const;

/** Query mock para forzar la vista aprobada del gerente en `/spr/mi-area`. */
export const SPR_AREA_DEMO_STATE_QUERY = 'estado';
export const SPR_AREA_DEMO_APPROVED_STATE = 'aprobado';

// Gerente re-revision tras reenvio corregido (Figma 1672:8268; conexion con 1672:8557).
// PROVISIONAL: implementado sin confirmar con Alexis si esta vista debe navegar a review UI (pregunta G2 pendiente).
export const SPR_MANAGER_PENDING_RE_REVIEW_STATUS = {
  pendingStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} con correcciones pendiente de aprobación`,
  pendingStepHelper: 'A la espera de tu firma y aprobación',
  pendingBadgeLabel: 'Pendiente',
  rejectedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} ha sido rechazado por tí`,
  rejectedStepHelper: 'A la espera de correcciones del responsable del área',
  deliveredStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} entregado por el responsable del área`,
  deliveredStepHelper: 'El responsable de área ha emitido el formulario',
} as const;

// PLACEHOLDER: estado post-rechazo del formulario (Figma 1672:5810).
export const SPR_REJECTED_STATUS = {
  formStatusLabel: 'Correcciones pendientes',
  formStatusHelper: 'Pendiente por gerente del área',
  reportStatusLabel: 'Aún no disponible',
  rejectedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} ha sido rechazado por Gerente de área`,
  rejectedStepHelper: 'A la espera de tus correcciones.',
  rejectedBadgeLabel: 'Pendiente',
  emittedStepTitle: (cycleLabel: string) => `Formulario SPR ${cycleLabel} de tu área ha sido emitido`,
  emittedStepHelper: 'A la espera de la aprobación y firma de tu gerente de área.',
} as const;

// PLACEHOLDER: modo corrección post-rechazo (Figma 1672:6610).
export const SPR_CORRECTION_MODE = {
  approverFallbackLabel: 'Gerente de área',
  rejectedDateFallback: '05-06-2026',
  rejectedTimeFallback: '15:22',
  commentFallback:
    'El valor reportado requiere verificación. Por favor corregir el dato antes de reenviar.',
  statusLabel: 'Rechazado — pendiente corrección',
  bannerTitle: (approverLabel: string, dateLabel: string, timeLabel: string) =>
    `Formulario rechazado por ${approverLabel} · ${dateLabel} · ${timeLabel}`,
  statusHelper: (dateLabel: string, timeLabel: string) => `Rechazado el ${dateLabel} · ${timeLabel}`,
  footerReadyMessage: 'Todos los parámetros completados. Puedes firmar y enviar.',
  nonEditableRecordMessage: 'Este parámetro ya fue aprobado y no se puede editar.',
} as const;

// Copy del modal de envio (Figma 1666:3035 / 1672:7702).
export const SPR_SUBMIT_MODAL = {
  title: 'Firmar y enviar formulario',
  initialDescription:
    'Al firmar confirmas que los datos ingresados son correctos y están respaldados por la documentación adjunta. El Gerente de Área recibirá una notificación para revisar y aprobar.',
  correctionDescription:
    'Al firmar confirmas que los datos han sido corregidos. El Gerente de Área recibirá una notificación para revisar y aprobar.',
  summaryTitle: 'Resumen del formulario',
} as const;

// PLACEHOLDER: "Fuente del dato" no existe como campo en spr_monthly_records.
// Listas por área (Figma 2606:5127) viven en sprFormFlow.constants.ts.
export { SPR_DATA_SOURCE_OPTIONS } from './sprFormFlow.constants';

// PLACEHOLDER: la documentacion adjunta requiere un record id y flujo de evidencias
// (GET/POST /spr/monthly-records/:id/evidences). Para la primera pantalla se listan
// archivos de ejemplo tomados del diseno, sin wiring real de carga/descarga.
export const SPR_MOCK_ATTACHMENTS = [
  { name: 'Registro_Mensual_Agua_MAY2026.xlsx', size: '284 KB', type: 'excel' as const },
  { name: 'Declaracion_DGEA_Mayo2026.pdf', size: '1,2 MB', type: 'pdf' as const },
] as const;

// PLACEHOLDER: promedios historicos de 6 meses para alertas de rango (Figma 1395:4462).
// La logica real vive en sprHistoricalRange.ts; se evalua por codigo de parametro.

// PLACEHOLDER: Dashboard Especialista de Sustentabilidad (Figma 2109:45162).
// No existe API de consolidado multi-area / ciclo corporativo / SAC. Datos de demo Figma.
export const SPR_REPORT_DASHBOARD = {
  pageTitle: 'SPR — Reporte SPR',
  pageSubtitle: (cycleLabel: string) => `Ciclo ${cycleLabel} · Consolidado automático en curso`,
  cycleBannerTitle: (cycleLabel: string) => `Ciclo — ${cycleLabel}`,
  cycleBannerHelper:
    'Consolidado se actualiza al recibir cada formulario firmado por el Responsable · Independiente de la firma del Gerente',
  cycleActiveBadge: 'Ciclo activo',
  traceabilityLabel: 'Ver trazabilidad del ciclo',
  alertBadge: '1 valor con alerta histórica',
  areasSectionTitle: (cycleLabel: string) => `Estado por área — ${cycleLabel}`,
  reportSectionTitle: (cycleLabel: string) => `Estado del Reporte SPR — ${cycleLabel}`,
  closureSectionTitle: (cycleLabel: string) => `Estado de cierre de ciclo — ${cycleLabel}`,
  closureSectionHelper: 'Actualizado al recibir cada formulario del Responsable y aprobación del Gerente',
  closureStatusLabel: 'Incompleto — No es posible el cierre de este ciclo',
  viewConsolidatedLabel: 'Ver consolidado',
  /** Cycle selector badge on estimated area detail (Figma 2587:4277). */
  cycleWithEstimatesBadge: 'Activo con estimados',
} as const;

export type SprReportTimelineStepStatus = 'done' | 'active' | 'upcoming';
export type SprReportTimelineAccent = 'rose' | 'teal' | 'amber' | 'navy' | 'sky';

export const SPR_REPORT_TIMELINE_STEPS = [
  {
    step: 1,
    title: 'Entrega de áreas',
    dateLabel: '05-06-2026 · Hoy',
    description: 'Responsables firman y envían · el consolidado se actualiza al recibir',
    actorLabel: 'Responsable de Área',
    status: 'done' as SprReportTimelineStepStatus,
    progress: 1,
    accent: 'rose' as SprReportTimelineAccent,
  },
  {
    step: 2,
    title: 'Consolidado automático',
    dateLabel: '7 áreas entregaron · 1 estimada',
    description: 'AurelIA consolida datos al recibir cada formulario.',
    actorLabel: 'AurelIA · Automático',
    status: 'active' as SprReportTimelineStepStatus,
    progress: 0.875,
    accent: 'teal' as SprReportTimelineAccent,
  },
  {
    step: 3,
    title: 'Envío al SAC corporativo',
    dateLabel: '09-06-2026',
    description: 'AurelIA envía el consolidado al SAC vía API. Se ejecuta independientemente del estado de firmas.',
    actorLabel: 'AurelIA → SAC',
    status: 'upcoming' as SprReportTimelineStepStatus,
    progress: 0,
    accent: 'amber' as SprReportTimelineAccent,
  },
  {
    step: 4,
    title: 'Firma del reporte SAC',
    dateLabel: '10-06-2026 · 5 días',
    description: 'Tania/Cata/Marjorie firman primero · Gabriel o Elisa dan el alta oficial.',
    actorLabel: 'Esp. Sust. → Gte. MA',
    status: 'upcoming' as SprReportTimelineStepStatus,
    progress: 0,
    accent: 'navy' as SprReportTimelineAccent,
  },
  {
    step: 5,
    title: 'Validación de datos',
    dateLabel: '10-06-2026 · 5 días',
    description: 'Gerentes de área SOX validan los datos reportados en sus perímetros.',
    actorLabel: 'Serv. Técnicos y Opt. de activos',
    status: 'upcoming' as SprReportTimelineStepStatus,
    progress: 0,
    accent: 'sky' as SprReportTimelineAccent,
  },
] as const;

export const SPR_REPORT_KPI_CARDS = [
  {
    value: '8',
    label: 'Áreas participantes',
    helper: '7 formularios recibidos',
    helperTone: 'teal' as const,
  },
  {
    value: '8',
    label: 'En consolidado',
    helper: 'Incluidos al recibir formulario',
    helperTone: 'muted' as const,
  },
  {
    value: '0',
    label: 'Sin datos aún · 1 área con datos estimados',
    helper: 'Fecha límite: Sin fecha límite',
    helperTone: 'purple' as const,
  },
  {
    value: '4/6',
    label: 'Aprobados por Gerente',
    helper: '2 pendientes de aprobación',
    helperTone: 'amber' as const,
  },
] as const;

export const SPR_REPORT_STATUS_ROWS = [
  {
    title: 'Consolidado en curso — 6 de 8 formularios recibidos',
    helper:
      'Actualizado al recibir cada formulario del Responsable · La aprobación del Gerente mejora la calidad pero no bloquea el consolidado',
    badge: '6/8 formularios',
    badgeTone: 'success' as const,
    actionLabel: 'Ver consolidado',
    actionHref: '/spr/reporte/consolidado',
  },
  {
    title: 'Envío al SAC — Automático · Día 9',
    helper: 'AurelIA envió el consolidado disponible el 09-06-2026, con o sin todas las firmas de Gerente',
    badge: '09-06-2026',
    badgeTone: 'success' as const,
    actionLabel: 'Ver reporte SAC',
    actionHref: '/spr/reporte/consolidado?estado=consolidado-enviado&tab=sac',
  },
  {
    title: 'Firma del reporte oficial — Orden: Tania/Cata/Marjorie → Gabriel/Elisa',
    helper: 'Disponible cuando el SAC genere el reporte · El Especialista firma primero',
    badge: 'Pendiente',
    badgeTone: 'muted' as const,
    actionLabel: null,
    actionHref: null,
  },
] as const;

export type SprReportAreaCardStatus = 'complete' | 'consolidating' | 'pending' | 'estimated';

export const SPR_REPORT_AREA_CARDS: {
  slug: string;
  name: string;
  status: SprReportAreaCardStatus;
  statusLabel: string;
  progress: number;
  badges: string[];
  /** Solo Algunas areas tienen mock de detalle (Figma 1560:3294 / 2587:4277). */
  hasDetailView?: boolean;
}[] = [
  {
    slug: 'servicios-tecnicos',
    name: 'Servicios Técnicos',
    status: 'complete',
    statusLabel: 'Completa',
    progress: 1,
    badges: ['Resp. ✓', 'Gte. ✓', 'Consolidado ✓'],
    hasDetailView: true,
  },
  {
    slug: 'optimizacion-de-activos',
    name: 'Optimización de Activos',
    status: 'complete',
    statusLabel: 'Completa',
    progress: 1,
    badges: ['Resp. ✓', 'Gte. ✓', 'Consolidado ✓'],
  },
  {
    slug: 'mina',
    name: 'Mina',
    status: 'complete',
    statusLabel: 'Completa',
    progress: 1,
    badges: ['Resp. ✓', 'Gte. ✓', 'Consolidado ✓'],
  },
  {
    slug: 'finanzas',
    name: 'Finanzas',
    status: 'complete',
    statusLabel: 'Completa',
    progress: 1,
    badges: ['Resp. ✓', 'Gte. ✓', 'Consolidado ✓'],
  },
  {
    slug: 'planta',
    name: 'Planta',
    status: 'consolidating',
    statusLabel: 'En consolidado',
    progress: 0.66,
    badges: ['Resp. ✓', 'Gte. →', 'Consol. · sin Gte.'],
    hasDetailView: true,
  },
  {
    slug: 'medio-ambiente',
    name: 'Medio Ambiente',
    status: 'consolidating',
    statusLabel: 'En consolidado',
    progress: 0.66,
    badges: ['Resp. ✓', 'Gte. →', 'Consol. · sin Gte.'],
  },
  {
    slug: 'sustentabilidad',
    name: 'Sustentabilidad',
    status: 'complete',
    statusLabel: 'Completa',
    progress: 1,
    badges: ['Resp. ✓', 'Gte. ✓', 'Consolidado ✓'],
  },
  {
    slug: 'servicios-operacionales',
    name: 'Servicios operacionales',
    status: 'estimated',
    statusLabel: '3 Estimados · Prom. 6 meses',
    progress: 1,
    badges: ['Resp. ✓', 'Gte.', 'Sin datos'],
    hasDetailView: true,
  },
];

/** Figma 2109:35701 / 2475:19381 — Detalle por área en consolidado enviado. */
export const SPR_CONSOLIDATED_SENT_AREA_CARDS: {
  slug: string;
  name: string;
  status: SprReportAreaCardStatus;
  statusLabel: string;
  progress: number;
  badges: string[];
}[] = [
  {
    slug: 'servicios-tecnicos',
    name: 'Servicios Técnicos',
    status: 'complete',
    statusLabel: 'Completa',
    progress: 1,
    badges: ['Resp. ✓', 'Gte. ✓', 'Consolidado ✓'],
  },
  {
    slug: 'optimizacion-de-activos',
    name: 'Optimización de Activos',
    status: 'complete',
    statusLabel: 'Completa',
    progress: 1,
    badges: ['Resp. ✓', 'Gte. ✓', 'Consolidado ✓'],
  },
  {
    slug: 'mina',
    name: 'Mina',
    status: 'complete',
    statusLabel: 'Completa',
    progress: 1,
    badges: ['Resp. ✓', 'Gte. ✓', 'Consolidado ✓'],
  },
  {
    slug: 'finanzas',
    name: 'Finanzas',
    status: 'complete',
    statusLabel: 'Completa',
    progress: 1,
    badges: ['Resp. ✓', 'Gte. ✓', 'Consolidado ✓'],
  },
  {
    slug: 'planta',
    name: 'Planta',
    status: 'consolidating',
    statusLabel: 'En consolidado',
    progress: 0.66,
    badges: ['Resp. ✓', 'Gte. →', 'Consol. · sin Gte.'],
  },
  {
    slug: 'medio-ambiente',
    name: 'Medio Ambiente',
    status: 'consolidating',
    statusLabel: 'En consolidado',
    progress: 0.66,
    badges: ['Resp. ✓', 'Gte. →', 'Consol. · sin Gte.'],
  },
  {
    slug: 'servicios-generales',
    name: 'Servicios Generales',
    status: 'pending',
    statusLabel: 'Pendiente',
    progress: 0,
    badges: ['Resp.', 'Gte.', 'Sin datos'],
  },
  {
    slug: 'sustentabilidad',
    name: 'Sustentabilidad',
    status: 'pending',
    statusLabel: 'Pendiente',
    progress: 0,
    badges: ['Resp.', 'Gte.', 'Sin datos'],
  },
];

export const SPR_REPORT_CLOSURE_ITEMS = [
  'El reporte presenta datos finales, sin estimaciones',
  'El reporte fue firmado por Sustentabilidad',
  'El reporte fue firmado por Gerencia',
  'Los datos han sido validados por áreas SOX',
] as const;

/** Flujo mock Dashboard SPR: `?estado=` en `/spr/reporte`. */
export const SPR_REPORT_FLOW_QUERY = 'estado' as const;

export type SprReportFlowId = 'en-curso' | 'validacion-aprobada' | 'ciclo-cerrado';

export type SprReportKpiValueTone = 'teal' | 'amber' | 'navy';
export type SprReportKpiHelperTone = 'teal' | 'purple' | 'amber' | 'muted' | 'navy';
export type SprReportClosureItemStatus = 'pending' | 'completed';

export type SprReportKpiCard = {
  value: string;
  valueTone?: SprReportKpiValueTone;
  label: string;
  /** Parte púrpura inline del label (Figma 2109:49560 — KPI sin datos / estimados). */
  labelHighlight?: string;
  helper: string;
  helperTone: SprReportKpiHelperTone;
};

export type SprReportStatusRow = {
  title: string;
  helper: string;
  badge: string;
  badgeTone: 'success' | 'muted';
  actionLabel: string | null;
  actionHref: string | null;
  actionVariant?: 'outline' | 'primary';
};

export type SprReportClosureItem = {
  label: string;
  status: SprReportClosureItemStatus;
};

export type SprReportDashboardConfig = {
  showTimeline: boolean;
  showReportStatus: boolean;
  pageSubtitle: (cycleLabel: string) => string;
  cycleBanner: {
    variant: 'light' | 'navy';
    helper?: string;
    badges: { label: string; tone: 'teal' | 'purple' | 'success' }[];
  };
  estimateBanner: {
    title: string;
    description: string;
    descriptionBold?: string;
    descriptionAfter?: string;
  } | null;
  kpiCards: SprReportKpiCard[];
  statusRows: SprReportStatusRow[];
  areaCards: (typeof SPR_REPORT_AREA_CARDS)[number][];
  closure: {
    helper: string;
    statusLabel: string;
    statusTone: 'danger' | 'success';
    items: SprReportClosureItem[];
  };
};

/** Demo Figma 2109:49560 — dashboard Mayo activo con estimados; ciclo no cerrable. */
export const SPR_REPORT_VALIDACION_APROBADA_DEMO_HREF = '/spr/reporte?ciclo=mayo-2026&estado=validacion-aprobada';
/** Demo Figma 1797:46981 / 2109:48163 — Mayo cerrado. */
export const SPR_REPORT_MAYO_CICLO_CERRADO_DEMO_HREF = '/spr/reporte?ciclo=mayo-2026&estado=ciclo-cerrado';
/** Demo Figma 2109:49077 — Junio 2026 (actual) ciclo cerrado. */
export const SPR_REPORT_CICLO_CERRADO_DEMO_HREF = '/spr/reporte?ciclo=junio-2026&estado=ciclo-cerrado';

const SPR_REPORT_VALIDACION_APROBADA_STATUS_ROWS: SprReportStatusRow[] = [
  {
    title: 'Consolidado en curso — 6 de 8 formularios recibidos',
    helper:
      'Actualizado al recibir cada formulario del Responsable · La aprobación del Gerente mejora la calidad pero no bloquea el consolidado',
    badge: '6/8 formularios',
    badgeTone: 'success',
    actionLabel: 'Ver consolidado',
    actionHref:
      '/spr/reporte/consolidado?estado=validacion-aprobada&tab=consolidado&detalle=cerrado&modal=ciclo-incompleto',
    actionVariant: 'primary',
  },
  {
    title: 'Envío al SAC — Automático · Día 9',
    helper: 'AurelIA envió el consolidado disponible el 09-06-2026, con o sin todas las firmas de Gerente',
    badge: '09-06-2026',
    badgeTone: 'success',
    actionLabel: 'Ver reporte SAC',
    actionHref: '/spr/reporte/consolidado?estado=validacion-aprobada&tab=sac',
    actionVariant: 'primary',
  },
  {
    title: 'Firma del reporte oficial — Orden: Esp. Sstentabilidad → Gerentes MA',
    helper: 'Reporte firmado por Esp. Sustentabilidad y Gerentes MA',
    badge: 'Completo',
    badgeTone: 'success',
    actionLabel: null,
    actionHref: null,
  },
];

const SPR_REPORT_VALIDACION_APROBADA_CLOSURE_ITEMS: SprReportClosureItem[] = [
  { label: SPR_REPORT_CLOSURE_ITEMS[0], status: 'pending' },
  { label: SPR_REPORT_CLOSURE_ITEMS[1], status: 'completed' },
  { label: SPR_REPORT_CLOSURE_ITEMS[2], status: 'completed' },
  { label: SPR_REPORT_CLOSURE_ITEMS[3], status: 'completed' },
];

const SPR_REPORT_CICLO_CERRADO_AREA_CARDS: (typeof SPR_REPORT_AREA_CARDS)[number][] =
  SPR_REPORT_AREA_CARDS.map((area) => {
    if (area.slug === 'servicios-operacionales') {
      return {
        ...area,
        status: 'consolidating' as const,
        statusLabel: 'En consolidado',
        progress: 0,
        badges: ['Resp. ✓', 'Gte. →', 'Consol. · sin Gte.'],
      };
    }
    if (area.slug === 'planta' || area.slug === 'medio-ambiente') {
      return { ...area, progress: 1 };
    }
    return area;
  });

const SPR_REPORT_CICLO_CERRADO_CLOSURE_ITEMS: SprReportClosureItem[] = SPR_REPORT_CLOSURE_ITEMS.map(
  (label) => ({ label, status: 'completed' as const }),
);

// PLACEHOLDER: detalles de area en Reporte SPR del Especialista.
// Sin API de consolidado por area; datos demo tomados de Figma.
export type SprReportAreaDetailTone = 'default' | 'teal' | 'blue' | 'sox' | 'danger';
export type SprReportAreaHeaderBadgeTone = 'complete' | 'pending' | 'danger';
export type SprReportSignatureBadgeTone = 'success' | 'pending';
export type SprReportSignatureAvatarTone = 'blue' | 'green' | 'muted';
export type SprReportAreaViewMode = 'filled' | 'empty' | 'estimated';
export type SprReportStatusLabelTone = 'success' | 'danger';

export type SprReportAreaDetailParameter = {
  id: string;
  name: string;
  subtitle: string;
  valueLabel: string;
  dataSource: string;
  isSox: boolean;
  needsHistoricalReview: boolean;
  /** Figma 2587:4277 — badge Estimado en lista / valor. */
  estimated?: boolean;
  note: string | null;
  historical: {
    enteredValueLabel: string;
    averageValueLabel: string;
    deviationLabel: string;
  } | null;
  detailRows: { label: string; value: string; tone: SprReportAreaDetailTone | 'purple' }[];
};

export type SprReportAreaDetailData = {
  viewMode: SprReportAreaViewMode;
  headerBadge: string;
  headerBadgeTone: SprReportAreaHeaderBadgeTone;
  statusLabel: string | null;
  statusLabelTone: SprReportStatusLabelTone;
  reminderLabel: string | null;
  showParameterSoxBadges: boolean;
  historicalAlertCountLabel: (count: number) => string;
  traceabilityLabel: string;
  historicalAlertTitle: string;
  historicalAlertDescription: string;
  pendingManagerNotice: { title: string; description: string } | null;
  /** Figma 2587:4277 — banner púrpura de estimación. */
  estimateNotice: { title: string; description: string; descriptionBold?: string; descriptionAfter?: string } | null;
  parametersSidebarAlert: string | null;
  emptyDocumentsLabel: string | null;
  /** Dropzone mock cuando no hay docs (estimado). */
  documentsDropzone?: { title: string; helper: string } | null;
  emptyState: { title: string; description: string; ctaLabel: string } | null;
  emptyNoteTitle: string;
  emptyNoteHelper: string;
  footerNotice: string | null;
  processStatusTitle: string;
  parametersTitle: string;
  documentsTitle: string;
  processRows: { label: string; value: string; tone: SprReportAreaDetailTone }[];
  documents: { name: string; size: string }[];
  parameters: SprReportAreaDetailParameter[];
  signatures: {
    roleLabel: string;
    helperPrefix: string;
    helperHighlight: string | null;
    badge: string;
    badgeTone: SprReportSignatureBadgeTone;
    avatarTone: SprReportSignatureAvatarTone;
    muted?: boolean;
  }[];
};

/** Figma 1560:3294 — Servicios Técnicos completa. */
export const SPR_REPORT_AREA_DETAIL_SERVICIOS_TECNICOS: SprReportAreaDetailData = {
  viewMode: 'filled',
  headerBadge: 'Completa · Resp. ✓ · Gte. ✓ · Consolidado ✓',
  headerBadgeTone: 'complete',
  statusLabel: 'En consolidado · Aprobado por Gerente',
  statusLabelTone: 'success',
  reminderLabel: null,
  showParameterSoxBadges: true,
  historicalAlertCountLabel: (count: number) =>
    count === 1 ? '1 valor fuera del rango histórico' : `${count} valores fuera del rango histórico`,
  traceabilityLabel: 'Ver trazabilidad',
  historicalAlertTitle: 'Valor fuera del rango histórico',
  historicalAlertDescription:
    'Desviación superior al 10% respecto al promedio de 6 meses. El Gerente aprobó revisando la nota del Responsable.',
  pendingManagerNotice: null,
  estimateNotice: null,
  parametersSidebarAlert: null,
  emptyDocumentsLabel: null,
  documentsDropzone: null,
  emptyState: null,
  emptyNoteTitle: 'Sin nota',
  emptyNoteHelper: 'El Responsable no dejó comentarios adicionales.',
  footerNotice: null,
  processStatusTitle: 'Estado del proceso',
  parametersTitle: 'Parámetros reportados',
  documentsTitle: 'Documentación adjunta',
  processRows: [
    { label: 'Estado', value: 'Completa', tone: 'default' },
    { label: 'Responsable envió', value: '04-06-2026 · 11:20', tone: 'default' },
    { label: '→ Consolidado desde', value: '04-06-2026 · 11:20 · Automático', tone: 'teal' },
    { label: 'Gerente aprobó', value: '05-06-2026 · 18:45', tone: 'default' },
    { label: 'Parámetros', value: '8 de 8 completados', tone: 'default' },
  ],
  documents: [
    { name: 'Registro_Agua_MAY2026.xlsx', size: '284 KB' },
    { name: 'Declaracion_DGEA_Mayo2026.pdf', size: '1,2 MB' },
  ],
  parameters: [
    {
      id: 'gw-freshwater',
      name: 'Ground Water: Freshwater',
      subtitle: 'Agua subterránea extraída · Referencia SOX en SAC',
      valueLabel: '55,9 MLT',
      dataSource: 'Sistema DGEA',
      isSox: true,
      needsHistoricalReview: true,
      note: 'Valor validado contra DGEA. El incremento se debe a la activación del pozo norte por mayor demanda operacional en mayo.',
      historical: {
        enteredValueLabel: '55,9 MLT',
        averageValueLabel: '44,2 MLT',
        deviationLabel: '+26,5%',
      },
      detailRows: [
        {
          label: 'Ingresado al consolidado',
          value: '04-06-2026 · 11:20 · Al recibir formulario del Responsable',
          tone: 'teal',
        },
        { label: 'Aprobado por Gerente', value: '05-06-2026 · 18:45', tone: 'default' },
        {
          label: 'Referencia SOX en SAC',
          value: 'Este dato alimenta un control SOX en el SAC',
          tone: 'sox',
        },
      ],
    },
    {
      id: 'sw-freshwater',
      name: 'Surface Water: Freshwater',
      subtitle: 'Agua superficial · Referencia SOX en SAC',
      valueLabel: '0 MLT',
      dataSource: 'Sistema DGEA',
      isSox: true,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [
        {
          label: 'Ingresado al consolidado',
          value: '04-06-2026 · 11:20 · Al recibir formulario del Responsable',
          tone: 'teal',
        },
        { label: 'Aprobado por Gerente', value: '05-06-2026 · 18:45', tone: 'default' },
        {
          label: 'Referencia SOX en SAC',
          value: 'Este dato alimenta un control SOX en el SAC',
          tone: 'sox',
        },
      ],
    },
    {
      id: 'recycled-water',
      name: 'Total Volume: Recycled Water',
      subtitle: 'Agua reciclada · Referencia SOX en SAC',
      valueLabel: '9,4 MLT',
      dataSource: 'Sistema DGEA',
      isSox: true,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [
        {
          label: 'Ingresado al consolidado',
          value: '04-06-2026 · 11:20 · Al recibir formulario del Responsable',
          tone: 'teal',
        },
        { label: 'Aprobado por Gerente', value: '05-06-2026 · 18:45', tone: 'default' },
        {
          label: 'Referencia SOX en SAC',
          value: 'Este dato alimenta un control SOX en el SAC',
          tone: 'sox',
        },
      ],
    },
    {
      id: 'operational-water',
      name: 'Operational Water Use',
      subtitle: 'Uso operacional de agua',
      valueLabel: '122,4 MLT',
      dataSource: 'Sistema DGEA',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [
        {
          label: 'Ingresado al consolidado',
          value: '04-06-2026 · 11:20 · Al recibir formulario del Responsable',
          tone: 'teal',
        },
        { label: 'Aprobado por Gerente', value: '05-06-2026 · 18:45', tone: 'default' },
        { label: 'Referencia SOX en SAC', value: 'No aplica', tone: 'default' },
      ],
    },
  ],
  signatures: [
    {
      roleLabel: 'Responsable de Área',
      helperPrefix: '04-06-2026 · 11:20 · ',
      helperHighlight: 'Consolidado al firmar',
      badge: 'Firmado ✓',
      badgeTone: 'success',
      avatarTone: 'blue',
    },
    {
      roleLabel: 'Gerente de Área',
      helperPrefix: '05-06-2026 · 18:45',
      helperHighlight: null,
      badge: 'Aprobado ✓',
      badgeTone: 'success',
      avatarTone: 'green',
    },
  ],
};

/** Figma 1560:4724 — Planta en consolidado / Gte. pendiente. */
export const SPR_REPORT_AREA_DETAIL_PLANTA: SprReportAreaDetailData = {
  viewMode: 'filled',
  headerBadge: 'En consolidado · Gte. pendiente',
  headerBadgeTone: 'pending',
  statusLabel: null,
  statusLabelTone: 'success',
  reminderLabel: 'Recordatorio al Gerente',
  showParameterSoxBadges: false,
  historicalAlertCountLabel: (count: number) =>
    count === 1 ? '1 valor fuera del rango histórico' : `${count} valores fuera del rango histórico`,
  traceabilityLabel: 'Ver trazabilidad',
  historicalAlertTitle: 'Valor fuera del rango histórico',
  historicalAlertDescription:
    'Desviación superior al 10% respecto al promedio de 6 meses. El Gerente aprobó revisando la nota del Responsable.',
  pendingManagerNotice: {
    title: 'Aprobación del Gerente de Área pendiente',
    description:
      'Los datos ya están en el consolidado desde el 04-06-2026 a las 16:33. La aprobación del Gerente es informativa — no bloquea el consolidado ni el envío al SAC.',
  },
  estimateNotice: null,
  parametersSidebarAlert: null,
  emptyDocumentsLabel: null,
  documentsDropzone: null,
  emptyState: null,
  emptyNoteTitle: 'Sin nota',
  emptyNoteHelper: 'El Responsable no dejó comentarios adicionales.',
  footerNotice:
    'Si el Gerente rechaza el formulario, el Responsable deberá hacer correcciones y reenviar. Los datos actualizados reemplazarán los del consolidado automáticamente.',
  processStatusTitle: 'Estado del proceso',
  parametersTitle: 'Parámetros reportados',
  documentsTitle: 'Documentación adjunta',
  processRows: [
    { label: 'Estado', value: 'En consolidado', tone: 'blue' },
    { label: 'Responsable envió', value: '04-06-2026 · 16:33', tone: 'default' },
    { label: 'Consolidado desde', value: '04-06-2026 · 16:33', tone: 'teal' },
    { label: 'Gerente de Área', value: 'Pendiente', tone: 'default' },
    { label: 'Parámetros', value: '6 de 6 completados', tone: 'default' },
  ],
  documents: [
    { name: 'Informe_Operaciones_Planta_MAY2026.pdf', size: '2,1 MB' },
    { name: 'Cubicacion_CM_Mayo2026.xlsx', size: '380 KB' },
  ],
  parameters: [
    {
      id: 'total-energia',
      name: 'Total Energía Consumida',
      subtitle: 'Área Planta · Solo lectura',
      valueLabel: '58.432 GJ',
      dataSource: 'SAP · Módulo CO Controlling',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'SAP · Módulo CO Controlling', tone: 'default' },
        { label: 'Período reportado', value: 'Mayo 2026', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: '04-06-2026 · 16:20', tone: 'default' },
      ],
    },
    {
      id: 'diesel',
      name: 'Combustible Diesel',
      subtitle: 'Área Planta · Solo lectura',
      valueLabel: '3.241.000 L',
      dataSource: 'SAP · Módulo CO Controlling',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'SAP · Módulo CO Controlling', tone: 'default' },
        { label: 'Período reportado', value: 'Mayo 2026', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: '04-06-2026 · 16:20', tone: 'default' },
      ],
    },
    {
      id: 'explosivos',
      name: 'Explosivos consumidos',
      subtitle: 'Área Planta · Solo lectura',
      valueLabel: '1.842 ton',
      dataSource: 'SAP · Módulo CO Controlling',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'SAP · Módulo CO Controlling', tone: 'default' },
        { label: 'Período reportado', value: 'Mayo 2026', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: '04-06-2026 · 16:20', tone: 'default' },
      ],
    },
    {
      id: 'mineral',
      name: 'Mineral procesado',
      subtitle: 'Área Planta · Solo lectura',
      valueLabel: '1.180.000 ton',
      dataSource: 'SAP · Módulo CO Controlling',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'SAP · Módulo CO Controlling', tone: 'default' },
        { label: 'Período reportado', value: 'Mayo 2026', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: '04-06-2026 · 16:20', tone: 'default' },
      ],
    },
    {
      id: 'agua-proceso',
      name: 'Agua consumida proceso',
      subtitle: 'Área Planta · Solo lectura',
      valueLabel: '38,7 MLT',
      dataSource: 'SAP · Módulo CO Controlling',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'SAP · Módulo CO Controlling', tone: 'default' },
        { label: 'Período reportado', value: 'Mayo 2026', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: '04-06-2026 · 16:20', tone: 'default' },
      ],
    },
    {
      id: 'respel',
      name: 'Residuos RESPEL',
      subtitle: 'Área Planta · Solo lectura',
      valueLabel: '24,3 ton',
      dataSource: 'SAP · Módulo CO Controlling',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'SAP · Módulo CO Controlling', tone: 'default' },
        { label: 'Período reportado', value: 'Mayo 2026', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: '04-06-2026 · 16:20', tone: 'default' },
      ],
    },
  ],
  signatures: [
    {
      roleLabel: 'Responsable de Área',
      helperPrefix: '04-06-2026 · 16:20 · ',
      helperHighlight: 'Datos incluidos al consolidado al firmar',
      badge: 'Firmado ✓',
      badgeTone: 'success',
      avatarTone: 'blue',
    },
    {
      roleLabel: 'Gerente de Área',
      helperPrefix: 'Pendiente de revisión · Notificado el 04-06-2026',
      helperHighlight: null,
      badge: 'Pendiente →',
      badgeTone: 'pending',
      avatarTone: 'muted',
      muted: true,
    },
  ],
};

/** Figma 1560:5830 — Servicios Generales pendiente / sin datos. */
export const SPR_REPORT_AREA_DETAIL_SERVICIOS_GENERALES: SprReportAreaDetailData = {
  viewMode: 'empty',
  headerBadge: 'Pendiente · Sin datos · Fecha límite hoy',
  headerBadgeTone: 'danger',
  statusLabel: 'El Responsable no ha enviado datos · Sin datos en consolidado',
  statusLabelTone: 'danger',
  reminderLabel: null,
  showParameterSoxBadges: false,
  historicalAlertCountLabel: () => '',
  traceabilityLabel: 'Ver trazabilidad',
  historicalAlertTitle: '',
  historicalAlertDescription: '',
  pendingManagerNotice: null,
  estimateNotice: null,
  parametersSidebarAlert: 'El responsable no ha iniciado el ingreso de datos. Quedan 5 días para el cierre.',
  emptyDocumentsLabel: 'Sin documentos adjuntos',
  documentsDropzone: null,
  emptyState: {
    title: 'Sin datos enviados',
    description:
      'El Responsable no ha enviado el formulario. No hay datos disponibles para el consolidado. Si no se reciben antes del día 9, AurelIA usará el promedio de los últimos 6 meses como estimación.',
    ctaLabel: 'Enviar recordatorio manual',
  },
  emptyNoteTitle: 'Sin nota',
  emptyNoteHelper: 'El Responsable no dejó comentarios adicionales.',
  footerNotice: null,
  processStatusTitle: 'Estado del proceso',
  parametersTitle: 'Parámetros por completar',
  documentsTitle: 'Documentación adjunta',
  processRows: [
    { label: 'Estado', value: 'Pendiente', tone: 'danger' },
    { label: 'Fecha límite', value: '10-06-2026 · 5 días', tone: 'danger' },
    { label: 'Parámetros', value: '0 de 7 completados', tone: 'default' },
    { label: 'Responsable', value: 'Camila Ríos P.', tone: 'default' },
  ],
  documents: [],
  parameters: [
    {
      id: 'km-charter',
      name: 'Kilómetros pasajeros charter',
      subtitle: '',
      valueLabel: 'Sin valor',
      dataSource: '',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [],
    },
    {
      id: 'km-terrestre',
      name: 'Kilómetros pasajeros terrestre',
      subtitle: '',
      valueLabel: 'Sin valor',
      dataSource: '',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [],
    },
    {
      id: 'lpg',
      name: 'LPG consumido (kg)',
      subtitle: '',
      valueLabel: 'Sin valor',
      dataSource: '',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [],
    },
    {
      id: 'rsinp',
      name: 'Residuos RSINP (ton)',
      subtitle: '',
      valueLabel: 'Sin valor',
      dataSource: '',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [],
    },
    {
      id: 'municipales',
      name: 'Residuos municipales (ton)',
      subtitle: '',
      valueLabel: 'Sin valor',
      dataSource: '',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [],
    },
    {
      id: 'valorizados',
      name: 'Residuos valorizados (ton)',
      subtitle: '',
      valueLabel: 'Sin valor',
      dataSource: '',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [],
    },
    {
      id: 'lodos',
      name: 'Lodos PTAS generados (m³)',
      subtitle: '',
      valueLabel: 'Sin valor',
      dataSource: '',
      isSox: false,
      needsHistoricalReview: false,
      note: null,
      historical: null,
      detailRows: [],
    },
  ],
  signatures: [],
};

/** Figma 2587:4277 — área con datos estimados (Servicios operacionales). */
export const SPR_REPORT_AREA_DETAIL_SERVICIOS_OPERACIONALES: SprReportAreaDetailData = {
  viewMode: 'estimated',
  headerBadge: 'En consolidado · Gte. pendiente',
  headerBadgeTone: 'pending',
  statusLabel: null,
  statusLabelTone: 'success',
  reminderLabel: null,
  showParameterSoxBadges: false,
  historicalAlertCountLabel: () => '',
  traceabilityLabel: 'Ver trazabilidad',
  historicalAlertTitle: '',
  historicalAlertDescription: '',
  pendingManagerNotice: null,
  estimateNotice: {
    title: 'Esta área cuenta con datos estimados',
    description:
      'AurelIA calculó automáticamente el promedio de los últimos 6 meses y lo usó como estimación para el envío al SAC. ',
    descriptionBold:
      'Esta estimación es solo visible para ti — el SAC recibe el valor numérico sin distinción.',
    descriptionAfter: ' Si recibes los datos reales, puedes actualizar el próximo ciclo.',
  },
  parametersSidebarAlert: null,
  emptyDocumentsLabel: null,
  documentsDropzone: {
    title: 'Adjuntar documento',
    helper: 'PDF, Excel, Word · Máx. 10 MB',
  },
  emptyState: null,
  emptyNoteTitle: 'Sin nota',
  emptyNoteHelper: 'El Responsable no dejó comentarios adicionales.',
  footerNotice:
    'Si el Gerente rechaza el formulario, el Responsable deberá hacer correcciones y reenviar. Los datos actualizados reemplazarán los del consolidado automáticamente.',
  processStatusTitle: 'Estado del proceso',
  parametersTitle: 'Parámetros reportados',
  documentsTitle: 'Documentación adjunta',
  processRows: [
    { label: 'Estado', value: 'En consolidado', tone: 'blue' },
    { label: 'Responsable envió', value: '04-06-2026 · 16:33', tone: 'default' },
    { label: 'Consolidado desde', value: '04-06-2026 · 16:33', tone: 'teal' },
    { label: 'Gerente de Área', value: 'Pendiente', tone: 'default' },
    { label: 'Parámetros', value: '6 de 6 completados', tone: 'default' },
  ],
  documents: [],
  parameters: [
    {
      id: 'param-1',
      name: 'Parámetro 1',
      subtitle: 'Área Servicios operacionales · Solo lectura',
      valueLabel: '58.432 GJ',
      dataSource: 'Estimados · Prom. 6 meses',
      isSox: false,
      needsHistoricalReview: false,
      estimated: true,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'Estimados · Prom. 6 meses', tone: 'purple' },
        { label: 'Período reportado', value: 'Promedio de 6 meses', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: 'No aplica', tone: 'default' },
      ],
    },
    {
      id: 'param-2',
      name: 'Parámetro 2',
      subtitle: 'Área Servicios operacionales · Solo lectura',
      valueLabel: '3.241.000 L',
      dataSource: 'Estimados · Prom. 6 meses',
      isSox: false,
      needsHistoricalReview: false,
      estimated: true,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'Estimados · Prom. 6 meses', tone: 'purple' },
        { label: 'Período reportado', value: 'Promedio de 6 meses', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: 'No aplica', tone: 'default' },
      ],
    },
    {
      id: 'param-3',
      name: 'Parámetro 3',
      subtitle: 'Área Servicios operacionales · Solo lectura',
      valueLabel: '1.842 ton',
      dataSource: 'Estimados · Prom. 6 meses',
      isSox: false,
      needsHistoricalReview: false,
      estimated: true,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'Estimados · Prom. 6 meses', tone: 'purple' },
        { label: 'Período reportado', value: 'Promedio de 6 meses', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: 'No aplica', tone: 'default' },
      ],
    },
    {
      id: 'param-4',
      name: 'Parámetro 4',
      subtitle: 'Área Servicios operacionales · Solo lectura',
      valueLabel: '1.180.000 ton',
      dataSource: 'Estimados · Prom. 6 meses',
      isSox: false,
      needsHistoricalReview: false,
      estimated: true,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'Estimados · Prom. 6 meses', tone: 'purple' },
        { label: 'Período reportado', value: 'Promedio de 6 meses', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: 'No aplica', tone: 'default' },
      ],
    },
    {
      id: 'param-5',
      name: 'Parámetro 5',
      subtitle: 'Área Servicios operacionales · Solo lectura',
      valueLabel: '38,7 MLT',
      dataSource: 'Estimados · Prom. 6 meses',
      isSox: false,
      needsHistoricalReview: false,
      estimated: true,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'Estimados · Prom. 6 meses', tone: 'purple' },
        { label: 'Período reportado', value: 'Promedio de 6 meses', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: 'No aplica', tone: 'default' },
      ],
    },
    {
      id: 'param-6',
      name: 'Parámetro 6',
      subtitle: 'Área Servicios operacionales · Solo lectura',
      valueLabel: '24,3 ton',
      dataSource: 'Estimados · Prom. 6 meses',
      isSox: false,
      needsHistoricalReview: false,
      estimated: true,
      note: null,
      historical: null,
      detailRows: [
        { label: 'Fuente declarada', value: 'Estimados · Prom. 6 meses', tone: 'purple' },
        { label: 'Período reportado', value: 'Promedio de 6 meses', tone: 'default' },
        { label: 'Estado en consolidado', value: 'Incluido · 04-06-2026 · 16:20', tone: 'teal' },
        { label: 'Fecha de ingreso del Responsable', value: 'No aplica', tone: 'default' },
      ],
    },
  ],
  signatures: [
    {
      roleLabel: 'Responsable de Área',
      helperPrefix: 'Pendiente de emisión · Notificado el 04-06-2026',
      helperHighlight: null,
      badge: 'Pendiente →',
      badgeTone: 'pending',
      avatarTone: 'muted',
    },
    {
      roleLabel: 'Gerente de Área',
      helperPrefix: 'Pendiente de revisión · Notificado el 04-06-2026',
      helperHighlight: null,
      badge: 'Pendiente →',
      badgeTone: 'pending',
      avatarTone: 'muted',
    },
  ],
};

export const SPR_REPORT_AREA_DETAILS: Record<string, SprReportAreaDetailData> = {
  'servicios-tecnicos': SPR_REPORT_AREA_DETAIL_SERVICIOS_TECNICOS,
  planta: SPR_REPORT_AREA_DETAIL_PLANTA,
  'servicios-generales': SPR_REPORT_AREA_DETAIL_SERVICIOS_GENERALES,
  'servicios-operacionales': SPR_REPORT_AREA_DETAIL_SERVICIOS_OPERACIONALES,
};

export function resolveSprReportAreaDetail(areaSlug: string | undefined) {
  if (!areaSlug) return null;
  const detail = SPR_REPORT_AREA_DETAILS[areaSlug];
  if (!detail) return null;
  const area =
    SPR_REPORT_AREA_CARDS.find((card) => card.slug === areaSlug) ??
    SPR_CONSOLIDATED_SENT_AREA_CARDS.find((card) => card.slug === areaSlug);
  if (!area) return null;
  return { area, detail };
}

// PLACEHOLDER: sección Reporte SPR / tabla consolidado (Figma 1564:1187).
export type SprConsolidatedTrend = 'up' | 'down' | 'flat';
export type SprConsolidatedOrigin = 'formulario' | 'automatico' | 'multiple';

export type SprConsolidatedTableRow =
  | { kind: 'group'; id: string; label: string }
  | {
      kind: 'data';
      id: string;
      name: string;
      subtitle?: string;
      area: string;
      category: string;
      value: string;
      unit: string;
      trend: SprConsolidatedTrend;
      trendLabel: string;
      origin: SprConsolidatedOrigin;
      highlight?: boolean;
      /** Figma 2109:30986 — filas estimadas con promedio 6M. */
      estimated?: boolean;
    };

/** Flujo mock Reporte SPR: `?estado=` en `/spr/reporte/consolidado`. */
export const SPR_CONSOLIDATED_FLOW_QUERY = 'estado' as const;
export const SPR_CONSOLIDATED_FLOW = {
  enCurso: 'en-curso',
  /** Consolidado 7/8 con detalle por área y tabla SAC (vista intermedia del ciclo). */
  consolidadoSieteAreas: 'consolidado-7-8',
  /** Figma 1760:25200 — tras reapertura; tab SAC con alerta de actualización pendiente. */
  sacReabierto: 'sac-reabierto',
  /** Figma 1760:30869 — SAC disponible tras proceso reabierto (8/8, firma habilitada). */
  sacDisponible: 'sac-disponible',
  sacPreparando: 'sac-preparando',
  consolidadoEnviado: 'consolidado-enviado',
  firmaGerente: 'firma-gerente',
  firmasCompletas: 'firmas-completas',
  validacionDiscrepancia: 'validacion-discrepancia',
  /** Figma 1760:23481 — validación con discrepancia tras ambas firmas. */
  validacionDiscrepanciaPostFirma: 'validacion-discrepancia-post-firma',
  /** Figma 2035:3608 — validación SOX aprobada; ciclo no cerrable por datos estimados. */
  validacionAprobada: 'validacion-aprobada',
  /** Figma 2035:7406 — ciclo cerrado exitosamente; todos los hitos completados. */
  cicloCerrado: 'ciclo-cerrado',
} as const;

export type SprConsolidatedFlowId =
  (typeof SPR_CONSOLIDATED_FLOW)[keyof typeof SPR_CONSOLIDATED_FLOW];

/** Query mock vista detalle discrepancia en validacion (Figma 1760:24201 detalle). */
export const SPR_CONSOLIDATED_DEMO_CASE_QUERY = 'caso';
export const SPR_CONSOLIDATED_DEMO_CASE_SERVICIOS_TECNICOS = 'servicios-tecnicos';
/** Query mock modal reapertura en validacion. */
export const SPR_CONSOLIDATED_DEMO_MODAL_QUERY = 'modal';
export const SPR_CONSOLIDATED_DEMO_REOPEN_MODAL = 'reabrir-area';
/** Query mock modal ciclo incompleto tras validación aprobada (Figma 2035:5007). */
export const SPR_CONSOLIDATED_DEMO_CICLO_INCOMPLETO_MODAL = 'ciclo-incompleto';
/** Query mock modal ciclo cerrado exitosamente (Figma 2035:7406). */
export const SPR_CONSOLIDATED_DEMO_CICLO_CERRADO_MODAL = 'ciclo-cerrado';
/** Query mock fila KPI con discrepancia expandida (Figma 2035:7228 / 2035:10382). */
export const SPR_CONSOLIDATED_DEMO_DISCREPANCIA_EXPANDIDA_QUERY = 'discrepancia-expandida';
export const SPR_CONSOLIDATED_DEMO_DISCREPANCIA_FRESHWATER_INTENSITY = 'freshwater-intensity';
/** Demo Figma 1760:24201 — validación con discrepancia (antes de firma gerente MA). */
export const SPR_CONSOLIDATED_VALIDACION_DISCREPANCIA_DEMO_HREF =
  '/spr/reporte/consolidado?estado=validacion-discrepancia&tab=validacion';
export const SPR_CONSOLIDATED_VALIDACION_DISCREPANCIA_REOPEN_MODAL_DEMO_HREF =
  '/spr/reporte/consolidado?estado=validacion-discrepancia&tab=validacion&modal=reabrir-area';
/** Demo Figma 1760:24680 — detalle del formulario del responsable (caso Servicios técnicos). */
export const SPR_CONSOLIDATED_SIETE_AREAS_DEMO_HREF =
  '/spr/reporte/consolidado?estado=consolidado-7-8&tab=consolidado';
/** Demo Figma 1760:24680 — detalle del formulario del responsable (caso Servicios técnicos). */
export const SPR_CONSOLIDATED_VALIDACION_DISCREPANCIA_DETAIL_DEMO_HREF =
  '/spr/reporte/consolidado?estado=validacion-discrepancia&tab=validacion&caso=servicios-tecnicos';
/** Demo Figma 1760:25200 — SAC pendiente de actualización tras reapertura. */
export const SPR_CONSOLIDATED_SAC_REABIERTO_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-reabierto&tab=sac';
/** Demo Figma 1760:25499 — tab Firma bloqueada tras reapertura. */
export const SPR_CONSOLIDATED_SAC_REABIERTO_FIRMA_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-reabierto&tab=firma';
/** Demo Figma 1760:25798 — validación esperando corrección del responsable. */
export const SPR_CONSOLIDATED_SAC_REABIERTO_VALIDACION_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-reabierto&tab=validacion';
/** Demo Figma 1760:24680 — consolidado en curso tras reapertura. */
export const SPR_CONSOLIDATED_PROCESO_REABIERTO_CONSOLIDADO_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-reabierto&tab=consolidado';
/** Demo Figma 1760:26850 — firma disponible en proceso reabierto. */
export const SPR_CONSOLIDATED_PROCESO_REABIERTO_FIRMA_LISTA_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-reabierto&tab=firma&fase=firma-lista';
/** Demo Figma 1760:30869 — SAC disponible (detalle colapsado). */
export const SPR_CONSOLIDATED_SAC_DISPONIBLE_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-disponible&tab=consolidado&detalle=cerrado';
/** Demo Figma 1760:32949 — tab Reporte SAC disponible (vista principal). */
export const SPR_CONSOLIDATED_SAC_DISPONIBLE_SAC_TAB_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-disponible&tab=sac';
/** Demo Figma 1570:6144 — tab Firma del reporte en flujo sac-disponible. */
export const SPR_CONSOLIDATED_SAC_DISPONIBLE_FIRMA_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-disponible&tab=firma';
/** Demo Figma 1956:68048 — firmas completas tras sac-disponible (header 1956:68049). */
export const SPR_CONSOLIDATED_SAC_DISPONIBLE_FIRMAS_COMPLETAS_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-disponible&tab=firma&fase=firmas-completas';
/** Demo Figma 1942:63546 — ambas firmas hechas; notifica a áreas SOX; validación en proceso. */
export const SPR_CONSOLIDATED_FIRMAS_COMPLETAS_DEMO_HREF =
  '/spr/reporte/consolidado?estado=firmas-completas&tab=firma';
/** Demo Figma 1760:34230 — validación de responsables tras firmas completas en sac-disponible. */
export const SPR_CONSOLIDATED_SAC_DISPONIBLE_VALIDACION_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-disponible&tab=validacion&fase=firmas-completas';
/** Demo Figma 1760:31420 — consolidado con detalle por área expandido. */
export const SPR_CONSOLIDATED_SAC_DISPONIBLE_DETALLE_DEMO_HREF =
  '/spr/reporte/consolidado?estado=sac-disponible&tab=consolidado&detalle=abierto';
/** Demo Figma 2035:3608 — validación aprobada; modal ciclo no cerrable por estimados. */
export const SPR_CONSOLIDATED_VALIDACION_APROBADA_DEMO_HREF =
  '/spr/reporte/consolidado?estado=validacion-aprobada&tab=consolidado&detalle=cerrado&modal=ciclo-incompleto';
/** Demo Figma 2035:5637 — tab Reporte SAC tras validación aprobada (banner verde). */
export const SPR_CONSOLIDATED_VALIDACION_APROBADA_SAC_TAB_DEMO_HREF =
  '/spr/reporte/consolidado?estado=validacion-aprobada&tab=sac';
/** Demo Figma 2035:6252 — tab Firma del reporte tras validación aprobada (banner verde + firmas). */
export const SPR_CONSOLIDATED_VALIDACION_APROBADA_FIRMA_TAB_DEMO_HREF =
  '/spr/reporte/consolidado?estado=validacion-aprobada&tab=firma';
/** Demo Figma 2035:6977 — tab Validación de responsables tras validación aprobada (banner verde + tabla KPI). */
export const SPR_CONSOLIDATED_VALIDACION_APROBADA_VALIDACION_TAB_DEMO_HREF =
  '/spr/reporte/consolidado?estado=validacion-aprobada&tab=validacion';
/** Demo Figma 2035:7228 — tab Validación con discrepancia histórica expandida (validacion-aprobada). */
export const SPR_CONSOLIDATED_VALIDACION_APROBADA_VALIDACION_DISCREPANCIA_DEMO_HREF =
  '/spr/reporte/consolidado?estado=validacion-aprobada&tab=validacion&discrepancia-expandida=freshwater-intensity';
/** Demo Figma 2035:7406 — ciclo cerrado exitosamente; modal + tab Consolidado. */
export const SPR_CONSOLIDATED_CICLO_CERRADO_DEMO_HREF =
  '/spr/reporte/consolidado?estado=ciclo-cerrado&tab=consolidado&detalle=cerrado&modal=ciclo-cerrado';
/** Demo Figma 2035:8751 — tab Consolidado tras cierre exitoso (banner verde + tabla). */
export const SPR_CONSOLIDATED_CICLO_CERRADO_CONSOLIDADO_TAB_DEMO_HREF =
  '/spr/reporte/consolidado?estado=ciclo-cerrado&tab=consolidado&detalle=cerrado';
/** Demo Figma 2035:9632 — tab Firma del reporte tras cierre exitoso (banner verde + firmas). */
export const SPR_CONSOLIDATED_CICLO_CERRADO_FIRMA_TAB_DEMO_HREF =
  '/spr/reporte/consolidado?estado=ciclo-cerrado&tab=firma';
/** Demo Figma 2035:9972 — tab Validación de responsables tras cierre exitoso (banner verde + tabla KPI). */
export const SPR_CONSOLIDATED_CICLO_CERRADO_VALIDACION_TAB_DEMO_HREF =
  '/spr/reporte/consolidado?estado=ciclo-cerrado&tab=validacion';
/** Demo Figma 2035:10382 — tab Validación con discrepancia histórica expandida (ciclo-cerrado). */
export const SPR_CONSOLIDATED_CICLO_CERRADO_VALIDACION_DISCREPANCIA_DEMO_HREF =
  '/spr/reporte/consolidado?estado=ciclo-cerrado&tab=validacion&discrepancia-expandida=freshwater-intensity';
/** Query mock detalle por área abierto/cerrado en consolidado enviado. */
export const SPR_CONSOLIDATED_DEMO_DETALLE_QUERY = 'detalle';
export const SPR_CONSOLIDATED_DEMO_DETALLE_ABIERTO = 'abierto';
/** Query mock fase firma lista en proceso reabierto. */
export const SPR_CONSOLIDATED_DEMO_FASE_QUERY = 'fase';
export const SPR_CONSOLIDATED_DEMO_FIRMA_LISTA_FASE = 'firma-lista';
export const SPR_CONSOLIDATED_DEMO_FIRMAS_COMPLETAS_FASE = 'firmas-completas';

export type SprKpiValidationRowStatus =
  | 'confirmed'
  | 'confirmedWithDiscrepancy'
  | 'discrepancy'
  | 'pending';

export type SprConsolidatedTimelineStatus = 'done' | 'active' | 'partial' | 'upcoming' | 'discrepancy';
export type SprConsolidatedTabBadgeTone = 'teal' | 'amber' | 'muted' | 'rose';

export const SPR_CONSOLIDATED_REPORT = {
  pageTitle: 'SPR — Reporte SPR',
  pageSubtitle: (cycleLabel: string) => `Ciclo ${cycleLabel} · Consolidado automático en curso`,
  pageSubtitleShort: (cycleLabel: string) => `Ciclo ${cycleLabel}`,
  traceabilityLabel: 'Ver trazabilidad del ciclo',
  bannerTitle: (cycleLabel: string) => `Consolidado automático en curso — ${cycleLabel}`,
  bannerHelper:
    'AurelIA agrega automáticamente los datos de cada área al consolidado apenas el Responsable firma y envía. No hace falta esperar a las 8 áreas.',
  tableTitle: 'Datos consolidados · 5 áreas · 28 parámetros',
  alertBadge: '1 valor con alerta histórica',
  footerShowing: 'Mostrando 28 de 28 parámetros consolidados',
  pendingAreasLabel: 'Áreas pendientes:',
  pendingAreasValue: 'Planta · Servicios Generales · Sustentabilidad',
  sacPending: {
    title: 'Reporte SAC — Pendiente de generación',
    bodyBefore: 'AurelIA enviará el consolidado al SAC el ',
    dateLabel: '09-06-2026',
    bodyAfter:
      ' vía API. El SAC calculará los KPIs derivados y generará el reporte. AurelIA lo descargará automáticamente y lo mostrará aquí.',
    availableLabel: 'Disponible en',
    daysLabel: '4 días',
  },
  // Figma 1570:2653 — tab Firma del reporte (a la espera del SAC).
  firmaPending: {
    title: 'Firma del reporte — A espera de generación del reporte SAC',
    body: 'Una vez que el reporte SAC esté disponible, este apartado se disponibilizará para que pueda ser firmado',
    availableLabel: 'Disponible en',
    daysLabel: '4 días',
  },
  // Figma 1672:14266 — tab Validación (a la espera del SAC). Copy ajustada al tab (Figma reusa texto de Firma).
  validationPending: {
    title: 'Validación de responsables — A espera de generación del reporte SAC',
    body: 'Una vez que el reporte SAC esté disponible, este apartado se disponibilizará para que pueda ser validado',
    availableLabel: 'Disponible en',
    daysLabel: '4 días',
  },
  // Figma 1570:3146 / 1570:4077 / 1672:13475 — SAC en preparación.
  sacPreparing: {
    title: 'El reporte SAC está siendo preparado',
    body: 'AurelIA ha enviado el consolidado a SAC. El reporte está siendo preparado ahora mismo. Esto podría tardar unos minutos',
  },
  // Figma 2109:30986 — consolidado ya enviado al SAC.
  consolidadoEnviado: {
    estimateBannerTitle: '2 áreas sin datos reales — AurelIA usó el promedio histórico como estimación',
    estimateBannerBody:
      'Servicios Generales y Sustentabilidad no entregaron datos a tiempo. AurelIA estimó esos parámetros con el promedio de los últimos 6 meses.',
    areaDetailTitle: 'Detalle por área',
    areaDetailHelper: 'Revisa el detalle de lo reportado área por área',
    areaDetailSectionTitle: (cycleLabel: string) => `Estado por área — ${cycleLabel}`,
    areaDetailAlertBadge: '1 valor con alerta histórica',
    tableTitle: 'Consolidado enviado al SAC — 09-06-2026 · 27 parámetros',
    filterLabel: 'Ver solo:',
    filterAll: 'Todos',
    filterReal: 'Solo reales',
    filterEstimated: 'Solo estimados',
    traceabilityLabel: 'Ver trazabilidad',
    downloadLabel: 'Descargar',
    valueColumn: 'Valor Feb.',
    footerReales: '42 parámetros reales',
    footerEstimados: '3 estimados · promedio 6 meses',
    footerSource: 'Valores fuente: SPR_2026_02.xlsx · Salares Norte · Company code 8021',
    sacAvailableTitle: 'Reporte SAC — Disponible',
    sacAvailableBody:
      'El consolidado ya fue enviado al SAC. El reporte está listo para revisión en este apartado.',
    // Figma 1570:5335 — tab Reporte SAC disponible.
    sacReportTitle: 'Reporte SAC — Mayo 2026',
    sacReportBadge: 'Reporte oficial · Mayo 2026',
    sacReportExport: 'Exportar',
    sacReportLegendIngresado: 'Ingresado',
    sacReportLegendIngresadoHelper: 'Dato enviado por AurelIA al SAC',
    sacReportLegendCalculado: 'Calculado SAC',
    sacReportLegendCalculadoHelper: 'KPI calculado por el SAC con factores de emisión corporativos',
  },
  // Figma 1760:25200 — alerta en tab Reporte SAC tras reapertura de Servicios técnicos.
  sacReabierto: {
    alertTitle: 'El reporte SAC será actualizado',
    alertBody:
      'El proceso ha sido reabierto para el área de “Servicios técnicos”. Una vez el responsable del área emita el formulario reportando sus parámetros, se realizará nuevamente la consolidación y reconstrucción del reporte SAC.',
    // Figma 1760:25499 — tab Firma bloqueada hasta actualización SAC.
    firmaPendingTitle: 'Firma del reporte — A espera de actualización del reporte SAC',
    firmaPendingBody:
      'Una vez el reporte SAC esté nuevamente disponible, este apartado se disponibilizará para que pueda ser firmado.',
  },
  // Figma 1570:6144 — tab Firma del reporte (lista para firmar).
  firmaReady: {
    infoBefore: 'El reporte requiere ',
    infoBold: 'dos firmas en orden',
    infoAfter:
      ': primero debe firmar un Especialista de Sustentabilidad (Tania, Catalina o Marjorie), y una vez completada esa firma, queda habilitada la firma del Gerente MA o Gerente de Sustentabilidad para dar el alta oficial.',
    cardTitle: 'Firma oficial del Reporte SPR — Mayo 2026',
    cardBadge: '2 firmas requeridas',
    step1Title: 'Firma del Especialista de Sustentabilidad',
    step1Badge: 'Pendiente · Tú puedes firmar',
    step1Helper: 'Cualquiera de los siguientes Especialistas puede firmar en este paso:',
    step1Cta: 'Haz clic para firmar como Tania Galarce',
    step1Footer: 'Al firmar, se habilitará la firma del Gerente MA o Gerente de Sustentabilidad',
    bridgeHelper:
      'La firma del Gerente se habilita después de la firma del Especialista y de la revisión por parte de las áreas de “Servicios técnicos” y “Optimización de activos”.',
    step2Title: 'Firma del Gerente MA o Gerente de Sustentabilidad',
    step2Badge: 'Bloqueado',
    step2Helper: 'Disponible una vez que el Especialista complete el paso 1:',
    step2Footer: 'Al firmar el Gerente, el reporte queda oficial y se notifica a las áreas SOX',
    pendingLabel: 'Pendiente',
    specialists: [
      {
        id: 'tania',
        initials: 'TG',
        name: 'Tania Galarce',
        role: 'Especialista Sustentabilidad · Sesión activa',
        active: true,
      },
      {
        id: 'catalina',
        initials: 'CC',
        name: 'Catalina Cortés',
        role: 'Especialista Sustentabilidad',
        active: false,
      },
      {
        id: 'marjorie',
        initials: 'MR',
        name: 'Marjorie Reyes',
        role: 'Especialista Sustentabilidad',
        active: false,
      },
    ],
    managers: [
      {
        id: 'gabriel',
        initials: 'GF',
        name: 'Gabriel Fuenzalida',
        role: 'Gerente de Sustentabilidad y Cumplimiento Ambiental',
      },
      {
        id: 'elisa',
        initials: 'EG',
        name: 'Elisa González',
        role: 'Gerente de Medio Ambiente',
      },
    ],
  },
  // Figma 1570:6712 — modal Firma del Especialista (paso 1 de 2).
  firmaEspecialistaModal: {
    title: 'Firma del Especialista — Paso 1 de 2',
    body: 'Al firmar confirmas que has revisado el reporte generado por el SAC. Tu firma habilita la firma del Gerente MA o Gerente de Sustentabilidad para dar el alta oficial.',
    resumenLabel: 'Resumen',
    areasLabel: 'Áreas incluidas',
    areasValue: '8 de 8',
    kpisLabel: 'KPIs calculados por SAC',
    kpisValue: '22 adicionales',
    digitalTitle: 'Firma digital — Paso 1',
    digitalCta: 'Haz clic para firmar digitalmente',
    digitalSigned: 'Firmado digitalmente · Tania Galarce',
    digitalMeta: 'Tania Galarce · Especialista Sustentabilidad · Fecha y hora automática',
    cancelLabel: 'Cancelar',
    confirmLabel: 'Confirmar firma',
  },
  timelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '5/8 áreas',
      status: 'partial' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: '09-06-2026',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  statusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado en curso',
      badge: '5/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'Pendiente',
      badgeTone: 'muted' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Pendiente',
      badgeTone: 'muted' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: 'Pendiente',
      badgeTone: 'muted' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  // Consolidado 7/8 con detalle por área expandido.
  consolidadoSieteAreasTimelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '7/8 áreas',
      status: 'partial' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  consolidadoSieteAreasStatusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado en curso',
      badge: '7/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'Pendiente',
      badgeTone: 'muted' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Pendiente',
      badgeTone: 'muted' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: 'Pendiente',
      badgeTone: 'muted' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  // Figma 1760:25200 / 1760:25798 — SAC reabierto tras reapertura de área.
  sacReabiertoTimelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '7/8 áreas',
      status: 'partial' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: 'En proceso',
      status: 'active' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: '1 discrepancia',
      status: 'discrepancy' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  sacReabiertoStatusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado en curso',
      badge: '7/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'En proceso',
      badgeTone: 'amber' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Pendiente',
      badgeTone: 'muted' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: '1 discrepancia',
      badgeTone: 'rose' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  // Figma 1760:30869 — SAC disponible tras proceso reabierto (8/8, firma en curso).
  sacDisponibleTimelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '8/8 áreas',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: '10-06-2026',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'En proceso',
      status: 'active' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  sacDisponibleStatusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado enviado',
      badge: '8/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'Disponible',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Pendiente',
      badgeTone: 'amber' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: 'Pendiente',
      badgeTone: 'muted' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  // Figma 1570:3146 — timeline + tabs del momento “SAC preparando”.
  sacPreparingTimelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '8/8 áreas',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: 'En proceso',
      status: 'active' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  sacPreparingStatusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado enviado',
      badge: '5/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'Disponible',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Pendiente',
      badgeTone: 'amber' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: 'Pendiente',
      badgeTone: 'muted' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  // Figma 2109:30986 — consolidado enviado; firma especialista en proceso.
  consolidadoEnviadoTimelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '8/8 áreas',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: '09-06-2026',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'En proceso',
      status: 'active' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  consolidadoEnviadoStatusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado enviado',
      badge: '8/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'Disponible',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Pendiente',
      badgeTone: 'amber' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: 'Pendiente',
      badgeTone: 'muted' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  // Figma 1942:61722 — especialista firmó; gerente habilitado (CTA Gabriel).
  firmaGerente: {
    step1Badge: 'Firmado ✓',
    step1Helper: 'Firmado por',
    bridgeHelper: 'La firma del Gerente se habilita después de la firma del Especialista.',
    step2Badge: 'Pendiente · Habilitado',
    step2Helper: 'Disponible una vez que el Especialista complete el paso 1:',
    managerAction: 'Pendiente →',
    step2Cta: 'Haz clic para firmar como Gabriel Fuenzalida',
  },
  // Figma 1942:62087 / 1942:62490 — modal Firma del Gerente (paso 2 de 2).
  firmaGerenteModal: {
    title: 'Firma de Gerente de Sustentabilidad y Cumplimiento Ambiental — Paso 2 de 2',
    body: 'Al firmar das por revisado y validado el reporte SAC',
    resumenLabel: 'Resumen',
    areasLabel: 'Áreas incluidas',
    areasValue: '8 de 8',
    kpisLabel: 'KPIs calculados por SAC',
    kpisValue: '22 adicionales',
    digitalTitle: 'Firma digital',
    digitalCta: 'Haz clic para firmar digitalmente',
    digitalSigned: 'Firmado digitalmente · Gabriel Fuenzalida',
    digitalMeta:
      'Gabriel Fuenzalida · Gerente de Sustentabilidad y Cumplimiento Ambiental · Fecha y hora automática',
    cancelLabel: 'Cancelar',
    confirmLabel: 'Confirmar firma',
  },
  firmaGerenteTimelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '8/8 áreas',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: '09-06-2026',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Completado',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'En proceso',
      status: 'active' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  // Figma 1942:63546 / 1956:68048 — ambas firmas hechas; validación SOX en proceso.
  // Solo notifica a Servicios técnicos y Optimización de activos (áreas SOX).
  // Par responsable: /spr?estado=validacion-kpis (Figma 1672:14978).
  firmasCompletas: {
    infoBanner:
      'Al firmar el reporte oficial, AurelIA notificó automáticamente a los Responsables de Área de “Servicios técnicos” y “Optimización de activos”, para que confirmen que los valores calculados son correctos.',
    signedBadge: 'Firmado ✓',
    signedByLabel: 'Firmado por',
  },
  firmasCompletasTimelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '8/8 áreas',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: '09-06-2026',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Completado',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Completado',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'En proceso',
      status: 'active' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  firmasCompletasStatusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado enviado',
      badge: '8/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'Disponible',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Completado',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: 'Pendiente',
      badgeTone: 'amber' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  // Figma 1760:34230 — tabs tras firmas completas en flujo sac-disponible (validación en proceso).
  sacDisponibleFirmasCompletasStatusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado enviado',
      badge: '8/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'Disponible',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Completado',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: 'En proceso',
      badgeTone: 'amber' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  // Figma 1760:34230 — banner informativo en tab Validación (sac-disponible post-firma).
  sacDisponibleValidacion: {
    title: 'Validación de responsables',
    body: 'Una vez el reporte SAC sea firmado nuevamente por Especialistas de Sustentabilidad, aquellas áreas que reportaron discrepancias serán notificadas para realizar la validación de sus datos una vez más.',
  },
  // Figma 2035:3608 — validación SOX aprobada; ciclo abierto por datos estimados.
  validacionAprobadaTimelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '8/8 áreas',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: '09-06-2026',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Completado',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Completado',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'Completado',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  validacionAprobadaStatusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado enviado',
      badge: '8/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'Disponible',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Completado',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: 'Completado',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  validacionAprobada: {
    estimateBannerTitle: '2 áreas sin datos reales — AurelIA usó el promedio histórico como estimación',
    estimateBannerBodyBefore:
      'Servicios Generales y Sustentabilidad no entregaron datos antes del día 9. AurelIA calculó automáticamente el promedio de los últimos 6 meses y lo usó como estimación para el envío al SAC. ',
    estimateBannerBodyBold:
      'Esta estimación es solo visible para ti — el SAC recibe el valor numérico sin distinción.',
    estimateBannerBodyAfter: ' Si recibes los datos reales, puedes actualizar el próximo ciclo.',
    // Figma 2035:5637 — banner verde en tab Reporte SAC.
    sacTabInfoBanner:
      'Las áreas SOX han finalizado las revisiones de los datos sin discrepancias. Aún existen datos estimados dentro del consolidado, por ende el ciclo aún no puede ser cerrado. Los datos en “Monitoreo de KPIs” han sido actualizados con respecto a este ciclo. Puedes acceder a revisar los KPIs desde la página “Monitoreo de KPIs”.',
    kpiTableTitle: 'Estado de validación por KPI',
    footerSummary: '2 confirmados · 1 discrepancia · 2 pendientes',
    previousSacValueLabel: 'Dato anterior',
    resendReminderLabel: 'Reenviar recordatorio a pendientes',
  },
  validacionAprobadaKpiRows: [
    {
      id: 'ground-water-freshwater',
      kpi: 'Ground Water: Freshwater',
      area: 'Servicios Técnicos',
      areaTone: 'blue' as const,
      responsibleInitials: 'FN',
      responsibleName: 'Felipe Núñez G.',
      responsibleTone: 'blue' as const,
      sacValue: '55,9 MLT',
      status: 'confirmed' as const satisfies SprKpiValidationRowStatus,
      comment: '10-06-2026 · 09:02',
    },
    {
      id: 'water-recycled',
      kpi: '% Water Recycled',
      area: 'Servicios Técnicos',
      areaTone: 'blue' as const,
      responsibleInitials: 'FN',
      responsibleName: 'Felipe Núñez G.',
      responsibleTone: 'blue' as const,
      sacValue: '7,69%',
      status: 'confirmed' as const satisfies SprKpiValidationRowStatus,
      comment: '10-06-2026 · 09:04',
    },
    {
      id: 'freshwater-intensity',
      kpi: 'Freshwater Intensity',
      area: 'Servicios Técnicos',
      areaTone: 'blue' as const,
      responsibleInitials: 'FN',
      responsibleName: 'Felipe Núñez G.',
      responsibleTone: 'blue' as const,
      sacValue: '0,112 MLT/ktAu',
      status: 'confirmedWithDiscrepancy' as const satisfies SprKpiValidationRowStatus,
      comment: '10-06-2026 · 09:04',
      expandable: true,
      discrepancyComment: SPR_KPI_REVIEW.demoDiscrepancyCommentFallback,
    },
    {
      id: 'ghg-scope-1',
      kpi: 'GHG Emissions Scope 1',
      area: 'Optimiz. Activos',
      areaTone: 'amber' as const,
      responsibleInitials: 'CC',
      responsibleName: 'Cristian Castro G.',
      responsibleTone: 'amber' as const,
      sacValue: '8.432 tCO₂e',
      status: 'confirmed' as const satisfies SprKpiValidationRowStatus,
      comment: 'Notificado el 09-06-2026',
    },
    {
      id: 'ghg-scope-2',
      kpi: 'GHG Emissions Scope 2',
      area: 'Optimiz. Activos',
      areaTone: 'amber' as const,
      responsibleInitials: 'CC',
      responsibleName: 'Cristian Castro G.',
      responsibleTone: 'amber' as const,
      sacValue: '12.105 tCO₂e',
      status: 'confirmed' as const satisfies SprKpiValidationRowStatus,
      comment: 'Notificado el 09-06-2026',
    },
  ],
  cycleIncompleteModal: {
    body: 'Las áreas SOX han finalizado las revisiones de los datos sin discrepancias. Aún existen datos estimados dentro del consolidado, por ende el ciclo aún no puede ser cerrado. Los datos en “Monitoreo de KPIs” han sido actualizados con respecto a este ciclo. Puedes acceder a revisar los KPIs desde la página “Monitoreo de KPIs”.',
    overallStatusLabel: 'Estado de termino del ciclo',
    overallStatusBadge: 'Incompleto',
    milestones: [
      {
        id: 'no-estimates',
        label: 'El reporte presenta datos finales, sin estimaciones',
        status: 'pending' as const,
      },
      {
        id: 'sustainability-signed',
        label: 'El reporte fue firmado por Sustentabilidad',
        status: 'completed' as const,
      },
      {
        id: 'management-signed',
        label: 'El reporte fue firmado por Gerencia',
        status: 'completed' as const,
      },
      {
        id: 'sox-validated',
        label: 'Los datos han sido validados por áreas SOX',
        status: 'completed' as const,
      },
    ],
    infoTitle: 'El ciclo seguirá abierto hasta cumplir con los 4 hitos',
    infoBody: 'Esto no significa un bloqueante para iniciar un nuevo ciclo. El siguiente ciclo comienza el 01 de Junio de 2026.',
    confirmLabel: 'Entendido',
  },
  // Figma 2035:7406 — modal ciclo cerrado exitosamente.
  cycleClosedModal: {
    title: (cycleLabel: string) => `Ciclo ${cycleLabel} cerrado`,
    body: 'Las áreas SOX han finalizado las revisiones de los datos sin discrepancias. Se han cumplido los 4 hitos, por ende el ciclo se ha cerrado exitosamente. Los datos en “Monitoreo de KPIs” han sido actualizados con respecto a este ciclo. Puedes acceder a revisar los KPIs desde la página “Monitoreo de KPIs”.',
    overallStatusLabel: 'Estado de termino del ciclo',
    overallStatusBadge: 'Completado',
    milestones: [
      {
        id: 'no-estimates',
        label: 'El reporte presenta datos finales, sin estimaciones',
        status: 'completed' as const,
      },
      {
        id: 'sustainability-signed',
        label: 'El reporte fue firmado por Sustentabilidad',
        status: 'completed' as const,
      },
      {
        id: 'management-signed',
        label: 'El reporte fue firmado por Gerencia',
        status: 'completed' as const,
      },
      {
        id: 'sox-validated',
        label: 'Los datos han sido validados por áreas SOX',
        status: 'completed' as const,
      },
    ],
    ctaLabel: 'Ir a Monitoreo de KPIs',
    postCloseDemoHref: SPR_REPORT_CICLO_CERRADO_DEMO_HREF,
  },
  // Figma 2035:8751 / 2035:9632 / 2035:9972 — banner verde compartido en tabs ciclo-cerrado.
  cicloCerrado: {
    tabInfoBanner: (cycleLabel: string) =>
      `Ciclo ${cycleLabel} cerrado exitosamente. Los datos en “Monitoreo de KPIs” han sido actualizados con respecto a este ciclo. Puedes acceder a revisar los KPIs desde la página “Monitoreo de KPIs”.`,
  },
  // Figma 1760:23481 — validación con discrepancia tras firmas completas (conecta con 1760:27156).
  validacionDiscrepanciaPostFirmaTimelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '8/8 áreas',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: '09-06-2026',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: 'Completado',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Completado',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: '1 discrepancia',
      status: 'discrepancy' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  validacionDiscrepanciaPostFirmaStatusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado enviado',
      badge: '8/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'Disponible',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Completado',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: '1 discrepancia',
      badgeTone: 'rose' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  // Figma 1760:24201 — validacion con discrepancia pendiente (conecta con 1760:27156).
  validacionDiscrepanciaTimelineSteps: [
    {
      id: 'areas',
      title: 'Consolidado\ncompleto',
      badge: '8/8 áreas',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'sac-send',
      title: 'Envío al SAC\ncompletado',
      badge: '09-06-2026',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'esp',
      title: 'Firma\nEspecialista',
      badge: '3/3',
      status: 'done' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'validation',
      title: 'Validación de\nresponsables',
      badge: 'En proceso',
      status: 'active' as const satisfies SprConsolidatedTimelineStatus,
    },
    {
      id: 'gte-ma',
      title: 'Firma\nGerente MA',
      badge: 'Pendiente',
      status: 'upcoming' as const satisfies SprConsolidatedTimelineStatus,
    },
  ],
  validacionDiscrepanciaStatusTabs: [
    {
      id: 'consolidado' as const,
      label: 'Consolidado enviado',
      badge: '8/8',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'sac' as const,
      label: 'Reporte SAC',
      badge: 'Disponible',
      badgeTone: 'teal' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'firma' as const,
      label: 'Firma del reporte',
      badge: 'Pendiente',
      badgeTone: 'amber' as const satisfies SprConsolidatedTabBadgeTone,
    },
    {
      id: 'validacion' as const,
      label: 'Validación de responsables',
      badge: 'Pendiente',
      badgeTone: 'amber' as const satisfies SprConsolidatedTabBadgeTone,
    },
  ],
  validacionDiscrepancia: {
    alertTitle: 'Discrepancia reportada — requiere tu revisión',
    awaitingCorrectionAlertTitle: 'Discrepancia reportada — Esperando corrección de área responsable',
    areaServiciosLabel: 'Servicios técnicos',
    areaOptimizacionLabel: 'Optimización de activos',
    casesCountLabel: (count: number) => `${count} caso${count === 1 ? '' : 's'}`,
    noCasesLabel: '0 casos',
    unresolvedBadge: 'Sin resolver',
    reportedCaseTitle: 'Felipe Núñez González · Freshwater Intensity',
    reportedAtLabel: 'Reportado el 10-06-2026 · 09:15',
    commentFallback: SPR_KPI_REVIEW.demoDiscrepancyCommentFallback,
    reopenCta: 'Reabrir proceso para esta área',
    kpiTableTitle: 'Estado de validación por KPI',
    kpiTableAlert: '1 discrepancia requiere revisión',
    footerSummary: '2 confirmados · 1 discrepancia · 2 pendientes',
    resendReminderLabel: 'Reenviar recordatorio a pendientes',
    detailTitle: 'Reporte de discrepancia',
    detailBackLabel: '← Volver al listado',
    detailAreaBanner: 'SERVICIOS TÉCNICOS',
    detailGeneralInfoTitle: 'Información General',
    detailMetaLabel: 'Mayo 2026 · Felipe Núñez González (Servicios Técnicos) · Reportado 10-06-2026 · 09:15',
    detailTabParameters: 'Parámetros a corregir',
    detailTabDiscrepancy: 'Discrepancia reportada',
    detailTabFiles: 'Archivos & Evidencia',
    detailSectionTitle: 'Agua — Freshwater',
    detailParameterSectionLabel: 'Parámetro seleccionado',
    detailParameterName: 'Ground Water: Freshwater',
    detailParameterSubtitle: 'Agua subterránea extraída · Control SOX: ESG_SD_C06_WMA',
    detailValueLabel: 'Valor reportado',
    detailValue: '55,9',
    detailValueUnit: 'MLT',
    detailSourceLabel: 'Fuente del dato',
    detailSourceValue: 'Sistema Monitoreo de Extracciones DGEA',
    detailNoteLabel: 'Nota para el Gerente de Área',
    detailNoteValue:
      'Revisé el dato con el equipo de monitoreo. El valor de extracción debería ser consistente con el reporte DGEA del período.',
    detailFooterNotice: 'Esta información se notificará al Especialista de Medio Ambiente',
    detailFilesEmpty: 'Sin archivos adjuntos en este caso',
    detailPendingBadge: 'Pendiente',
    detailControlBadge: 'C2',
    detailKpiTitle: 'Freshwater Intensity',
    detailKpiSubtitle: 'Agua GRI 303',
    detailKpiBadge: 'Discrepancia reportada',
    detailSacValueLabel: 'Freshwater Intensity',
    detailSacValue: '0,112',
    detailSacUnit: 'MLT/ktAu',
    detailSacHelper: 'Valor del SAC',
    detailCommentTitle: 'Comentario del Responsable de Área',
    solutionsTitle: 'Casos posibles para resolver esta discrepancia',
    responsibleWrongTitle: 'El Responsable de Área se equivocó',
    responsibleWrongDescription:
      'Solicitar al Responsable que corrija el dato en el formulario SPR. AurelIA reabrirá el ciclo automáticamente cuando confirmes la reapertura.',
    sacWrongTitle: 'El SAC calculó mal',
    sacWrongDescription:
      'Comunicar a TI SAC para que corrijan y recalculen. Los datos se actualizarán en el consolidado una vez corregidos en SAC.',
    emailTemplateLabel: 'Plantilla email',
    areaListDiscrepancyLabel: '1 discrepancia · C2',
    areaListNoCasesLabel: 'Sin casos',
    reopenModalTitle: 'Reabrir proceso para Servicios técnicos',
    reopenModalBody:
      'El responsable del área podrá corregir el formulario de sus parametros y las evidencias. Una vez esto sea realizado, se corregirá el consolidado y reporte SPR.',
    reopenModalQuestion: '¿Deseas continuar?',
    reopenModalCancel: 'Cancelar',
    reopenModalConfirm: 'Confirmar reapertura',
    reopenModalSubmitting: 'Confirmando…',
    specialistPostReopenDemoHref: SPR_CONSOLIDATED_SAC_REABIERTO_DEMO_HREF,
    responsibleDemoHref: SPR_DISCREPANCY_CORRECTION.demoHref,
  },
  validacionDiscrepanciaKpiRows: [
    {
      id: 'ground-water-freshwater',
      kpi: 'Ground Water: Freshwater',
      area: 'Servicios Técnicos',
      areaTone: 'blue' as const,
      responsibleInitials: 'FN',
      responsibleName: 'Felipe Núñez G.',
      responsibleTone: 'blue' as const,
      sacValue: '55,9 MLT',
      status: 'confirmed' as const satisfies SprKpiValidationRowStatus,
      comment: '10-06-2026 · 09:02',
    },
    {
      id: 'water-recycled',
      kpi: '% Water Recycled',
      area: 'Servicios Técnicos',
      areaTone: 'blue' as const,
      responsibleInitials: 'FN',
      responsibleName: 'Felipe Núñez G.',
      responsibleTone: 'blue' as const,
      sacValue: '7,69%',
      status: 'confirmed' as const satisfies SprKpiValidationRowStatus,
      comment: '10-06-2026 · 09:04',
    },
    {
      id: 'freshwater-intensity',
      kpi: 'Freshwater Intensity',
      area: 'Servicios Técnicos',
      areaTone: 'blue' as const,
      responsibleInitials: 'FN',
      responsibleName: 'Felipe Núñez G.',
      responsibleTone: 'blue' as const,
      sacValue: '0,112 MLT/ktAu',
      status: 'discrepancy' as const satisfies SprKpiValidationRowStatus,
      comment: SPR_KPI_REVIEW.demoDiscrepancyCommentFallback,
    },
    {
      id: 'ghg-scope-1',
      kpi: 'GHG Emissions Scope 1',
      area: 'Optimiz. Activos',
      areaTone: 'amber' as const,
      responsibleInitials: 'CC',
      responsibleName: 'Cristian Castro G.',
      responsibleTone: 'amber' as const,
      sacValue: '8.432 tCO₂e',
      status: 'pending' as const satisfies SprKpiValidationRowStatus,
      comment: 'Notificado el 09-06-2026',
    },
    {
      id: 'ghg-scope-2',
      kpi: 'GHG Emissions Scope 2',
      area: 'Optimiz. Activos',
      areaTone: 'amber' as const,
      responsibleInitials: 'CC',
      responsibleName: 'Cristian Castro G.',
      responsibleTone: 'amber' as const,
      sacValue: '12.105 tCO₂e',
      status: 'pending' as const satisfies SprKpiValidationRowStatus,
      comment: 'Notificado el 09-06-2026',
    },
  ],
} as const;

export type SprConsolidatedTabId = (typeof SPR_CONSOLIDATED_REPORT.statusTabs)[number]['id'];

export function resolveSprConsolidatedFlow(raw: string | null): SprConsolidatedFlowId {
  if (raw === SPR_CONSOLIDATED_FLOW.consolidadoSieteAreas) return SPR_CONSOLIDATED_FLOW.consolidadoSieteAreas;
  if (raw === SPR_CONSOLIDATED_FLOW.sacReabierto) return SPR_CONSOLIDATED_FLOW.sacReabierto;
  if (raw === SPR_CONSOLIDATED_FLOW.sacDisponible) return SPR_CONSOLIDATED_FLOW.sacDisponible;
  if (raw === SPR_CONSOLIDATED_FLOW.sacPreparando) return SPR_CONSOLIDATED_FLOW.sacPreparando;
  if (raw === SPR_CONSOLIDATED_FLOW.consolidadoEnviado) return SPR_CONSOLIDATED_FLOW.consolidadoEnviado;
  if (raw === SPR_CONSOLIDATED_FLOW.firmaGerente) return SPR_CONSOLIDATED_FLOW.firmaGerente;
  if (raw === SPR_CONSOLIDATED_FLOW.firmasCompletas) return SPR_CONSOLIDATED_FLOW.firmasCompletas;
  if (raw === SPR_CONSOLIDATED_FLOW.validacionDiscrepancia) return SPR_CONSOLIDATED_FLOW.validacionDiscrepancia;
  if (raw === SPR_CONSOLIDATED_FLOW.validacionDiscrepanciaPostFirma) {
    return SPR_CONSOLIDATED_FLOW.validacionDiscrepanciaPostFirma;
  }
  if (raw === SPR_CONSOLIDATED_FLOW.validacionAprobada) return SPR_CONSOLIDATED_FLOW.validacionAprobada;
  if (raw === SPR_CONSOLIDATED_FLOW.cicloCerrado) return SPR_CONSOLIDATED_FLOW.cicloCerrado;
  return SPR_CONSOLIDATED_FLOW.enCurso;
}

const SPR_REPORT_DASHBOARD_CONFIGS: Record<SprReportFlowId, SprReportDashboardConfig> = {
  [SPR_CONSOLIDATED_FLOW.enCurso]: {
    showTimeline: true,
    showReportStatus: true,
    pageSubtitle: SPR_REPORT_DASHBOARD.pageSubtitle,
    cycleBanner: {
      variant: 'light',
      helper: SPR_REPORT_DASHBOARD.cycleBannerHelper,
      badges: [{ label: SPR_REPORT_DASHBOARD.cycleActiveBadge, tone: 'teal' }],
    },
    estimateBanner: null,
    kpiCards: SPR_REPORT_KPI_CARDS.map((card) => ({ ...card, valueTone: 'navy' as const })),
    statusRows: SPR_REPORT_STATUS_ROWS.map((row) => ({ ...row, actionVariant: 'outline' as const })),
    areaCards: SPR_REPORT_AREA_CARDS,
    closure: {
      helper: SPR_REPORT_DASHBOARD.closureSectionHelper,
      statusLabel: SPR_REPORT_DASHBOARD.closureStatusLabel,
      statusTone: 'danger',
      items: SPR_REPORT_CLOSURE_ITEMS.map((label) => ({ label, status: 'pending' as const })),
    },
  },
  [SPR_CONSOLIDATED_FLOW.validacionAprobada]: {
    showTimeline: false,
    showReportStatus: true,
    pageSubtitle: (cycleLabel: string) => `Ciclo ${cycleLabel}`,
    cycleBanner: {
      variant: 'navy',
      helper:
        'Consolidado se actualiza al recibir cada formulario firmado por el Responsable · Independiente de la firma del Gerente',
      badges: [
        { label: 'Ciclo activo', tone: 'teal' },
        { label: 'X áreas con datos estimados', tone: 'purple' },
      ],
    },
    estimateBanner: {
      title: '1 área sin datos reales — AurelIA usó el promedio histórico como estimación',
      description:
        'Servicios operacionales no entregó datos antes del día 9. AurelIA calculó automáticamente el promedio de los últimos 6 meses y lo usó como estimación para el envío al SAC. ',
      descriptionBold: 'Esta estimación es solo visible para ti — el SAC recibe el valor numérico sin distinción.',
      descriptionAfter: ' Si recibes los datos reales, puedes actualizar el próximo ciclo.',
    },
    kpiCards: [
      {
        value: '8',
        valueTone: 'teal',
        label: 'Áreas participantes',
        helper: '7 formularios recibidos',
        helperTone: 'teal',
      },
      {
        value: '8',
        valueTone: 'teal',
        label: 'En consolidado',
        helper: 'Incluidos al recibir formulario',
        helperTone: 'teal',
      },
      {
        value: '0',
        valueTone: 'teal',
        label: 'Sin datos aún · ',
        labelHighlight: '1 área con datos estimados',
        helper: 'Fecha límite: Sin fecha límite',
        helperTone: 'purple',
      },
      {
        value: '4/6',
        valueTone: 'amber',
        label: 'Aprobados por Gerente',
        helper: '2 pendientes de aprobación',
        helperTone: 'muted',
      },
    ],
    statusRows: SPR_REPORT_VALIDACION_APROBADA_STATUS_ROWS,
    areaCards: SPR_REPORT_AREA_CARDS,
    closure: {
      helper: 'El ciclo no podrá ser cerrado hasta que no se cumplan estos hitos',
      statusLabel: 'Incompleto — No es posible el cierre de este ciclo',
      statusTone: 'danger',
      items: SPR_REPORT_VALIDACION_APROBADA_CLOSURE_ITEMS,
    },
  },
  [SPR_CONSOLIDATED_FLOW.cicloCerrado]: {
    showTimeline: false,
    showReportStatus: false,
    pageSubtitle: (cycleLabel: string) => `Ciclo ${cycleLabel}`,
    cycleBanner: {
      variant: 'navy',
      badges: [{ label: 'Ciclo cerrado', tone: 'success' }],
    },
    estimateBanner: null,
    kpiCards: [
      {
        value: '8',
        valueTone: 'teal',
        label: 'Áreas participantes',
        helper: '8 formularios recibidos',
        helperTone: 'teal',
      },
      {
        value: '8',
        valueTone: 'teal',
        label: 'En consolidado',
        helper: 'Incluidos al recibir formulario',
        helperTone: 'teal',
      },
      {
        value: '0',
        valueTone: 'teal',
        label: 'Sin datos aún',
        helper: 'Fecha límite: Sin fecha límite',
        helperTone: 'navy',
      },
      {
        value: '4/6',
        valueTone: 'amber',
        label: 'Aprobados por Gerente',
        helper: '2 pendientes de aprobación',
        helperTone: 'muted',
      },
    ],
    statusRows: [],
    areaCards: SPR_REPORT_CICLO_CERRADO_AREA_CARDS,
    closure: {
      helper: 'El ciclo no podrá ser cerrado hasta que no se cumplan estos hitos',
      statusLabel: 'Ciclo cerrado',
      statusTone: 'success',
      items: SPR_REPORT_CICLO_CERRADO_CLOSURE_ITEMS,
    },
  },
};

export function resolveSprReportFlow(raw: string | null): SprReportFlowId {
  if (raw === SPR_CONSOLIDATED_FLOW.validacionAprobada) return SPR_CONSOLIDATED_FLOW.validacionAprobada;
  if (raw === SPR_CONSOLIDATED_FLOW.cicloCerrado) return SPR_CONSOLIDATED_FLOW.cicloCerrado;
  return SPR_CONSOLIDATED_FLOW.enCurso;
}

export function getSprReportDashboardConfig(flow: SprReportFlowId): SprReportDashboardConfig {
  return SPR_REPORT_DASHBOARD_CONFIGS[flow];
}

export const SPR_CONSOLIDATED_TABLE_ROWS: SprConsolidatedTableRow[] = [
  { kind: 'group', id: 'g-insumos', label: 'Insumos' },
  {
    kind: 'data',
    id: 'cianuro',
    name: 'Cianuro',
    subtitle: 'Cyanide',
    area: 'Planta',
    category: 'Insumos',
    value: '306',
    unit: 'TON',
    trend: 'up',
    trendLabel: '↑ +113%',
    origin: 'formulario',
  },
  {
    kind: 'data',
    id: 'explosivos',
    name: 'Explosivos',
    subtitle: 'Blasting agents',
    area: 'Mina',
    category: 'Insumos',
    value: '355.311',
    unit: 'TON',
    trend: 'up',
    trendLabel: '↑ +273%',
    origin: 'formulario',
    highlight: true,
  },
  {
    kind: 'data',
    id: 'hcl',
    name: 'HCl',
    subtitle: 'Ácido clorhídrico',
    area: 'Planta',
    category: 'Insumos',
    value: '0',
    unit: 'TON',
    trend: 'flat',
    trendLabel: '→ Sin cambio',
    origin: 'formulario',
  },
  {
    kind: 'data',
    id: 'cal',
    name: 'Cal / Lime',
    area: 'Planta',
    category: 'Insumos',
    value: '432',
    unit: 'TON',
    trend: 'up',
    trendLabel: '↑ +112%',
    origin: 'formulario',
  },
  {
    kind: 'data',
    id: 'soda',
    name: 'Soda cáustica',
    subtitle: 'Caustic soda',
    area: 'Planta',
    category: 'Insumos',
    value: '52',
    unit: 'TON',
    trend: 'up',
    trendLabel: '↑ +100%',
    origin: 'formulario',
  },
  { kind: 'group', id: 'g-energia', label: 'Energía' },
  {
    kind: 'data',
    id: 'diesel-haulage',
    name: 'Diesel: Haulage and Other',
    area: 'Optim. Activos',
    category: 'Energía GRI 302',
    value: '1.604,71',
    unit: 'KLT',
    trend: 'down',
    trendLabel: '↓ -7%',
    origin: 'formulario',
  },
  {
    kind: 'data',
    id: 'diesel-power',
    name: 'Diesel: Power Generation',
    area: 'Optim. Activos',
    category: 'Energía GRI 302',
    value: '1.861,38',
    unit: 'KLT',
    trend: 'down',
    trendLabel: '↓ -18%',
    origin: 'formulario',
  },
  {
    kind: 'data',
    id: 'lpg',
    name: 'Gas licuado (LPG)',
    area: 'Mina + Serv. Operacionales',
    category: 'Varias áreas',
    value: '20.825,6',
    unit: 'KG',
    trend: 'down',
    trendLabel: '↓ 17%',
    origin: 'multiple',
  },
  {
    kind: 'data',
    id: 'acetileno',
    name: 'Acetileno / Acetylene',
    area: 'Planta + Mina',
    category: 'Energía GRI 302',
    value: '140',
    unit: 'KG',
    trend: 'down',
    trendLabel: '↓ 7%',
    origin: 'formulario',
  },
  {
    kind: 'data',
    id: 'diesel-gen',
    name: 'Diesel generación eléctrica',
    subtitle: 'Diesel Plants Electricity Generated',
    area: 'Optim. Activos',
    category: 'Energía GRI 302',
    value: '6.733,67',
    unit: 'MWH',
    trend: 'down',
    trendLabel: '↓ -22%',
    origin: 'formulario',
  },
  {
    kind: 'data',
    id: 'cost-diesel',
    name: 'Costos energía: Diesel',
    subtitle: 'Energy Costs: Diesel in USD',
    area: 'Finanzas',
    category: 'Energía · Costos',
    value: '2.12M',
    unit: 'USD',
    trend: 'down',
    trendLabel: '↓ -13%',
    origin: 'formulario',
  },
  {
    kind: 'data',
    id: 'cost-elec',
    name: 'Costos energía: Electricidad',
    subtitle: 'Energy Costs: Electricity in USD',
    area: 'Finanzas',
    category: 'Energía · Costos',
    value: '688.314',
    unit: 'USD',
    trend: 'up',
    trendLabel: '↑ +6%',
    origin: 'formulario',
  },
  { kind: 'group', id: 'g-agua', label: 'Agua' },
  {
    kind: 'data',
    id: 'gw-fresh',
    name: 'Ground Water: Freshwater',
    subtitle: 'Alta calidad (<5000 mg/L)',
    area: 'Serv. Técnicos',
    category: 'Agua GRI 303',
    value: '55,93',
    unit: 'MLT',
    trend: 'down',
    trendLabel: '↓ -25%',
    origin: 'formulario',
    highlight: true,
  },
  {
    kind: 'data',
    id: 'recycled',
    name: 'Total Volume: Recycled Water',
    area: 'Serv. Técnicos',
    category: 'Agua GRI 303',
    value: '9,41',
    unit: 'MLT',
    trend: 'down',
    trendLabel: '↓ -23%',
    origin: 'formulario',
    estimated: true,
  },
  {
    kind: 'data',
    id: 'reused',
    name: 'Total Volume: Reused Water',
    area: 'Serv. Técnicos',
    category: 'Agua GRI 303',
    value: '57,09',
    unit: 'MLT',
    trend: 'down',
    trendLabel: '↓ -29%',
    origin: 'formulario',
    estimated: true,
  },
  { kind: 'group', id: 'g-residuos', label: 'Residuos' },
  {
    kind: 'data',
    id: 'waste-rock',
    name: 'Waste rock to dump - Weighed',
    subtitle: 'Roca estéril',
    area: 'Mina',
    category: 'Residuos',
    value: '1.62M',
    unit: 'TON',
    trend: 'up',
    trendLabel: '↑ +44%',
    origin: 'automatico',
    estimated: true,
  },
  {
    kind: 'data',
    id: 'hydrocarbons',
    name: 'Hydrocarbons (oil, grease)',
    area: 'Medio Ambiente + Mina + SSOO',
    category: 'Residuos',
    value: '32,96',
    unit: 'TON',
    trend: 'flat',
    trendLabel: '→ Estable',
    origin: 'multiple',
  },
  {
    kind: 'data',
    id: 'chemicals',
    name: 'Chemicals (packaging/expired)',
    area: 'Medio Ambiente + Planta + SSOO',
    category: 'Residuos',
    value: '17,8',
    unit: 'TON',
    trend: 'flat',
    trendLabel: '→ Estable',
    origin: 'multiple',
  },
  { kind: 'group', id: 'g-incidentes', label: 'Incidentes ambientales' },
  {
    kind: 'data',
    id: 'level-0',
    name: 'Level 0',
    subtitle: 'Total incidentes nivel 0',
    area: 'Med. Ambiente',
    category: 'Incidentes',
    value: '2',
    unit: 'EA',
    trend: 'up',
    trendLabel: '↑ +100%',
    origin: 'formulario',
  },
  {
    kind: 'data',
    id: 'level-1-air',
    name: 'Level 1 - Release to air',
    area: 'Med. Ambiente',
    category: 'Incidentes',
    value: '0',
    unit: 'EA',
    trend: 'flat',
    trendLabel: '→ Sin cambio',
    origin: 'automatico',
  },
  {
    kind: 'data',
    id: 'level-2-air',
    name: 'Level 2 - Release to air',
    area: 'Med. Ambiente',
    category: 'Incidentes',
    value: '0',
    unit: 'EA',
    trend: 'down',
    trendLabel: '↓ -100%',
    origin: 'automatico',
  },
];

