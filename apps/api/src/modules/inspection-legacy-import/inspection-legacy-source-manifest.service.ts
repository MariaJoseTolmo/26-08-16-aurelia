import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import sourceManifest from './config/source-manifest.json';

export interface InspectionLegacySourceVerification {
  valid: boolean;
  expected: {
    fileName: string;
    sha256: string;
    fileSizeBytes: number;
    sheet: string;
    expectedRows: number;
  };
  actual: {
    filePath: string;
    fileName: string;
    sha256: string;
    fileSizeBytes: number;
  };
  errors: string[];
}

@Injectable()
export class InspectionLegacySourceManifestService {
  get manifest(): typeof sourceManifest {
    return sourceManifest;
  }

  async verify(filePath: string): Promise<InspectionLegacySourceVerification> {
    const [contents, metadata] = await Promise.all([
      readFile(filePath),
      stat(filePath),
    ]);
    const sha256 = createHash('sha256').update(contents).digest('hex');
    const fileName = this.fileName(filePath);
    const errors: string[] = [];

    if (fileName !== sourceManifest.fileName) {
      errors.push(`Nombre inesperado: ${fileName}`);
    }
    if (metadata.size !== sourceManifest.fileSizeBytes) {
      errors.push(`Tamaño inesperado: ${metadata.size} bytes`);
    }
    if (sha256 !== sourceManifest.sha256) {
      errors.push(`SHA-256 inesperado: ${sha256}`);
    }

    return {
      valid: errors.length === 0,
      expected: {
        fileName: sourceManifest.fileName,
        sha256: sourceManifest.sha256,
        fileSizeBytes: sourceManifest.fileSizeBytes,
        sheet: sourceManifest.sheet,
        expectedRows: sourceManifest.expectedRows,
      },
      actual: {
        filePath,
        fileName,
        sha256,
        fileSizeBytes: metadata.size,
      },
      errors,
    };
  }

  async assertValid(filePath: string): Promise<InspectionLegacySourceVerification> {
    const verification = await this.verify(filePath);
    if (!verification.valid) {
      throw new Error(`La fuente histórica no coincide con el manifest aprobado: ${verification.errors.join('; ')}`);
    }
    return verification;
  }

  private fileName(filePath: string): string {
    return filePath.replace(/\\/g, '/').split('/').at(-1) ?? filePath;
  }
}
