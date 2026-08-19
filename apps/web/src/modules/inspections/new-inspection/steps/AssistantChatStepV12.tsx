import { useEffect, type ComponentProps } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInspectionAssignmentScope } from '../../../../shared/services/inspection-assignment-scope.service';
import { useSessionStore } from '../../../../shared/stores/session.store';
import { useNewInspectionDraftStore } from '../state/newInspectionDraft.store';
import { AssistantChatStep as AssistantChatStepV11 } from './AssistantChatStepV11';

type AssistantChatStepProps = ComponentProps<typeof AssistantChatStepV11>;

function cleanText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function getPanel() {
  return document.querySelector('.new-inspection-modal-panel') as HTMLElement | null;
}

function getScroller(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll('div')).find((element) => {
    const className = element.className.toString();
    return className.includes('overflow-y-auto') && className.includes('bg-[#F4F6F9]');
  }) as HTMLElement | undefined;
}

function directScrollerChild(scroller: HTMLElement, element: Element | null | undefined) {
  if (!element) return null;
  let current = element as HTMLElement;
  while (current.parentElement && current.parentElement !== scroller) current = current.parentElement;
  return current.parentElement === scroller ? current : null;
}

function findSuggestionConfirm(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll('button')).find((button) => {
    const label = cleanText(button.textContent).toLowerCase();
    if (label !== 'confirmar' && label !== 'confirmar empresa') return false;
    let current = button.parentElement;
    while (current && current !== panel) {
      const content = cleanText(current.textContent).toLowerCase();
      if (content.includes('empresa sugerida por aurelia') || content.includes('empresa responsable sugerida')) return true;
      current = current.parentElement;
    }
    return false;
  }) as HTMLButtonElement | undefined;
}

function findSuggestionCard(panel: HTMLElement, confirmButton: HTMLButtonElement | undefined) {
  let current = confirmButton?.parentElement ?? null;
  while (current && current !== panel) {
    const content = cleanText(current.textContent).toLowerCase();
    if (content.includes('empresa sugerida por aurelia') || content.includes('empresa responsable sugerida')) return current;
    current = current.parentElement;
  }
  return null;
}

function findOtherCompanyButton(card: HTMLElement | null) {
  if (!card) return undefined;
  return Array.from(card.querySelectorAll('button')).find((button) => {
    const label = cleanText(button.textContent).toLowerCase();
    return label === 'elegir otra' || label === 'elegir otra empresa';
  }) as HTMLButtonElement | undefined;
}

function ensureLockedCompanyField(scroller: HTMLElement, anchor: HTMLElement | null, companyName: string) {
  let host = scroller.querySelector('[data-eecc-locked-company="true"]') as HTMLElement | null;
  if (!host) {
    host = document.createElement('div');
    host.dataset.eeccLockedCompany = 'true';
    host.className = 'mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]';
    host.innerHTML = '<p class="text-[12px] font-bold text-[#131313]">Empresa responsable</p><div class="mt-[8px] flex h-[50px] w-full items-center justify-between rounded-[10px] border-[1.5px] border-[#24588B] bg-[#F6FAFF] px-[15.5px] py-[15px] text-left text-[13px] leading-[19.5px] text-[#131313]"><span data-eecc-company-name="true" class="truncate"></span><span class="text-[16px] leading-none text-[#646464]">⌄</span></div>';
    if (anchor?.parentElement === scroller) scroller.insertBefore(host, anchor);
    else scroller.appendChild(host);
  }
  const name = host.querySelector('[data-eecc-company-name="true"]');
  if (name) name.textContent = companyName;
  return host;
}

function hideCompanyAssignmentArtifacts(scroller: HTMLElement, companyName: string) {
  const normalizedCompany = cleanText(companyName).toLowerCase();
  Array.from(scroller.children).forEach((child) => {
    const element = child as HTMLElement;
    if (element.dataset.eeccLockedCompany === 'true') return;
    const content = cleanText(element.textContent).toLowerCase();
    const isSuggestionIntro = content.includes('basándome en el historial') && content.includes('te propongo');
    const isSuggestion = content.includes('empresa sugerida por aurelia') || content.includes('empresa responsable sugerida');
    const isOtherPrompt = content.includes('selecciona otra empresa responsable');
    const isConfirmation = content === `✓ ${normalizedCompany} confirmada`;
    const isEnhancedSelector = Boolean(element.querySelector('[data-assistant-company-selector-host="true"]')) || element.dataset.assistantCompanySelectorHost === 'true';
    const isCompanyPicker = content.startsWith('empresa responsable') && !content.includes('personal') && (content.includes('seleccione la empresa') || content.includes(normalizedCompany));
    if (isSuggestionIntro || isSuggestion || isOtherPrompt || isConfirmation || isEnhancedSelector || isCompanyPicker) element.style.display = 'none';
  });
  scroller.querySelectorAll('[data-assistant-company-selector-host="true"]').forEach((element) => {
    (element as HTMLElement).style.display = 'none';
  });
}

function selectAssignedCompany(panel: HTMLElement, companyName: string, suggestionCard: HTMLElement | null) {
  const companyButton = Array.from(panel.querySelectorAll('button')).find((button) => {
    if (button.closest('[data-eecc-locked-company="true"]')) return false;
    if (suggestionCard?.contains(button)) return false;
    return cleanText(button.textContent) === companyName;
  }) as HTMLButtonElement | undefined;
  if (!companyButton || companyButton.dataset.eeccAssignedCompanyHandled === 'true') return false;
  companyButton.dataset.eeccAssignedCompanyHandled = 'true';
  companyButton.click();
  return true;
}

function syncEeccCompanyStep(companyId: string, companyName: string) {
  const panel = getPanel();
  if (!panel) return;
  panel.dataset.eeccCompanyFlow = 'true';
  const scroller = getScroller(panel);
  if (!scroller) return;

  const confirmButton = findSuggestionConfirm(panel);
  const suggestionCard = findSuggestionCard(panel, confirmButton);
  const suggestionBlock = directScrollerChild(scroller, suggestionCard);
  const companyPromptVisible = Boolean(confirmButton || suggestionCard || Array.from(scroller.children).some((child) => cleanText(child.textContent).toLowerCase().includes('selecciona otra empresa responsable')));
  const peopleVisible = Array.from(scroller.children).some((child) => cleanText(child.textContent).toLowerCase().includes('sugiero este personal'));
  if (!companyPromptVisible && !peopleVisible) return;

  const state = useNewInspectionDraftStore.getState();
  if (state.findingCompanyId !== companyId || state.findingCompanyName !== companyName) state.setFindingCompany(companyId, companyName);

  ensureLockedCompanyField(scroller, suggestionBlock, companyName);

  if (confirmButton && suggestionCard && suggestionCard.dataset.eeccCompanyTransition !== 'true') {
    suggestionCard.dataset.eeccCompanyTransition = 'true';
    const content = cleanText(suggestionCard.textContent).toLowerCase();
    if (content.includes(companyName.toLowerCase())) confirmButton.click();
    else findOtherCompanyButton(suggestionCard)?.click();
  }

  selectAssignedCompany(panel, companyName, suggestionCard);
  hideCompanyAssignmentArtifacts(scroller, companyName);
}

export function AssistantChatStep(props: AssistantChatStepProps) {
  const user = useSessionStore((state) => state.user);
  const scopeQuery = useQuery({
    queryKey: ['inspections', 'assignment-scope', user?.id],
    queryFn: getInspectionAssignmentScope,
    enabled: Boolean(user),
    staleTime: 300000,
  });

  useEffect(() => {
    const scope = scopeQuery.data;
    if (!scope || scope.canSelectCompany || !scope.companyId || !scope.companyName) return undefined;

    const sync = () => syncEeccCompanyStep(scope.companyId as string, scope.companyName as string);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(sync, 100);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      document.querySelector('[data-eecc-locked-company="true"]')?.remove();
    };
  }, [scopeQuery.data]);

  return <AssistantChatStepV11 {...props} />;
}
