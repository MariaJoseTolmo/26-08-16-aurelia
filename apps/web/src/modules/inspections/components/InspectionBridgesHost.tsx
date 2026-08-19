import { useEffect, useState } from 'react';
import { ApproveCloseConfirmBridge } from './ApproveCloseConfirmBridge';
import { DraftProgressBridge } from './DraftProgressBridge';
import { IncompleteInspectionDraftBridge } from './IncompleteInspectionDraftBridge';
import { InspectionAreaSectorFilterBridge } from './InspectionAreaSectorFilterBridge';
import { InspectionAssignmentScopeBridge } from './InspectionAssignmentScopeBridge';
import { InspectionClosedReassignLockBridge } from './InspectionClosedReassignLockBridge';
import { InspectionEvidenceImageSourceBridge } from './InspectionEvidenceImageSourceBridge';
import { InspectionEvidenceViewerBridge } from './InspectionEvidenceViewerBridge';
import { InspectionExportMenuBridge } from './InspectionExportMenuBridge';
import { InspectionManagementCalendarOverlayBridge } from './InspectionManagementCalendarOverlayBridge';
import { InspectionManagementSelectMenuBridge } from './InspectionManagementSelectMenuBridge';
import { InspectionManagementTableBorderBridge } from './InspectionManagementTableBorderBridge';
import { InspectionPdfDownloadBridge } from './InspectionPdfDownloadBridge';
import { InspectionTableActionMenuBridge } from './InspectionTableActionMenuBridge';
import { ManualExecutionCancelConfirmBridge } from './ManualExecutionCancelConfirmBridge';

const locationEvent = 'aurelia:location-change';
type PatchedWindow = Window & { __aureliaInspectionHistoryPatched__?: boolean };

function currentPath() {
  return window.location.pathname;
}

function ensureHistoryEvents() {
  const scopedWindow = window as PatchedWindow;
  if (scopedWindow.__aureliaInspectionHistoryPatched__) return;
  scopedWindow.__aureliaInspectionHistoryPatched__ = true;
  const pushState = window.history.pushState.bind(window.history);
  const replaceState = window.history.replaceState.bind(window.history);
  window.history.pushState = (...args) => {
    pushState(...args);
    window.dispatchEvent(new Event(locationEvent));
  };
  window.history.replaceState = (...args) => {
    replaceState(...args);
    window.dispatchEvent(new Event(locationEvent));
  };
}

export function InspectionBridgesHost() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    ensureHistoryEvents();
    const sync = () => setPath(currentPath());
    window.addEventListener(locationEvent, sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener(locationEvent, sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  if (!path.startsWith('/inspections')) return null;
  return (
    <>
      <InspectionAreaSectorFilterBridge />
      <InspectionAssignmentScopeBridge />
      <IncompleteInspectionDraftBridge />
      <DraftProgressBridge />
      <ApproveCloseConfirmBridge />
      <InspectionClosedReassignLockBridge />
      <InspectionEvidenceImageSourceBridge />
      <InspectionEvidenceViewerBridge />
      <ManualExecutionCancelConfirmBridge />
      <InspectionTableActionMenuBridge />
      <InspectionExportMenuBridge />
      <InspectionManagementSelectMenuBridge />
      <InspectionManagementCalendarOverlayBridge />
      <InspectionManagementTableBorderBridge />
      <InspectionPdfDownloadBridge />
    </>
  );
}
