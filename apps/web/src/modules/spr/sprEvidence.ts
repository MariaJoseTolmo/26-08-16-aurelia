import type { SprParameterResponse } from '@aurelia/contracts';

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.xlsx', '.xls', '.doc', '.docx'];

export function parameterRequiresEvidence(parameter: Pick<SprParameterResponse, 'isSox' | 'requiresEvidence'>): boolean {
  return parameter.isSox || parameter.requiresEvidence;
}

export function inferSprAttachmentType(fileName: string): 'pdf' | 'excel' {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  return 'excel';
}

export function formatSprAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB`;
}

export function validateSprAttachmentFile(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
  if (!hasAllowedExtension) {
    return 'Solo se permiten archivos PDF, Excel o Word.';
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return 'El archivo supera el máximo de 10 MB.';
  }
  return null;
}

export function resolveSprEvidenceRelationType(parameter: Pick<SprParameterResponse, 'isSox'>): string {
  return parameter.isSox ? 'sox_support' : 'spr_record_evidence';
}
