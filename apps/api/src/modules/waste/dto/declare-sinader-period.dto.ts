import { IsISO8601, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import type { DeclareWasteSinaderPeriodRequest } from '@aurelia/contracts';

/**
 * Cierre de un período SINADER. Ver `DeclareWasteSinaderPeriodRequest`.
 *
 * El folio se valida en FORMA y no contra un catálogo: es un identificador que
 * emite un sistema externo y AurelIA no tiene cómo comprobarlo. Lo que sí se
 * comprueba es que no llegue vacío ni con basura, porque queda como la referencia
 * de una declaración reglamentaria.
 */
export class DeclareSinaderPeriodDto implements DeclareWasteSinaderPeriodRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9./-]*$/, {
    message: 'folio must contain only letters, digits, dots, slashes or hyphens',
  })
  folio: string;

  /** `strict: true` rechaza fechas imposibles como 2026-02-31, que `new Date()` acepta. */
  @IsISO8601({ strict: true })
  declaredOn: string;
}
