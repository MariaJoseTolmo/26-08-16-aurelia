import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InspectionFindingStatus,
  InspectionSlaEventType,
  type InspectionFindingSlaReassignmentResponse,
} from '@aurelia/contracts';
import { randomUUID } from 'node:crypto';
import { DataSource, Not } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ReassignInspectionFindingSlaDto } from './dto/reassign-inspection-finding-sla.dto';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionSlaEventEntity } from './entities/inspection-sla-event.entity';
import { addInspectionBusinessDays, inspectionBusinessDaysUntil } from './inspection-business-days';

@Injectable()
export class InspectionSlaReassignmentService {
  constructor(private readonly dataSource: DataSource) {}

  async reassign(
    findingId: string,
    dto: ReassignInspectionFindingSlaDto,
    actorId: string | null,
  ): Promise<InspectionFindingSlaReassignmentResponse> {
    const reason = dto.reason.trim();
    if (!reason) throw new BadRequestException('SLA reassignment reason is required');

    return this.dataSource.transaction(async (manager) => {
      const findingRepository = manager.getRepository(InspectionFindingEntity);
      const eventRepository = manager.getRepository(InspectionSlaEventEntity);
      const userRepository = manager.getRepository(UserEntity);
      const finding = await findingRepository.findOne({
        where: { id: findingId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!finding) throw new NotFoundException(`Finding ${findingId} not found`);
      if (finding.status !== InspectionFindingStatus.OPEN) {
        throw new BadRequestException('Only open findings can have their SLA reassigned');
      }

      const reassignedAt = new Date();
      const previousDueAt = finding.dueAt ? new Date(finding.dueAt) : null;
      const previousSlaBusinessDays = inspectionBusinessDaysUntil(reassignedAt, previousDueAt);
      const newDueAt = addInspectionBusinessDays(reassignedAt, dto.slaBusinessDays);
      const inspectionFindings = await findingRepository.find({
        where: {
          inspectionId: finding.inspectionId,
          status: Not(InspectionFindingStatus.CANCELLED),
        },
        order: { createdAt: 'ASC', id: 'ASC' },
      });
      const findingNumber = Math.max(1, inspectionFindings.findIndex((item) => item.id === finding.id) + 1);
      const actor = actorId ? await userRepository.findOneBy({ id: actorId }) : null;
      const reassignedByName = actor
        ? `${actor.firstName} ${actor.lastName}`.trim() || actor.email
        : null;

      finding.dueAt = newDueAt;
      await findingRepository.save(finding);

      const event = eventRepository.create({
        findingId: finding.id,
        policyId: null,
        type: InspectionSlaEventType.REASSIGNED,
        eventKey: `finding-sla-reassigned:${finding.id}:${randomUUID()}`,
        dueAt: newDueAt,
        occurredAt: reassignedAt,
        metadata: {
          inspectionId: finding.inspectionId,
          findingNumber,
          findingTitle: finding.title,
          previousSlaBusinessDays,
          newSlaBusinessDays: dto.slaBusinessDays,
          previousDueAt: previousDueAt?.toISOString() ?? null,
          newDueAt: newDueAt.toISOString(),
          reason,
          reassignedByUserId: actorId,
        },
      });
      const savedEvent = await eventRepository.save(event);

      return {
        id: savedEvent.id,
        findingId: finding.id,
        inspectionId: finding.inspectionId,
        findingNumber,
        findingTitle: finding.title,
        previousSlaBusinessDays,
        newSlaBusinessDays: dto.slaBusinessDays,
        previousDueAt: previousDueAt?.toISOString() ?? null,
        newDueAt: newDueAt.toISOString(),
        reason,
        reassignedAt: reassignedAt.toISOString(),
        reassignedByUserId: actorId,
        reassignedByName,
      };
    });
  }
}
