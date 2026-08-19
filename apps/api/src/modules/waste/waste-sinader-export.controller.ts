import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { WasteSinaderExportDto } from './dto/waste-sinader-export.dto';
import { WasteSinaderExportPdfService } from './waste-sinader-export-pdf.service';
import { WasteSinaderExportXlsxService } from './waste-sinader-export-xlsx.service';
import { wasteSinaderExportBaseFilename } from './waste-warehouse-export.theme';

/**
 * Exportación de la vista "Reporte SINADER" a PDF y Excel (nodos `3830:65724` y
 * `4304:31205`).
 *
 * POST y no GET por lo mismo que en "Control de bodega": el cliente ENVÍA el
 * documento a renderizar, así que el archivo dice exactamente lo que el aprobador
 * vio en pantalla en vez de depender de que dos formateadores coincidan.
 *
 * PENDIENTE, Y ACÁ PESA MÁS QUE EN LAS OTRAS DOS EXPORTACIONES: el endpoint
 * confía en las cifras que le manda el cliente, así que un usuario con
 * `waste:export` puede generar un PDF con los números que él mismo eligió. Para
 * "Control de bodega", que es un reporte de uso interno, es aceptable. Este
 * consolidado es el insumo de una declaración a la autoridad, así que ANTES de que
 * el archivo salga de la empresa hay que agregar la variante que lo arme desde
 * `waste_sinader_periods` en el servidor —los datos ya están en la tabla— y dejar
 * ésta sólo para la vista previa.
 *
 * `waste:export` y no `waste:read`, igual que `WasteWarehouseExportController`: la
 * migración `1785400000000-CreateWasteModuleFoundation` creó ese permiso con la
 * descripción "Permite exportar reportes del módulo de residuos".
 */
@RequirePermissions('waste:export')
@Controller('waste/sinader')
export class WasteSinaderExportController {
  constructor(
    private readonly pdf: WasteSinaderExportPdfService,
    private readonly xlsx: WasteSinaderExportXlsxService,
  ) {}

  // Nest responde 201 por defecto en POST; una descarga no crea un recurso.
  @Post('export/pdf')
  @HttpCode(HttpStatus.OK)
  async exportPdf(
    @Body() payload: WasteSinaderExportDto,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const generatedAt = new Date();
    const buffer = await this.pdf.render(payload, {
      generatedAt,
      author: request.user.email || 'AurelIA',
    });

    this.send(response, buffer, 'application/pdf', `${wasteSinaderExportBaseFilename(generatedAt)}.pdf`);
  }

  @Post('export/xlsx')
  @HttpCode(HttpStatus.OK)
  exportXlsx(
    @Body() payload: WasteSinaderExportDto,
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
      `${wasteSinaderExportBaseFilename(generatedAt)}.xlsx`,
    );
  }

  private send(response: Response, buffer: Buffer, contentType: string, filename: string): void {
    response.setHeader('Content-Type', contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.setHeader('Content-Length', String(buffer.length));
    response.end(buffer);
  }
}
