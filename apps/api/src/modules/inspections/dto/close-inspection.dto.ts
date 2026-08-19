import { IsOptional, IsString } from 'class-validator';

export class CloseInspectionDto {
  @IsOptional()
  @IsString()
  reason?: string | null;
}
