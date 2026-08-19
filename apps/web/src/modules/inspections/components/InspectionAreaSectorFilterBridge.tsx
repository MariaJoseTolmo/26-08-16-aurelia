import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MultiSelectTableFilter, type MultiSelectOption } from './MultiSelectTableFilter';
import { TwoStepTableSelectFilter } from './TwoStepTableSelectFilter';
import { subscribeInspectionDom } from './inspection-dom-subscription';

type SelectTarget = {
  select: HTMLSelectElement;
  host: HTMLElement;
};

type SelectBridgeConfig = {
  selector: string;
  width: number;
  allLabel: string;
  detailTitle?: (group: string) => string;
};

type MultiSelectBridgeConfig = {
  selector: string;
  width: number;
  allLabel: string;
};

const dateInputSelector = 'table thead tr:nth-child(2) td:nth-child(2) input';

function isInspectionsRoute() {
  return window.location.pathname.startsWith('/inspections');
}

function sameOptions(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameMultiOptions(left: MultiSelectOption[], right: MultiSelectOption[]) {
  return left.length === right.length && left.every((value, index) => {
    const other = right[index];
    return Boolean(other && value.value === other.value && value.label === other.label);
  });
}

function findSelectTarget(selector: string): SelectTarget | null {
  const select = document.querySelector<HTMLSelectElement>(selector);
  const host = select?.parentElement;
  return select && host ? { select, host } : null;
}

function prepareSelectTarget(target: SelectTarget) {
  if (target.host.dataset.aureliaInspectionFilterPrepared === 'true') return;
  target.host.dataset.aureliaInspectionFilterPrepared = 'true';
  target.host.style.position = 'relative';
  target.host.style.borderColor = 'transparent';
  target.host.style.background = 'transparent';
  target.host.style.boxShadow = 'none';
  target.select.style.opacity = '0';
  target.select.style.pointerEvents = 'none';
  target.select.tabIndex = -1;
}

function readSelectOptions(select: HTMLSelectElement) {
  return Array.from(select.options).map((option) => option.value.trim()).filter(Boolean);
}

function readMultiSelectOptions(select: HTMLSelectElement): MultiSelectOption[] {
  return Array.from(select.options)
    .map((option) => ({ label: option.textContent?.trim() || option.value.trim(), value: option.value.trim() }))
    .filter((option) => option.value.length > 0 && !option.value.includes(','));
}

function readSelectLabel(select: HTMLSelectElement, fallback: string) {
  return select.options[0]?.textContent?.trim() || fallback;
}

function normalizeDateInput() {
  const input = document.querySelector<HTMLInputElement>(dateInputSelector);
  if (!input) return;
  if (input.placeholder !== 'dd-mm-aa') input.placeholder = 'dd-mm-aa';
  const match = input.value.match(/^(\d{2}-\d{2})-(\d{4})$/);
  const prefix = match?.[1];
  const year = match?.[2];
  if (!prefix || !year) return;
  const normalized = `${prefix}-${year.slice(-2)}`;
  if (normalized === input.value) return;
  input.value = normalized;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function updateSelectValue(select: HTMLSelectElement, value: string, label: string) {
  if (value && !Array.from(select.options).some((option) => option.value === value)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.hidden = true;
    select.appendChild(option);
  }
  select.value = value;
}

function SelectFilterBridge({ selector, width, allLabel, detailTitle }: SelectBridgeConfig) {
  const [target, setTarget] = useState<SelectTarget | null>(null);
  const [value, setValue] = useState('');
  const [label, setLabel] = useState(allLabel);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    const syncTarget = () => {
      if (!isInspectionsRoute()) {
        setTarget(null);
        return;
      }
      const nextTarget = findSelectTarget(selector);
      normalizeDateInput();
      if (!nextTarget) {
        setTarget(null);
        return;
      }
      prepareSelectTarget(nextTarget);
      setTarget((previous) => previous?.select === nextTarget.select && previous.host === nextTarget.host ? previous : nextTarget);
      const nextValue = nextTarget.select.value;
      const nextLabel = readSelectLabel(nextTarget.select, allLabel);
      const nextOptions = readSelectOptions(nextTarget.select);
      setValue((previous) => previous === nextValue ? previous : nextValue);
      setLabel((previous) => previous === nextLabel ? previous : nextLabel);
      setOptions((previous) => sameOptions(previous, nextOptions) ? previous : nextOptions);
    };
    return subscribeInspectionDom(syncTarget);
  }, [allLabel, selector]);

  useEffect(() => {
    if (!target) return undefined;
    const syncValue = () => setValue(target.select.value);
    target.select.addEventListener('change', syncValue);
    return () => target.select.removeEventListener('change', syncValue);
  }, [target]);

  function changeValue(nextValue: string) {
    if (!target) return;
    updateSelectValue(target.select, nextValue, nextValue);
    setValue(nextValue);
    target.select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (!target) return null;
  return createPortal(
    <div className="absolute left-0 top-0 z-[1]">
      <TwoStepTableSelectFilter value={value} onChange={changeValue} width={width} allLabel={label} options={options} detailTitle={detailTitle} />
    </div>,
    target.host,
  );
}

function MultiSelectFilterBridge({ selector, width, allLabel }: MultiSelectBridgeConfig) {
  const [target, setTarget] = useState<SelectTarget | null>(null);
  const [value, setValue] = useState('');
  const [label, setLabel] = useState(allLabel);
  const [options, setOptions] = useState<MultiSelectOption[]>([]);

  useEffect(() => {
    const syncTarget = () => {
      if (!isInspectionsRoute()) {
        setTarget(null);
        return;
      }
      const nextTarget = findSelectTarget(selector);
      normalizeDateInput();
      if (!nextTarget) {
        setTarget(null);
        return;
      }
      prepareSelectTarget(nextTarget);
      setTarget((previous) => previous?.select === nextTarget.select && previous.host === nextTarget.host ? previous : nextTarget);
      const nextValue = nextTarget.select.value;
      const nextLabel = readSelectLabel(nextTarget.select, allLabel);
      const nextOptions = readMultiSelectOptions(nextTarget.select);
      setValue((previous) => previous === nextValue ? previous : nextValue);
      setLabel((previous) => previous === nextLabel ? previous : nextLabel);
      setOptions((previous) => sameMultiOptions(previous, nextOptions) ? previous : nextOptions);
    };
    return subscribeInspectionDom(syncTarget);
  }, [allLabel, selector]);

  useEffect(() => {
    if (!target) return undefined;
    const syncValue = () => setValue(target.select.value);
    target.select.addEventListener('change', syncValue);
    return () => target.select.removeEventListener('change', syncValue);
  }, [target]);

  function changeValue(nextValue: string) {
    if (!target) return;
    updateSelectValue(target.select, nextValue, nextValue || label);
    setValue(nextValue);
    target.select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (!target) return null;
  return createPortal(
    <div className="absolute left-0 top-0 z-[1]">
      <MultiSelectTableFilter value={value} onChange={changeValue} width={width} allLabel={label} options={options} />
    </div>,
    target.host,
  );
}

export function InspectionAreaSectorFilterBridge() {
  return (
    <>
      <SelectFilterBridge selector="table thead tr:nth-child(2) td:nth-child(3) select" width={175} allLabel="Todos los inspectores" />
      <SelectFilterBridge selector="table thead tr:nth-child(2) td:nth-child(4) select" width={184} allLabel="Todas las áreas" detailTitle={(group) => `Sectores de ${group}`} />
      <SelectFilterBridge selector="table thead tr:nth-child(2) td:nth-child(5) select" width={173} allLabel="Todas las empresas" />
      <SelectFilterBridge selector="table thead tr:nth-child(2) td:nth-child(6) select" width={108} allLabel="Todos" />
      <SelectFilterBridge selector="table thead tr:nth-child(2) td:nth-child(7) select" width={172} allLabel="Todas" detailTitle={(group) => group} />
      <MultiSelectFilterBridge selector="table thead tr:nth-child(2) td:nth-child(9) select" width={131} allLabel="Todos" />
    </>
  );
}
