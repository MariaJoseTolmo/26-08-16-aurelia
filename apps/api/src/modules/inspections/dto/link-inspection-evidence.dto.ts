import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LinkInspectionEvidenceDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  relationType?: string;
}
