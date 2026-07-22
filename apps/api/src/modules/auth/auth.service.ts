import { randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@aurelia/contracts';
import { UserEntity } from '../users/entities/user.entity';
import { CredentialHashService } from './credential-hash.service';
import { JwtTokenService } from './jwt-token.service';
import { SessionRegistryService } from './session-registry.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName: string;
    position: string | null;
    companyId: string | null;
    companyName: string | null;
    areaId: string | null;
    areaName: string | null;
    roles: Role[];
    permissions: string[];
  };
}

export interface SessionRenewRequest {
  refreshToken: string;
}

export interface IframeSessionTicketRequest {
  ticket: string;
}

export interface IframeSessionTicketResponse {
  ticket: string;
  expiresAt: string;
}

export interface AuthClientContext {
  userAgent: string | null;
  ipAddress: string | null;
}

interface IframeSessionTicketRecord {
  userId: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private static readonly MAX_FAILED_ATTEMPTS = 5;

  private static readonly LOCK_MINUTES = 15;

  private static readonly IFRAME_TICKET_TTL_MS = 60_000;

  private readonly iframeTickets = new Map<string, IframeSessionTicketRecord>();

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly jwtTokenService: JwtTokenService,
    private readonly credentialHashService: CredentialHashService,
    private readonly sessionRegistryService: SessionRegistryService,
  ) {}

  async login(payload: LoginRequest, context: AuthClientContext): Promise<LoginResponse> {
    const email = payload?.email?.trim().toLowerCase();

    if (!email || !payload?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.usersRepository.findOne({
      where: { email, isActive: true },
      relations: {
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
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatch = await this.credentialHashService.matches(payload.password, user.passwordHash);

    if (!isPasswordMatch) {
      const failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
      const shouldLock = failedLoginAttempts >= AuthService.MAX_FAILED_ATTEMPTS;

      await this.usersRepository.update(user.id, {
        failedLoginAttempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + AuthService.LOCK_MINUTES * 60 * 1000)
          : null,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    return this.issueLoginResponse(user.id, context);
  }

  async renew(payload: SessionRenewRequest, context: AuthClientContext): Promise<LoginResponse> {
    const refreshToken = payload?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid session');
    }

    const issued = await this.sessionRegistryService.rotate(refreshToken, context);
    return this.issueLoginResponse(issued.session.userId, context, issued.key, issued.session.id);
  }

  createIframeSessionTicket(userId: string): IframeSessionTicketResponse {
    this.pruneExpiredIframeTickets();
    const ticket = randomUUID();
    const expiresAt = Date.now() + AuthService.IFRAME_TICKET_TTL_MS;
    this.iframeTickets.set(ticket, { userId, expiresAt });

    return {
      ticket,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  async exchangeIframeSessionTicket(payload: IframeSessionTicketRequest, context: AuthClientContext): Promise<LoginResponse> {
    const ticket = payload?.ticket?.trim();
    if (!ticket) {
      throw new UnauthorizedException('Invalid session ticket');
    }

    const record = this.iframeTickets.get(ticket);
    this.iframeTickets.delete(ticket);

    if (!record || record.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid session ticket');
    }

    return this.issueLoginResponse(record.userId, context);
  }

  async logout(sessionId: string | undefined): Promise<void> {
    await this.sessionRegistryService.revoke(sessionId);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionRegistryService.revokeAll(userId);
  }

  private async issueLoginResponse(userId: string, context: AuthClientContext, existingRefreshToken?: string, existingSessionId?: string): Promise<LoginResponse> {
    const issued = existingRefreshToken && existingSessionId
      ? { key: existingRefreshToken, session: { id: existingSessionId } }
      : await this.sessionRegistryService.issue(await this.findActiveUserById(userId), context);
    const user = await this.findActiveUserById(userId);
    const activeUserRoles = user.userRoles?.filter((userRole) => userRole.role.isActive) ?? [];
    const roles = activeUserRoles.map((userRole) => userRole.role.code);
    const permissions = this.resolvePermissions(activeUserRoles);
    const isGoldFieldsUser = user.email.endsWith('@goldfields.com');
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const companyName = user.company?.name ?? (isGoldFieldsUser ? 'Gold Fields' : null);
    const areaName = user.area?.name ?? null;
    const token = this.jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      fullName,
      roles,
      permissions,
      sid: issued.session.id,
    });

    return {
      token,
      refreshToken: issued.key,
      user: {
        id: user.id,
        email: user.email,
        fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position,
        companyId: user.companyId,
        companyName,
        areaId: user.areaId,
        areaName,
        roles,
        permissions,
      },
    };
  }

  private async findActiveUserById(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id, isActive: true },
      relations: {
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
    });

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    return user;
  }

  private pruneExpiredIframeTickets(): void {
    const now = Date.now();
    Array.from(this.iframeTickets.entries()).forEach(([ticket, record]) => {
      if (record.expiresAt < now) this.iframeTickets.delete(ticket);
    });
  }

  private resolvePermissions(userRoles: UserEntity['userRoles']): string[] {
    const permissions = userRoles.flatMap((userRole) => (
      userRole.role.rolePermissions?.map((rolePermission) => rolePermission.permission.code) ?? []
    ));

    return Array.from(new Set(permissions)).sort();
  }
}
