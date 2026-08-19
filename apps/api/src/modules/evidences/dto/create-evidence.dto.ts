import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEvidenceDto {
  @IsOptional()
  @IsUUID()
  fileId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  evidenceType?: string;

  @IsOptional()
  @IsString()
  capturedAt?: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}
