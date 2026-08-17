import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type {
  WasteFolioSupportExportDocument,
  WasteFolioSupportExportField,
  WasteFolioSupportExportRequest,
  WasteFolioSupportExportWeights,
} from '@aurelia/contracts';

/**
 * Mismos topes que las otras exportaciones del módulo y por el mismo motivo: el payload
 * lo arma el cliente, así que sin límites un request podría dejar el proceso Node
 * ocupado renderizando un documento de miles de filas.
 *
 * ACÁ SON MUCHO MÁS BAJOS que en los reportes de período, y no por prudencia genérica:
 * este documento describe UN traslado. Sus datos son los ocho pares del nodo `3084:11074`
 * y su paquete son los respaldos de una sola guía de despacho. Cuarenta ya es un traslado
 * con evidencia excepcional; trescientos serían un error de armado del payload, y el tope
 * es lo que lo convierte en un 400 en vez de un PDF de cien hojas.
 */
const MAX_FIELDS = 24;
const MAX_DOCUMENTS = 40;
const MAX_TEXT = 500;

export class WasteFolioSupportExportFieldDto implements WasteFolioSupportExportField {
  @IsString()
  @MaxLength(MAX_TEXT)
  label: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  value: string;
}

export class WasteFolioSupportExportDocumentDto implements WasteFolioSupportExportDocument {
  @IsString()
  @MaxLength(MAX_TEXT)
  label: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  filename: string;
}

export class WasteFolioSupportExportWeightsDto implements WasteFolioSupportExportWeights {
  @IsString()
  @MaxLength(MAX_TEXT)
  dispatched: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  received: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  difference: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  differenceLabel: string;
}

export class WasteFolioSupportExportDto implements WasteFolioSupportExportRequest {
  @IsString()
  @MaxLength(MAX_TEXT)
  folio: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  title: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  subtitle: string;

  @IsString()
  @MaxLength(MAX_TEXT)
  statusLabel: string;

  /*
   * `ArrayNotEmpty` en los datos del traslado y NO en el paquete: un respaldo sin ningún
   * dato del traslado no es un respaldo, mientras que un folio cuyo paquete todavía no
   * tiene adjuntos sí puede querer su PDF —el documento dibuja la sección vacía—.
   */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_FIELDS)
  @ValidateNested({ each: true })
  @Type(() => WasteFolioSupportExportFieldDto)
  fields: WasteFolioSupportExportFieldDto[];

  @ValidateNested()
  @Type(() => WasteFolioSupportExportWeightsDto)
  weights: WasteFolioSupportExportWeightsDto;

  @IsArray()
  @ArrayMaxSize(MAX_DOCUMENTS)
  @ValidateNested({ each: true })
  @Type(() => WasteFolioSupportExportDocumentDto)
  documents: WasteFolioSupportExportDocumentDto[];
}
