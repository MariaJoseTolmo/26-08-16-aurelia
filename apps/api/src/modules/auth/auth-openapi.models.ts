import { Role } from '@aurelia/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginOpenApiRequest {
  @ApiProperty({ format: 'email', example: 'inspector@goldfields.com' })
  email: string;

  @ApiProperty({ format: 'password', writeOnly: true, example: '********' })
  password: string;

  @ApiPropertyOptional({
    enum: ['web', 'mobile-inspecciones', 'mobile-incidentes'],
    example: 'web',
    description: 'Aplicación cliente que inicia la sesión.',
  })
  client?: 'web' | 'mobile-inspecciones' | 'mobile-incidentes';
}

export class AuthenticatedUserOpenApiModel {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ nullable: true })
  position: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  companyId: string | null;

  @ApiProperty({ nullable: true })
  companyName: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  areaId: string | null;

  @ApiProperty({ nullable: true })
  areaName: string | null;

  @ApiProperty({ enum: Role, enumName: 'Role', isArray: true })
  roles: Role[];

  @ApiProperty({ type: [String], example: ['inspections:read', 'inspections:create'] })
  permissions: string[];
}

export class LoginOpenApiResponse {
  @ApiProperty({
    description: 'JWT de acceso para enviar como Bearer token.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Token opaco utilizado exclusivamente para renovar la sesión.',
    example: '4a3b83b0-9d0c-49ea-bac3-5faf4fb0a331.secret',
  })
  refreshToken: string;

  @ApiProperty({ type: () => AuthenticatedUserOpenApiModel })
  user: AuthenticatedUserOpenApiModel;
}

export class SessionRenewOpenApiRequest {
  @ApiProperty({ writeOnly: true, description: 'Refresh token vigente emitido durante login o renovación.' })
  refreshToken: string;
}

export class IframeSessionTicketOpenApiRequest {
  @ApiProperty({ format: 'uuid', description: 'Ticket de un solo uso y corta duración.' })
  ticket: string;
}

export class IframeSessionTicketOpenApiResponse {
  @ApiProperty({ format: 'uuid' })
  ticket: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt: string;
}

export class MeOpenApiResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ enum: Role, enumName: 'Role', isArray: true })
  roles: Role[];

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiProperty({ example: false })
  isPlaceholder: boolean;
}
