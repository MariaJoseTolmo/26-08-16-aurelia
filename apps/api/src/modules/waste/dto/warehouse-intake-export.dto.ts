import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  WarehouseIntakeExportRequest,
  WarehouseIntakeExportRow,
} from '@aurelia/contracts';

/**
 * Mismos topes que `WarehouseControlExportDto` y por el mismo motivo: el payload
 * lo arma el cliente, así que sin límites un request podría dejar el proceso
 * Node ocupado generando una planilla de decenas de miles de filas.
 */
const MAX_ROWS = 2000;
const MAX_FILTERS = 20;
const MAX_TEXT = 500;
/** Una cantidad por encima de esto no es un ingreso, es un error de tipeo. */
const MAX_QUANTITY = 1_000_000_000;

export class WarehouseIntakeExportRowDto implements WarehouseIntakeExportRow {
  @IsString()
  @MaxLength(MAX_TEXT)
  entryDate: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  category: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  wasteType: string;

  @IsNumber()
  @Min(0)
  @Max(MAX_QUANTITY)
  quantity: number;

  @IsString()
  @MaxLength(MAX_TEXT)
  unit: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  origin: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  plate: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  driver: string;

  @IsBoolean()
  hazardous: boolean;
}

export class WarehouseIntakeExportDto implements WarehouseIntakeExportRequest {
  @IsString()
  @MaxLength(MAX_TEXT)
  title: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  description: string;

  @IsArray()
  @ArrayMaxSize(MAX_FILTERS)
  @IsString({ each: true })
  @MaxLength(MAX_TEXT, { each: true })
  activeFilters: string[];

  @IsArray()
  @ArrayMaxSize(MAX_ROWS)
  @ValidateNested({ each: true })
  @Type(() => WarehouseIntakeExportRowDto)
  rows: WarehouseIntakeExportRowDto[];
}
