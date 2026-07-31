import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpErrorOpenApiModel } from '../../openapi/http-error-openapi.model';
import { AuthController } from './auth.controller';
import {
  AuthenticatedUserOpenApiModel,
  IframeSessionTicketOpenApiRequest,
  IframeSessionTicketOpenApiResponse,
  LoginOpenApiRequest,
  LoginOpenApiResponse,
  MeOpenApiResponse,
  SessionRenewOpenApiRequest,
} from './auth-openapi.models';

type ControllerClass = { prototype: object; name: string };

function decorateMethod(
  controller: ControllerClass,
  methodName: string,
  ...decorators: MethodDecorator[]
): void {
  const descriptor = Object.getOwnPropertyDescriptor(controller.prototype, methodName);
  if (!descriptor) throw new Error(`Missing ${controller.name}.${methodName} for OpenAPI metadata`);
  decorators.forEach((decorator) => decorator(controller.prototype, methodName, descriptor));
}

ApiTags('Autenticación')(AuthController);
ApiExtraModels(
  HttpErrorOpenApiModel,
  LoginOpenApiRequest,
  AuthenticatedUserOpenApiModel,
  LoginOpenApiResponse,
  SessionRenewOpenApiRequest,
  IframeSessionTicketOpenApiRequest,
  IframeSessionTicketOpenApiResponse,
  MeOpenApiResponse,
)(AuthController);

decorateMethod(
  AuthController,
  'login',
  ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Valida las credenciales y emite un JWT de acceso junto con un refresh token rotatorio.',
  }),
  ApiBody({ type: LoginOpenApiRequest }),
  ApiOkResponse({ description: 'Sesión iniciada correctamente.', type: LoginOpenApiResponse }),
  ApiUnauthorizedResponse({ description: 'Credenciales inválidas o usuario temporalmente bloqueado.', type: HttpErrorOpenApiModel }),
);

decorateMethod(
  AuthController,
  'renew',
  ApiOperation({
    summary: 'Renovar sesión',
    description: 'Rota el refresh token vigente y entrega un nuevo par de tokens.',
  }),
  ApiBody({ type: SessionRenewOpenApiRequest }),
  ApiOkResponse({ description: 'Sesión renovada correctamente.', type: LoginOpenApiResponse }),
  ApiUnauthorizedResponse({ description: 'Refresh token ausente, inválido, revocado o vencido.', type: HttpErrorOpenApiModel }),
);

decorateMethod(
  AuthController,
  'createIframeTicket',
  ApiBearerAuth('bearer'),
  ApiOperation({
    summary: 'Crear ticket para sesión embebida',
    description: 'Genera un ticket de un solo uso y corta duración para abrir una sesión dentro de un iframe autorizado.',
  }),
  ApiOkResponse({ description: 'Ticket temporal emitido.', type: IframeSessionTicketOpenApiResponse }),
  ApiUnauthorizedResponse({ description: 'Token de acceso ausente, inválido o vencido.', type: HttpErrorOpenApiModel }),
);

decorateMethod(
  AuthController,
  'exchangeIframeTicket',
  ApiOperation({ summary: 'Canjear ticket de sesión embebida' }),
  ApiBody({ type: IframeSessionTicketOpenApiRequest }),
  ApiOkResponse({ description: 'Ticket canjeado y sesión iniciada.', type: LoginOpenApiResponse }),
  ApiUnauthorizedResponse({ description: 'Ticket ausente, inválido, vencido o ya utilizado.', type: HttpErrorOpenApiModel }),
);

decorateMethod(
  AuthController,
  'logout',
  ApiBearerAuth('bearer'),
  ApiOperation({ summary: 'Cerrar la sesión actual' }),
  ApiNoContentResponse({ description: 'Sesión actual revocada.' }),
  ApiUnauthorizedResponse({ description: 'Token de acceso ausente, inválido o vencido.', type: HttpErrorOpenApiModel }),
);

decorateMethod(
  AuthController,
  'logoutAll',
  ApiBearerAuth('bearer'),
  ApiOperation({ summary: 'Cerrar todas las sesiones del usuario' }),
  ApiNoContentResponse({ description: 'Todas las sesiones activas fueron revocadas.' }),
  ApiUnauthorizedResponse({ description: 'Token de acceso ausente, inválido o vencido.', type: HttpErrorOpenApiModel }),
);

decorateMethod(
  AuthController,
  'getMe',
  ApiBearerAuth('bearer'),
  ApiOperation({ summary: 'Consultar el usuario autenticado' }),
  ApiOkResponse({ description: 'Identidad, roles y permisos del JWT actual.', type: MeOpenApiResponse }),
  ApiUnauthorizedResponse({ description: 'Token de acceso ausente, inválido o vencido.', type: HttpErrorOpenApiModel }),
);
