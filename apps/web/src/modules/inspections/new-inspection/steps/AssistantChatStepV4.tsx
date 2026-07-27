import { useEffect, type ComponentProps } from 'react';
import { AssistantChatStep as AssistantChatStepV12 } from './AssistantChatStepV12';

type AssistantChatStepProps = ComponentProps<typeof AssistantChatStepV12>;

function cleanText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function findCompanySuggestionCard(button: HTMLButtonElement) {
  const panel = button.closest('.new-inspection-modal-panel');
  if (!panel) return null;

  let current = button.parentElement;
  while (current && current !== panel) {
    const content = cleanText(current.textContent);
    if (
      content.includes('empresa sugerida por aurelia')
      || content.includes('empresa responsable sugerida')
    ) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function isOtherCompanyButton(button: HTMLButtonElement) {
  const label = cleanText(button.textContent);
  return label === 'elegir otra' || label === 'elegir otra empresa';
}

export function AssistantChatStep(props: AssistantChatStepProps) {
  useEffect(() => {
    function guardOtherCompanyAction(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest('button') as HTMLButtonElement | null;
      if (!button || !isOtherCompanyButton(button)) return;

      const suggestionCard = findCompanySuggestionCard(button);
      if (!suggestionCard) return;

      if (suggestionCard.dataset.assistantOtherCompanyHandled === 'true') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }

      // Se marca antes de que el evento llegue al onClick de React. Así una
      // segunda activación manual o programática no puede crear otro mensaje
      // `companies` mientras React procesa el primer cambio de estado.
      suggestionCard.dataset.assistantOtherCompanyHandled = 'true';
      button.dataset.assistantOtherCompanyHandled = 'true';

      queueMicrotask(() => {
        if (!button.isConnected) return;
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      });
    }

    document.addEventListener('click', guardOtherCompanyAction, true);
    return () => document.removeEventListener('click', guardOtherCompanyAction, true);
  }, []);

  return <AssistantChatStepV12 {...props} />;
}
