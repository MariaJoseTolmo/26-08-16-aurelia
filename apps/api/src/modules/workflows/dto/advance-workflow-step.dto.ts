import { WorkflowStepAction } from '@aurelia/contracts';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdvanceWorkflowStepDto {
  @IsUUID()
  stepId: string;

  @IsEnum(WorkflowStepAction)
  action: WorkflowStepAction;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  completedByUserId?: string;
}
