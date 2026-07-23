import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ApproveCloseConfirmBridge } from './modules/inspections/components/ApproveCloseConfirmBridge';
import { ChecklistResultBridge } from './modules/inspections/components/ChecklistResultBridge';
import { DraftProgressBridge } from './modules/inspections/components/DraftProgressBridge';
import { IncompleteInspectionDraftBridge } from './modules/inspections/components/IncompleteInspectionDraftBridge';
import { InspectionAreaSectorFilterBridge } from './modules/inspections/components/InspectionAreaSectorFilterBridge';
import { InspectionAssignmentScopeBridge } from './modules/inspections/components/InspectionAssignmentScopeBridge';
import { InspectionClosedReassignLockBridge } from './modules/inspections/components/InspectionClosedReassignLockBridge';
import { InspectionEvidenceImageSourceBridge } from './modules/inspections/components/InspectionEvidenceImageSourceBridge';
import { InspectionEvidenceViewerBridge } from './modules/inspections/components/InspectionEvidenceViewerBridge';
import { InspectionExportMenuBridge } from './modules/inspections/components/InspectionExportMenuBridge';
import { InspectionFollowupProgressBridge } from './modules/inspections/components/InspectionFollowupProgressBridge';
import { InspectionManagementCalendarOverlayBridge } from './modules/inspections/components/InspectionManagementCalendarOverlayBridge';
import { InspectionManagementSelectMenuBridge } from './modules/inspections/components/InspectionManagementSelectMenuBridge';
import { InspectionManagementTableBorderBridge } from './modules/inspections/components/InspectionManagementTableBorderBridge';
import { InspectionPdfDownloadBridge } from './modules/inspections/components/InspectionPdfDownloadBridge';
import { InspectionTableActionMenuBridge } from './modules/inspections/components/InspectionTableActionMenuBridge';
import { ManualExecutionCancelConfirmBridge } from './modules/inspections/components/ManualExecutionCancelConfirmBridge';
import { router } from './routes/router';
import './modules/dashboard/dashboard-figma-alignment.css';
import './shared/layout/app-notifications-state.css';

const queryClient = new QueryClient();
const bridgeKey = 'aurelia';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <InspectionAreaSectorFilterBridge key={bridgeKey} />
      <InspectionAssignmentScopeBridge />
      <IncompleteInspectionDraftBridge />
      <DraftProgressBridge />
      <ApproveCloseConfirmBridge />
      <InspectionFollowupProgressBridge />
      <InspectionClosedReassignLockBridge />
      <ChecklistResultBridge />
      <InspectionEvidenceImageSourceBridge />
      <InspectionEvidenceViewerBridge />
      <ManualExecutionCancelConfirmBridge />
      <InspectionTableActionMenuBridge />
      <InspectionExportMenuBridge />
      <InspectionManagementSelectMenuBridge />
      <InspectionManagementCalendarOverlayBridge />
      <InspectionManagementTableBorderBridge />
      <InspectionPdfDownloadBridge />
    </QueryClientProvider>
  </React.StrictMode>,
);
