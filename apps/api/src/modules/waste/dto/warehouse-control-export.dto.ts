import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  WarehouseControlExportBar,
  WarehouseControlExportExpiration,
  WarehouseControlExportKpi,
  WarehouseControlExportLot,
  WarehouseControlExportRequest,
  WarehouseControlLotStatus,
} from '@aurelia/contracts';

const LOT_STATUSES: WarehouseControlLotStatus[] = ['overdue', 'near_limit', 'normal'];

/**
 * Topes de tamaño. El payload lo arma el cliente, así que sin límites un request
 * podría pedir un PDF de decenas de miles de páginas y dejar el proceso Node
 * ocupado generándolo. 2000 lotes son ~40 páginas de tabla.
 */
const MAX_LOTS = 2000;
const MAX_BLOCKS = 40;
const MAX_TEXT = 500;

export class WarehouseControlExportKpiDto implements WarehouseControlExportKpi {
  @IsString()
  @MaxLength(MAX_TEXT)
  label: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEXT)
  secondaryValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_TEXT)
  note?: string;
}

export class WarehouseControlExportBarDto implements WarehouseControlExportBar {
  @IsString()
  @MaxLength(MAX_TEXT)
  label: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @IsString()
  @MaxLength(MAX_TEXT)
  deviationLabel: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  valueLabel: string;
}

export class WarehouseControlExportExpirationDto implements WarehouseControlExportExpiration {
  @IsString()
  @MaxLength(MAX_TEXT)
  wasteName: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  intakeDate: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  detail: string;

  @IsBoolean()
  overdue: boolean;
}

export class WarehouseControlExportLotDto implements WarehouseControlExportLot {
  @IsBoolean()
  hazardous: boolean;

  @IsString()
  @MaxLength(MAX_TEXT)
  category: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  wasteType: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  quantity: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  unit: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  elapsedLabel: string;

  @IsIn(LOT_STATUSES)
  status: WarehouseControlLotStatus;
}

export class WarehouseControlExportDto implements WarehouseControlExportRequest {
  @IsString()
  @MaxLength(MAX_TEXT)
  title: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  description: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  monthProgressLabel: string;

  @IsArray()
  @ArrayMaxSize(MAX_BLOCKS)
  @ValidateNested({ each: true })
  @Type(() => WarehouseControlExportKpiDto)
  kpis: WarehouseControlExportKpiDto[];

  @IsArray()
  @ArrayMaxSize(MAX_BLOCKS)
  @ValidateNested({ each: true })
  @Type(() => WarehouseControlExportBarDto)
  bars: WarehouseControlExportBarDto[];

  @IsArray()
  @ArrayMaxSize(MAX_BLOCKS)
  @ValidateNested({ each: true })
  @Type(() => WarehouseControlExportExpirationDto)
  expirations: WarehouseControlExportExpirationDto[];

  @IsArray()
  @ArrayMaxSize(MAX_LOTS)
  @ValidateNested({ each: true })
  @Type(() => WarehouseControlExportLotDto)
  lots: WarehouseControlExportLotDto[];
}
