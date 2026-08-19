import { BadRequestException } from '@nestjs/common';
import {
  InspectionAiAssessmentKind,
  InspectionAiDecision,
  InspectionFindingSeverity,
  InspectionFindingStatus,
} from '@aurelia/contracts';
import type { DataSource, Repository } from 'typeorm';
import type { AuditService } from '../audit/audit.service';
import type { InspectionAiAssessmentEntity } from './entities/inspection-ai-assessment.entity';
import type { InspectionFindingEntity } from './entities/inspection-finding.entity';
import type { InspectionProcessRequestEntity } from './entities/inspection-process-request.entity';
import type { InspectionEntity } from './entities/inspection.entity';
import { InspectionProcessService } from './inspection-process.service';

function repositoryMock<T extends object>() {
  return {
    findOneBy: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (value: T) => value),
    create: jest.fn((value: Partial<T>) => ({
      ...value,
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      createdAt: new Date('2026-07-23T12:00:00.000Z'),
      updatedAt: new Date('2026-07-23T12:00:00.000Z'),
    }) as T),
  } as unknown as jest.Mocked<Repository<T>>;
}

function buildService() {
  const inspections = repositoryMock<InspectionEntity>();
  const findings = repositoryMock<InspectionFindingEntity>();
  const requests = repositoryMock<InspectionProcessRequestEntity>();
  const assessments = repositoryMock<InspectionAiAssessmentEntity>();
  const dataSource = { transaction: jest.fn() } as unknown as DataSource;
  const audit = { logSafe: jest.fn().mockResolvedValue(null) } as unknown as jest.Mocked<AuditService>;
  return {
    service: new InspectionProcessService(
      inspections,
      findings,
      requests,
      assessments,
      dataSource,
      audit,
    ),
    inspections,
    findings,
    assessments,
    audit,
  };
}

describe('InspectionProcessService AI controls', () => {
  it('detecta coincidencia explicable y deja decisión humana pendiente', async () => {
    const { service, inspections, findings, assessments } = buildService();
    inspections.findOneBy.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      companyId: '22222222-2222-4222-8222-222222222222',
      areaId: '33333333-3333-4333-8333-333333333333',
    } as InspectionEntity);
    findings.find.mockResolvedValue([{
      id: '44444444-4444-4444-8444-444444444444',
      inspectionId: '11111111-1111-4111-8111-111111111111',
      title: 'Derrame de aceite en sector bombas',
      detectedCondition: 'Aceite derramado junto a bombas sin contención',
      description: null,
      status: InspectionFindingStatus.OPEN,
      severity: InspectionFindingSeverity.HIGH,
    } as InspectionFindingEntity]);
    assessments.save.mockImplementation(async (value) => value);

    const result = await service.preValidate(
      '11111111-1111-4111-8111-111111111111',
      {
        title: 'Derrame aceite sector bombas',
        detectedCondition: 'Aceite derramado junto a bombas sin contención secundaria',
        proposedCorrectiveAction: 'Instalar contención y limpiar',
        severity: InspectionFindingSeverity.HIGH,
      },
      '55555555-5555-4555-8555-555555555555',
    );

    expect(result.kind).toBe(InspectionAiAssessmentKind.DUPLICATE);
    expect(result.duplicateFindingId).toBe('44444444-4444-4444-8444-444444444444');
    expect(result.decision).toBe(InspectionAiDecision.PENDING);
    expect(result.explanation.join(' ')).toContain('Coincidencia');
  });

  it('explica campos faltantes sin bloquear automáticamente', async () => {
    const { service, inspections, findings } = buildService();
    inspections.findOneBy.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      companyId: null,
      areaId: null,
    } as InspectionEntity);
    findings.find.mockResolvedValue([]);

    const result = await service.preValidate(
      '11111111-1111-4111-8111-111111111111',
      { title: 'Hallazgo incompleto' },
      '55555555-5555-4555-8555-555555555555',
    );

    expect(result.recommendation).toBe('complete_required_fields');
    expect(result.explanation).toEqual(expect.arrayContaining([
      'Falta completar detectedCondition',
      'Falta completar proposedCorrectiveAction',
      'Falta completar severity',
      'Falta completar companyId',
      'Falta completar areaId',
    ]));
    expect(result.decision).toBe(InspectionAiDecision.PENDING);
  });

  it('registra override humano con motivo y actor', async () => {
    const { service, assessments, audit } = buildService();
    const assessment = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      inspectionId: '11111111-1111-4111-8111-111111111111',
      findingId: null,
      kind: InspectionAiAssessmentKind.PRE_VALIDATION,
      confidence: '0.9000',
      recommendation: 'ready_for_human_review',
      explanation: ['Campos mínimos completos para revisión humana'],
      duplicateFindingId: null,
      suggestedData: null,
      decision: InspectionAiDecision.PENDING,
      decisionReason: null,
      decidedByUserId: null,
      decidedAt: null,
      createdAt: new Date('2026-07-23T12:00:00.000Z'),
      updatedAt: new Date('2026-07-23T12:00:00.000Z'),
    } as InspectionAiAssessmentEntity;
    assessments.findOneBy.mockResolvedValue(assessment);
    assessments.save.mockImplementation(async (value) => value);

    const result = await service.recordAiDecision(
      assessment.id,
      {
        decision: InspectionAiDecision.OVERRIDDEN,
        reason: 'La inspección en terreno confirma que no corresponde a un duplicado.',
      },
      '55555555-5555-4555-8555-555555555555',
    );

    expect(result.decision).toBe(InspectionAiDecision.OVERRIDDEN);
    expect(result.decidedByUserId).toBe('55555555-5555-4555-8555-555555555555');
    expect(audit.logSafe).toHaveBeenCalledWith(expect.objectContaining({
      action: 'inspection.ai.human_decision_recorded',
    }));
  });

  it('rechaza una decisión humana pendiente', async () => {
    const { service } = buildService();
    await expect(service.recordAiDecision(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      {
        decision: InspectionAiDecision.PENDING as Exclude<InspectionAiDecision, InspectionAiDecision.PENDING>,
        reason: 'Motivo inválido porque la decisión sigue pendiente.',
      },
      '55555555-5555-4555-8555-555555555555',
    )).rejects.toBeInstanceOf(BadRequestException);
  });
});
