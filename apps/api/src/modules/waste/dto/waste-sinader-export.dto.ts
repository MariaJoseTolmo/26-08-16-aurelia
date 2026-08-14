import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type {
  WasteSinaderExportKpi,
  WasteSinaderExportRequest,
  WasteSinaderExportRow,
  WasteSinaderExportSignature,
  WasteSinaderExportStatus,
} from '@aurelia/contracts';

/**
 * Mismos topes que `WarehouseControlExportDto` y por el mismo motivo: el payload lo
 * arma el cliente, así que sin límites un request podría dejar el proceso Node
 * ocupado renderizando un PDF de decenas de miles de filas.
 *
 * `MAX_ROWS` es más bajo que los 2000 de las otras dos exportaciones: una línea del
 * consolidado es la combinación única de residuo, transportista y destino de un
 * mes, y la tabla tiene un constraint sobre esas tres dimensiones. Trescientas ya
 * es un mes extraordinario.
 */
const MAX_ROWS = 300;
const MAX_KPIS = 12;
const MAX_TEXT = 500;
/** El aviso de período abierto es un párrafo, no una celda. */
const MAX_NOTICE = 1000;

/** Los tres estados del contrato. `IsIn` los valida sin importar un enum de runtime. */
const SINADER_EXPORT_STATUSES: WasteSinaderExportStatus[] = [
  'in_progress',
  'pending_declaration',
  'declared',
];

export class WasteSinaderExportSignatureDto implements WasteSinaderExportSignature {
  @IsString()
  @MaxLength(MAX_TEXT)
  declaredBy: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  declaredAtAndFolio: string;
}


export class WasteSinaderExportKpiDto implements WasteSinaderExportKpi {
  @IsString()
  @MaxLength(MAX_TEXT)
  label: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEXT)
  unit?: string;
}

export class WasteSinaderExportRowDto implements WasteSinaderExportRow {
  @IsString()
  @MaxLength(MAX_TEXT)
  category: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  waste: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  quantity: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  treatment: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  destination: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  transport: string;
}

export class WasteSinaderExportDto implements WasteSinaderExportRequest {
  @IsIn(SINADER_EXPORT_STATUSES)
  status: WasteSinaderExportStatus;

  @IsString()
  @MaxLength(MAX_TEXT)
  statusBadgeLabel: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEXT)
  tableFootnote?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WasteSinaderExportSignatureDto)
  signature?: WasteSinaderExportSignatureDto;

  @IsString()
  @MaxLength(MAX_TEXT)
  title: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  description: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  periodLabel: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  statusLabel: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_NOTICE)
  notice?: string;

  @IsArray()
  @ArrayMaxSize(MAX_KPIS)
  @ValidateNested({ each: true })
  @Type(() => WasteSinaderExportKpiDto)
  kpis: WasteSinaderExportKpiDto[];

  @IsArray()
  @ArrayMaxSize(MAX_ROWS)
  @ValidateNested({ each: true })
  @Type(() => WasteSinaderExportRowDto)
  rows: WasteSinaderExportRowDto[];

  @IsString()
  @MaxLength(MAX_TEXT)
  totalLabel: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  totalQuantity: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  updatedAtLabel: string;
}
