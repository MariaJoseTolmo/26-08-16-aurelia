import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CreateIncidentFlashReportRequest } from '@aurelia/contracts';

export class CreateIncidentFlashReportDto implements CreateIncidentFlashReportRequest {
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  summary: string;

  @IsOptional()
  @IsString()
  immediateCauses?: string | null;

  @IsOptional()
  @IsString()
  affectedComponents?: string | null;

  @IsOptional()
  @IsString()
  potentialImpact?: string | null;

  @IsOptional()
  @IsString()
  reporterName?: string | null;
}
