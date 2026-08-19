import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class LinkEvidenceDto {
  @IsString()
  @MaxLength(80)
  entityType: string;

  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  relationType?: string;
}
