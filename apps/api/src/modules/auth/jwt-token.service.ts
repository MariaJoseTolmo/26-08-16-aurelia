import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  sid?: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function parseTokenJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(base64UrlDecode(value));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Invalid token');
    return parsed as Record<string, unknown>;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}

@Injectable()
export class JwtTokenService {
  constructor(private readonly config: ConfigService) {}

  sign(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: AccessTokenPayload = {
      ...payload,
      iat: now,
      exp: now + this.getTtlSeconds(),
    };
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = base64UrlEncode(JSON.stringify(fullPayload));
    const signature = this.signPart(`${header}.${body}`);
    return `${header}.${body}.${signature}`;
  }

  verify(token: string): AccessTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Invalid token');
    const [header, body, signature] = parts;
    const parsedHeader = parseTokenJson(header);
    if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT') throw new UnauthorizedException('Invalid token');
    const expected = this.signPart(`${header}.${body}`);
    if (!this.safeEquals(signature, expected)) throw new UnauthorizedException('Invalid token');
    const payload = parseTokenJson(body);
    if (!this.isAccessTokenPayload(payload)) throw new UnauthorizedException('Invalid token');
    if (payload.exp < Math.floor(Date.now() / 1000)) throw new UnauthorizedException('Token expired');
    return payload;
  }

  private signPart(value: string): string {
    const key = this.getTokenKey();
    return createHmac('sha256', key).update(value).digest('base64url');
  }

  private getTokenKey(): string {
    const key = this.config.get<string>('security.tokenKey');
    if (!key || key.length < 32) throw new Error('API_TOKEN_KEY must be at least 32 characters');
    return key;
  }

  private getTtlSeconds(): number {
    const ttlSeconds = this.config.get<number>('security.tokenTtlSeconds');
    if (!ttlSeconds || ttlSeconds <= 0) throw new Error('API_TOKEN_TTL_SECONDS must be a positive number');
    return ttlSeconds;
  }

  private isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
    if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
      return false;
    }

    const value = payload as Record<string, unknown>;

    return (
      typeof value.sub === 'string' &&
      typeof value.email === 'string' &&
      typeof value.fullName === 'string' &&
      Array.isArray(value.roles) &&
      value.roles.every((role) => typeof role === 'string') &&
      Array.isArray(value.permissions) &&
      value.permissions.every((permission) => typeof permission === 'string') &&
      (typeof value.sid === 'undefined' || typeof value.sid === 'string') &&
      typeof value.iat === 'number' &&
      typeof value.exp === 'number'
    );
  }

  private safeEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, 'utf8');
    const rightBuffer = Buffer.from(right, 'utf8');
    if (leftBuffer.length !== rightBuffer.length) return false;
    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}
