import { InspectionFindingSeverity, InspectionFindingStatus, UpdateInspectionFindingRequest } from '@aurelia/contracts';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateInspectionFindingDto implements UpdateInspectionFindingRequest {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  detectedCondition?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  proposedCorrectiveAction?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  executedActionDescription?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  rejectionReason?: string | null;

  @ApiPropertyOptional({ enum: InspectionFindingSeverity, enumName: 'InspectionFindingSeverity' })
  @IsOptional()
  @IsEnum(InspectionFindingSeverity)
  severity?: InspectionFindingSeverity;

  @ApiPropertyOptional({ enum: InspectionFindingStatus, enumName: 'InspectionFindingStatus' })
  @IsOptional()
  @IsEnum(InspectionFindingStatus)
  status?: InspectionFindingStatus;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  responsibleUserIds?: string[];

  @IsOptional()
  @IsISO8601()
  dueAt?: string | null;

  @IsOptional()
  @IsISO8601()
  executedAt?: string | null;

  @IsOptional()
  @IsISO8601()
  closedAt?: string | null;

  @IsOptional()
  @IsISO8601()
  rejectedAt?: string | null;

  @IsOptional()
  @IsString()
  reason?: string | null;
}
