import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HttpErrorOpenApiModel {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Bad request' },
      { type: 'array', items: { type: 'string' }, example: ['title must be longer than or equal to 3 characters'] },
    ],
  })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: '/api/inspections' })
  path: string;

  @ApiProperty({ format: 'date-time', example: '2026-07-30T20:45:00.000Z' })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Identificador de correlación de la solicitud, cuando fue generado por el middleware.',
    example: 'c577705d-88cb-439d-a494-c58d9f041a61',
  })
  requestId?: string;
}
