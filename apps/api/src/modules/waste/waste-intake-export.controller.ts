import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { WarehouseIntakeExportDto } from './dto/warehouse-intake-export.dto';
import { WasteIntakeExportXlsxService } from './waste-intake-export-xlsx.service';
import { wasteIntakeExportBaseFilename } from './waste-warehouse-export.theme';

/**
 * Exportación de la vista "Ingresos a bodega" a Excel.
 *
 * Mismo trato que `WasteWarehouseExportController`, del que copia el patrón:
 * POST porque el cliente ENVÍA el documento a renderizar —las filas ya filtradas
 * y las pastillas de filtro—, `waste:export` como permiso y 200 en vez del 201
 * que Nest pone por defecto en POST, porque una descarga no crea un recurso.
 *
 * Controller aparte y no un método más en el de "Control de bodega" porque el
 * prefijo de ruta es distinto (`waste/warehouse-intake`).
 *
 * PENDIENTE, igual que en el otro: cuando la vista consuma la API conviene una
 * variante GET que filtre en el servidor. Hoy el endpoint confía en las filas
 * que le manda el cliente, así que un usuario con permiso puede exportar cifras
 * que él mismo eligió. Para uso interno alcanza; para un tercero, no.
 */
@RequirePermissions('waste:export')
@Controller('waste/warehouse-intake')
export class WasteIntakeExportController {
  constructor(private readonly xlsx: WasteIntakeExportXlsxService) {}

  @Post('export/xlsx')
  @HttpCode(HttpStatus.OK)
  exportXlsx(
    @Body() payload: WarehouseIntakeExportDto,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): void {
    const generatedAt = new Date();
    const buffer = this.xlsx.build(payload, {
      generatedAt,
      author: request.user.email || 'AurelIA',
    });

    const filename = `${wasteIntakeExportBaseFilename(generatedAt)}.xlsx`;

    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.setHeader('Content-Length', String(buffer.length));
    response.send(buffer);
  }
}
