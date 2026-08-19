import { AssistantDraftResumeModalBridge } from './AssistantDraftResumeModalBridge';
import { IncompleteDraftResumeControllerBridge } from './IncompleteDraftResumeControllerBridge';

export function DraftProgressBridge() {
  return <><IncompleteDraftResumeControllerBridge /><AssistantDraftResumeModalBridge /></>;
}
