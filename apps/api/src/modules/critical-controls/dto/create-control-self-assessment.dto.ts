import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import {
  ControlAnswerValue,
  CreateControlSelfAssessmentRequest,
  UpsertControlSelfAssessmentAnswerRequest,
  UpsertControlSelfAssessmentAnswersRequest,
} from '@aurelia/contracts';

export class CreateControlSelfAssessmentDto implements CreateControlSelfAssessmentRequest {
  @IsUUID()
  mueId: string;

  @IsOptional()
  @IsUUID()
  criticalControlId?: string | null;

  @IsOptional()
  @IsUUID()
  areaId?: string | null;

  @IsOptional()
  @IsUUID()
  gerenciaId?: string | null;

  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  @IsInt()
  @Min(2000)
  @Max(2100)
  periodYear: number;

  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth: number;
}

export class UpsertControlSelfAssessmentAnswerDto implements UpsertControlSelfAssessmentAnswerRequest {
  @IsUUID()
  verificationItemId: string;

  @IsEnum(ControlAnswerValue)
  answer: ControlAnswerValue;

  @IsOptional()
  @IsString()
  comment?: string | null;

  @IsOptional()
  @IsString()
  riskLevel?: string | null;

  @IsOptional()
  @IsBoolean()
  actionRequired?: boolean;
}

export class UpsertControlSelfAssessmentAnswersDto implements UpsertControlSelfAssessmentAnswersRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertControlSelfAssessmentAnswerDto)
  answers: UpsertControlSelfAssessmentAnswerDto[];
}
