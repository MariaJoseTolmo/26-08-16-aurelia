import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { WasteService } from './waste.service';

@RequirePermissions('waste:read')
@Controller('waste')
export class WasteController {
  constructor(private readonly wasteService: WasteService) {}

  @Get('units')
  findUnits() {
    return this.wasteService.findUnits();
  }

  @Get('categories')
  findCategories() {
    return this.wasteService.findCategories();
  }

  @Get('types')
  findTypes(@Query() query: Record<string, string | undefined>) {
    return this.wasteService.findTypes(query);
  }

  @Get('warehouses')
  findWarehouses(@Query() query: Record<string, string | undefined>) {
    return this.wasteService.findWarehouses(query);
  }

  @Get('receipts')
  findReceipts(@Query() query: Record<string, string | undefined>) {
    return this.wasteService.findReceipts(query);
  }

  @Get('lots')
  findLots(@Query() query: Record<string, string | undefined>) {
    return this.wasteService.findLots(query);
  }

  @Get('lots/:id')
  findLot(@Param('id', ParseUUIDPipe) id: string) {
    return this.wasteService.findLot(id);
  }

  @Get('lots/:id/movements')
  findLotMovements(@Param('id', ParseUUIDPipe) id: string) {
    return this.wasteService.findLotMovements(id);
  }

  @Get('withdrawal-requests')
  findWithdrawalRequests(@Query() query: Record<string, string | undefined>) {
    return this.wasteService.findWithdrawalRequests(query);
  }

  @Get('withdrawal-requests/:id')
  findWithdrawalRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.wasteService.findWithdrawalRequest(id);
  }

  @Get('sidrep')
  findSidrepRecords(@Query() query: Record<string, string | undefined>) {
    return this.wasteService.findSidrepRecords(query);
  }

  @Get('sinader/periods')
  findSinaderPeriods(@Query() query: Record<string, string | undefined>) {
    return this.wasteService.findSinaderPeriods(query);
  }

  @Get('sinader/periods/:id')
  findSinaderPeriod(@Param('id', ParseUUIDPipe) id: string) {
    return this.wasteService.findSinaderPeriod(id);
  }
}
