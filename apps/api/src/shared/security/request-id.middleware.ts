import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export type RequestWithRequestId = Request & {
  requestId?: string;
};

const requestIdPattern = /^[a-zA-Z0-9._:-]{8,120}$/;

export function requestIdMiddleware(request: RequestWithRequestId, response: Response, next: NextFunction): void {
  const incoming = resolveIncomingRequestId(request);
  const requestId = incoming && requestIdPattern.test(incoming) ? incoming : randomUUID();
  request.requestId = requestId;
  response.setHeader('X-Request-Id', requestId);
  next();
}

export function getRequestId(request: Request): string | undefined {
  return (request as RequestWithRequestId).requestId;
}

function resolveIncomingRequestId(request: Request): string | undefined {
  const header = request.headers['x-request-id'];
  if (Array.isArray(header)) return header[0];
  return header;
}
