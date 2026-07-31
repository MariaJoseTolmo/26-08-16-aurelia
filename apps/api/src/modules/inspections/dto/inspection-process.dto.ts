import {
  InspectionAiDecision,
  InspectionAiPreValidationRequest,
  InspectionFindingSeverity,
  OpenInspectionDisputeRequest,
  RecordInspectionAiDecisionRequest,
  RequestInspectionExtensionRequest,
  ResubmitInspectionEvidenceRequest,
  ResolveInspectionDisputeRequest,
  ResolveInspectionExtensionRequest,
  UpsertInspectionSlaPolicyRequest,
} from '@aurelia/contracts';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsISO8601,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RequestInspectionExtensionDto implements RequestInspectionExtensionRequest {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  reason: string;

  @IsISO8601()
  requestedDueAt: string;
}

export class ResolveInspectionExtensionDto implements ResolveInspectionExtensionRequest {
  @IsBoolean()
  approved: boolean;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  reason: string;

  @IsOptional()
  @IsISO8601()
  resolvedDueAt?: string | null;
}

export class OpenInspectionDisputeDto implements OpenInspectionDisputeRequest {
  @IsString()
  @MinLength(5)
  @MaxLength(3000)
  reason: string;
}

export class ResolveInspectionDisputeDto implements ResolveInspectionDisputeRequest {
  @IsIn(['ratify', 'reassign'])
  resolution: 'ratify' | 'reassign';

  @IsString()
  @MinLength(5)
  @MaxLength(3000)
  reason: string;

  @IsOptional()
  @IsUUID()
  responsibleCompanyId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  responsibleUserIds?: string[];
}

export class ResubmitInspectionEvidenceDto implements ResubmitInspectionEvidenceRequest {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  reason: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  evidenceIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  executedActionDescription?: string | null;
}

export class UpsertInspectionSlaPolicyDto implements UpsertInspectionSlaPolicyRequest {
  @IsInt()
  @Min(0)
  @Max(8760)
  firstReminderHoursBefore: number;

  @IsInt()
  @Min(0)
  @Max(8760)
  secondReminderHoursBefore: number;

  @IsInt()
  @Min(0)
  @Max(8760)
  escalationHoursAfter: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason: string;
}

export class InspectionAiPreValidationDto implements InspectionAiPreValidationRequest {
  @IsOptional()
  @IsUUID()
  findingId?: string | null;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  detectedCondition?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  proposedCorrectiveAction?: string | null;

  @IsOptional()
  @IsEnum(InspectionFindingSeverity)
  severity?: InspectionFindingSeverity | null;

  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  @IsOptional()
  @IsUUID()
  areaId?: string | null;
}

export class RecordInspectionAiDecisionDto implements RecordInspectionAiDecisionRequest {
  @IsIn([
    InspectionAiDecision.ACCEPTED,
    InspectionAiDecision.OVERRIDDEN,
    InspectionAiDecision.REJECTED,
  ])
  decision: Exclude<InspectionAiDecision, InspectionAiDecision.PENDING>;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  reason: string;
}

export class NotificationDeliveryFailureDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;

  @IsOptional()
  @IsBoolean()
  bounced?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
