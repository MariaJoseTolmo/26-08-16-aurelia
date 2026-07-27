import React from 'react';
import { Redirect } from 'expo-router';
import { InspectionType } from '@aurelia/contracts';
import { useManualInspectionDraft } from './manualInspection.store';
import { ManualChecklistTemplateScreen } from './ManualChecklistTemplateScreen';
import { ManualFindingObservationsScreen } from './ManualFindingObservationsScreen';

export function ManualObservationsRouter() {
  const inspectionType = useManualInspectionDraft((state) => state.inspectionType);
  const inspectionTypeSelected = useManualInspectionDraft((state) => state.inspectionTypeSelected);

  if (!inspectionTypeSelected) return <Redirect href="/inspection/manual/type" />;
  if (inspectionType === InspectionType.ENVIRONMENTAL) return <ManualFindingObservationsScreen />;
  return <ManualChecklistTemplateScreen />;
}
