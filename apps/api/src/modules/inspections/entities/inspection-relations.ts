import type { InspectionFormTemplateEntity } from './inspection-form-template.entity';
import type { InspectionFormSectionEntity } from './inspection-form-section.entity';
import type { InspectionEntity } from './inspection.entity';

declare module './inspection-form-section.entity' {
  interface InspectionFormSectionEntity {
    template: InspectionFormTemplateEntity;
  }
}

declare module './inspection.entity' {
  interface InspectionEntity {
    template: InspectionFormTemplateEntity | null;
  }
}

export type InspectionEntityRelationPatch = InspectionEntity | InspectionFormSectionEntity;
