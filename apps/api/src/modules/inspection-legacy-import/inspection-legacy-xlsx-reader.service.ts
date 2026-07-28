import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import { LegacyInspectionRawRow } from './inspection-legacy-import.types';
import { InspectionLegacySourceManifestService } from './inspection-legacy-source-manifest.service';

interface ZipDirectoryEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

export interface InspectionLegacyWorkbookReadResult {
  sheet: string;
  headerRow: number;
  firstDataRow: number;
  lastDataRow: number;
  headers: string[];
  rows: LegacyInspectionRawRow[];
}

@Injectable()
export class InspectionLegacyXlsxReaderService {
  constructor(private readonly sourceManifest: InspectionLegacySourceManifestService) {}

  async read(filePath: string): Promise<InspectionLegacyWorkbookReadResult> {
    await this.sourceManifest.assertValid(filePath);
    const archive = await readFile(filePath);
    const entries = this.readZipEntries(archive);
    const workbookXml = this.requiredEntry(entries, 'xl/workbook.xml').toString('utf8');
    const relationshipsXml = this.requiredEntry(entries, 'xl/_rels/workbook.xml.rels').toString('utf8');
    const sheetPath = this.resolveSheetPath(
      workbookXml,
      relationshipsXml,
      this.sourceManifest.manifest.sheet,
    );
    const worksheetXml = this.requiredEntry(entries, sheetPath).toString('utf8');
    const sharedStrings = entries.has('xl/sharedStrings.xml')
      ? this.parseSharedStrings(this.requiredEntry(entries, 'xl/sharedStrings.xml').toString('utf8'))
      : [];

    const rowsByNumber = this.parseWorksheetRows(worksheetXml, sharedStrings);
    const manifest = this.sourceManifest.manifest;
    const headerCells = rowsByNumber.get(manifest.headerRow);
    if (!headerCells) {
      throw new Error(`No existe la fila de cabeceras ${manifest.headerRow} en ${manifest.sheet}`);
    }

    const headerByColumn = new Map<number, string>();
    headerCells.forEach((value, columnIndex) => {
      const header = this.text(value);
      if (header) headerByColumn.set(columnIndex, header);
    });
    const headers = [...headerByColumn.values()];
    this.assertRequiredHeaders(headers);

    const rows: LegacyInspectionRawRow[] = [];
    for (let rowNumber = manifest.firstDataRow; rowNumber <= manifest.lastDataRow; rowNumber += 1) {
      const cells = rowsByNumber.get(rowNumber) ?? new Map<number, unknown>();
      const row: LegacyInspectionRawRow = {};
      headerByColumn.forEach((header, columnIndex) => {
        row[header] = cells.get(columnIndex) ?? null;
      });
      rows.push(row);
    }

    if (rows.length !== manifest.expectedRows) {
      throw new Error(`La hoja produjo ${rows.length} filas; se esperaban ${manifest.expectedRows}`);
    }

    return {
      sheet: manifest.sheet,
      headerRow: manifest.headerRow,
      firstDataRow: manifest.firstDataRow,
      lastDataRow: manifest.lastDataRow,
      headers,
      rows,
    };
  }

  private readZipEntries(archive: Buffer): Map<string, Buffer> {
    const endOfCentralDirectory = this.findSignatureFromEnd(archive, 0x06054b50);
    if (endOfCentralDirectory < 0) {
      throw new Error('El archivo no contiene un directorio ZIP válido');
    }

    const totalEntries = archive.readUInt16LE(endOfCentralDirectory + 10);
    const centralDirectoryOffset = archive.readUInt32LE(endOfCentralDirectory + 16);
    const directoryEntries: ZipDirectoryEntry[] = [];
    let cursor = centralDirectoryOffset;

    for (let index = 0; index < totalEntries; index += 1) {
      if (archive.readUInt32LE(cursor) !== 0x02014b50) {
        throw new Error(`Entrada ZIP inválida en posición ${cursor}`);
      }
      const nameLength = archive.readUInt16LE(cursor + 28);
      const extraLength = archive.readUInt16LE(cursor + 30);
      const commentLength = archive.readUInt16LE(cursor + 32);
      const name = archive.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
      directoryEntries.push({
        name,
        compressionMethod: archive.readUInt16LE(cursor + 10),
        compressedSize: archive.readUInt32LE(cursor + 20),
        localHeaderOffset: archive.readUInt32LE(cursor + 42),
      });
      cursor += 46 + nameLength + extraLength + commentLength;
    }

    const entries = new Map<string, Buffer>();
    directoryEntries.forEach((entry) => {
      const localOffset = entry.localHeaderOffset;
      if (archive.readUInt32LE(localOffset) !== 0x04034b50) {
        throw new Error(`Cabecera ZIP local inválida para ${entry.name}`);
      }
      const nameLength = archive.readUInt16LE(localOffset + 26);
      const extraLength = archive.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + nameLength + extraLength;
      const compressed = archive.subarray(dataOffset, dataOffset + entry.compressedSize);
      if (entry.compressionMethod === 0) {
        entries.set(entry.name, Buffer.from(compressed));
        return;
      }
      if (entry.compressionMethod === 8) {
        entries.set(entry.name, inflateRawSync(compressed));
        return;
      }
      throw new Error(`Método de compresión ZIP no soportado (${entry.compressionMethod}) en ${entry.name}`);
    });

    return entries;
  }

  private resolveSheetPath(workbookXml: string, relationshipsXml: string, sheetName: string): string {
    const sheetPattern = /<sheet\b([^>]*)\/?\s*>/g;
    let relationshipId: string | null = null;
    for (const match of workbookXml.matchAll(sheetPattern)) {
      const attributes = match[1] ?? '';
      const name = this.attribute(attributes, 'name');
      if (this.decodeXml(name ?? '') !== sheetName) continue;
      relationshipId = this.attribute(attributes, 'r:id');
      break;
    }
    if (!relationshipId) {
      throw new Error(`No existe la hoja ${sheetName} en xl/workbook.xml`);
    }

    const relationshipPattern = /<Relationship\b([^>]*)\/?\s*>/g;
    for (const match of relationshipsXml.matchAll(relationshipPattern)) {
      const attributes = match[1] ?? '';
      if (this.attribute(attributes, 'Id') !== relationshipId) continue;
      const target = this.attribute(attributes, 'Target');
      if (!target) break;
      const normalized = target.replace(/^\//, '');
      return normalized.startsWith('xl/') ? normalized : `xl/${normalized}`;
    }

    throw new Error(`No se pudo resolver la relación ${relationshipId} de la hoja ${sheetName}`);
  }

  private parseSharedStrings(xml: string): string[] {
    const values: string[] = [];
    for (const match of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
      const body = match[1] ?? '';
      const fragments = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
        .map((fragment) => this.decodeXml(fragment[1] ?? ''));
      values.push(fragments.join(''));
    }
    return values;
  }

  private parseWorksheetRows(
    xml: string,
    sharedStrings: string[],
  ): Map<number, Map<number, unknown>> {
    const rows = new Map<number, Map<number, unknown>>();
    for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const rowAttributes = rowMatch[1] ?? '';
      const rowNumber = Number(this.attribute(rowAttributes, 'r'));
      if (!Number.isInteger(rowNumber) || rowNumber <= 0) continue;
      const cells = new Map<number, unknown>();
      const body = rowMatch[2] ?? '';
      for (const cellMatch of body.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attributes = cellMatch[1] ?? '';
        const reference = this.attribute(attributes, 'r');
        if (!reference) continue;
        const columnIndex = this.columnIndex(reference);
        const type = this.attribute(attributes, 't');
        const cellBody = cellMatch[2] ?? '';
        const value = this.parseCellValue(cellBody, type, sharedStrings);
        cells.set(columnIndex, value);
      }
      rows.set(rowNumber, cells);
    }
    return rows;
  }

  private parseCellValue(body: string, type: string | null, sharedStrings: string[]): unknown {
    if (type === 'inlineStr') {
      const values = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
        .map((match) => this.decodeXml(match[1] ?? ''));
      return values.join('');
    }

    const raw = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1];
    if (raw === undefined) return null;
    const decoded = this.decodeXml(raw);
    if (type === 's') {
      const index = Number(decoded);
      return Number.isInteger(index) ? sharedStrings.at(index) ?? null : null;
    }
    if (type === 'b') return decoded === '1';
    if (type === 'str' || type === 'e') return decoded;
    const numeric = Number(decoded);
    return Number.isFinite(numeric) ? numeric : decoded;
  }

  private assertRequiredHeaders(headers: string[]): void {
    const normalized = new Set(headers.map((header) => this.normalizeHeader(header)));
    const missing = this.sourceManifest.manifest.requiredHeaders.filter(
      (header) => !normalized.has(this.normalizeHeader(header)),
    );
    if (missing.length > 0) {
      throw new Error(`Faltan cabeceras requeridas en CONSOLIDADO: ${missing.join(', ')}`);
    }
  }

  private requiredEntry(entries: Map<string, Buffer>, name: string): Buffer {
    const entry = entries.get(name);
    if (!entry) throw new Error(`Falta la entrada XLSX requerida: ${name}`);
    return entry;
  }

  private findSignatureFromEnd(buffer: Buffer, signature: number): number {
    const minimum = Math.max(0, buffer.length - 65_557);
    for (let cursor = buffer.length - 22; cursor >= minimum; cursor -= 1) {
      if (buffer.readUInt32LE(cursor) === signature) return cursor;
    }
    return -1;
  }

  private attribute(attributes: string, name: string): string | null {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return attributes.match(new RegExp(`(?:^|\\s)${escapedName}="([^"]*)"`))?.[1] ?? null;
  }

  private columnIndex(reference: string): number {
    const letters = reference.match(/^[A-Z]+/i)?.[0]?.toUpperCase();
    if (!letters) throw new Error(`Referencia de celda inválida: ${reference}`);
    let value = 0;
    for (const letter of letters) value = value * 26 + letter.charCodeAt(0) - 64;
    return value - 1;
  }

  private decodeXml(value: string): string {
    return value
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
      .replace(/&#([0-9]+);/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

  private normalizeHeader(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase('es');
  }

  private text(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text || null;
  }
}
