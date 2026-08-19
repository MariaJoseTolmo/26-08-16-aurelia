import { useEffect, type ComponentProps } from 'react';
import { AssistantChatStep as AssistantChatStepV8 } from './AssistantChatStepV8';

type AssistantChatStepProps = ComponentProps<typeof AssistantChatStepV8>;

function cleanText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function getPanel() {
  return document.querySelector('.new-inspection-modal-panel') as HTMLElement | null;
}

function getScroll(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll('div')).find((element) => element.className.toString().includes('overflow-y-auto') && element.className.toString().includes('bg-[#F4F6F9]')) as HTMLElement | undefined;
}

function directScrollChild(scroll: HTMLElement, element: Element) {
  let current = element as HTMLElement;
  while (current.parentElement && current.parentElement !== scroll) current = current.parentElement;
  return current.parentElement === scroll ? current : null;
}

function findCompanyChipRows(panel: HTMLElement) {
  const scroll = getScroll(panel);
  if (!scroll) return [];
  const anchors = Array.from(scroll.querySelectorAll('*')).filter((element) => {
    const text = cleanText(element.textContent);
    return text === 'Selecciona otra empresa responsable.' || text.includes('Elige otra empresa.');
  });
  const rows: HTMLElement[] = [];
  anchors.forEach((anchor) => {
    const root = directScrollChild(scroll, anchor);
    let next = root?.nextElementSibling as HTMLElement | null | undefined;
    for (let index = 0; next && index < 4; index += 1) {
      const isNativeCompanySheet = next.className.toString().includes('fixed')
        && cleanText(next.textContent).includes('Seleccione la empresa');
      if (isNativeCompanySheet) {
        next = next.nextElementSibling as HTMLElement | null;
        continue;
      }

      const buttons = Array.from(next.querySelectorAll('button')).filter((button) => cleanText(button.textContent));
      const isCompanyRow = buttons.length >= 2 && buttons.every((button) => !cleanText(button.textContent).toLowerCase().includes('confirmar'));
      if (isCompanyRow) {
        rows.push(next);
        break;
      }
      next = next.nextElementSibling as HTMLElement | null;
    }
  });
  return rows;
}

function openCompanySheet(companies: string[], chipRow: HTMLElement, selectedName: string | null) {
  document.querySelector('[data-assistant-company-sheet="true"]')?.remove();
  const overlay = document.createElement('div');
  overlay.dataset.assistantCompanySheet = 'true';
  overlay.className = 'fixed bottom-[16px] right-[20px] top-[16px] z-[1200] flex w-[360px] max-w-[calc(100vw-40px)] items-end overflow-hidden rounded-[22px] bg-[rgba(19,19,19,0.75)]';
  const sheet = document.createElement('div');
  sheet.className = 'flex h-[705px] max-h-[88%] w-full flex-col rounded-t-[16px] bg-white px-[14px] pb-[24px] pt-[12px] shadow-[0_-12px_32px_rgba(0,0,0,0.22)]';
  sheet.innerHTML = '<div class="flex w-full flex-col items-center pt-[10px]"><div class="h-[4px] w-[40px] rounded-[2px] bg-[#D1D1D1]"></div></div><div class="mt-[24px] grid gap-[12px]"><p class="text-[18px] font-bold leading-[21.6px] text-[#131313]">Seleccione la empresa</p><input data-company-search="true" placeholder="Ingrese nombre de la empresa" class="h-[50px] w-full rounded-[10px] border-[1.5px] border-[#24588B] bg-[#F6FAFF] px-[15.5px] py-[15px] text-[13px] leading-[19.5px] text-[#131313] outline-none placeholder:text-[#131313]" /></div><div data-company-list="true" class="mt-[12px] min-h-0 flex-1 overflow-y-auto rounded-[12px] bg-white p-[8px]"></div>';
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  const input = sheet.querySelector('[data-company-search="true"]') as HTMLInputElement;
  const list = sheet.querySelector('[data-company-list="true"]') as HTMLElement;
  function render() {
    const query = input.value.trim().toLowerCase();
    list.innerHTML = '';
    companies.filter((name) => name.toLowerCase().includes(query)).forEach((name) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = `flex min-h-[46.7px] w-full items-center rounded-[8px] px-[8px] py-[12px] text-left ${name === selectedName ? 'bg-[#F6FAFF]' : 'bg-white'}`;
      option.innerHTML = `<span class="min-w-0 flex-1 text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">${name}</span>`;
      option.addEventListener('click', () => {
        const original = Array.from(chipRow.querySelectorAll('button')).find((button) => cleanText(button.textContent) === name) as HTMLButtonElement | undefined;
        original?.click();
        overlay.remove();
      });
      list.appendChild(option);
    });
  }
  input.addEventListener('input', render);
  overlay.addEventListener('click', () => overlay.remove());
  sheet.addEventListener('click', (event) => event.stopPropagation());
  render();
  window.setTimeout(() => input.focus(), 50);
}

function enhanceCompanyRows(panel: HTMLElement) {
  findCompanyChipRows(panel).forEach((row) => {
    if (row.dataset.assistantCompanySelector === 'true') return;
    const buttons = Array.from(row.querySelectorAll('button')) as HTMLButtonElement[];
    const companies = buttons.map((button) => cleanText(button.textContent)).filter(Boolean);
    if (!companies.length) return;
    row.dataset.assistantCompanySelector = 'true';
    row.style.display = 'none';
    const host = document.createElement('div');
    host.dataset.assistantCompanySelectorHost = 'true';
    host.className = 'mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]';
    host.innerHTML = '<p class="text-[12px] font-bold text-[#131313]">Empresa responsable</p><button type="button" class="mt-[8px] flex h-[50px] w-full items-center justify-between rounded-[10px] border-[1.5px] border-[#24588B] bg-[#F6FAFF] px-[15.5px] py-[15px] text-left text-[13px] leading-[19.5px] text-[#131313]"><span>Seleccione la empresa</span><span class="text-[16px] leading-none text-[#131313]">⌄</span></button>';
    const button = host.querySelector('button') as HTMLButtonElement;
    button.addEventListener('click', () => openCompanySheet(companies, row, null));
    row.parentElement?.insertBefore(host, row);
  });
}

function cleanupNativeCompanyPickerArtifacts(panel: HTMLElement) {
  const hasNativePicker = Array.from(panel.querySelectorAll('button')).some((button) => (
    cleanText(button.textContent) === 'Seleccione la empresa'
    && !button.closest('[data-assistant-company-selector-host="true"]')
  ));
  if (!hasNativePicker) return;

  panel.querySelectorAll('[data-assistant-company-selector-host="true"]').forEach((element) => element.remove());
  panel.querySelectorAll('[data-assistant-company-selector="true"]').forEach((element) => {
    const row = element as HTMLElement;
    row.style.display = '';
    delete row.dataset.assistantCompanySelector;
  });
  document.querySelector('[data-assistant-company-sheet="true"]')?.remove();
}

function enhancePersonnel(panel: HTMLElement) {
  Array.from(panel.querySelectorAll('button')).filter((button) => cleanText(button.textContent) === 'Confirmar personal').forEach((confirmButton) => {
    const card = confirmButton.parentElement as HTMLElement | null;
    if (!card) return;
    card.className = 'mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]';
    const list = Array.from(card.children).find((child) => child !== confirmButton) as HTMLElement | undefined;
    if (list) list.className = 'flex flex-col gap-[6px]';
    Array.from(card.querySelectorAll('button')).filter((button) => button !== confirmButton).forEach((button) => {
      const item = button as HTMLButtonElement;
      const rawName = item.dataset.assistantPersonName ?? cleanText(item.textContent).replace(/^★\s*/, '');
      const suggested = cleanText(item.textContent).startsWith('★') || item.dataset.assistantSuggested === 'true';
      const active = item.className.toString().includes('bg-[#052B63]') || item.querySelector('[data-person-check="true"]')?.textContent === '✓';
      item.dataset.assistantPersonName = rawName;
      item.dataset.assistantSuggested = suggested ? 'true' : 'false';
      const initials = rawName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
      item.className = `flex min-h-[48px] w-full items-center gap-[10px] rounded-[10px] border-[1.5px] px-[12px] py-[8px] text-left ${active ? 'border-[#00B398] bg-[#C5FFF6] text-[#131313]' : 'border-[#D1D1D1] bg-white text-[#131313]'}`;
      item.innerHTML = `<span class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#C8A064] text-[11px] font-bold text-[#001E39]">${initials}</span><span class="min-w-0 flex-1"><span class="block truncate text-[12px] font-bold text-[#131313]">${rawName}</span><span class="block truncate text-[10px] text-[#646464]">Responsable</span></span>${suggested ? '<span class="rounded-[3px] bg-[#FDF3E3] px-[5px] py-[1px] text-[9px] font-bold text-[#8E6E3E]">✦ Sugerido</span>' : ''}<span data-person-check="true" class="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-[#00B398] bg-[#00B398] text-[9px] text-white' : 'border-[#D1D1D1]'}">${active ? '✓' : ''}</span>`;
    });
    (confirmButton as HTMLButtonElement).className = 'mt-[10px] h-[42px] w-full rounded-[10px] bg-[#C8A064] text-[13px] font-bold text-white disabled:opacity-50';
  });
}

function enhanceSuggestionCards(panel: HTMLElement) {
  Array.from(panel.querySelectorAll('div')).forEach((element) => {
    const node = element as HTMLElement;
    const text = cleanText(node.textContent);
    if (text.includes('Empresa responsable sugerida') && text.includes('Confirmar empresa')) node.classList.add('assistant-checklist-company-suggestion');
    if (text.includes('Medida correctiva sugerida') && text.includes('Aceptar medida')) node.classList.add('assistant-checklist-ai-suggestion');
  });
}

function enhanceSummarySave(panel: HTMLElement) {
  const saveButton = Array.from(panel.querySelectorAll('button')).find((button) => cleanText(button.textContent).includes('Guardar checklist') && !button.closest('[data-assistant-checklist-bottom-save="true"]')) as HTMLButtonElement | undefined;
  const inputBar = Array.from(panel.children).find((child) => cleanText(child.textContent).includes('O escribe aquí')) as HTMLElement | undefined;
  let bottom = panel.querySelector('[data-assistant-checklist-bottom-save="true"]') as HTMLElement | null;
  if (!saveButton) {
    bottom?.remove();
    if (inputBar) inputBar.style.display = '';
    return;
  }
  saveButton.style.display = 'none';
  if (inputBar) inputBar.style.display = 'none';
  if (!bottom) {
    bottom = document.createElement('div');
    bottom.dataset.assistantChecklistBottomSave = 'true';
    bottom.className = 'border-t border-[#E3E3E3] bg-white px-[14px] pb-[10px] pt-[12px]';
    bottom.innerHTML = '<button type="button" class="flex h-[48px] w-full items-center justify-center gap-[10px] rounded-[12px] bg-[#35A137] px-[16px] text-[15px] font-bold leading-none text-white shadow-[0_2px_8px_rgba(53,161,55,0.18)]">✓ Guardar checklist</button><div class="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]"></div>';
    const button = bottom.querySelector('button') as HTMLButtonElement;
    button.addEventListener('click', () => saveButton.click());
    panel.appendChild(bottom);
  }
}

function installStyles() {
  if (document.getElementById('assistant-checklist-v9-styles')) return;
  const style = document.createElement('style');
  style.id = 'assistant-checklist-v9-styles';
  style.textContent = `
    .assistant-checklist-company-suggestion,
    .assistant-checklist-ai-suggestion {
      overflow: hidden !important;
      border: 1.5px solid #c8a064 !important;
      border-radius: 12px !important;
      background: #ffffff !important;
      padding: 0 !important;
      box-shadow: 0 2px 8px rgba(200, 160, 100, 0.15) !important;
    }
    .assistant-checklist-company-suggestion > div:first-child,
    .assistant-checklist-ai-suggestion > div:first-child {
      margin: 0 !important;
      padding: 9px 12px !important;
      background: linear-gradient(135deg, #fdf3e3, #fae8c8) !important;
      border-bottom: 1px solid rgba(200, 160, 100, 0.25) !important;
    }
    .assistant-checklist-company-suggestion > div:first-child p,
    .assistant-checklist-ai-suggestion > div:first-child p {
      color: #8e6e3e !important;
      font-size: 12px !important;
      font-weight: 700 !important;
    }
    .assistant-checklist-company-suggestion > div:first-child p::before,
    .assistant-checklist-ai-suggestion > div:first-child p::before {
      content: '✦';
      margin-right: 6px;
    }
    .assistant-checklist-company-suggestion > div:first-child > span,
    .assistant-checklist-ai-suggestion > div:first-child > span {
      display: none !important;
    }
    .assistant-checklist-company-suggestion > p,
    .assistant-checklist-ai-suggestion > p {
      margin: 0 !important;
      padding: 12px 12px 0 !important;
      color: #131313 !important;
      font-size: 13px !important;
      line-height: 18px !important;
      font-weight: 500 !important;
    }
    .assistant-checklist-company-suggestion > p:first-of-type {
      font-size: 16px !important;
      line-height: 20px !important;
      font-weight: 700 !important;
    }
    .assistant-checklist-company-suggestion > p::before,
    .assistant-checklist-company-suggestion > p::after,
    .assistant-checklist-ai-suggestion > p::before,
    .assistant-checklist-ai-suggestion > p::after {
      content: none !important;
      display: none !important;
    }
    .assistant-checklist-company-suggestion > div:last-child,
    .assistant-checklist-ai-suggestion > div:last-child {
      flex-direction: row !important;
      margin: 0 !important;
      padding: 10px 12px 12px !important;
      gap: 8px !important;
    }
    .assistant-checklist-company-suggestion > div:last-child button,
    .assistant-checklist-ai-suggestion > div:last-child button {
      height: 38px !important;
      border-radius: 10px !important;
      font-size: 12px !important;
      font-weight: 700 !important;
    }
    .assistant-checklist-company-suggestion > div:last-child button:first-child,
    .assistant-checklist-ai-suggestion > div:last-child button:first-child {
      background: #00b398 !important;
      color: #ffffff !important;
      border-color: #00b398 !important;
    }
    .assistant-checklist-company-suggestion > div:last-child button:last-child,
    .assistant-checklist-ai-suggestion > div:last-child button:last-child {
      background: #ffffff !important;
      color: #8e6e3e !important;
      border: 1.5px solid #c8a064 !important;
    }
    .assistant-checklist-company-suggestion > div:last-child button:disabled,
    .assistant-checklist-ai-suggestion > div:last-child button:disabled {
      opacity: 0.55 !important;
    }
  `;
  document.head.appendChild(style);
}

function enhanceChecklistUi() {
  const panel = getPanel();
  if (!panel) return;
  installStyles();
  cleanupNativeCompanyPickerArtifacts(panel);
  enhanceCompanyRows(panel);
  enhancePersonnel(panel);
  enhanceSuggestionCards(panel);
  enhanceSummarySave(panel);
}

export function AssistantChatStep(props: AssistantChatStepProps) {
  useEffect(() => {
    enhanceChecklistUi();
    const observer = new MutationObserver(() => enhanceChecklistUi());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(enhanceChecklistUi, 400);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      document.querySelector('[data-assistant-company-sheet="true"]')?.remove();
    };
  }, []);

  return <AssistantChatStepV8 {...props} />;
}
