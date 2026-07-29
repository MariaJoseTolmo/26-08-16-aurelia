import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FileResponse, FileStorageProvider } from '@aurelia/contracts';
import { BlobServiceClient } from '@azure/storage-blob';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { access, readFile } from 'fs/promises';
import { FileEntity } from './entities/file.entity';

export interface FileContentResponse {
  path: string;
  filename: string;
  mimeType: string | null;
}

export interface FileStorageHealthResponse {
  status: 'ok';
  provider: FileStorageProvider.AZURE_BLOB;
  accountName: string;
  containerName: string;
  probeBlobPath: string;
  checkedAt: string;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(FileEntity)
    private readonly files: Repository<FileEntity>,
  ) {}

  async saveUpload(
    file: Express.Multer.File,
    uploadedByUserId?: string,
  ): Promise<FileResponse> {
    const checksum = await this.calculateChecksum(file);

    const entity = this.files.create({
      storageProvider: FileStorageProvider.LOCAL,
      blobPath: file.path ?? null,
      originalFilename: file.originalname,
      mimeType: file.mimetype ?? null,
      sizeBytes: file.size ?? null,
      checksumSha256: checksum,
      uploadedByUserId: uploadedByUserId ?? null,
    });

    return this.toResponse(await this.files.save(entity));
  }

  async findOne(id: string): Promise<FileResponse> {
    const entity = await this.findEntityOrThrow(id);
    return this.toResponse(entity);
  }

  async getContent(id: string): Promise<FileContentResponse> {
    const entity = await this.findEntityOrThrow(id);
    if (entity.storageProvider !== FileStorageProvider.LOCAL || !entity.blobPath) {
      throw new NotFoundException(`File content ${id} not found`);
    }
    await access(entity.blobPath).catch(() => {
      throw new NotFoundException(`File content ${id} not found`);
    });
    return {
      path: entity.blobPath,
      filename: entity.originalFilename,
      mimeType: entity.mimeType,
    };
  }

  async healthCheck(): Promise<FileStorageHealthResponse> {
    const connectionString = this.config.get<string>('STORAGE_CONNECTION_STRING')?.trim();
    const accountName = this.config.get<string>('STORAGE_ACCOUNT_NAME')?.trim();
    const containerName = this.resolveStorageContainerName();
    const checkedAt = new Date().toISOString();
    const probeBlobPath = `health/probe-${Date.now()}-${Math.round(Math.random() * 1e9)}.txt`;
    const content = `aurelia-blob-health:${checkedAt}`;

    try {
      if (!connectionString) {
        throw new Error('Missing STORAGE_CONNECTION_STRING');
      }
      if (!accountName) {
        throw new Error('Missing STORAGE_ACCOUNT_NAME');
      }

      const blobService = BlobServiceClient.fromConnectionString(connectionString);
      const container = blobService.getContainerClient(containerName);
      const blob = container.getBlockBlobClient(probeBlobPath);

      await blob.uploadData(Buffer.from(content, 'utf8'), {
        blobHTTPHeaders: { blobContentType: 'text/plain; charset=utf-8' },
      });

      const downloaded = await blob.downloadToBuffer();
      const readBack = downloaded.toString('utf8');
      if (readBack !== content) {
        throw new Error('Storage probe mismatch after write/read roundtrip');
      }

      await blob.deleteIfExists();

      return {
        status: 'ok',
        provider: FileStorageProvider.AZURE_BLOB,
        accountName,
        containerName,
        probeBlobPath,
        checkedAt,
      };
    } catch (error) {
      throw new ServiceUnavailableException(
        `Storage health check failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private resolveStorageContainerName(): string {
    const documents = this.config.get<string>('STORAGE_CONTAINER_DOCUMENTS')?.trim();
    if (documents) return documents;

    const evidences = this.config.get<string>('STORAGE_CONTAINER_EVIDENCES')?.trim();
    if (evidences) return evidences;

    throw new ServiceUnavailableException(
      'Storage health check failed: missing STORAGE_CONTAINER_DOCUMENTS or STORAGE_CONTAINER_EVIDENCES',
    );
  }

  private async findEntityOrThrow(id: string): Promise<FileEntity> {
    const entity = await this.files.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`File ${id} not found`);
    }
    return entity;
  }

  private async calculateChecksum(file: Express.Multer.File): Promise<string> {
    const content = file.buffer ?? (file.path ? await readFile(file.path) : null);
    if (!content) {
      throw new BadRequestException('Uploaded file content is not available');
    }
    return createHash('sha256').update(content).digest('hex');
  }

  private toResponse(entity: FileEntity): FileResponse {
    return {
      id: entity.id,
      storageProvider: entity.storageProvider,
      containerName: entity.containerName,
      blobPath: entity.blobPath,
      externalUrl: entity.externalUrl,
      originalFilename: entity.originalFilename,
      mimeType: entity.mimeType,
      sizeBytes: entity.sizeBytes,
      checksumSha256: entity.checksumSha256,
      uploadedByUserId: entity.uploadedByUserId,
      uploadedAt: entity.uploadedAt.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
