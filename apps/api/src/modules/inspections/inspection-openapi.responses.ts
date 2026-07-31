import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { HttpErrorOpenApiModel } from '../../openapi/http-error-openapi.model';
import { InspectionDashboardController } from './inspection-dashboard.controller';
import { InspectionHistoryController } from './inspection-history.controller';
import {
  InspectionAssignmentScopeOpenApiModel,
  InspectionDashboardSummaryOpenApiModel,
  InspectionDetailOpenApiModel,
  InspectionFindingOpenApiModel,
  InspectionFindingSlaReassignmentOpenApiModel,
  InspectionManagementTableOpenApiModel,
  InspectionOpenApiModel,
} from './inspection-openapi.models';
import { InspectionsController } from './inspections.controller';

type ControllerClass = { prototype: object; name: string };

function decorateMethod(
  controller: ControllerClass,
  methodName: string,
  ...decorators: MethodDecorator[]
): void {
  const descriptor = Object.getOwnPropertyDescriptor(controller.prototype, methodName);
  if (!descriptor) throw new Error(`Missing ${controller.name}.${methodName} for typed OpenAPI response metadata`);
  decorators.forEach((decorator) => decorator(controller.prototype, methodName, descriptor));
}

ApiExtraModels(
  HttpErrorOpenApiModel,
  InspectionOpenApiModel,
  InspectionFindingOpenApiModel,
  InspectionAssignmentScopeOpenApiModel,
  InspectionDashboardSummaryOpenApiModel,
  InspectionManagementTableOpenApiModel,
  InspectionDetailOpenApiModel,
  InspectionFindingSlaReassignmentOpenApiModel,
)(InspectionsController);

ApiExtraModels(InspectionManagementTableOpenApiModel)(InspectionDashboardController);
ApiExtraModels(InspectionManagementTableOpenApiModel)(InspectionHistoryController);

decorateMethod(
  InspectionsController,
  'getAssignmentScope',
  ApiOkResponse({
    description: 'Empresa fija del usuario o permiso para seleccionar cualquier empresa.',
    type: InspectionAssignmentScopeOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'getDashboardSummary',
  ApiOkResponse({
    description: 'Resumen de inspecciones y observaciones visible para el usuario autenticado.',
    type: InspectionDashboardSummaryOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'findAll',
  ApiOkResponse({
    description: 'Inspecciones filtradas por permisos y alcance.',
    type: InspectionOpenApiModel,
    isArray: true,
  }),
);

decorateMethod(
  InspectionsController,
  'create',
  ApiCreatedResponse({ description: 'Inspección creada correctamente.', type: InspectionOpenApiModel }),
  ApiBadRequestResponse({ description: 'El payload no cumple las reglas de validación.', type: HttpErrorOpenApiModel }),
);

decorateMethod(
  InspectionsController,
  'findFindings',
  ApiOkResponse({
    description: 'Observaciones asociadas a la inspección.',
    type: InspectionFindingOpenApiModel,
    isArray: true,
  }),
  ApiNotFoundResponse({
    description: 'La inspección no existe o no está dentro del alcance.',
    type: HttpErrorOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'getDetail',
  ApiOkResponse({
    description: 'Detalle, observaciones, seguimientos, SLA, checklist, datos generales y proyección legacy.',
    type: InspectionDetailOpenApiModel,
  }),
  ApiNotFoundResponse({
    description: 'La inspección no existe o no está dentro del alcance.',
    type: HttpErrorOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'createFinding',
  ApiCreatedResponse({ description: 'Observación creada correctamente.', type: InspectionFindingOpenApiModel }),
  ApiBadRequestResponse({
    description: 'La observación no cumple las reglas de validación.',
    type: HttpErrorOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'closeInspection',
  ApiOkResponse({ description: 'Inspección cerrada correctamente.', type: InspectionOpenApiModel }),
  ApiBadRequestResponse({
    description: 'La inspección todavía posee observaciones abiertas.',
    type: HttpErrorOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'findOne',
  ApiOkResponse({ description: 'Inspección encontrada.', type: InspectionOpenApiModel }),
  ApiNotFoundResponse({
    description: 'La inspección no existe o no está dentro del alcance.',
    type: HttpErrorOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'updateStatus',
  ApiOkResponse({ description: 'Estado actualizado correctamente.', type: InspectionOpenApiModel }),
  ApiBadRequestResponse({
    description: 'La transición de estado no está permitida.',
    type: HttpErrorOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'update',
  ApiOkResponse({ description: 'Inspección actualizada correctamente.', type: InspectionOpenApiModel }),
  ApiBadRequestResponse({
    description: 'La actualización no cumple las reglas de validación o transición.',
    type: HttpErrorOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'reassignFindingSla',
  ApiCreatedResponse({
    description: 'SLA actualizado y evento de seguimiento registrado.',
    type: InspectionFindingSlaReassignmentOpenApiModel,
  }),
  ApiBadRequestResponse({
    description: 'Nuevo SLA o motivo inválido, o estado no reasignable.',
    type: HttpErrorOpenApiModel,
  }),
);

decorateMethod(
  InspectionsController,
  'updateFinding',
  ApiOkResponse({ description: 'Observación actualizada correctamente.', type: InspectionFindingOpenApiModel }),
  ApiBadRequestResponse({
    description: 'Transición o información de revisión inválida.',
    type: HttpErrorOpenApiModel,
  }),
);

decorateMethod(
  InspectionDashboardController,
  'getManagementTable',
  ApiOkResponse({
    description: 'Tabla paginada de gestión y opciones disponibles para filtros.',
    type: InspectionManagementTableOpenApiModel,
  }),
);

decorateMethod(
  InspectionHistoryController,
  'getHistoryTable',
  ApiOkResponse({
    description: 'Tabla paginada de inspecciones cerradas y opciones disponibles para filtros.',
    type: InspectionManagementTableOpenApiModel,
  }),
);
