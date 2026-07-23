import { BadRequestException } from '@nestjs/common';
import { InspectionFindingStatus, InspectionStatus } from '@aurelia/contracts';
import { InspectionTransitionPolicyService } from './inspection-transition-policy.service';

describe('InspectionTransitionPolicyService', () => {
  const policy = new InspectionTransitionPolicyService();

  it('permite el flujo operativo de inspección', () => {
    expect(() => policy.assertInspectionTransition(InspectionStatus.DRAFT, InspectionStatus.IN_PROGRESS)).not.toThrow();
    expect(() => policy.assertInspectionTransition(InspectionStatus.IN_PROGRESS, InspectionStatus.SUBMITTED)).not.toThrow();
    expect(() => policy.assertInspectionTransition(InspectionStatus.SUBMITTED, InspectionStatus.UNDER_REVIEW)).not.toThrow();
    expect(() => policy.assertInspectionTransition(InspectionStatus.UNDER_REVIEW, InspectionStatus.CLOSED)).not.toThrow();
  });

  it('rechaza reabrir una inspección cerrada', () => {
    expect(() => policy.assertInspectionTransition(InspectionStatus.CLOSED, InspectionStatus.IN_PROGRESS))
      .toThrow(BadRequestException);
  });

  it('permite ejecutar y revisar un hallazgo', () => {
    expect(() => policy.assertFindingTransition(InspectionFindingStatus.OPEN, InspectionFindingStatus.IN_PROGRESS)).not.toThrow();
    expect(() => policy.assertFindingTransition(InspectionFindingStatus.IN_PROGRESS, InspectionFindingStatus.CLOSED)).not.toThrow();
  });

  it('permite reenvío tras rechazo pero no cierre directo desde abierto', () => {
    expect(() => policy.assertFindingTransition(InspectionFindingStatus.REJECTED, InspectionFindingStatus.IN_PROGRESS)).not.toThrow();
    expect(() => policy.assertFindingTransition(InspectionFindingStatus.OPEN, InspectionFindingStatus.CLOSED))
      .toThrow(BadRequestException);
  });

  it('mantiene estados idempotentes sin crear transición inválida', () => {
    expect(() => policy.assertInspectionTransition(InspectionStatus.IN_PROGRESS, InspectionStatus.IN_PROGRESS)).not.toThrow();
    expect(() => policy.assertFindingTransition(InspectionFindingStatus.REJECTED, InspectionFindingStatus.REJECTED)).not.toThrow();
  });
});
