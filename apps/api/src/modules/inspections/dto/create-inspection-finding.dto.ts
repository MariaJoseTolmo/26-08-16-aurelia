import { CreateInspectionFindingRequest, InspectionFindingSeverity } from '@aurelia/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateInspectionFindingDto implements CreateInspectionFindingRequest {
  @IsOptional()
  @IsUUID()
  checklistItemId?: string | null;

  @IsOptional()
  @IsUUID()
  findingTypeId?: string | null;

  @IsOptional()
  @IsUUID()
  severityId?: string | null;

  @IsOptional()
  @IsUUID()
  responsibleCompanyId?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  responsibleUserIds?: string[];

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

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

  @ApiProperty({ enum: InspectionFindingSeverity, enumName: 'InspectionFindingSeverity' })
  @IsEnum(InspectionFindingSeverity)
  severity: InspectionFindingSeverity;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string | null;

  @IsOptional()
  @IsISO8601()
  dueAt?: string | null;
}
