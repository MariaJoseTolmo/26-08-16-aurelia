import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
} from '@nestjs/swagger';
import { InspectionCriticalityCatalogController } from './inspection-criticality-catalog.controller';
import { InspectionDashboardController } from './inspection-dashboard.controller';
import { InspectionFindingCatalogController } from './inspection-finding-catalog.controller';
import { InspectionHistoryController } from './inspection-history.controller';
import {
  ApiInspectionController,
  INSPECTION_OPENAPI_TAGS,
} from './inspection-openapi.decorator';
import { InspectionProcessController } from './inspection-process.controller';
import { InspectionTransversalController } from './inspection-transversal.controller';
import { InspectionsController } from './inspections.controller';

type ControllerClass = { prototype: object; name: string };

const objectSchema = { type: 'object', additionalProperties: true } as const;
const arraySchema = { type: 'array', items: objectSchema } as const;
const uuidParam = (name: string, description: string) => ApiParam({ name, description, format: 'uuid' });

function decorateMethod(
  controller: ControllerClass,
  methodName: string,
  ...decorators: MethodDecorator[]
): void {
  const descriptor = Object.getOwnPropertyDescriptor(controller.prototype, methodName);
  if (!descriptor) throw new Error(`Missing ${controller.name}.${methodName} for OpenAPI metadata`);
  decorators.forEach((decorator) => decorator(controller.prototype, methodName, descriptor));
}

function applyControllerMetadata(): void {
  ApiInspectionController(INSPECTION_OPENAPI_TAGS.core)(InspectionsController);
  ApiInspectionController(INSPECTION_OPENAPI_TAGS.processes)(InspectionProcessController);
  ApiInspectionController(INSPECTION_OPENAPI_TAGS.dashboard)(InspectionDashboardController);
  ApiInspectionController(INSPECTION_OPENAPI_TAGS.history)(InspectionHistoryController);
  ApiInspectionController(INSPECTION_OPENAPI_TAGS.transversal)(InspectionTransversalController);
  ApiInspectionController(INSPECTION_OPENAPI_TAGS.catalogs)(InspectionFindingCatalogController);
  ApiInspectionController(INSPECTION_OPENAPI_TAGS.catalogs)(InspectionCriticalityCatalogController);
}

function applyCoreMetadata(): void {
  decorateMethod(InspectionsController, 'findTypes',
    ApiOperation({ summary: 'Listar tipos de inspección' }),
    ApiOkResponse({ description: 'Tipos de inspección disponibles.', schema: arraySchema }),
  );
  decorateMethod(InspectionsController, 'findTemplates',
    ApiOperation({ summary: 'Listar plantillas de checklist' }),
    ApiOkResponse({ description: 'Plantillas vigentes para inspecciones checklist.', schema: arraySchema }),
  );
  decorateMethod(InspectionsController, 'findResponsibleUsers',
    ApiOperation({ summary: 'Listar usuarios responsables asignables' }),
    ApiQuery({ name: 'companyId', required: false, format: 'uuid', description: 'Empresa para filtrar responsables.' }),
    ApiOkResponse({ description: 'Usuarios disponibles según el alcance del solicitante.', schema: arraySchema }),
  );
  decorateMethod(InspectionsController, 'getAssignmentScope',
    ApiOperation({ summary: 'Consultar alcance disponible para asignaciones' }),
    ApiOkResponse({ description: 'Empresas y áreas que el usuario puede seleccionar.', schema: objectSchema }),
  );
  decorateMethod(InspectionsController, 'getDashboardSummary',
    ApiOperation({ summary: 'Obtener resumen mobile de inspecciones' }),
    ApiOkResponse({ description: 'Resumen de inspecciones y observaciones visible para el usuario.', schema: objectSchema }),
  );
  decorateMethod(InspectionsController, 'findAll',
    ApiOperation({ summary: 'Listar inspecciones accesibles' }),
    ApiQuery({ name: 'status', required: false, description: 'Estado de la inspección.' }),
    ApiQuery({ name: 'inspectionTypeId', required: false, format: 'uuid', description: 'Tipo de inspección.' }),
    ApiOkResponse({ description: 'Inspecciones filtradas por permisos y alcance.', schema: arraySchema }),
  );
  decorateMethod(InspectionsController, 'create',
    ApiOperation({ summary: 'Crear una inspección' }),
    ApiCreatedResponse({ description: 'Inspección creada correctamente.', schema: objectSchema }),
    ApiBadRequestResponse({ description: 'El payload no cumple las reglas de validación.' }),
  );
  decorateMethod(InspectionsController, 'findFindings',
    ApiOperation({ summary: 'Listar observaciones de una inspección' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiOkResponse({ description: 'Observaciones asociadas a la inspección.', schema: arraySchema }),
    ApiNotFoundResponse({ description: 'La inspección no existe o no está dentro del alcance.' }),
  );
  decorateMethod(InspectionsController, 'getDetail',
    ApiOperation({ summary: 'Obtener el detalle completo de una inspección' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiOkResponse({ description: 'Detalle, observaciones, seguimientos, SLA y datos generales.', schema: objectSchema }),
    ApiNotFoundResponse({ description: 'La inspección no existe o no está dentro del alcance.' }),
  );
  decorateMethod(InspectionsController, 'createFinding',
    ApiOperation({ summary: 'Crear una observación en una inspección' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiCreatedResponse({ description: 'Observación creada correctamente.', schema: objectSchema }),
    ApiBadRequestResponse({ description: 'La observación no cumple las reglas de validación.' }),
  );
  decorateMethod(InspectionsController, 'closeInspection',
    ApiOperation({ summary: 'Cerrar una inspección sin observaciones pendientes' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiOkResponse({ description: 'Inspección cerrada correctamente.', schema: objectSchema }),
    ApiBadRequestResponse({ description: 'La inspección todavía posee observaciones abiertas.' }),
  );
  decorateMethod(InspectionsController, 'upsertAnswer',
    ApiOperation({ summary: 'Registrar o actualizar una respuesta de checklist' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiCreatedResponse({ description: 'Respuesta de checklist guardada.', schema: objectSchema }),
  );
  decorateMethod(InspectionsController, 'findOne',
    ApiOperation({ summary: 'Obtener una inspección por ID' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiOkResponse({ description: 'Inspección encontrada.', schema: objectSchema }),
    ApiNotFoundResponse({ description: 'La inspección no existe o no está dentro del alcance.' }),
  );
  decorateMethod(InspectionsController, 'updateStatus',
    ApiOperation({ summary: 'Actualizar el estado de una inspección' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiOkResponse({ description: 'Estado actualizado correctamente.', schema: objectSchema }),
    ApiBadRequestResponse({ description: 'La transición de estado no está permitida.' }),
  );
  decorateMethod(InspectionsController, 'update',
    ApiOperation({ summary: 'Actualizar los datos de una inspección' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiOkResponse({ description: 'Inspección actualizada correctamente.', schema: objectSchema }),
  );
  decorateMethod(InspectionsController, 'createFollowup',
    ApiOperation({ summary: 'Crear un seguimiento de una observación' }),
    uuidParam('findingId', 'Identificador de la observación.'),
    ApiCreatedResponse({ description: 'Seguimiento creado correctamente.', schema: objectSchema }),
  );
  decorateMethod(InspectionsController, 'reassignFindingSla',
    ApiOperation({ summary: 'Reasignar el SLA de una observación existente' }),
    uuidParam('findingId', 'Identificador de la observación.'),
    ApiCreatedResponse({ description: 'SLA actualizado y evento de seguimiento registrado.', schema: objectSchema }),
    ApiBadRequestResponse({ description: 'Nuevo SLA o motivo inválido, o estado no reasignable.' }),
  );
  decorateMethod(InspectionsController, 'updateFinding',
    ApiOperation({ summary: 'Actualizar una observación' }),
    uuidParam('findingId', 'Identificador de la observación.'),
    ApiOkResponse({ description: 'Observación actualizada correctamente.', schema: objectSchema }),
    ApiBadRequestResponse({ description: 'Transición o información de revisión inválida.' }),
  );
  decorateMethod(InspectionsController, 'updateFollowup',
    ApiOperation({ summary: 'Actualizar un seguimiento' }),
    uuidParam('followupId', 'Identificador del seguimiento.'),
    ApiOkResponse({ description: 'Seguimiento actualizado correctamente.', schema: objectSchema }),
  );
}

function applyProcessMetadata(): void {
  decorateMethod(InspectionProcessController, 'resubmitEvidence',
    ApiOperation({ summary: 'Reenviar evidencias de una observación rechazada' }),
    uuidParam('findingId', 'Identificador de la observación.'),
    ApiCreatedResponse({ description: 'Solicitud de reenvío registrada.', schema: objectSchema }),
  );
  decorateMethod(InspectionProcessController, 'preValidate',
    ApiOperation({ summary: 'Ejecutar prevalidación asistida por IA' }),
    uuidParam('inspectionId', 'Identificador de la inspección.'),
    ApiCreatedResponse({ description: 'Evaluación de IA generada.', schema: objectSchema }),
  );
  decorateMethod(InspectionProcessController, 'findAiAssessments',
    ApiOperation({ summary: 'Listar evaluaciones de IA de una inspección' }),
    uuidParam('inspectionId', 'Identificador de la inspección.'),
    ApiOkResponse({ description: 'Evaluaciones registradas.', schema: arraySchema }),
  );
  decorateMethod(InspectionProcessController, 'recordAiDecision',
    ApiOperation({ summary: 'Registrar la decisión humana sobre una evaluación de IA' }),
    uuidParam('assessmentId', 'Identificador de la evaluación.'),
    ApiOkResponse({ description: 'Decisión registrada.', schema: objectSchema }),
  );
}

function managementQueries(): MethodDecorator[] {
  return [
    ApiQuery({ name: 'page', required: false, example: 1, description: 'Página, desde 1.' }),
    ApiQuery({ name: 'pageSize', required: false, example: 10, description: 'Filas por página.' }),
    ApiQuery({ name: 'id', required: false, description: 'Número o identificador visible.' }),
    ApiQuery({ name: 'date', required: false, example: '27-07-2026', description: 'Fecha dd-mm-aaaa, dd-mm-aa o ISO.' }),
    ApiQuery({ name: 'inspector', required: false, description: 'Nombre del inspector.' }),
    ApiQuery({ name: 'area', required: false, description: 'Área o sector.' }),
    ApiQuery({ name: 'company', required: false, description: 'Empresa.' }),
    ApiQuery({ name: 'type', required: false, enum: ['Checklist', 'Hallazgo'], description: 'Tipo de inspección.' }),
    ApiQuery({ name: 'urgency', required: false, description: 'Urgencia máxima.' }),
    ApiQuery({ name: 'count', required: false, description: 'Cantidad de observaciones.' }),
    ApiQuery({ name: 'obs', required: false, description: 'Estado resumido de observaciones.' }),
    ApiQuery({ name: 'daysMin', required: false, description: 'Mínimo de días.' }),
    ApiQuery({ name: 'daysMax', required: false, description: 'Máximo de días.' }),
    ApiQuery({ name: 'closure', required: false, description: 'Porcentaje de cierre.' }),
  ];
}

function dashboardPeriodQueries(): MethodDecorator[] {
  return [
    ApiQuery({ name: 'year', required: false, example: 2026, description: 'Año del período.' }),
    ApiQuery({
      name: 'period',
      required: false,
      enum: ['year', 'q1', 'q2', 'q3', 'q4', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'],
      description: 'Año, trimestre o mes.',
    }),
    ApiQuery({ name: 'companyId', required: false, format: 'uuid', description: 'Empresa responsable.' }),
  ];
}

function applyDashboardMetadata(): void {
  decorateMethod(InspectionDashboardController, 'getManagementKpis',
    ApiOperation({ summary: 'Obtener KPIs de gestión de inspecciones' }),
    ApiOkResponse({ description: 'Indicadores de la vista Gestión.', schema: objectSchema }),
  );
  decorateMethod(InspectionDashboardController, 'getManagementTable',
    ApiOperation({ summary: 'Consultar la tabla de gestión' }),
    ...managementQueries(),
    ApiOkResponse({ description: 'Tabla paginada y opciones de filtro.', schema: objectSchema }),
  );
  decorateMethod(InspectionDashboardController, 'exportManagementTableXlsx',
    ApiOperation({ summary: 'Exportar la tabla filtrada a Excel' }),
    ...managementQueries(),
    ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    ApiOkResponse({
      description: 'Archivo XLSX de la tabla filtrada.',
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: { type: 'string', format: 'binary' },
        },
      },
    }),
  );
  decorateMethod(InspectionDashboardController, 'getSummary',
    ApiOperation({ summary: 'Obtener resumen filtrado del dashboard' }),
    ...dashboardPeriodQueries(),
    ApiOkResponse({ description: 'Resumen del período.', schema: objectSchema }),
  );
  decorateMethod(InspectionDashboardController, 'getCharts',
    ApiOperation({ summary: 'Obtener series para gráficos del dashboard' }),
    ...dashboardPeriodQueries(),
    ApiOkResponse({ description: 'Series y distribuciones del período.', schema: objectSchema }),
  );
  decorateMethod(InspectionDashboardController, 'getCompanyAnalysis',
    ApiOperation({ summary: 'Obtener análisis por empresa' }),
    ...dashboardPeriodQueries(),
    ApiOkResponse({ description: 'Indicadores agrupados por empresa.', schema: objectSchema }),
  );
  decorateMethod(InspectionDashboardController, 'getOpenFindings',
    ApiOperation({ summary: 'Obtener observaciones abiertas del dashboard' }),
    ...dashboardPeriodQueries(),
    ApiOkResponse({ description: 'Observaciones abiertas visibles para el usuario.', schema: objectSchema }),
  );
}

function applyHistoryMetadata(): void {
  decorateMethod(InspectionHistoryController, 'getHistoryKpis',
    ApiOperation({ summary: 'Obtener KPIs históricos' }),
    ApiOkResponse({ description: 'Indicadores de inspecciones cerradas.', schema: objectSchema }),
  );
  decorateMethod(InspectionHistoryController, 'getHistoryTable',
    ApiOperation({ summary: 'Consultar el historial de inspecciones' }),
    ...managementQueries(),
    ApiOkResponse({ description: 'Tabla paginada de inspecciones cerradas.', schema: objectSchema }),
  );
}

function applyTransversalMetadata(): void {
  decorateMethod(InspectionTransversalController, 'findEvidences',
    ApiOperation({ summary: 'Listar evidencias de una inspección' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiOkResponse({ description: 'Evidencias vinculadas.', schema: arraySchema }),
  );
  decorateMethod(InspectionTransversalController, 'linkEvidence',
    ApiOperation({ summary: 'Vincular una evidencia a una inspección' }),
    uuidParam('id', 'Identificador de la inspección.'),
    uuidParam('evidenceId', 'Identificador de la evidencia.'),
    ApiCreatedResponse({ description: 'Vínculo creado correctamente.', schema: objectSchema }),
  );
  decorateMethod(InspectionTransversalController, 'findComments',
    ApiOperation({ summary: 'Listar comentarios de una inspección' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiOkResponse({ description: 'Comentarios asociados.', schema: arraySchema }),
  );
  decorateMethod(InspectionTransversalController, 'createComment',
    ApiOperation({ summary: 'Crear un comentario en una inspección' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiCreatedResponse({ description: 'Comentario creado correctamente.', schema: objectSchema }),
  );
  decorateMethod(InspectionTransversalController, 'getExportPayload',
    ApiOperation({ summary: 'Obtener el payload estructurado de exportación' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiOkResponse({ description: 'Datos consolidados para exportación.', schema: objectSchema }),
  );
  decorateMethod(InspectionTransversalController, 'getExportPdf',
    ApiOperation({ summary: 'Descargar el informe PDF de una inspección' }),
    uuidParam('id', 'Identificador de la inspección.'),
    ApiProduces('application/pdf'),
    ApiOkResponse({
      description: 'Informe PDF de la inspección.',
      content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
    }),
  );
}

function applyCatalogMetadata(): void {
  decorateMethod(InspectionFindingCatalogController, 'findTypes',
    ApiOperation({ summary: 'Listar tipos de hallazgo' }),
    ApiOkResponse({ description: 'Tipos de hallazgo activos.', schema: arraySchema }),
  );
  decorateMethod(InspectionFindingCatalogController, 'findSeverities',
    ApiOperation({ summary: 'Listar severidades de hallazgo' }),
    ApiOkResponse({ description: 'Severidades activas.', schema: arraySchema }),
  );
  decorateMethod(InspectionFindingCatalogController, 'findAll',
    ApiOperation({ summary: 'Obtener catálogos de hallazgos' }),
    ApiOkResponse({ description: 'Tipos y severidades en una sola respuesta.', schema: objectSchema }),
  );
  decorateMethod(InspectionCriticalityCatalogController, 'findProbabilities',
    ApiOperation({ summary: 'Listar probabilidades de riesgo' }),
    ApiOkResponse({ description: 'Probabilidades activas ordenadas por criticidad.', schema: arraySchema }),
  );
  decorateMethod(InspectionCriticalityCatalogController, 'findConsequences',
    ApiOperation({ summary: 'Listar consecuencias de riesgo' }),
    ApiOkResponse({ description: 'Consecuencias activas ordenadas por criticidad.', schema: arraySchema }),
  );
}

applyControllerMetadata();
applyCoreMetadata();
applyProcessMetadata();
applyDashboardMetadata();
applyHistoryMetadata();
applyTransversalMetadata();
applyCatalogMetadata();
