import { Controller, Get, Req } from '@nestjs/common';
import type { MobileBootstrapResponse } from '@aurelia/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { MobileBootstrapService } from './mobile-bootstrap.service';

@RequirePermissions('mobile:read')
@Controller('mobile/bootstrap')
export class MobileBootstrapController {
  constructor(private readonly mobileBootstrapService: MobileBootstrapService) {}

  @Get()
  getBootstrap(@Req() request: AuthenticatedRequest): Promise<MobileBootstrapResponse> {
    return this.mobileBootstrapService.buildBootstrap(request.user);
  }
}
