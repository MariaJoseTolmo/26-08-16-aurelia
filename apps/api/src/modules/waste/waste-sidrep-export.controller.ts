import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { WasteFolioSupportExportDto } from './dto/waste-folio-support-export.dto';
import { WasteFolioSupportExportPdfService } from './waste-folio-support-export-pdf.service';
import { wasteFolioSupportExportBaseFilename } from './waste-warehouse-export.theme';

/**
 * Exportación del "Respaldo de Traslado de Residuo Peligroso" — nodo `3084:11044`, que
 * se pide desde el botón "Descargar PDF" del modal `3085:13254`.
 *
 * POST y no GET por lo mismo que en las otras tres exportaciones del módulo: el cliente
 * ENVÍA el documento a renderizar, así que el archivo dice exactamente lo que el
 * aprobador vio en pantalla en vez de depender de que dos formateadores coincidan.
 *
 * PENDIENTE, Y ACÁ PESA COMO EN EL CONSOLIDADO SINADER: el endpoint confía en los datos
 * que le manda el cliente, así que alguien con `waste:export` puede generar un respaldo
 * con los pesos y las fechas que él mismo eligió. Este documento se lleva a una
 * fiscalización ambiental, así que ANTES de que salga de la empresa hay que agregar la
 * variante que lo arme desde `waste_sidrep_records` en el servidor —la entidad ya
 * existe— y dejar ésta sólo para la vista previa. Ver la misma nota en
 * `WasteSinaderExportController`.
 *
 * `waste:export`, igual que las otras exportaciones: la migración
 * `1785400000000-CreateWasteModuleFoundation` creó ese permiso con la descripción
 * "Permite exportar reportes del módulo de residuos".
 */
@RequirePermissions('waste:export')
@Controller('waste/sidrep')
export class WasteSidrepExportController {
  constructor(private readonly pdf: WasteFolioSupportExportPdfService) {}

  // Nest responde 201 por defecto en POST; una descarga no crea un recurso.
  @Post('folios/export/pdf')
  @HttpCode(HttpStatus.OK)
  async exportSupportPdf(
    @Body() payload: WasteFolioSupportExportDto,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): Promise<void> {
    const buffer = await this.pdf.render(payload, {
      generatedAt: new Date(),
      /*
       * El autor va al membrete del documento ("Por: …"), no sólo a los metadatos del
       * PDF: el nodo `3084:11058` lo dibuja, y en un respaldo de fiscalización identifica
       * quién lo generó.
       */
      author: request.user.email || 'AurelIA',
    });

    const filename = `${wasteFolioSupportExportBaseFilename(payload.folio)}.pdf`;
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.setHeader('Content-Length', String(buffer.length));
    response.end(buffer);
  }
}
