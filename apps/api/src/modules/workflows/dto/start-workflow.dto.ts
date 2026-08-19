import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class StartWorkflowDto {
  @IsUUID()
  workflowDefinitionId: string;

  @IsString()
  @MaxLength(80)
  entityType: string;

  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsUUID()
  startedByUserId?: string;
}
