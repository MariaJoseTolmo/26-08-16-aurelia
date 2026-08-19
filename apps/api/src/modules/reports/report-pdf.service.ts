import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';

export type ReportPdfDocument = PDFKit.PDFDocument;

export interface ReportPdfOptions {
  title?: string;
  author?: string;
  subject?: string;
}

type ReportFontRole = 'regular' | 'bold' | 'italic' | 'boldItalic';

type ReportFontDefinition = {
  alias: string;
  coreFont: string;
  candidates: string[];
};

const PERIODIC_INSPECTION_REPORT_SUBJECT = 'Informe periódico de inspecciones ambientales';

@Injectable()
export class ReportPdfService {
  async render(
    build: (document: ReportPdfDocument) => Promise<void> | void,
    options: ReportPdfOptions = {},
  ): Promise<Buffer> {
    const document = new PDFDocument({
      autoFirstPage: false,
      bufferPages: true,
      compress: true,
      info: {
        Title: options.title ?? 'Aurelia Report',
        Author: options.author ?? 'Aurelia',
        Subject: options.subject ?? 'Aurelia reporting',
        Creator: 'Aurelia',
        Producer: 'Aurelia',
      },
    });
    this.configureReportFonts(document);
    this.configureDrawingDefaults(document, options);

    const chunks: Buffer[] = [];
    const completed = new Promise<Buffer>((resolve, reject) => {
      document.on('data', (chunk: Buffer | Uint8Array) => chunks.push(Buffer.from(chunk)));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
    });

    try {
      await build(document);
      document.end();
    } catch (error) {
      document.end();
      throw error;
    }

    return completed;
  }

  private configureDrawingDefaults(document: ReportPdfDocument, options: ReportPdfOptions): void {
    if (options.subject !== PERIODIC_INSPECTION_REPORT_SUBJECT) return;

    const originalFillAndStroke = document.fillAndStroke.bind(document);
    const normalizedFillAndStroke = ((...args: unknown[]) => {
      document.lineWidth(0.75);
      return Reflect.apply(originalFillAndStroke, document, args) as ReportPdfDocument;
    }) as ReportPdfDocument['fillAndStroke'];

    (document as unknown as { fillAndStroke: ReportPdfDocument['fillAndStroke'] }).fillAndStroke = normalizedFillAndStroke;
  }

  private configureReportFonts(document: ReportPdfDocument): void {
    const replacements: Record<string, string> = {};

    for (const definition of this.reportFontDefinitions()) {
      const fontPath = definition.candidates.find((candidate) => candidate && existsSync(candidate));
      if (!fontPath) continue;
      try {
        document.registerFont(definition.alias, fontPath);
        replacements[definition.coreFont] = definition.alias;
      } catch {
        // PDFKit keeps its core Helvetica variant when an optional Inter file cannot be loaded.
      }
    }

    if (Object.keys(replacements).length === 0) return;

    const originalFont = document.font.bind(document);
    const mappedFont = ((source: unknown, ...args: unknown[]) => {
      const mappedSource = typeof source === 'string' ? replacements[source] ?? source : source;
      return Reflect.apply(originalFont, document, [mappedSource, ...args]) as ReportPdfDocument;
    }) as ReportPdfDocument['font'];

    (document as unknown as { font: ReportPdfDocument['font'] }).font = mappedFont;
  }

  private reportFontDefinitions(): ReportFontDefinition[] {
    const windowsFonts = process.env.WINDIR ? join(process.env.WINDIR, 'Fonts') : '';
    const environment: Record<ReportFontRole, string> = {
      regular: process.env.AURELIA_PDF_FONT_REGULAR ?? '',
      bold: process.env.AURELIA_PDF_FONT_BOLD ?? '',
      italic: process.env.AURELIA_PDF_FONT_ITALIC ?? '',
      boldItalic: process.env.AURELIA_PDF_FONT_BOLD_ITALIC ?? '',
    };
    const candidates: Record<ReportFontRole, string[]> = {
      regular: [
        environment.regular,
        windowsFonts ? join(windowsFonts, 'Inter-Regular.ttf') : '',
        '/usr/share/fonts/truetype/inter/Inter-Regular.ttf',
        '/usr/share/fonts/opentype/inter/Inter-Regular.otf',
        '/Library/Fonts/Inter-Regular.ttf',
        '/Library/Fonts/Inter Regular.ttf',
      ],
      bold: [
        environment.bold,
        windowsFonts ? join(windowsFonts, 'Inter-Bold.ttf') : '',
        '/usr/share/fonts/truetype/inter/Inter-Bold.ttf',
        '/usr/share/fonts/opentype/inter/Inter-Bold.otf',
        '/Library/Fonts/Inter-Bold.ttf',
        '/Library/Fonts/Inter Bold.ttf',
      ],
      italic: [
        environment.italic,
        windowsFonts ? join(windowsFonts, 'Inter-Italic.ttf') : '',
        '/usr/share/fonts/truetype/inter/Inter-Italic.ttf',
        '/usr/share/opentype/inter/Inter-Italic.otf',
        '/Library/Fonts/Inter-Italic.ttf',
        '/Library/Fonts/Inter Italic.ttf',
      ],
      boldItalic: [
        environment.boldItalic,
        windowsFonts ? join(windowsFonts, 'Inter-BoldItalic.ttf') : '',
        '/usr/share/fonts/truetype/inter/Inter-BoldItalic.ttf',
        '/usr/share/opentype/inter/Inter-BoldItalic.otf',
        '/Library/Fonts/Inter-BoldItalic.ttf',
        '/Library/Fonts/Inter Bold Italic.ttf',
      ],
    };

    return [
      { alias: 'Aurelia-Inter-Regular', coreFont: 'Helvetica', candidates: candidates.regular },
      { alias: 'Aurelia-Inter-Bold', coreFont: 'Helvetica-Bold', candidates: candidates.bold },
      { alias: 'Aurelia-Inter-Italic', coreFont: 'Helvetica-Oblique', candidates: candidates.italic },
      { alias: 'Aurelia-Inter-BoldItalic', coreFont: 'Helvetica-BoldOblique', candidates: candidates.boldItalic },
    ];
  }
}
