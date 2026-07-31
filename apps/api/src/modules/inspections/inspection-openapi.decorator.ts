import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const INSPECTION_OPENAPI_TAGS = {
  core: 'Inspecciones',
  processes: 'Inspecciones · Procesos',
  dashboard: 'Inspecciones · Dashboard',
  history: 'Inspecciones · Historial',
  transversal: 'Inspecciones · Evidencias y comentarios',
  catalogs: 'Inspecciones · Catálogos',
} as const;

export function ApiInspectionController(tag: typeof INSPECTION_OPENAPI_TAGS[keyof typeof INSPECTION_OPENAPI_TAGS]) {
  return applyDecorators(
    ApiTags(tag),
    ApiBearerAuth('bearer'),
    ApiUnauthorizedResponse({ description: 'Token de acceso ausente, inválido o vencido.' }),
    ApiForbiddenResponse({ description: 'El usuario autenticado no posee los permisos o el alcance requeridos.' }),
  );
}
