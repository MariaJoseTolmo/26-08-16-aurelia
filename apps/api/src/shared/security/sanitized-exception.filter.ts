import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { getRequestId } from './request-id.middleware';

interface SanitizedErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
  requestId?: string;
}

const sensitivePatterns = [
  /password/i,
  /token/i,
  /secret/i,
  /hash/i,
  /authorization/i,
  /bearer/i,
  /refresh/i,
  /jwt/i,
  /sql/i,
  /query/i,
  /database/i,
  /constraint/i,
  /duplicate key/i,
  /violates/i,
  /stack/i,
];

@Catch()
export class SanitizedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SanitizedExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const statusCode = this.resolveStatusCode(exception);
    const requestId = getRequestId(request);

    if (statusCode >= 500) {
      const message = exception instanceof Error ? exception.message : 'Unknown error';
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`[${requestId ?? 'no-request-id'}] ${message}`, stack);
    }

    const body: SanitizedErrorResponse = {
      statusCode,
      message: this.resolveMessage(exception, statusCode),
      error: this.resolveError(statusCode),
      path: request.originalUrl.split('?')[0],
      timestamp: new Date().toISOString(),
    };

    if (requestId) body.requestId = requestId;
    response.status(statusCode).json(body);
  }

  private resolveStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveMessage(exception: unknown, statusCode: number): string | string[] {
    if (!(exception instanceof HttpException)) return 'Internal server error';
    if (statusCode >= 500) return 'Internal server error';
    if (statusCode === HttpStatus.NOT_FOUND) return 'Resource not found';
    if (statusCode === HttpStatus.CONFLICT) return 'Conflict';
    if (statusCode === HttpStatus.UNAUTHORIZED) return 'Unauthorized';
    if (statusCode === HttpStatus.FORBIDDEN) return 'Forbidden';

    const response = exception.getResponse();
    if (typeof response === 'string') return this.sanitizeMessage(response, statusCode);
    if (!response || typeof response !== 'object') return this.defaultMessage(statusCode);

    const body = response as Record<string, unknown>;
    const message = body.message;

    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.map((item) => this.sanitizeMessage(item, statusCode));
    }

    if (typeof message === 'string') return this.sanitizeMessage(message, statusCode);
    return this.defaultMessage(statusCode);
  }

  private sanitizeMessage(message: string, statusCode: number): string {
    if (sensitivePatterns.some((pattern) => pattern.test(message))) return this.defaultMessage(statusCode);
    return message;
  }

  private defaultMessage(statusCode: number): string {
    if (statusCode === HttpStatus.BAD_REQUEST) return 'Bad request';
    if (statusCode === HttpStatus.UNAUTHORIZED) return 'Unauthorized';
    if (statusCode === HttpStatus.FORBIDDEN) return 'Forbidden';
    if (statusCode === HttpStatus.NOT_FOUND) return 'Resource not found';
    if (statusCode === HttpStatus.CONFLICT) return 'Conflict';
    if (statusCode === HttpStatus.TOO_MANY_REQUESTS) return 'Too many requests';
    return 'Request failed';
  }

  private resolveError(statusCode: number): string {
    if (statusCode === HttpStatus.BAD_REQUEST) return 'Bad Request';
    if (statusCode === HttpStatus.UNAUTHORIZED) return 'Unauthorized';
    if (statusCode === HttpStatus.FORBIDDEN) return 'Forbidden';
    if (statusCode === HttpStatus.NOT_FOUND) return 'Not Found';
    if (statusCode === HttpStatus.CONFLICT) return 'Conflict';
    if (statusCode === HttpStatus.TOO_MANY_REQUESTS) return 'Too Many Requests';
    if (statusCode >= 500) return 'Internal Server Error';
    return 'Error';
  }
}
