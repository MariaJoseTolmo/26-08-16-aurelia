import type { FileStorageProvider } from '../enums';
import type { ID, ISODateString } from '../types/common';

export interface FileRecord {
  id: ID;
  storageProvider: FileStorageProvider;
  containerName: string | null;
  blobPath: string | null;
  externalUrl: string | null;
  originalFilename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  checksumSha256: string | null;
  uploadedByUserId: ID | null;
  uploadedAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
