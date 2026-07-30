import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { InspectionSlaEventType } from '@aurelia/contracts';
import { validateSync } from 'class-validator';
import { ReassignInspectionFindingSlaDto } from '../modules/inspections/dto/reassign-inspection-finding-sla.dto';
import {
  addInspectionBusinessDays,
  inspectionBusinessDaysUntil,
} from '../modules/inspections/inspection-business-days';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function testBusinessDays(): void {
  const friday = new Date(2026, 6, 31, 12, 0, 0);
  const monday = addInspectionBusinessDays(friday, 1);
  assert(monday.getFullYear() === 2026, 'One business day from Friday must keep the expected year');
  assert(monday.getMonth() === 7, 'One business day from Friday must move to August');
  assert(monday.getDate() === 3, 'One business day from Friday must skip the weekend and end on Monday');

  const wednesday = addInspectionBusinessDays(friday, 3);
  assert(wednesday.getDate() === 5, 'Three business days from Friday must end on Wednesday');
  assert(
    inspectionBusinessDaysUntil(friday, wednesday) === 3,
    'Remaining SLA must be expressed in business days',
  );
}

function testDtoValidation(): void {
  const invalid = Object.assign(new ReassignInspectionFindingSlaDto(), {
    slaBusinessDays: 0,
    reason: 'x',
  });
  assert(validateSync(invalid).length >= 2, 'Zero days and a short reason must be rejected');

  const valid = Object.assign(new ReassignInspectionFindingSlaDto(), {
    slaBusinessDays: 10,
    reason: 'Se requiere un plazo adicional para completar la acción.',
  });
  assert(validateSync(valid).length === 0, 'A positive SLA and a meaningful reason must be accepted');
}

function testIntegrationSources(): void {
  const controller = source('src/modules/inspections/inspections.controller.ts');
  const service = source('src/modules/inspections/inspection-sla-reassignment.service.ts');
  const detail = source('src/modules/inspections/inspection-detail.service.ts');
  const webSheet = source('../web/src/modules/inspections/components/SlaReassignSheet.tsx');
  const webModal = source('../web/src/modules/inspections/components/InspectionDetailRealDataModal.tsx');
  const mobileModal = source('../mobile-inspecciones/src/modules/inspection/MobileInspectionDetailModal.tsx');
  const closedMobileModal = source('../mobile-inspecciones/src/modules/inspection/MobileNativeClosedInspectionDetailModal.tsx');

  assert(
    controller.includes("@Post('findings/:findingId/reassign-sla')"),
    'The API must expose a dedicated SLA reassignment endpoint',
  );
  assert(
    controller.includes('INSPECTION_CAPABILITIES.reassign'),
    'SLA reassignment must preserve the reassign capability check',
  );
  assert(
    service.includes("finding.status !== InspectionFindingStatus.OPEN"),
    'Only existing open observations may have their SLA reassigned',
  );
  assert(
    service.includes('InspectionSlaEventType.REASSIGNED') && service.includes('reason'),
    'The transaction must persist a reassigned SLA event with its reason',
  );
  assert(
    detail.includes('slaReassignments:') && detail.includes('toSlaReassignmentResponse'),
    'Inspection detail must expose SLA reassignment milestones',
  );
  assert(
    webSheet.includes('Ingrese el motivo de la modificación')
      && webSheet.includes('reason.trim().length >= 3'),
    'Web must require a meaningful reason before enabling SLA reassignment',
  );
  assert(
    webModal.includes('SLA anterior:')
      && webModal.includes('Nuevo SLA:')
      && webModal.includes('detail.slaReassignments'),
    'Web must render previous/new SLA in Seguimientos',
  );
  assert(
    mobileModal.includes('Ingrese el motivo de la modificación')
      && mobileModal.includes('SLA anterior:')
      && mobileModal.includes('Nuevo SLA:'),
    'Mobile must require a reason and render previous/new SLA in Seguimientos',
  );
  assert(
    closedMobileModal.includes('detail.slaReassignments'),
    'Closed inspections must preserve SLA milestones in mobile history',
  );
}

function main(): void {
  assert(
    InspectionSlaEventType.REASSIGNED === 'reassigned',
    'The shared SLA event enum must include reassigned',
  );
  testBusinessDays();
  testDtoValidation();
  testIntegrationSources();
  console.log('Inspection SLA reassignment smoke test passed');
}

main();
