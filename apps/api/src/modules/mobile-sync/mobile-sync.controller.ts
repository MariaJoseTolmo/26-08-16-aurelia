import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import type { MobileSyncBatchRequest, MobileSyncBatchResponse } from '@aurelia/contracts';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { MobileSyncService } from './mobile-sync.service';

@RequirePermissions('mobile:sync')
@Controller('mobile/sync')
export class MobileSyncController {
  constructor(private readonly mobileSyncService: MobileSyncService) {}

  @Post()
  acceptBatch(@Body() body: MobileSyncBatchRequest): Promise<MobileSyncBatchResponse> {
    return this.mobileSyncService.acceptBatch(body);
  }

  @Get(':batchId')
  getBatch(@Param('batchId') batchId: string): MobileSyncBatchResponse {
    const batch = this.mobileSyncService.getBatch(batchId);
    if (!batch) throw new NotFoundException('Mobile sync batch not found');
    return batch;
  }

  @Get()
  status() {
    return this.mobileSyncService.getStatus();
  }
}
