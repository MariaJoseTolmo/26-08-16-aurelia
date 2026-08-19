import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ControlAreaAssignmentResponse,
  ControlVerificationItemResponse,
  CriticalControlResponse,
  MueDetailResponse,
  MueResponse,
} from '@aurelia/contracts';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { MueService } from './mue.service';

@RequirePermissions('critical-controls:read')
@Controller('mue')
export class MueController {
  constructor(private readonly mueService: MueService) {}

  @Get()
  findMues(): Promise<MueResponse[]> {
    return this.mueService.findMues();
  }

  @Get(':id')
  findMue(@Param('id', ParseUUIDPipe) id: string): Promise<MueDetailResponse> {
    return this.mueService.findMue(id);
  }

  @Get(':id/controls')
  findControls(@Param('id', ParseUUIDPipe) id: string): Promise<CriticalControlResponse[]> {
    return this.mueService.findControls(id);
  }

  @Get(':id/assignments')
  findAssignments(@Param('id', ParseUUIDPipe) id: string): Promise<ControlAreaAssignmentResponse[]> {
    return this.mueService.findAssignments(id);
  }
}

@RequirePermissions('critical-controls:read')
@Controller('critical-controls/catalog')
export class CriticalControlsCatalogController {
  constructor(private readonly mueService: MueService) {}

  @Get('controls')
  findControls(@Query('mueId') mueId?: string): Promise<CriticalControlResponse[]> {
    return this.mueService.findControls(mueId);
  }

  @Get('verification-items')
  findVerificationItems(@Query('criticalControlId') criticalControlId?: string): Promise<ControlVerificationItemResponse[]> {
    return this.mueService.findVerificationItems(criticalControlId);
  }

  @Get('assignments')
  findAssignments(@Query('mueId') mueId?: string): Promise<ControlAreaAssignmentResponse[]> {
    return this.mueService.findAssignments(mueId);
  }
}
