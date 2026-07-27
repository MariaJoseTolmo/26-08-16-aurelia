import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import {
  MarkAllNotificationsReadResponse,
  NotificationDeepLinkResponse,
  NotificationDeliveryResponse,
  NotificationResponse,
} from '@aurelia/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { Public } from '../auth/public.decorator';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  CreateNotificationDeepLinkDto,
  NotificationDeliveryFailureDto,
  RegisterNotificationEmailDeliveryDto,
} from './dto/notification-delivery.dto';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationRecipientStateService } from './notification-recipient-state.service';
import { NotificationsService } from './notifications.service';

@RequirePermissions('notifications:read')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationRecipientStateService: NotificationRecipientStateService,
    private readonly notificationDeliveries: NotificationDeliveryService,
  ) {}

  @Get()
  findMine(
    @Req() request: AuthenticatedRequest,
    @Query('unreadOnly') unreadOnly?: string,
  ): Promise<NotificationResponse[]> {
    return this.notificationsService.findForUser(request.user.sub, unreadOnly === 'true');
  }

  @RequirePermissions('notifications:write')
  @Post()
  create(@Body() dto: CreateNotificationDto): Promise<NotificationResponse> {
    return this.notificationsService.create(dto);
  }

  @Post(':id/deep-link')
  createDeepLink(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateNotificationDeepLinkDto,
  ): Promise<NotificationDeepLinkResponse> {
    return this.notificationDeliveries.createDeepLink(id, request.user.sub, dto);
  }

  @Public()
  @Get('deep-link/:token')
  resolveDeepLink(@Param('token') token: string): NotificationDeepLinkResponse {
    return this.notificationDeliveries.resolveDeepLink(token);
  }

  @RequirePermissions('notifications:write')
  @Post(':id/deliveries/email')
  registerEmailDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterNotificationEmailDeliveryDto,
  ): Promise<NotificationDeliveryResponse> {
    return this.notificationDeliveries.registerEmailAttempt({
      notificationId: id,
      destination: dto.destination,
      metadata: dto.metadata,
    });
  }

  @RequirePermissions('notifications:write')
  @Get(':id/deliveries')
  findDeliveries(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationDeliveryResponse[]> {
    return this.notificationDeliveries.findByNotification(id);
  }

  @RequirePermissions('notifications:write')
  @Patch('deliveries/:deliveryId/sent')
  markDeliverySent(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
  ): Promise<NotificationDeliveryResponse> {
    return this.notificationDeliveries.markSent(deliveryId);
  }

  @RequirePermissions('notifications:write')
  @Patch('deliveries/:deliveryId/failure')
  markDeliveryFailure(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @Body() dto: NotificationDeliveryFailureDto,
  ): Promise<NotificationDeliveryResponse> {
    return this.notificationDeliveries.markFailed(
      deliveryId,
      dto.reason,
      dto.bounced ?? false,
      dto.metadata,
    );
  }

  @RequirePermissions('notifications:write')
  @Post('deliveries/:deliveryId/retry')
  retryDelivery(
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
  ): Promise<NotificationDeliveryResponse> {
    return this.notificationDeliveries.retry(deliveryId);
  }

  @Patch(':id/read')
  markRead(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponse> {
    return this.notificationsService.markRead(id, request.user.sub);
  }

  @Patch(':id/dismiss')
  dismiss(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MarkAllNotificationsReadResponse> {
    return this.notificationRecipientStateService.dismiss(id, request.user.sub);
  }

  @Patch(':id/inspection-thread/dismiss')
  dismissInspectionThread(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MarkAllNotificationsReadResponse> {
    return this.notificationRecipientStateService.readAndDismissPreviousInspectionThread(id, request.user.sub);
  }
}
