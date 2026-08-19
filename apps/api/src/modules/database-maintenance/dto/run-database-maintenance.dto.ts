import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class RunDatabaseMaintenanceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seeds?: string[];

  @IsOptional()
  @IsBoolean()
  allowRisky?: boolean;

  @IsOptional()
  @IsBoolean()
  resetSchema?: boolean;

  @IsOptional()
  @IsString()
  resetConfirmation?: string;

  @IsOptional()
  @IsBoolean()
  runSeedsOnly?: boolean;
}
