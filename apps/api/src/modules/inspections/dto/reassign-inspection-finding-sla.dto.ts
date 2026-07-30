import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import type { ReassignInspectionFindingSlaRequest } from '@aurelia/contracts';

export class ReassignInspectionFindingSlaDto implements ReassignInspectionFindingSlaRequest {
  @IsInt()
  @Min(1)
  @Max(365)
  slaBusinessDays: number;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}
