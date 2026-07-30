import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InspectionFindingSlaReassignmentResponse,
  InspectionFindingStatus,
  InspectionSlaEventType,
} from '@aurelia/contracts';
import { randomUUID } from 'node:crypto';
import { DataSource, Not } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ReassignInspectionFindingSlaDto } from './dto/reassign-inspection-finding-sla.dto';
import { InspectionFindingEntity } from './entities/inspection-finding.entity';
import { InspectionSlaEventEntity } from './entities/inspection-sla-event.entity';

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
      const previousSlaBusinessDays = this.businessDaysUntil(reassignedAt, previousDueAt);
      const newDueAt = this.addBusinessDays(reassignedAt, dto.slaBusinessDays);
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

  private addBusinessDays(value: Date, businessDays: number): Date {
    const result = new Date(value);
    let remaining = businessDays;
    while (remaining > 0) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) remaining -= 1;
    }
    return result;
  }

  private businessDaysUntil(from: Date, dueAt: Date | null): number {
    if (!dueAt || dueAt.getTime() <= from.getTime()) return 0;
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const target = new Date(dueAt);
    target.setHours(0, 0, 0, 0);
    let days = 0;
    while (cursor.getTime() < target.getTime()) {
      cursor.setDate(cursor.getDate() + 1);
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) days += 1;
    }
    return days;
  }
}
