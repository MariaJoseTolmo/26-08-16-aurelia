import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CommentResponse } from '@aurelia/contracts';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() dto: CreateCommentDto): Promise<CommentResponse> {
    return this.commentsService.create(dto);
  }

  @Get()
  findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ): Promise<CommentResponse[]> {
    return this.commentsService.findAll(entityType, entityId);
  }

  @Delete(':id')
  @HttpCode(204)
  softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.commentsService.softDelete(id);
  }
}
