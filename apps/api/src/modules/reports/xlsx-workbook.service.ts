import { Injectable } from '@nestjs/common';
import { deflateRawSync } from 'zlib';

export type XlsxCellStyle = 'default' | 'header' | 'title' | 'section' | 'date' | 'percent' | 'integer' | 'muted' | 'success' | 'warning' | 'danger' | 'teal';

export interface XlsxCell {
  value: string | number | boolean | Date | null;
  style?: XlsxCellStyle;
}

export interface XlsxColumn {
  width: number;
}

export interface XlsxPageSetup {
  /** Código de papel de OOXML. 9 = A4. */
  paperSize: number;
  orientation: 'portrait' | 'landscape';
  /** Ajusta el ancho a una página y deja el alto libre. */
  fitToWidth?: boolean;
}

export interface XlsxSheet {
  name: string;
  columns: XlsxColumn[];
  rows: XlsxCell[][];
  freezeRows?: number;
  autoFilter?: string;
  /** Configuración de impresión. Sin esto Excel usa el papel por defecto del sistema. */
  pageSetup?: XlsxPageSetup;
  /**
   * Filas a repetir en el encabezado de cada página impresa, en notación de
   * Excel (`"1:2"`). Es el equivalente al `<thead>` repetido del PDF.
   */
  printTitleRows?: string;
}

interface ZipEntry {
  name: string;
  data: Buffer;
}

interface PackedZipEntry extends ZipEntry {
  crc: number;
  compressed: Buffer;
  localOffset: number;
}

const styleIndexes: Record<XlsxCellStyle, number> = {
  default: 0,
  header: 1,
  title: 2,
  section: 3,
  date: 4,
  percent: 5,
  integer: 6,
  muted: 7,
  success: 8,
  warning: 9,
  danger: 10,
  teal: 11,
};

@Injectable()
export class XlsxWorkbookService {
  build(sheets: XlsxSheet[], metadata: { title: string; creator: string; createdAt: string }): Buffer {
    const entries: ZipEntry[] = [
      { name: '[Content_Types].xml', data: this.xmlBuffer(this.contentTypes(sheets.length)) },
      { name: '_rels/.rels', data: this.xmlBuffer(this.rootRelationships()) },
      { name: 'docProps/app.xml', data: this.xmlBuffer(this.appProperties(sheets)) },
      { name: 'docProps/core.xml', data: this.xmlBuffer(this.coreProperties(metadata)) },
      { name: 'xl/workbook.xml', data: this.xmlBuffer(this.workbook(sheets)) },
      { name: 'xl/_rels/workbook.xml.rels', data: this.xmlBuffer(this.workbookRelationships(sheets.length)) },
      { name: 'xl/styles.xml', data: this.xmlBuffer(this.styles()) },
      ...sheets.map((sheet, index) => ({
        name: `xl/worksheets/sheet${index + 1}.xml`,
        data: this.xmlBuffer(this.worksheet(sheet)),
      })),
    ];
    return this.createZip(entries);
  }

  cell(value: XlsxCell['value'], style: XlsxCellStyle = 'default'): XlsxCell {
    return { value, style };
  }

  private worksheet(sheet: XlsxSheet): string {
    const columns = sheet.columns
      .map((column, index) => `<col min="${index + 1}" max="${index + 1}" width="${column.width}" customWidth="1"/>`)
      .join('');
    const rows = sheet.rows
      .map((row, rowIndex) => this.worksheetRow(row, rowIndex + 1))
      .join('');
    const freezeRows = Math.max(0, sheet.freezeRows ?? 0);
    const pane = freezeRows > 0
      ? `<pane ySplit="${freezeRows}" topLeftCell="A${freezeRows + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${freezeRows + 1}" sqref="A${freezeRows + 1}"/>`
      : '<selection activeCell="A1" sqref="A1"/>';
    const autoFilter = sheet.autoFilter ? `<autoFilter ref="${this.escapeXml(sheet.autoFilter)}"/>` : '';
    const dimension = this.dimensionRef(sheet.rows);
    // `sheetPr` debe ir primero y `pageSetup` justo después de `pageMargins`:
    // el esquema CT_Worksheet valida por secuencia, no por presencia.
    const sheetPr = sheet.pageSetup?.fitToWidth ? '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' : '';
    const pageSetup = sheet.pageSetup
      ? `<pageSetup paperSize="${sheet.pageSetup.paperSize}" orientation="${sheet.pageSetup.orientation}"${sheet.pageSetup.fitToWidth ? ' fitToWidth="1" fitToHeight="0"' : ''}/>`
      : '';

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${sheetPr}
  <dimension ref="${dimension}"/>
  <sheetViews><sheetView tabSelected="1" workbookViewId="0">${pane}</sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${columns}</cols>
  <sheetData>${rows}</sheetData>
  ${autoFilter}
  <pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
  ${pageSetup}
</worksheet>`;
  }

  private worksheetRow(cells: XlsxCell[], rowNumber: number): string {
    const height = cells.some((cell) => cell.style === 'title') ? ' ht="24" customHeight="1"' : '';
    const xml = cells.map((cell, columnIndex) => this.worksheetCell(cell, rowNumber, columnIndex + 1)).join('');
    return `<row r="${rowNumber}"${height}>${xml}</row>`;
  }

  private worksheetCell(cell: XlsxCell, rowNumber: number, columnNumber: number): string {
    const reference = `${this.columnName(columnNumber)}${rowNumber}`;
    const style = styleIndexes[cell.style ?? 'default'];
    const styleAttribute = style > 0 ? ` s="${style}"` : '';

    if (cell.value === null) return `<c r="${reference}"${styleAttribute}/>`;
    if (cell.value instanceof Date) {
      return `<c r="${reference}"${styleAttribute}><v>${this.excelDateSerial(cell.value)}</v></c>`;
    }
    if (typeof cell.value === 'number') {
      return `<c r="${reference}"${styleAttribute}><v>${Number.isFinite(cell.value) ? cell.value : 0}</v></c>`;
    }
    if (typeof cell.value === 'boolean') {
      return `<c r="${reference}" t="b"${styleAttribute}><v>${cell.value ? 1 : 0}</v></c>`;
    }
    const text = this.escapeXml(cell.value);
    const preserve = /^\s|\s$|\n/.test(cell.value) ? ' xml:space="preserve"' : '';
    return `<c r="${reference}" t="inlineStr"${styleAttribute}><is><t${preserve}>${text}</t></is></c>`;
  }

  private workbook(sheets: XlsxSheet[]): string {
    const sheetXml = sheets
      .map((sheet, index) => `<sheet name="${this.escapeXml(this.safeSheetName(sheet.name))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
      .join('');
    // Los títulos de impresión NO son propiedad de la hoja en OOXML: son nombres
    // definidos a nivel libro, acotados con `localSheetId`.
    const printTitles = sheets
      .map((sheet, index) => (sheet.printTitleRows ? this.printTitlesDefinedName(sheet, index) : ''))
      .join('');
    const definedNames = printTitles ? `<definedNames>${printTitles}</definedNames>` : '';

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews>
  <sheets>${sheetXml}</sheets>
  ${definedNames}
  <calcPr calcId="191029" fullCalcOnLoad="1"/>
</workbook>`;
  }

  private workbookRelationships(sheetCount: number): string {
    const worksheets = Array.from({ length: sheetCount }, (_, index) => (
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
    )).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${worksheets}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  }

  private contentTypes(sheetCount: number): string {
    const worksheets = Array.from({ length: sheetCount }, (_, index) => (
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${worksheets}
</Types>`;
  }

  private rootRelationships(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
  }

  private coreProperties(metadata: { title: string; creator: string; createdAt: string }): string {
    const created = new Date(metadata.createdAt);
    const iso = Number.isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString();
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${this.escapeXml(metadata.title)}</dc:title>
  <dc:creator>${this.escapeXml(metadata.creator)}</dc:creator>
  <cp:lastModifiedBy>${this.escapeXml(metadata.creator)}</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified>
</cp:coreProperties>`;
  }

  private appProperties(sheets: XlsxSheet[]): string {
    const titles = sheets.map((sheet) => `<vt:lpstr>${this.escapeXml(this.safeSheetName(sheet.name))}</vt:lpstr>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>AurelIA</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>${sheets.length}</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="${sheets.length}" baseType="lpstr">${titles}</vt:vector></TitlesOfParts>
  <Company>Gold Fields</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>1.0</AppVersion>
</Properties>`;
  }

  private styles(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2"><numFmt numFmtId="164" formatCode="dd-mm-yyyy"/><numFmt numFmtId="165" formatCode="0%"/></numFmts>
  <fonts count="5">
    <font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Calibri"/></font>
    <font><b/><color rgb="FF001E39"/><sz val="16"/><name val="Calibri"/></font>
    <font><b/><color rgb="FF001E39"/><sz val="11"/><name val="Calibri"/></font>
    <font><color rgb="FF646464"/><sz val="10"/><name val="Calibri"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF001E39"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF7F7F7"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE0FFD3"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFEAB8"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFD0DB"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFC5FFF6"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD1D1D1"/></left><right style="thin"><color rgb="FFD1D1D1"/></right><top style="thin"><color rgb="FFD1D1D1"/></top><bottom style="thin"><color rgb="FFD1D1D1"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;
  }

  private createZip(entries: ZipEntry[]): Buffer {
    const packed: PackedZipEntry[] = [];
    const localParts: Buffer[] = [];
    let offset = 0;

    for (const entry of entries) {
      const name = Buffer.from(entry.name, 'utf8');
      const compressed = deflateRawSync(entry.data, { level: 6 });
      const crc = this.crc32(entry.data);
      const header = Buffer.alloc(30);
      header.writeUInt32LE(0x04034b50, 0);
      header.writeUInt16LE(20, 4);
      header.writeUInt16LE(0, 6);
      header.writeUInt16LE(8, 8);
      header.writeUInt16LE(0, 10);
      header.writeUInt16LE(0, 12);
      header.writeUInt32LE(crc, 14);
      header.writeUInt32LE(compressed.length, 18);
      header.writeUInt32LE(entry.data.length, 22);
      header.writeUInt16LE(name.length, 26);
      header.writeUInt16LE(0, 28);
      localParts.push(header, name, compressed);
      packed.push({ ...entry, crc, compressed, localOffset: offset });
      offset += header.length + name.length + compressed.length;
    }

    const centralParts: Buffer[] = [];
    let centralSize = 0;
    for (const entry of packed) {
      const name = Buffer.from(entry.name, 'utf8');
      const header = Buffer.alloc(46);
      header.writeUInt32LE(0x02014b50, 0);
      header.writeUInt16LE(20, 4);
      header.writeUInt16LE(20, 6);
      header.writeUInt16LE(0, 8);
      header.writeUInt16LE(8, 10);
      header.writeUInt16LE(0, 12);
      header.writeUInt16LE(0, 14);
      header.writeUInt32LE(entry.crc, 16);
      header.writeUInt32LE(entry.compressed.length, 20);
      header.writeUInt32LE(entry.data.length, 24);
      header.writeUInt16LE(name.length, 28);
      header.writeUInt16LE(0, 30);
      header.writeUInt16LE(0, 32);
      header.writeUInt16LE(0, 34);
      header.writeUInt16LE(0, 36);
      header.writeUInt32LE(0, 38);
      header.writeUInt32LE(entry.localOffset, 42);
      centralParts.push(header, name);
      centralSize += header.length + name.length;
    }

    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(packed.length, 8);
    end.writeUInt16LE(packed.length, 10);
    end.writeUInt32LE(centralSize, 12);
    end.writeUInt32LE(offset, 16);
    end.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, ...centralParts, end]);
  }

  private crc32(data: Buffer): number {
    let crc = 0xffffffff;
    for (const value of data) {
      crc ^= value;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  private excelDateSerial(value: Date): number {
    const utc = Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
    return (utc - Date.UTC(1899, 11, 30)) / 86400000;
  }

  private dimensionRef(rows: XlsxCell[][]): string {
    const rowCount = Math.max(1, rows.length);
    const columnCount = Math.max(1, ...rows.map((row) => row.length));
    return `A1:${this.columnName(columnCount)}${rowCount}`;
  }

  private columnName(index: number): string {
    let value = index;
    let name = '';
    while (value > 0) {
      const remainder = (value - 1) % 26;
      name = String.fromCharCode(65 + remainder) + name;
      value = Math.floor((value - 1) / 26);
    }
    return name;
  }

  /**
   * `<definedName name="_xlnm.Print_Titles" localSheetId="0">'Hoja'!$1:$2</definedName>`
   *
   * El nombre de hoja se duplica las comillas simples (escape de Excel) ANTES de
   * escapar el XML: al revés, `&apos;&apos;` quedaría como una sola comilla.
   */
  private printTitlesDefinedName(sheet: XlsxSheet, index: number): string {
    const rows = (sheet.printTitleRows ?? '').split(':');
    const first = rows[0] ?? '1';
    const last = rows[1] ?? first;
    const name = this.escapeXml(this.safeSheetName(sheet.name).replace(/'/g, "''"));
    return `<definedName name="_xlnm.Print_Titles" localSheetId="${index}">'${name}'!$${first}:$${last}</definedName>`;
  }

  private safeSheetName(value: string): string {
    return value.replace(/[\\/*?:[\]]/g, ' ').trim().slice(0, 31) || 'Hoja';
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private xmlBuffer(value: string): Buffer {
    return Buffer.from(value.trim(), 'utf8');
  }
}
