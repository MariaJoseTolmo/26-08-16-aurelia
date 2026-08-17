import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { DeclareSinaderPeriodDto } from './dto/declare-sinader-period.dto';
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

  /**
   * Cierra el período dejando constancia del folio y la fecha.
   *
   * `waste:close` y no el `waste:read` de la clase: la migración creó ese permiso
   * con la descripción "Permite cerrar folios SIDREP y períodos SINADER", que es
   * exactamente esto. El guard resuelve con `getAllAndOverride`, así que el método
   * gana sobre la clase.
   *
   * Devuelve el período ya declarado —con sus líneas— para que el cliente pinte el
   * estado nuevo con la respuesta y no tenga que volver a pedirlo.
   */
  @Post('sinader/periods/:id/declare')
  @RequirePermissions('waste:close')
  @HttpCode(HttpStatus.OK)
  declareSinaderPeriod(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DeclareSinaderPeriodDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.wasteService.declareSinaderPeriod(id, body, request.user.sub ?? null);
  }
}
