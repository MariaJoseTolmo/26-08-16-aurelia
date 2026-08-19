import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { MeResponse, Role } from '@aurelia/contracts';
import type { Request } from 'express';
import type { AuthenticatedRequest } from './authenticated-request';
import {
  AuthClientContext,
  AuthService,
  IframeSessionTicketRequest,
  IframeSessionTicketResponse,
  LoginRequest,
  LoginResponse,
  SessionRenewRequest,
} from './auth.service';
import { Public } from './public.decorator';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() payload: LoginRequest, @Req() request: Request): Promise<LoginResponse> {
    return this.authService.login(payload, this.getClientContext(request));
  }

  @Public()
  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  renew(@Body() payload: SessionRenewRequest, @Req() request: Request): Promise<LoginResponse> {
    return this.authService.renew(payload, this.getClientContext(request));
  }

  @Post('auth/iframe-ticket')
  @HttpCode(HttpStatus.OK)
  createIframeTicket(@Req() request: AuthenticatedRequest): IframeSessionTicketResponse {
    return this.authService.createIframeSessionTicket(request.user.sub);
  }

  @Public()
  @Post('auth/iframe-session')
  @HttpCode(HttpStatus.OK)
  exchangeIframeTicket(@Body() payload: IframeSessionTicketRequest, @Req() request: Request): Promise<LoginResponse> {
    return this.authService.exchangeIframeSessionTicket(payload, this.getClientContext(request));
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.authService.logout(request.user.sid);
  }

  @Post('auth/logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.authService.logoutAll(request.user.sub);
  }

  @Get('me')
  getMe(@Req() request: AuthenticatedRequest): MeResponse {
    return {
      id: request.user.sub,
      email: request.user.email,
      fullName: request.user.fullName,
      roles: request.user.roles as Role[],
      permissions: request.user.permissions,
      isPlaceholder: false,
    };
  }

  private getClientContext(request: Request): AuthClientContext {
    const userAgentHeader = request.headers['user-agent'];

    return {
      userAgent: Array.isArray(userAgentHeader)
        ? (userAgentHeader[0] ?? null)
        : (userAgentHeader ?? null),
      ipAddress: request.ip ?? null,
    };
  }
}
