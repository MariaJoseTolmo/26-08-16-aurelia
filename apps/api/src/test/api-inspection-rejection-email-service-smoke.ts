import assert from 'node:assert/strict';
import { ConfigService } from '@nestjs/config';
import { InspectionFindingStatus } from '@aurelia/contracts';
import { InspectionRejectionEmailService } from '../modules/inspections/inspection-rejection-email.service';

async function main(): Promise<void> {
  const rejectedAt = new Date('2026-07-29T20:00:00.000Z');
  const finding = {
    id: '11111111-1111-4111-8111-111111111111',
    inspectionId: '22222222-2222-4222-8222-222222222222',
    checklistItemId: null,
    ownerUserId: '33333333-3333-4333-8333-333333333333',
    status: InspectionFindingStatus.REJECTED,
    rejectionReason: 'La evidencia no permite verificar el cierre.',
    rejectedAt,
    updatedAt: rejectedAt,
    createdAt: new Date('2026-07-20T12:00:00.000Z'),
  };
  const inspection = {
    id: finding.inspectionId,
    title: 'Inspección #369',
    scheduledAt: new Date('2026-07-20T10:00:00.000Z'),
    createdAt: new Date('2026-07-19T10:00:00.000Z'),
    areaId: '44444444-4444-4444-8444-444444444444',
    area: { name: 'Planta de procesos' },
    sector: { name: 'Chancado' },
  };
  const responsible = {
    id: finding.ownerUserId,
    email: 'responsable@example.com',
    firstName: 'María',
    lastName: 'Responsable',
    position: 'Supervisora de área',
    isActive: true,
  };
  const reviewer = {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'revisor@example.com',
    firstName: 'Pedro',
    lastName: 'Contreras Ríos',
    position: 'Admin GF HSE',
    isActive: true,
  };

  let sentCount = 0;
  let createdNotification: any = null;
  let lastOutbound: any = null;
  let markedSent = false;

  const service = new InspectionRejectionEmailService(
    {
      findOne: async () => inspection,
    } as any,
    {
      findOneBy: async () => finding,
      find: async () => [finding],
    } as any,
    {
      find: async () => [],
    } as any,
    {
      findOneBy: async (where: { id: string }) => where.id === reviewer.id ? reviewer : responsible,
      find: async () => [],
    } as any,
    {
      render: (params: any) => ({
        subject: `Rechazo ${params.inspectionNumber}`,
        html: `<a href="${params.actionUrl}">${params.rejectionReason}</a>`,
        text: params.rejectionReason,
      }),
    } as any,
    {
      send: async (message: any) => {
        sentCount += 1;
        lastOutbound = message;
        return {
          provider: 'smtp',
          messageId: '<message@example.com>',
          accepted: ['responsable@example.com'],
          rejected: [],
        };
      },
    } as any,
    {
      findForUser: async () => createdNotification ? [createdNotification] : [],
      create: async (input: any) => {
        createdNotification = {
          id: '66666666-6666-4666-8666-666666666666',
          metadata: input.metadata,
        };
        return createdNotification;
      },
    } as any,
    {
      createDeepLink: async () => ({ token: 'signed-token' }),
      registerEmailAttempt: async () => ({ id: '77777777-7777-4777-8777-777777777777' }),
      markSent: async () => {
        markedSent = true;
        return {};
      },
      markFailed: async () => {
        throw new Error('markFailed should not run in successful delivery');
      },
    } as any,
    new ConfigService({ WEB_APP_URL: 'https://aurelia.goldfields.cl' }),
  );

  await service.notifyFindingRejected(finding.id, reviewer.id);

  assert.equal(sentCount, 1);
  assert.equal(markedSent, true);
  assert.equal(createdNotification.metadata.event, 'inspection.finding-rejected');
  assert.equal(createdNotification.metadata.inspectionNumber, '369');
  assert.equal(createdNotification.metadata.observationNumber, '1');
  assert.match(lastOutbound.html, /notifications\/open\/signed-token/);
  assert.deepEqual(lastOutbound.to, [{
    email: 'responsable@example.com',
    name: 'María Responsable',
  }]);

  await service.notifyFindingRejected(finding.id, reviewer.id);
  assert.equal(sentCount, 1, 'A duplicate rejection event must not send another email');

  console.log('Inspection rejection email service smoke test passed.');
}

void main();
