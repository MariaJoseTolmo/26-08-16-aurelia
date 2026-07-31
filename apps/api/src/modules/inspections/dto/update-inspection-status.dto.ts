import { InspectionStatus, UpdateInspectionStatusRequest } from '@aurelia/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateInspectionStatusDto implements UpdateInspectionStatusRequest {
  @ApiProperty({ enum: InspectionStatus, enumName: 'InspectionStatus' })
  @IsEnum(InspectionStatus)
  status: InspectionStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
