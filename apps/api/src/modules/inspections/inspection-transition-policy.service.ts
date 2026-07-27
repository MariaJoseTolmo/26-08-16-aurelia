import { BadRequestException, Injectable } from '@nestjs/common';
import { InspectionFindingStatus, InspectionStatus } from '@aurelia/contracts';

const INSPECTION_TRANSITIONS: Record<InspectionStatus, ReadonlySet<InspectionStatus>> = {
  [InspectionStatus.DRAFT]: new Set([
    InspectionStatus.SCHEDULED,
    InspectionStatus.IN_PROGRESS,
    InspectionStatus.CANCELLED,
  ]),
  [InspectionStatus.SCHEDULED]: new Set([
    InspectionStatus.IN_PROGRESS,
    InspectionStatus.CANCELLED,
  ]),
  [InspectionStatus.IN_PROGRESS]: new Set([
    InspectionStatus.SUBMITTED,
    InspectionStatus.UNDER_REVIEW,
    InspectionStatus.RETURNED,
    InspectionStatus.CLOSED,
    InspectionStatus.CANCELLED,
  ]),
  [InspectionStatus.SUBMITTED]: new Set([
    InspectionStatus.UNDER_REVIEW,
    InspectionStatus.RETURNED,
    InspectionStatus.CLOSED,
    InspectionStatus.CANCELLED,
  ]),
  [InspectionStatus.UNDER_REVIEW]: new Set([
    InspectionStatus.RETURNED,
    InspectionStatus.CLOSED,
    InspectionStatus.CANCELLED,
  ]),
  [InspectionStatus.RETURNED]: new Set([
    InspectionStatus.IN_PROGRESS,
    InspectionStatus.SUBMITTED,
    InspectionStatus.UNDER_REVIEW,
    InspectionStatus.CLOSED,
    InspectionStatus.CANCELLED,
  ]),
  [InspectionStatus.CLOSED]: new Set(),
  [InspectionStatus.CANCELLED]: new Set(),
};

const FINDING_TRANSITIONS: Record<InspectionFindingStatus, ReadonlySet<InspectionFindingStatus>> = {
  [InspectionFindingStatus.OPEN]: new Set([
    InspectionFindingStatus.IN_PROGRESS,
    InspectionFindingStatus.CANCELLED,
  ]),
  [InspectionFindingStatus.IN_PROGRESS]: new Set([
    InspectionFindingStatus.CLOSED,
    InspectionFindingStatus.REJECTED,
    InspectionFindingStatus.CANCELLED,
  ]),
  [InspectionFindingStatus.REJECTED]: new Set([
    InspectionFindingStatus.IN_PROGRESS,
    InspectionFindingStatus.CANCELLED,
  ]),
  [InspectionFindingStatus.CLOSED]: new Set(),
  [InspectionFindingStatus.CANCELLED]: new Set(),
};

@Injectable()
export class InspectionTransitionPolicyService {
  assertInspectionTransition(current: InspectionStatus, next: InspectionStatus): void {
    if (current === next) return;
    if (!INSPECTION_TRANSITIONS[current]?.has(next)) {
      throw new BadRequestException(`Invalid inspection transition: ${current} -> ${next}`);
    }
  }

  assertFindingTransition(current: InspectionFindingStatus, next: InspectionFindingStatus): void {
    if (current === next) return;
    if (!FINDING_TRANSITIONS[current]?.has(next)) {
      throw new BadRequestException(`Invalid inspection finding transition: ${current} -> ${next}`);
    }
  }
}
