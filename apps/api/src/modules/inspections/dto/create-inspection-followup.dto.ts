import { CreateInspectionFollowupRequest, InspectionFollowupStatus } from '@aurelia/contracts';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateInspectionFollowupDto implements CreateInspectionFollowupRequest {
  @ApiPropertyOptional({ enum: InspectionFollowupStatus, enumName: 'InspectionFollowupStatus' })
  @IsOptional()
  @IsEnum(InspectionFollowupStatus)
  status?: InspectionFollowupStatus;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsUUID()
  performedByUserId?: string | null;

  @IsOptional()
  @IsISO8601()
  performedAt?: string | null;

  @IsOptional()
  @IsISO8601()
  nextDueAt?: string | null;
}
