import { IsOptional, IsString } from 'class-validator';
import { LinkSprRecordEvidenceRequest } from '@aurelia/contracts';

export class LinkSprRecordEvidenceDto implements LinkSprRecordEvidenceRequest {
  @IsOptional()
  @IsString()
  relationType?: string;
}
