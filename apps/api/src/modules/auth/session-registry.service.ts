import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { UserSessionEntity } from './entities/user-session.entity';

export interface IssuedSession {
  session: UserSessionEntity;
  key: string;
}

export interface SessionClientContext {
  userAgent: string | null;
  ipAddress: string | null;
}

@Injectable()
export class SessionRegistryService {
  constructor(
    @InjectRepository(UserSessionEntity)
    private readonly sessions: Repository<UserSessionEntity>,
    private readonly config: ConfigService,
  ) {}

  async issue(user: UserEntity, context: SessionClientContext): Promise<IssuedSession> {
    const key = randomBytes(48).toString('base64url');
    const session = await this.sessions.save(this.sessions.create({
      user,
      userId: user.id,
      sessionKeyHash: this.digest(key),
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      expiresAt: new Date(Date.now() + this.getTtlSeconds() * 1000),
      revokedAt: null,
      rotatedAt: null,
      replacedBySessionId: null,
    }));

    return { session, key };
  }

  async rotate(key: string, context: SessionClientContext): Promise<IssuedSession> {
    const current = await this.sessions.findOne({
      where: { sessionKeyHash: this.digest(key) },
      relations: {
        user: {
          company: true,
          area: true,
          userRoles: {
            role: {
              rolePermissions: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!current) {
      throw new UnauthorizedException('Invalid session');
    }

    if (current.revokedAt || current.expiresAt.getTime() <= Date.now() || !current.user?.isActive) {
      await this.revokeAll(current.userId);
      throw new UnauthorizedException('Invalid session');
    }

    const next = await this.issue(current.user, context);
    const now = new Date();
    await this.sessions.update(current.id, {
      revokedAt: now,
      rotatedAt: now,
      replacedBySessionId: next.session.id,
    });

    return next;
  }

  async findSessionUser(key: string): Promise<UserEntity> {
    const session = await this.sessions.findOne({
      where: { sessionKeyHash: this.digest(key) },
      relations: {
        user: {
          company: true,
          area: true,
          userRoles: {
            role: {
              rolePermissions: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!session?.user || session.revokedAt || session.expiresAt.getTime() <= Date.now() || !session.user.isActive) {
      throw new UnauthorizedException('Invalid session');
    }

    return session.user;
  }

  async revoke(sessionId: string | undefined): Promise<void> {
    if (!sessionId) {
      throw new UnauthorizedException('Invalid session');
    }

    await this.sessions.update(sessionId, { revokedAt: new Date() });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.sessions
      .createQueryBuilder()
      .update(UserSessionEntity)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  private digest(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private getTtlSeconds(): number {
    const ttlSeconds = this.config.get<number>('security.sessionTtlSeconds');
    if (!ttlSeconds || ttlSeconds <= 0) throw new Error('API_SESSION_TTL_SECONDS must be a positive number');
    return ttlSeconds;
  }
}
