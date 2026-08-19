import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { WorkflowDefinitionResponse, WorkflowInstanceResponse } from '@aurelia/contracts';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDefinitionDto } from './dto/create-workflow-definition.dto';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { AdvanceWorkflowStepDto } from './dto/advance-workflow-step.dto';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get('definitions')
  findDefinitions(): Promise<WorkflowDefinitionResponse[]> {
    return this.workflowsService.findDefinitions();
  }

  @Post('definitions')
  createDefinition(@Body() dto: CreateWorkflowDefinitionDto): Promise<WorkflowDefinitionResponse> {
    return this.workflowsService.createDefinition(dto);
  }

  @Post('start')
  start(@Body() dto: StartWorkflowDto): Promise<WorkflowInstanceResponse> {
    return this.workflowsService.start(dto);
  }

  @Post(':id/advance')
  advance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdvanceWorkflowStepDto,
  ): Promise<WorkflowInstanceResponse> {
    return this.workflowsService.advance(id, dto);
  }

  @Get()
  findInstances(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('status') status?: string,
  ): Promise<WorkflowInstanceResponse[]> {
    return this.workflowsService.findInstances(entityType, entityId, status);
  }
}
