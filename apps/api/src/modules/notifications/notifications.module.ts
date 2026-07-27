import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionFindingResponsibleEntity } from '../inspections/entities/inspection-finding-responsible.entity';
import { InspectionFindingEntity } from '../inspections/entities/inspection-finding.entity';
import { InspectionFormTemplateEntity } from '../inspections/entities/inspection-form-template.entity';
import { InspectionTypeEntity } from '../inspections/entities/inspection-type.entity';
import { InspectionEntity } from '../inspections/entities/inspection.entity';
import { AreaEntity } from '../organization/entities/area.entity';
import { CompanyEntity } from '../organization/entities/company.entity';
import { SectorEntity } from '../organization/entities/sector.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity';
import { NotificationRecipientEntity } from './entities/notification-recipient.entity';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationDeliverySubscriber } from './notification-delivery.subscriber';
import { NotificationRecipientStateService } from './notification-recipient-state.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      NotificationRecipientEntity,
      NotificationDeliveryEntity,
      InspectionEntity,
      InspectionFindingEntity,
      InspectionFindingResponsibleEntity,
      InspectionTypeEntity,
      InspectionFormTemplateEntity,
      AreaEntity,
      CompanyEntity,
      SectorEntity,
      UserEntity,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationRecipientStateService,
    NotificationDeliveryService,
    NotificationDeliverySubscriber,
  ],
  exports: [NotificationsService, NotificationDeliveryService],
})
export class NotificationsModule {}
