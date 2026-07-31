import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
} from '@nestjs/swagger';
import { InspectionCriticalityCatalogController } from './inspection-criticality-catalog.controller';
import { InspectionDashboardController } from './inspection-dashboard.controller';
import { InspectionFindingCatalogController } from './inspection-finding-catalog.controller';
import { InspectionHistoryController } from './inspection-history.controller';
import { InspectionProcessController } from './inspection-process.controller';
import {
  EvidenceLinkOpenApiModel,
  EvidenceOpenApiModel,
  InspectionAiAssessmentOpenApiModel,
  InspectionChecklistAnswerOpenApiModel,
  InspectionChecklistTemplateCatalogOpenApiModel,
  InspectionCommentOpenApiModel,
  InspectionDashboardChartsOpenApiModel,
  InspectionDashboardCompanyAnalysisOpenApiModel,
  InspectionDashboardOpenFindingsOpenApiModel,
  InspectionExportPayloadOpenApiModel,
  InspectionFindingCatalogsOpenApiModel,
  InspectionFindingSeverityCatalogOpenApiModel,
  InspectionFindingTypeCatalogOpenApiModel,
  InspectionFollowupOpenApiModel,
  InspectionHistoryKpisOpenApiModel,
  InspectionManagementKpisOpenApiModel,
  InspectionProcessRequestOpenApiModel,
  InspectionResponsibleUserOpenApiModel,
  InspectionRiskConsequenceCatalogOpenApiModel,
  InspectionRiskProbabilityCatalogOpenApiModel,
  InspectionTypeCatalogOpenApiModel,
} from './inspection-openapi-secondary.models';
import { InspectionTransversalController } from './inspection-transversal.controller';
import { InspectionsController } from './inspections.controller';

type ControllerClass = { prototype: object; name: string };

function decorateMethod(
  controller: ControllerClass,
  methodName: string,
  ...decorators: MethodDecorator[]
): void {
  const descriptor = Object.getOwnPropertyDescriptor(controller.prototype, methodName);
  if (!descriptor) throw new Error(`Missing ${controller.name}.${methodName} for secondary OpenAPI response metadata`);
  decorators.forEach((decorator) => decorator(controller.prototype, methodName, descriptor));
}

ApiExtraModels(
  InspectionTypeCatalogOpenApiModel,
  InspectionChecklistTemplateCatalogOpenApiModel,
  InspectionResponsibleUserOpenApiModel,
  InspectionChecklistAnswerOpenApiModel,
  InspectionFollowupOpenApiModel,
)(InspectionsController);

ApiExtraModels(
  InspectionManagementKpisOpenApiModel,
  InspectionDashboardChartsOpenApiModel,
  InspectionDashboardCompanyAnalysisOpenApiModel,
  InspectionDashboardOpenFindingsOpenApiModel,
)(InspectionDashboardController);

ApiExtraModels(InspectionHistoryKpisOpenApiModel)(InspectionHistoryController);

ApiExtraModels(
  EvidenceOpenApiModel,
  EvidenceLinkOpenApiModel,
  InspectionCommentOpenApiModel,
  InspectionExportPayloadOpenApiModel,
)(InspectionTransversalController);

ApiExtraModels(
  InspectionProcessRequestOpenApiModel,
  InspectionAiAssessmentOpenApiModel,
)(InspectionProcessController);

ApiExtraModels(
  InspectionFindingTypeCatalogOpenApiModel,
  InspectionFindingSeverityCatalogOpenApiModel,
  InspectionFindingCatalogsOpenApiModel,
)(InspectionFindingCatalogController);

ApiExtraModels(
  InspectionRiskProbabilityCatalogOpenApiModel,
  InspectionRiskConsequenceCatalogOpenApiModel,
)(InspectionCriticalityCatalogController);

decorateMethod(
  InspectionsController,
  'findTypes',
  ApiOkResponse({
    description: 'Tipos de inspección disponibles.',
    type: InspectionTypeCatalogOpenApiModel,
    isArray: true,
  }),
);

decorateMethod(
  InspectionsController,
  'findTemplates',
  ApiOkResponse({
    description: 'Plantillas vigentes con secciones e ítems de checklist.',
    type: InspectionChecklistTemplateCatalogOpenApiModel,
    isArray: true,
  }),
);

decorateMethod(
  InspectionsController,
  'findResponsibleUsers',
  ApiOkResponse({
    description: 'Usuarios responsables disponibles según empresa, permisos y alcance.',
    type: InspectionResponsibleUserOpenApiModel,
    isArray: true,
  }),
);

decorateMethod(
  InspectionsController,
  'upsertAnswer',
  ApiCreatedResponse({
    description: 'Respuesta de checklist creada o actualizada.',
    type: InspectionChecklistAnswerOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'createFollowup',
  ApiCreatedResponse({
    description: 'Seguimiento registrado para la observación.',
    type: InspectionFollowupOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'updateFollowup',
  ApiOkResponse({
    description: 'Seguimiento actualizado correctamente.',
    type: InspectionFollowupOpenApiModel,
  }),
);

decorateMethod(
  InspectionDashboardController,
  'getManagementKpis',
  ApiOkResponse({
    description: 'Indicadores de la vista de gestión para el año vigente.',
    type: InspectionManagementKpisOpenApiModel,
  }),
);

decorateMethod(
  InspectionDashboardController,
  'getCharts',
  ApiOkResponse({
    description: 'Series anuales y mensuales, distribución por área y tasas de cierre.',
    type: InspectionDashboardChartsOpenApiModel,
  }),
);

decorateMethod(
  InspectionDashboardController,
  'getCompanyAnalysis',
  ApiOkResponse({
    description: 'Indicadores y series de inspecciones agrupadas por empresa.',
    type: InspectionDashboardCompanyAnalysisOpenApiModel,
  }),
);

decorateMethod(
  InspectionDashboardController,
  'getOpenFindings',
  ApiOkResponse({
    description: 'Inspecciones con observaciones abiertas y resumen de severidad.',
    type: InspectionDashboardOpenFindingsOpenApiModel,
  }),
);

decorateMethod(
  InspectionHistoryController,
  'getHistoryKpis',
  ApiOkResponse({
    description: 'Indicadores de inspecciones cerradas e histórico anual.',
    type: InspectionHistoryKpisOpenApiModel,
  }),
);

decorateMethod(
  InspectionTransversalController,
  'findEvidences',
  ApiOkResponse({
    description: 'Evidencias relacionadas directamente o mediante observaciones y seguimientos.',
    type: EvidenceOpenApiModel,
    isArray: true,
  }),
);

decorateMethod(
  InspectionTransversalController,
  'linkEvidence',
  ApiCreatedResponse({
    description: 'Relación entre la evidencia y la inspección creada correctamente.',
    type: EvidenceLinkOpenApiModel,
  }),
);

decorateMethod(
  InspectionTransversalController,
  'findComments',
  ApiOkResponse({
    description: 'Comentarios registrados para la inspección.',
    type: InspectionCommentOpenApiModel,
    isArray: true,
  }),
);

decorateMethod(
  InspectionTransversalController,
  'createComment',
  ApiCreatedResponse({
    description: 'Comentario registrado correctamente.',
    type: InspectionCommentOpenApiModel,
  }),
);

decorateMethod(
  InspectionTransversalController,
  'getExportPayload',
  ApiOkResponse({
    description: 'Payload consolidado utilizado para construir el informe de una inspección.',
    type: InspectionExportPayloadOpenApiModel,
  }),
);

decorateMethod(
  InspectionProcessController,
  'resubmitEvidence',
  ApiCreatedResponse({
    description: 'Solicitud de reenvío de evidencias registrada.',
    type: InspectionProcessRequestOpenApiModel,
  }),
);

decorateMethod(
  InspectionProcessController,
  'preValidate',
  ApiCreatedResponse({
    description: 'Evaluación de prevalidación asistida por IA.',
    type: InspectionAiAssessmentOpenApiModel,
  }),
);

decorateMethod(
  InspectionProcessController,
  'findAiAssessments',
  ApiOkResponse({
    description: 'Evaluaciones de IA registradas para la inspección.',
    type: InspectionAiAssessmentOpenApiModel,
    isArray: true,
  }),
);

decorateMethod(
  InspectionProcessController,
  'recordAiDecision',
  ApiOkResponse({
    description: 'Evaluación con la decisión humana actualizada.',
    type: InspectionAiAssessmentOpenApiModel,
  }),
);

decorateMethod(
  InspectionFindingCatalogController,
  'findTypes',
  ApiOkResponse({
    description: 'Tipos de hallazgo activos.',
    type: InspectionFindingTypeCatalogOpenApiModel,
    isArray: true,
  }),
);

decorateMethod(
  InspectionFindingCatalogController,
  'findSeverities',
  ApiOkResponse({
    description: 'Severidades de hallazgo y sus plazos de cierre.',
    type: InspectionFindingSeverityCatalogOpenApiModel,
    isArray: true,
  }),
);

decorateMethod(
  InspectionFindingCatalogController,
  'findAll',
  ApiOkResponse({
    description: 'Tipos y severidades de hallazgo en una sola respuesta.',
    type: InspectionFindingCatalogsOpenApiModel,
  }),
);

decorateMethod(
  InspectionCriticalityCatalogController,
  'findProbabilities',
  ApiOkResponse({
    description: 'Probabilidades activas utilizadas en la matriz de criticidad.',
    type: InspectionRiskProbabilityCatalogOpenApiModel,
    isArray: true,
  }),
);

decorateMethod(
  InspectionCriticalityCatalogController,
  'findConsequences',
  ApiOkResponse({
    description: 'Consecuencias activas utilizadas en la matriz de criticidad.',
    type: InspectionRiskConsequenceCatalogOpenApiModel,
    isArray: true,
  }),
);
