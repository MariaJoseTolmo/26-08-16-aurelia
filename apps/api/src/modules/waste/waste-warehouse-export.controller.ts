import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { WarehouseControlExportDto } from './dto/warehouse-control-export.dto';
import { WasteWarehouseExportPdfService } from './waste-warehouse-export-pdf.service';
import { WasteWarehouseExportXlsxService } from './waste-warehouse-export-xlsx.service';
import { warehouseExportBaseFilename } from './waste-warehouse-export.theme';

/**
 * Exportación de la vista "Control de bodega" a PDF y Excel.
 *
 * POST y no GET porque el cliente ENVÍA el documento a renderizar: el cuerpo es
 * exactamente lo que el usuario ve en pantalla, filtros y formatos incluidos.
 * Eso es lo que garantiza que las tres representaciones —pantalla, PDF y
 * Excel— digan lo mismo, en vez de depender de que dos formateadores distintos
 * coincidan.
 *
 * PENDIENTE cuando la vista consuma la API: al pasar a datos reales conviene
 * agregar la variante GET con agregación en el servidor. Hoy el endpoint confía
 * en las cifras que le manda el cliente, así que un usuario con `waste:read`
 * puede generar un PDF con números que él mismo eligió. Para un reporte de uso
 * interno es aceptable; para uno que salga a un tercero (SIDREP/SINADER), no.
 */
/*
 * `waste:export` y no `waste:read`: la migración
 * `1785400000000-CreateWasteModuleFoundation` creó ese permiso con la
 * descripción "Permite exportar reportes del módulo de residuos", así que
 * existía para esto. Ver el listado de la vista sigue pidiendo `waste:read`.
 */
@RequirePermissions('waste:export')
@Controller('waste/warehouse-control')
export class WasteWarehouseExportController {
  constructor(
    private readonly pdf: WasteWarehouseExportPdfService,
    private readonly xlsx: WasteWarehouseExportXlsxService,
  ) {}

  // Nest responde 201 por defecto en POST; una descarga no crea un recurso.
  @Post('export/pdf')
  @HttpCode(HttpStatus.OK)
  async exportPdf(
    @Body() payload: WarehouseControlExportDto,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const generatedAt = new Date();
    const buffer = await this.pdf.render(payload, {
      generatedAt,
      author: request.user.email || 'AurelIA',
    });

    this.send(response, buffer, 'application/pdf', `${warehouseExportBaseFilename(generatedAt)}.pdf`);
  }

  @Post('export/xlsx')
  @HttpCode(HttpStatus.OK)
  exportXlsx(
    @Body() payload: WarehouseControlExportDto,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): void {
    const generatedAt = new Date();
    const buffer = this.xlsx.build(payload, {
      generatedAt,
      author: request.user.email || 'AurelIA',
    });

    this.send(
      response,
      buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `${warehouseExportBaseFilename(generatedAt)}.xlsx`,
    );
  }

  private send(response: Response, buffer: Buffer, contentType: string, filename: string): void {
    response.setHeader('Content-Type', contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.setHeader('Content-Length', String(buffer.length));
    response.send(buffer);
  }
}
