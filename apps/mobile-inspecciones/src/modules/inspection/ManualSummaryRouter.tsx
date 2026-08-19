import React from 'react';
import { Redirect } from 'expo-router';
import { InspectionType } from '@aurelia/contracts';
import { useManualInspectionDraft } from './manualInspection.store';
import { ManualFindingSummaryScreen } from './ManualFindingSummaryScreen';
import { ManualInspectionSummaryFixedScreen } from './ManualInspectionSummaryFixedScreen';

export function ManualSummaryRouter() {
  const inspectionType = useManualInspectionDraft((state) => state.inspectionType);
  const inspectionTypeSelected = useManualInspectionDraft((state) => state.inspectionTypeSelected);

  if (!inspectionTypeSelected) return <Redirect href="/inspection/manual/type" />;
  if (inspectionType === InspectionType.ENVIRONMENTAL) return <ManualFindingSummaryScreen />;
  return <ManualInspectionSummaryFixedScreen />;
}
