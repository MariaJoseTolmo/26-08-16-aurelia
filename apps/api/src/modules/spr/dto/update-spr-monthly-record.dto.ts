import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { UpdateSprMonthlyRecordRequest } from '@aurelia/contracts';

export class UpdateSprMonthlyRecordDto implements UpdateSprMonthlyRecordRequest {
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
