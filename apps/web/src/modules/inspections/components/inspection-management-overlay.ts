export type InspectionManagementOverlayKind = 'select' | 'calendar' | 'action';

export type InspectionManagementOverlayDetail = {
  kind: InspectionManagementOverlayKind;
  owner: Element;
  sourceId: string;
};

const overlayEventName = 'aurelia:inspection-management-overlay-open';
let overlaySourceSequence = 0;

export function nextInspectionManagementOverlaySourceId(prefix: InspectionManagementOverlayKind) {
  overlaySourceSequence += 1;
  return `${prefix}-${overlaySourceSequence}`;
}

export function announceInspectionManagementOverlay(detail: InspectionManagementOverlayDetail) {
  document.dispatchEvent(new CustomEvent<InspectionManagementOverlayDetail>(overlayEventName, { detail }));
}

export function subscribeToInspectionManagementOverlay(
  listener: (detail: InspectionManagementOverlayDetail) => void,
) {
  const handleOverlayOpen = (event: Event) => {
    listener((event as CustomEvent<InspectionManagementOverlayDetail>).detail);
  };

  document.addEventListener(overlayEventName, handleOverlayOpen);
  return () => document.removeEventListener(overlayEventName, handleOverlayOpen);
}
