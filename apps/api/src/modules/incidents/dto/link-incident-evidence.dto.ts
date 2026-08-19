import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LinkIncidentEvidenceDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  relationType?: string;
}
