import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileResponse } from '@aurelia/contracts';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { FileStorageHealthResponse, FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('health')
  health(): Promise<FileStorageHealthResponse> {
    return this.filesService.healthCheck();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('uploadedByUserId') uploadedByUserId?: string,
  ): Promise<FileResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.filesService.saveUpload(file, uploadedByUserId);
  }

  @Get(':id/content')
  async streamContent(@Param('id', ParseUUIDPipe) id: string, @Res() response: Response): Promise<void> {
    const file = await this.filesService.getContent(id);
    response.setHeader('Content-Type', file.mimeType ?? 'application/octet-stream');
    response.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    createReadStream(file.path).pipe(response);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FileResponse> {
    return this.filesService.findOne(id);
  }
}
