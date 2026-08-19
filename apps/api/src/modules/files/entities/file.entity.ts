import { FileStorageProvider } from '@aurelia/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'storage_provider',
    type: 'enum',
    enum: FileStorageProvider,
    enumName: 'file_storage_provider',
    default: FileStorageProvider.LOCAL,
  })
  storageProvider: FileStorageProvider;

  @Column({ name: 'container_name', type: 'varchar', length: 160, nullable: true })
  containerName: string | null;

  @Column({ name: 'blob_path', type: 'text', nullable: true })
  blobPath: string | null;

  @Column({ name: 'external_url', type: 'text', nullable: true })
  externalUrl: string | null;

  @Column({ name: 'original_filename', length: 255 })
  originalFilename: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120, nullable: true })
  mimeType: string | null;

  @Column({ name: 'size_bytes', type: 'bigint', nullable: true })
  sizeBytes: number | null;

  @Column({ name: 'checksum_sha256', type: 'varchar', length: 128, nullable: true })
  checksumSha256: string | null;

  @Index('idx_files_uploaded_by')
  @Column({ name: 'uploaded_by_user_id', type: 'uuid', nullable: true })
  uploadedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by_user_id', foreignKeyConstraintName: 'fk_files_uploaded_by' })
  uploadedByUser: UserEntity | null;

  @Column({ name: 'uploaded_at', type: 'timestamptz', default: () => 'now()' })
  uploadedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
