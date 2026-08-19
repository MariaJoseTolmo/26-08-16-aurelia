import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { CreateSprMonthlyRecordRequest } from '@aurelia/contracts';

export class CreateSprMonthlyRecordDto implements CreateSprMonthlyRecordRequest {
  @IsUUID()
  parameterId: string;

  @IsOptional()
  @IsUUID()
  areaId?: string | null;

  @IsOptional()
  @IsUUID()
  assignmentId?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  periodYear: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  numericValue?: number | null;

  @IsOptional()
  @IsString()
  textValue?: string | null;

  @IsOptional()
  @IsBoolean()
  booleanValue?: boolean | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
