import type { Request } from 'express';
import type { AccessTokenPayload } from './jwt-token.service';

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}
