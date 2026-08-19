import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  InspectionAnswerValue,
  InspectionType,
  type AreaResponse,
  type CompanyResponse,
  type InspectionChecklistItem,
  type InspectionChecklistTemplateResponse,
  type InspectionFindingSeverityResponse,
  type InspectionFindingTypeResponse,
  type InspectionTypeResponse,
  type SectorResponse,
  type UserResponse,
} from '@aurelia/contracts';
import {
  getCompanyUsers,
  getInspectionFindingSeverities,
  getInspectionFindingTypes,
  getInspectionTemplates,
  getInspectionTypes,
  getOrganizationAreas,
  getOrganizationSectors,
  getResponsibleCompanies,
  suggestCompany,
  suggestCorrectiveMeasure,
} from '../../../../shared/services/inspections.service';
import { useNewInspectionLocation } from '../hooks/useNewInspectionLocation';
import {
  clearNewInspectionDraftSnapshot,
  hasNewInspectionDraftProgress,
  saveNewInspectionDraftSnapshot,
  type NewInspectionDraft,
  type NewInspectionPickedAsset,
  useNewInspectionDraftStore,
} from '../state/newInspectionDraft.store';
import { ChatAureliaIcon, ChatBackIcon, ChatChecklistIcon, ChatFindingIcon, ChatMoreIcon, ChatSendIcon } from '../icons/AssistantChatIcons';

interface AssistantChatStepProps {
  onBack: () => void;
  onSave: () => void;
  onCancelInspection: () => void;
  saving: boolean;
  errorMessage: string | null;
  resumeFromDraft?: boolean;
}

type Row = InspectionChecklistItem & { index: number; sectionTitle: string };
type MsgType =
  | 'bot'
  | 'user'
  | 'typing'
  | 'error'
  | 'areas'
  | 'sectors'
  | 'types'
  | 'dates'
  | 'loc'
  | 'templatePick'
  | 'templates'
  | 'generalPhoto'
  | 'question'
  | 'itemPhoto'
  | 'findingTypes'
  | 'findingPhoto'
  | 'aiMeasure'
  | 'criticality'
  | 'sla'
  | 'findingNext'
  | 'companySuggestion'
  | 'companies'
  | 'people'
  | 'summary';

type Msg = { id: string; t: MsgType; data?: unknown };
type TypeOption = { value: InspectionType; label: string; icon: string; inspectionTypeId: string | null };
type TemplatePickData = { template: InspectionChecklistTemplateResponse; templates: InspectionChecklistTemplateResponse[] };
type FindingPhotoData = { observationId: string };
type AiMeasureData = { observationId: string; suggestion: string; fallback: boolean };
type CompanySuggestionData = { company: CompanyResponse; companies: CompanyResponse[]; suggestion: string; fallback: boolean };
type CriticalityData = { observationId: string; severities: InspectionFindingSeverityResponse[] };
type SlaData = { observationId: string; initialDays: number };
type PeopleData = { users: UserResponse[]; suggestedUserId: string | null };
type PhotoReceipt = { title: string; sub: string };

const STEP_LABELS = ['Identificación', 'Observación', 'Medida y criticidad', 'Más observaciones', 'Empresa y personal', 'Resumen', 'Completado'];
const STEP_PCT = ['14%', '28%', '42%', '57%', '71%', '86%', '100%'];
const FALLBACK_MEASURE = 'Corregir la condición identificada y registrar evidencia de cierre para validación.';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function currentTime() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export function firstName(value: string) {
  return value.split(' ')[0] || value;
}

function dates() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - index);
    return `${String(day.getDate()).padStart(2, '0')}-${String(day.getMonth() + 1).padStart(2, '0')}-${day.getFullYear()}`;
  });
}

function rowsOf(template: InspectionChecklistTemplateResponse | null): Row[] {
  if (!template) return [];
  return template.sections
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .flatMap((section) =>
      section.items
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => ({ ...item, sectionTitle: section.title, index: 0 })),
    )
    .map((item, index) => ({ ...item, index }));
}

function checklistTypeId(types: InspectionTypeResponse[]) {
  return types.find((item) => item.code === InspectionType.REGULATORY)?.id ?? null;
}

function answerLabel(value?: InspectionAnswerValue) {
  if (value === InspectionAnswerValue.COMPLIANT) return 'SÍ';
  if (value === InspectionAnswerValue.NOT_COMPLIANT) return 'NO';
  if (value === InspectionAnswerValue.NOT_APPLICABLE) return 'N/A';
  return 'Pendiente';
}

function parseSlaDays(label: string | null | undefined, fallback = 7) {
  const value = Number((label ?? '').match(/(\d+)/)?.[1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function receiptText(fileName: string) {
  const now = new Date();
  return `${fileName} · GPS ✓ · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function defaultSlaLabel(days: number) {
  return `${days} Días`;
}

function fileAsset(file: File): NewInspectionPickedAsset {
  return { name: file.name, file };
}

function suggestedResponsible(users: UserResponse[]) {
  return users.find((user) => (user.position ?? '').toLowerCase().includes('supervisor')) ?? users[0] ?? null;
}

function matchSuggestedCompany(companies: CompanyResponse[], suggestion: string) {
  const normalizedSuggestion = normalizeText(suggestion);
  return companies.find((company) => normalizedSuggestion.includes(normalizeText(company.name)) || normalizeText(company.name).includes(normalizedSuggestion)) ?? null;
}

function BotMark() {
  return <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#C8A064] text-[#001E39]"><ChatAureliaIcon className="h-[18px] w-[20px]" /></div>;
}

function BotBubble({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[10px] flex w-full items-end gap-[7px]">
      <BotMark />
      <div className="max-w-[286px] rounded-[16px] border border-[#E3E3E3] bg-white px-[13px] py-[11px] shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
        <div>{children}</div>
        <p className="mt-[7px] text-[12px] leading-none text-[#ACACAC]">{currentTime()}</p>
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[10px] ml-auto max-w-[78%] rounded-[16px] bg-[#002659] px-[13px] py-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="text-[13px] font-semibold leading-[18px] text-white">{children}</div>
      <p className="mt-[6px] text-[11px] leading-none text-[rgba(255,255,255,0.5)]">{currentTime()}</p>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="mb-[10px] flex w-full items-end gap-[7px]">
      <BotMark />
      <div className="inline-flex items-center gap-[4px] rounded-[14px] border border-[#D3D7DE] bg-white px-[14px] py-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <span className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#9CA3AF]" />
        <span className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:150ms]" />
        <span className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function ChipRow({ chips, selected, onSelect, variant = 'gold' }: { chips: string[]; selected?: string | null; onSelect: (label: string) => void; variant?: 'gold' | 'navy' }) {
  return (
    <div className="mb-[10px] ml-[33px] flex flex-wrap gap-[8px]">
      {chips.map((chip) => {
        const active = selected === chip;
        const activeClass = variant === 'navy' ? 'border-[#002659] bg-[#002659] text-white' : 'border-[#C8A064] bg-[#C8A064] text-[#001E39]';
        return <button key={chip} type="button" onClick={() => onSelect(chip)} className={`min-h-[28px] rounded-full border-[1.5px] px-[13.5px] py-[5px] text-[13px] font-bold leading-[16px] ${active ? activeClass : 'border-[#D1D1D1] bg-white text-[#646464]'}`}>{chip}</button>;
      })}
    </div>
  );
}

function QuickIcon({ icon }: { icon?: string }) {
  if (icon === 'search') return <ChatFindingIcon className="h-[10px] w-[13px]" />;
  if (icon === 'clipboard-check' || icon === 'check' || icon === 'list') return <ChatChecklistIcon className="h-[10px] w-[13px]" />;
  if (icon === 'plus') return <span className="text-[16px] leading-none">+</span>;
  if (icon === 'arrow-right') return <span className="text-[15px] leading-none">→</span>;
  return null;
}

function QuickOpts({ options, selected, onSelect }: { options: Array<{ value: string; label: string; icon?: string }>; selected?: string | null; onSelect: (value: string) => void }) {
  return (
    <div className="mb-[10px] ml-[33px] flex flex-wrap gap-[6px]">
      {options.map((option) => {
        const active = selected === option.value || selected === option.label;
        return <button key={option.value} type="button" onClick={() => onSelect(option.value)} className={`inline-flex min-h-[32px] items-center gap-[8px] rounded-[9999px] border-[1.5px] px-[15.5px] py-[7px] text-[14px] font-bold leading-[18px] ${active ? 'border-[#002659] bg-[#002659] text-white' : 'border-[#D1D1D1] bg-white text-[#24588B]'}`}><QuickIcon icon={option.icon} />{option.label}</button>;
      })}
    </div>
  );
}

function ErrorBubble({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mb-[10px] ml-[33px] rounded-[12px] border border-[#F3A7B8] bg-[#FFD4E0] px-[12px] py-[10px] text-[#7A0E23]">
      <p className="text-[12px] font-semibold">{message}</p>
      {onRetry ? <button type="button" className="mt-[8px] rounded-[8px] bg-white px-[10px] py-[6px] text-[11px] font-bold" onClick={onRetry}>Reintentar</button> : null}
    </div>
  );
}

function PhotoStepWidget({ resolved, receipt, onCapture, onSkip }: { resolved: boolean; receipt?: PhotoReceipt; onCapture: (asset: NewInspectionPickedAsset) => void; onSkip: () => void }) {
  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    onCapture(fileAsset(file));
    event.target.value = '';
  }

  return (
    <div className="mb-[10px] ml-[33px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]">
      {resolved && receipt ? (
        <div className="flex min-h-[58px] items-center gap-[10px] rounded-[10px] bg-[#35A137] px-[12px] py-[8px] text-white">
          <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.24)]">📷</span>
          <span className="min-w-0"><span className="block truncate text-[13px] font-bold">{receipt.title}</span><span className="block truncate text-[11px] text-[rgba(255,255,255,0.78)]">{receipt.sub}</span></span>
        </div>
      ) : (
        <div className="grid gap-[8px]">
          <label className="flex min-h-[84px] cursor-pointer items-center rounded-[10px] border-[1.5px] border-dashed border-[#D1D1D1] bg-[#F6FAFF] px-[12px] py-[10px]">
            <input type="file" className="hidden" accept="image/*" disabled={resolved} onChange={onFile} />
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[8px] bg-white text-[16px]">📷</span>
            <span className="ml-[10px] flex min-w-0 flex-col"><span className="truncate text-[13px] font-semibold text-[#646464]">Tomar foto o galería</span><span className="mt-[2px] text-[11px] text-[#B7B7B7]">Fecha, hora y GPS automáticos</span></span>
          </label>
          <button type="button" className="h-[34px] rounded-[10px] border border-[#E3E3E3] text-[12px] font-bold text-[#646464]" onClick={onSkip}>Omitir</button>
        </div>
      )}
    </div>
  );
}

function AiProposalCard({ suggestion, fallback, accepted, onAccept, onEdit }: { suggestion: string; fallback: boolean; accepted: boolean; onAccept: () => void; onEdit: () => void }) {
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[14px] border border-[#D8E0EA] bg-white p-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"><div className="flex items-center justify-between gap-[8px]"><p className="text-[12px] font-bold text-[#002659]">Medida correctiva sugerida</p>{fallback ? <span className="rounded-full bg-[#FFF4DA] px-[8px] py-[3px] text-[10px] font-bold text-[#8E6E3E]">Base</span> : <span className="rounded-full bg-[#DDF7F3] px-[8px] py-[3px] text-[10px] font-bold text-[#006153]">IA</span>}</div><p className="mt-[8px] text-[13px] leading-[18px] text-[#131313]">{suggestion}</p><div className="mt-[10px] flex gap-[8px]"><button type="button" disabled={accepted} onClick={onAccept} className="h-[38px] flex-1 rounded-[10px] bg-[#35A137] text-[12px] font-bold text-white disabled:opacity-50">Aceptar medida</button><button type="button" disabled={accepted} onClick={onEdit} className="h-[38px] flex-1 rounded-[10px] border border-[#C8A064] bg-white text-[12px] font-bold text-[#8E6E3E] disabled:opacity-50">Editar</button></div></div>;
}

function CompanySuggestionCard({ company, suggestion, fallback, accepted, onAccept, onOther }: { company: CompanyResponse; suggestion: string; fallback: boolean; accepted: boolean; onAccept: () => void; onOther: () => void }) {
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[14px] border border-[#D8E0EA] bg-white p-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"><div className="flex items-center justify-between gap-[8px]"><p className="text-[12px] font-bold text-[#002659]">Empresa responsable sugerida</p>{fallback ? <span className="rounded-full bg-[#FFF4DA] px-[8px] py-[3px] text-[10px] font-bold text-[#8E6E3E]">Base</span> : <span className="rounded-full bg-[#DDF7F3] px-[8px] py-[3px] text-[10px] font-bold text-[#006153]">IA</span>}</div><p className="mt-[8px] text-[15px] font-bold leading-[20px] text-[#131313]">{company.name}</p>{suggestion && normalizeText(suggestion) !== normalizeText(company.name) ? <p className="mt-[5px] text-[11px] leading-[16px] text-[#646464]">Sugerencia IA: {suggestion}</p> : null}<div className="mt-[10px] flex gap-[8px]"><button type="button" disabled={accepted} onClick={onAccept} className="h-[38px] flex-1 rounded-[10px] bg-[#35A137] text-[12px] font-bold text-white disabled:opacity-50">Confirmar empresa</button><button type="button" disabled={accepted} onClick={onOther} className="h-[38px] flex-1 rounded-[10px] border border-[#C8A064] bg-white text-[12px] font-bold text-[#8E6E3E] disabled:opacity-50">Elegir otra</button></div></div>;
}

function LocationWidget({ captured, label, accuracy, capturing, resolved, onCapture }: { captured: boolean; label: string; accuracy: string; capturing: boolean; resolved: boolean; onCapture: () => void }) {
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><p className="text-[12px] font-bold text-[#131313]">Ubicación de la inspección</p><p className="mt-[8px] text-[11px] leading-[17px] text-[#646464]">La ubicación es obligatoria para continuar.</p><button type="button" className={`mt-[8px] h-[44px] w-full rounded-[10px] text-[12px] font-bold text-white ${captured ? 'bg-[#3A9B3A]' : 'bg-[#C8A064]'}`} onClick={onCapture} disabled={capturing || resolved}>{capturing ? 'Capturando ubicación...' : captured ? 'Ubicación capturada' : 'Capturar ubicación'}</button><div className="mt-[8px] rounded-[8px] border border-[#E3E3E3] bg-[#F4F6F9] px-[12px] py-[8px]"><p className="text-[11px] font-semibold text-[#131313]">{label}</p><p className="mt-[2px] text-[10px] text-[#646464]">{accuracy}</p></div></div>;
}

function QuestionCard({ row, selected, resolved, onAnswer }: { row: Row; selected?: InspectionAnswerValue; resolved: boolean; onAnswer: (value: InspectionAnswerValue) => void }) {
  const options = [{ value: InspectionAnswerValue.COMPLIANT, label: 'SÍ' }, { value: InspectionAnswerValue.NOT_COMPLIANT, label: 'NO' }, { value: InspectionAnswerValue.NOT_APPLICABLE, label: 'N/A' }];
  return <div className="mb-[10px] ml-[33px] mr-[12px] overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white"><div className="flex items-center justify-between gap-[8px] bg-[#002659] px-[12px] py-[7px] text-white"><p className="min-w-0 flex-1 truncate text-[12px] font-bold">{row.sectionTitle}</p><p className="text-[11px] font-bold">{row.code}</p></div><div className="p-[12px]"><div className="flex items-start gap-[8px]"><span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#001E39] text-[11px] font-bold text-white">{row.index + 1}</span><p className="flex-1 text-[13px] font-semibold leading-[19px] text-[#131313]">{row.question}</p></div>{row.guidance ? <p className="mt-[8px] text-[11px] leading-[16px] text-[#646464]">{row.guidance}</p> : null}<div className="mt-[10px] flex gap-[8px]">{options.map((option) => { const active = selected === option.value; return <button key={option.value} type="button" disabled={resolved || Boolean(selected)} onClick={() => onAnswer(option.value)} className={`h-[36px] flex-1 rounded-full border-[1.5px] text-[13px] font-bold ${active ? 'border-[#002659] bg-[#002659] text-white' : 'border-[#D1D1D1] bg-white text-[#24588B] disabled:opacity-45'}`}>{option.label}</button>; })}</div></div></div>;
}

function CriticalityCard({ severities, resolved, onSelect }: { severities: InspectionFindingSeverityResponse[]; resolved: boolean; onSelect: (severity: InspectionFindingSeverityResponse) => void }) {
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><p className="text-[14px] font-bold text-[#131313]">Criticidad</p><div className="mt-[8px] grid gap-[8px]">{severities.slice().sort((left, right) => left.sortOrder - right.sortOrder).map((severity) => <button key={severity.id} type="button" disabled={resolved} onClick={() => onSelect(severity)} className="rounded-[10px] border border-[#E3E3E3] bg-[#F6FAFF] px-[12px] py-[10px] text-left disabled:opacity-50"><span className="block text-[13px] font-bold text-[#131313]">{severity.name}</span><span className="mt-[2px] block text-[11px] leading-[15px] text-[#646464]">{severity.description ?? 'Sin descripción'}</span></button>)}</div></div>;
}

function SlaConfirmWidget({ initialDays, resolved, onSave }: { initialDays: number; resolved: boolean; onSave: (days: number) => void }) {
  const [days, setDays] = useState(String(initialDays));
  const numericDays = Number(days);
  const valid = Number.isFinite(numericDays) && numericDays > 0;
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><p className="text-[13px] font-bold text-[#131313]">Confirma el SLA</p><div className="mt-[8px] flex items-center gap-[8px]"><input value={days} disabled={resolved} onChange={(event) => setDays(event.target.value)} className="h-[40px] w-[90px] rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[10px] text-[13px] font-bold text-[#131313] outline-none" /><span className="text-[12px] text-[#646464]">días</span><button type="button" disabled={resolved || !valid} onClick={() => onSave(numericDays)} className="ml-auto h-[40px] rounded-[10px] bg-[#C8A064] px-[12px] text-[12px] font-bold text-white disabled:opacity-50">Guardar observación</button></div></div>;
}

function PersonnelPicker({ users, suggestedUserId, confirmed, onConfirm }: { users: UserResponse[]; suggestedUserId: string | null; confirmed: boolean; onConfirm: (selected: UserResponse[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(suggestedUserId ? [suggestedUserId] : []);
  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><div className="flex flex-wrap gap-[8px]">{users.map((user) => { const active = selectedIds.includes(user.id); return <button key={user.id} type="button" disabled={confirmed} onClick={() => setSelectedIds((current) => current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id])} className={`rounded-full border-[1.5px] px-[12px] py-[6px] text-[11px] font-semibold ${active ? 'border-[#052B63] bg-[#052B63] text-white' : 'border-[#D1D1D1] bg-white text-[#646464]'}`}>{user.id === suggestedUserId ? '★ ' : ''}{user.fullName}</button>; })}</div><button type="button" disabled={confirmed || selectedUsers.length === 0} onClick={() => onConfirm(selectedUsers)} className="mt-[10px] h-[42px] w-full rounded-[10px] bg-[#C8A064] text-[13px] font-bold text-white disabled:opacity-50">Confirmar personal</button></div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex border-b border-[#E3E3E3] px-[12px] py-[8px]"><span className="w-[96px] text-[12px] text-[#646464]">{label}</span><span className="flex-1 text-[12px] font-bold text-[#131313]">{value || '—'}</span></div>;
}

function SummaryCard({ rows, onSave, saving, errorMessage, saveLabel }: { rows: Row[]; onSave: () => void; saving: boolean; errorMessage: string | null; saveLabel: string }) {
  const state = useNewInspectionDraftStore();
  const noCount = rows.filter((row) => state.answersByItemId[row.id] === InspectionAnswerValue.NOT_COMPLIANT).length;
  return <div className="mb-[10px] ml-[33px] mr-[12px] grid gap-[10px]"><div className="overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white"><div className="flex items-center justify-between bg-[#002659] px-[12px] py-[7px] text-white"><p className="text-[12px] font-bold">Datos generales</p><span className="rounded bg-[#DDF7F3] px-[6px] py-[2px] text-[9px] font-bold text-[#006153]">{state.inspectionType === InspectionType.ENVIRONMENTAL ? 'Hallazgo' : 'Checklist'}</span></div><SummaryRow label="Inspector" value={state.inspectorName} /><SummaryRow label="Área · Sector" value={[state.areaName, state.sectorName].filter(Boolean).join(' · ')} /><SummaryRow label="Fecha" value={state.inspectionDate} /><SummaryRow label="Ubicación" value={state.locationLabel} /><SummaryRow label="Registro" value={state.findingTypeLabel ?? state.templateName ?? '—'} /><SummaryRow label="Empresa EECC" value={state.findingCompanyName ?? (noCount ? 'Pendiente' : 'No aplica')} /><SummaryRow label="Responsables" value={state.findingResponsibleIds.length ? `${state.findingResponsibleIds.length} seleccionados` : '—'} /></div>{state.inspectionType !== InspectionType.ENVIRONMENTAL ? <div className="overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white"><div className="bg-[#002659] px-[12px] py-[7px] text-white"><p className="text-[12px] font-bold">{rows.length} Ítems · {noCount} hallazgos</p></div><div className="grid gap-[6px] p-[12px]">{rows.map((row) => <div key={row.id} className="flex justify-between gap-[8px] text-[12px]"><span className="flex-1 text-[#131313]">{row.index + 1}. {row.code}</span><span className="font-bold text-[#002659]">{answerLabel(state.answersByItemId[row.id])}</span></div>)}</div></div> : null}{errorMessage ? <p className="rounded-[8px] bg-[#FFD4E0] px-[10px] py-[8px] text-[12px] font-semibold text-[#7A0E23]">{errorMessage}</p> : null}<button type="button" onClick={onSave} disabled={saving} className="h-[48px] rounded-[14px] bg-[#35A137] text-[15px] font-bold text-white disabled:opacity-70">{saving ? 'Guardando…' : saveLabel}</button></div>;
}

function ChatInput({ disabled, value, onChange, onSend }: { disabled: boolean; value: string; onChange: (value: string) => void; onSend: () => void }) {
  return <div className="border-t border-[#E3E3E3] bg-white px-[12px] pb-[8px] pt-[9px]"><div className="flex w-full gap-[8px]"><input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSend(); }} placeholder="O escribe aquí…" className="h-[41px] flex-1 rounded-full border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] px-[15.5px] text-[15px] text-[#131313] outline-none placeholder:text-[#ACACAC] disabled:text-[#ACACAC]" /><button type="button" disabled={disabled || !value.trim()} onClick={onSend} className="flex h-[38px] min-w-[38px] items-center justify-center rounded-full bg-[#C8A064] text-[#001E39] disabled:opacity-50"><ChatSendIcon /></button></div><div className="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>;
}

export function AssistantChatStep({ onBack, onSave, onCancelInspection, saving, errorMessage, resumeFromDraft = false }: AssistantChatStepProps) {
  const draft = useNewInspectionDraftStore();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const retries = useRef<Map<string, () => void>>(new Map());
  const sequence = useRef(0);
  const booted = useRef(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [resolvedMessages, setResolvedMessages] = useState<Set<string>>(new Set());
  const [confirmedPeople, setConfirmedPeople] = useState<Set<string>>(new Set());
  const [photoReceiptByMessageId, setPhotoReceiptByMessageId] = useState<Record<string, PhotoReceipt>>({});
  const [waiting, setWaiting] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [checklistRows, setChecklistRows] = useState<Row[]>([]);
  const { captureLocation, capturing, locationError } = useNewInspectionLocation();
  const safeStep = Math.max(0, Math.min(step, STEP_LABELS.length - 1));

  function push(type: MsgType, data?: unknown) { sequence.current += 1; const message = { id: String(sequence.current), t: type, data }; setMessages((prev) => [...prev, message]); return message.id; }
  function clearTyping() { setMessages((prev) => prev.filter((message) => message.t !== 'typing')); }
  function markResolved(messageId: string) { setResolvedMessages((prev) => new Set(prev).add(messageId)); }
  function pushError(message: string, retry?: () => void) { const messageId = push('error', { message }); if (retry) retries.current.set(messageId, retry); }

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
  useEffect(() => useNewInspectionDraftStore.subscribe((state) => saveNewInspectionDraftSnapshot(state)), []);
  useEffect(() => { if (booted.current) return; booted.current = true; if (resumeFromDraft && hasNewInspectionDraftProgress(useNewInspectionDraftStore.getState())) { void resumeChat(); return; } startFresh(); }, []);

  function resetChatState() { retries.current.clear(); setMessages([]); setResolvedMessages(new Set()); setConfirmedPeople(new Set()); setPhotoReceiptByMessageId({}); setWaiting(null); setInputValue(''); setChecklistRows([]); setStep(0); }
  function startFresh() { clearNewInspectionDraftSnapshot(); useNewInspectionDraftStore.getState().reset(); resetChatState(); void beginAreaSelection(); }

  async function resumeChat() {
    resetChatState();
    const state = useNewInspectionDraftStore.getState();
    push('bot', `Retomé tu borrador de ${state.inspectionTypeLabel}. Continuemos desde el último punto pendiente.`);
    if (!state.areaId) { await beginAreaSelection(); return; }
    push('user', state.areaName ?? 'Área seleccionada');
    if (!state.sectorId) { await beginSectorSelection(state.areaId); return; }
    push('user', state.sectorName ?? 'Sector seleccionado');
    if (!state.locationCaptured) { push('bot', 'Capturemos la ubicación obligatoria.'); push('loc'); return; }
    push('user', `Ubicación capturada · ${state.locationAccuracyLabel}`);
    if (state.inspectionType === InspectionType.ENVIRONMENTAL) { await resumeFinding(state); return; }
    await resumeChecklist(state);
  }

  async function resumeChecklist(state: NewInspectionDraft) {
    if (!state.templateId) { await askChecklistTemplate(); return; }
    push('user', state.templateName ?? 'Plantilla seleccionada');
    const template = await findTemplate(state.templateId);
    if (!template) { await askChecklistTemplate(); return; }
    const rows = rowsOf(template);
    setChecklistRows(rows);
    if (!state.generalPhoto) { push('bot', 'Adjunta la foto general obligatoria.'); push('generalPhoto'); return; }
    push('user', `Foto general registrada · ${state.generalPhoto.name}`);
    const pendingNo = rows.find((row) => {
      if (state.answersByItemId[row.id] !== InspectionAnswerValue.NOT_COMPLIANT) return false;
      const detail = state.detailsByItemId[row.id] ?? {};
      return !detail.detectedCondition?.trim() || !detail.correctiveAction?.trim() || !detail.evidence;
    });
    if (pendingNo) {
      const detail = state.detailsByItemId[pendingNo.id] ?? {};
      if (!detail.detectedCondition?.trim()) { push('bot', 'Describe la condición detectada.'); setWaiting(`check-cond:${pendingNo.id}`); return; }
      if (!detail.correctiveAction?.trim()) { push('bot', 'Indica la medida correctiva propuesta.'); setWaiting(`check-measure:${pendingNo.id}`); return; }
      push('bot', 'Adjunta foto para este hallazgo.'); push('itemPhoto', pendingNo); return;
    }
    const next = rows.find((row) => !state.answersByItemId[row.id]);
    if (next) { push('bot', `Responderemos ${rows.length} ítems.`); push('question', next); return; }
    await finishChecklistItems(rows);
  }

  async function resumeFinding(state: NewInspectionDraft) {
    if (!state.findingTypeId) { await askFindingType(); return; }
    push('user', state.findingTypeLabel ?? 'Tipo de hallazgo seleccionado');
    const pending = state.findingObservations.find((item) => !item.saved) ?? null;
    if (pending) {
      if (!pending.detectedCondition.trim()) { push('bot', 'Describe la condición detectada.'); setWaiting(`finding-cond:${pending.id}`); return; }
      if (!pending.evidence) { push('bot', 'Adjunta fotografía del hallazgo.'); push('findingPhoto', { observationId: pending.id } as FindingPhotoData); return; }
      if (!pending.correctiveAction.trim()) { push('bot', 'Escribe o confirma la medida correctiva.'); setWaiting(`finding-measure:${pending.id}`); return; }
      if (!pending.severityId) { await askFindingCriticality(pending.id); return; }
      push('bot', 'Confirma el SLA para esta observación.'); push('sla', { observationId: pending.id, initialDays: parseSlaDays(pending.severityClosureTimeLabel, 7) } as SlaData); return;
    }
    const savedCount = state.findingObservations.filter((item) => item.saved).length;
    if (savedCount === 0) { await startFindingObservation(); return; }
    if (!state.findingCompanyId) { push('bot', '¿Deseas agregar otra observación o continuar con empresa y personal?'); push('findingNext', { observationId: 'resume' }); return; }
    push('user', `${state.findingCompanyName ?? 'Empresa'} confirmada`);
    if (state.findingResponsibleIds.length === 0) { await askResponsiblePeople(state.findingCompanyId); return; }
    await showSummary();
  }

  async function findTemplate(templateId: string) {
    try {
      const templates = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'templates'], queryFn: getInspectionTemplates, staleTime: 300000 });
      return templates.find((template) => template.id === templateId) ?? null;
    } catch {
      pushError('No pude cargar la plantilla guardada.', () => { void resumeChecklist(useNewInspectionDraftStore.getState()); });
      return null;
    }
  }

  async function beginAreaSelection() { push('typing'); try { const areas = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'areas'], queryFn: getOrganizationAreas, staleTime: 300000 }); clearTyping(); const name = useNewInspectionDraftStore.getState().inspectorName; push('bot', `¡Hola, ${name}! 👋 Soy AurelIA. Voy a ayudarte a registrar esta inspección de forma rápida. ¿En qué área estás hoy?`); push('areas', areas); } catch { clearTyping(); pushError('No pude cargar áreas.', () => { void beginAreaSelection(); }); } }
  async function beginSectorSelection(areaId: string) { push('typing'); try { const sectors = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'sectors', areaId], queryFn: () => getOrganizationSectors(areaId), staleTime: 300000 }); clearTyping(); const area = useNewInspectionDraftStore.getState().areaName ?? 'el área'; push('bot', `Perfecto, ${area} ✓. Ahora el sector — ¿en cuál específicamente?`); push('sectors', sectors); } catch { clearTyping(); pushError('No pude cargar sectores.', () => { void beginSectorSelection(areaId); }); } }
  async function selectArea(area: AreaResponse, messageId: string) { markResolved(messageId); draft.setArea(area.id, area.name); push('user', area.name); await beginSectorSelection(area.id); }
  async function selectSector(sector: SectorResponse, messageId: string) { markResolved(messageId); draft.setSector(sector.id, sector.name); push('user', sector.name); push('typing'); try { const types = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'inspection-types'], queryFn: getInspectionTypes, staleTime: 300000 }); clearTyping(); setStep(0); const state = useNewInspectionDraftStore.getState(); push('bot', `${state.areaName ?? 'Área'} · ${sector.name} ✓. ¿Qué tipo de inspección es?`); push('types', [{ value: InspectionType.ENVIRONMENTAL, label: 'Hallazgo', icon: 'search', inspectionTypeId: types.find((item) => item.code === InspectionType.ENVIRONMENTAL)?.id ?? null }, { value: InspectionType.REGULATORY, label: 'Checklist normativo', icon: 'clipboard-check', inspectionTypeId: checklistTypeId(types) }] as TypeOption[]); } catch { clearTyping(); pushError('No pude cargar tipos.', () => { void selectSector(sector, messageId); }); } }
  async function selectInspectionType(value: InspectionType, inspectionTypeId: string | null, label: string, messageId: string) { markResolved(messageId); draft.setInspectionType(value, label); push('user', label); if (!inspectionTypeId) { pushError('No se encontró este tipo de inspección en catálogo.'); return; } await sleep(200); push('bot', 'Selecciona la fecha de inspección.'); push('dates', dates()); }
  async function selectInspectionDate(value: string, messageId: string) { markResolved(messageId); draft.setInspectionDate(value); push('user', value); await sleep(200); push('bot', 'Capturemos la ubicación obligatoria.'); push('loc'); }
  async function captureChatLocation(messageId: string) { const ok = await captureLocation(); if (!ok) { pushError(locationError ?? 'No se pudo capturar la ubicación.', () => { void captureChatLocation(messageId); }); return; } markResolved(messageId); push('user', `Ubicación capturada · ${useNewInspectionDraftStore.getState().locationAccuracyLabel}`); if (useNewInspectionDraftStore.getState().inspectionType === InspectionType.ENVIRONMENTAL) { await askFindingType(); return; } await askChecklistTemplate(); }
  async function askChecklistTemplate() { push('typing'); try { const templates = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'templates'], queryFn: getInspectionTemplates, staleTime: 300000 }); clearTyping(); if (!templates.length) { pushError('No hay plantillas normativas disponibles.'); return; } setStep(1); push('bot', 'Te sugiero esta plantilla normativa.'); push('templatePick', { template: templates[0], templates } as TemplatePickData); } catch { clearTyping(); pushError('No pude cargar plantillas normativas.', () => { void askChecklistTemplate(); }); } }
  async function selectChecklistTemplate(template: InspectionChecklistTemplateResponse, messageId: string) { markResolved(messageId); const rows = rowsOf(template); setChecklistRows(rows); draft.setTemplate({ id: template.id, name: template.name, code: template.code, itemsCount: rows.length }); push('user', template.name); await sleep(200); push('bot', 'Adjunta la foto general obligatoria.'); push('generalPhoto'); }
  function openChecklistTemplates(templates: InspectionChecklistTemplateResponse[], messageId: string) { markResolved(messageId); push('bot', 'Elige una plantilla.'); push('templates', templates); }
  async function handleChecklistGeneralPhoto(asset: NewInspectionPickedAsset, messageId: string) { setPhotoReceiptByMessageId((prev) => ({ ...prev, [messageId]: { title: 'Foto adjunta ✓', sub: receiptText(asset.name) } })); markResolved(messageId); draft.setGeneralPhoto(asset); push('user', 'Foto general registrada'); await sleep(200); const first = checklistRows[0]; if (!first) { pushError('La plantilla seleccionada no tiene ítems.'); return; } setStep(1); push('bot', `Responderemos ${checklistRows.length} ítems.`); push('question', first); }
  async function answerChecklistItem(row: Row, value: InspectionAnswerValue, messageId: string) { markResolved(messageId); draft.setAnswer(row.id, value); push('user', `${row.code}: ${answerLabel(value)}`); if (value === InspectionAnswerValue.NOT_COMPLIANT) { await sleep(200); push('bot', 'Describe la condición detectada.'); setWaiting(`check-cond:${row.id}`); return; } await goToNextChecklistQuestion(row.index); }
  async function handleChecklistCondition(text: string, itemId: string) { draft.setItemDetail(itemId, { detectedCondition: text }); push('user', text); await sleep(200); push('bot', 'Indica la medida correctiva propuesta.'); setWaiting(`check-measure:${itemId}`); }
  async function handleChecklistMeasure(text: string, itemId: string) { draft.setItemDetail(itemId, { correctiveAction: text }); push('user', text); const row = checklistRows.find((item) => item.id === itemId); if (!row) return; await sleep(200); push('bot', 'Adjunta foto para este hallazgo.'); push('itemPhoto', row); setWaiting(null); }
  async function handleChecklistItemPhoto(asset: NewInspectionPickedAsset, row: Row, messageId: string) { setPhotoReceiptByMessageId((prev) => ({ ...prev, [messageId]: { title: 'Foto adjunta ✓', sub: receiptText(asset.name) } })); markResolved(messageId); draft.setItemDetail(row.id, { evidence: asset }); push('user', `Foto registrada · ${row.code}`); await goToNextChecklistQuestion(row.index); }
  async function goToNextChecklistQuestion(index: number) { await sleep(200); const next = checklistRows[index + 1]; if (next) { push('question', next); return; } await finishChecklistItems(checklistRows); }
  async function finishChecklistItems(rows: Row[]) { const state = useNewInspectionDraftStore.getState(); const hasFindings = rows.some((row) => state.answersByItemId[row.id] === InspectionAnswerValue.NOT_COMPLIANT); if (!hasFindings) { setStep(5); push('bot', 'Checklist completo sin hallazgos. Se cerrará automáticamente al guardar.'); await showSummary(); return; } push('bot', 'Hay ítems no conformes. Debemos asignar empresa y responsables.'); await askCompany('responsible-companies-checklist'); }
  async function askFindingType() { push('typing'); try { const findingTypes = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'finding-types'], queryFn: getInspectionFindingTypes, staleTime: 300000 }); clearTyping(); if (!findingTypes.length) { pushError('No hay tipos de hallazgo en catálogos.'); return; } setStep(1); push('bot', 'Selecciona el tipo de hallazgo.'); push('findingTypes', findingTypes); } catch { clearTyping(); pushError('No pude cargar tipos de hallazgo.', () => { void askFindingType(); }); } }
  async function selectFindingType(type: InspectionFindingTypeResponse, messageId: string) { markResolved(messageId); draft.setFindingType(type.id, type.name); push('user', type.name); await startFindingObservation(); }
  async function startFindingObservation() { setStep(1); const observationId = draft.addFindingObservation(); await sleep(200); push('bot', 'Describe la condición detectada.'); setWaiting(`finding-cond:${observationId}`); }
  async function handleFindingCondition(text: string, observationId: string) { draft.updateFindingObservation(observationId, { detectedCondition: text }); push('user', text); await sleep(200); push('bot', 'Adjunta fotografía del hallazgo.'); push('findingPhoto', { observationId } as FindingPhotoData); setWaiting(null); }
  async function handleFindingPhoto(asset: NewInspectionPickedAsset, observationId: string, messageId: string) { setPhotoReceiptByMessageId((prev) => ({ ...prev, [messageId]: { title: 'Foto adjunta ✓', sub: receiptText(asset.name) } })); markResolved(messageId); draft.updateFindingObservation(observationId, { evidence: asset }); push('user', 'Foto del hallazgo registrada'); const state = useNewInspectionDraftStore.getState(); const observation = state.findingObservations.find((item) => item.id === observationId); if (!observation) return; push('typing'); let suggestion = FALLBACK_MEASURE; let fallback = true; try { const response = await suggestCorrectiveMeasure({ area: state.areaName ?? '', sector: state.sectorName ?? '', description: observation.detectedCondition }); suggestion = response.suggestion; fallback = response.fallback; } catch { suggestion = FALLBACK_MEASURE; fallback = true; } clearTyping(); push('bot', 'Analicé el contexto del hallazgo. Te propongo una medida correctiva.'); push('aiMeasure', { observationId, suggestion, fallback } as AiMeasureData); }
  async function acceptAiMeasure(messageId: string, data: AiMeasureData) { markResolved(messageId); draft.updateFindingObservation(data.observationId, { correctiveAction: data.suggestion }); push('user', '✓ Medida aceptada'); await askFindingCriticality(data.observationId); }
  function editAiMeasure(messageId: string, data: AiMeasureData) { markResolved(messageId); push('bot', 'Escribe la medida correctiva que aplicarás.'); setWaiting(`finding-measure:${data.observationId}`); }
  async function handleFindingMeasure(text: string, observationId: string) { draft.updateFindingObservation(observationId, { correctiveAction: text }); push('user', text); await askFindingCriticality(observationId); }
  async function askFindingCriticality(observationId: string) { setStep(2); push('typing'); try { const severities = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'finding-severities'], queryFn: getInspectionFindingSeverities, staleTime: 300000 }); clearTyping(); if (!severities.length) { pushError('No hay criticidades en catálogos para continuar.'); return; } push('bot', 'Definamos la criticidad del hallazgo.'); push('criticality', { observationId, severities } as CriticalityData); } catch { clearTyping(); pushError('No pude cargar criticidades.', () => { void askFindingCriticality(observationId); }); } }
  async function completeFindingCriticality(observationId: string, severity: InspectionFindingSeverityResponse, messageId: string) { markResolved(messageId); draft.updateFindingObservation(observationId, { severityId: severity.id, severityLabel: severity.name, severityClosureTimeLabel: severity.closureTimeLabel }); await sleep(200); push('bot', 'Confirma el SLA para esta observación.'); push('sla', { observationId, initialDays: parseSlaDays(severity.closureTimeLabel, 7) } as SlaData); }
  async function saveFindingObservation(messageId: string, data: SlaData, days: number) { markResolved(messageId); const state = useNewInspectionDraftStore.getState(); const target = state.findingObservations.find((item) => item.id === data.observationId); if (!target) return; if (!target.detectedCondition.trim() || !target.correctiveAction.trim() || !target.evidence || !target.severityId) { pushError('La observación está incompleta. Debe incluir condición, medida, foto y criticidad.'); return; } draft.updateFindingObservation(data.observationId, { severityClosureTimeLabel: defaultSlaLabel(days), saved: true }); push('user', `✓ Observación guardada (SLA ${days} días)`); await sleep(200); setStep(3); push('bot', '¿Deseas agregar otra observación o continuar con empresa y personal?'); push('findingNext', { observationId: data.observationId }); }
  async function findingDecision(value: 'add' | 'continue', messageId: string) { markResolved(messageId); if (value === 'add') { await startFindingObservation(); return; } await askCompany('responsible-companies-finding'); }
  async function askCompany(queryKey: string) { push('typing'); try { const companies = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', queryKey], queryFn: getResponsibleCompanies, staleTime: 300000 }); clearTyping(); if (!companies.length) { pushError('No hay empresas contratistas disponibles en catálogos.'); return; } setStep(4); push('bot', 'Te sugiero una empresa responsable según el área, sector y empresas disponibles.'); let suggestion = companies[0].name; let fallback = true; try { const state = useNewInspectionDraftStore.getState(); const response = await suggestCompany({ area: state.areaName ?? '', sector: state.sectorName ?? '', availableCompanies: companies.map((company) => company.name) }); suggestion = response.suggestion; fallback = response.fallback; } catch { suggestion = companies[0].name; fallback = true; } const suggested = matchSuggestedCompany(companies, suggestion) ?? companies[0]; push('companySuggestion', { company: suggested, companies, suggestion, fallback } as CompanySuggestionData); } catch { clearTyping(); pushError('No pude cargar empresas.', () => { void askCompany(queryKey); }); } }
  async function selectCompany(company: CompanyResponse, messageId: string) { markResolved(messageId); draft.setFindingCompany(company.id, company.name); push('user', `${company.name} confirmada`); await askResponsiblePeople(company.id); }
  function chooseOtherCompany(messageId: string, companies: CompanyResponse[]) { markResolved(messageId); push('bot', 'Selecciona otra empresa responsable.'); push('companies', companies); }
  async function askResponsiblePeople(companyId: string) { push('typing'); try { const users = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'responsibles', companyId], queryFn: () => getCompanyUsers(companyId), staleTime: 300000 }); clearTyping(); if (!users.length) { pushError('No hay personal asociado a la empresa seleccionada. Elige otra empresa.'); const companies = await getResponsibleCompanies(); push('bot', 'Selecciona otra empresa para continuar.'); push('companies', companies); return; } const suggested = suggestedResponsible(users); const state = useNewInspectionDraftStore.getState(); push('bot', `Para ${state.findingCompanyName ?? 'la empresa seleccionada'} en ${state.areaName ?? 'el área inspeccionada'}, sugiero este personal. Selecciona uno o más:`); push('people', { users, suggestedUserId: suggested?.id ?? null } as PeopleData); } catch { clearTyping(); pushError('No pude cargar personal.', () => { void askResponsiblePeople(companyId); }); } }
  async function confirmPeople(users: UserResponse[], messageId: string) { setConfirmedPeople((prev) => new Set(prev).add(messageId)); if (users.length === 0) { pushError('Debes seleccionar al menos un responsable.'); return; } draft.setFindingResponsibles(users.map((item) => item.id)); push('user', `Personal: ${users.map((item) => item.fullName).join(', ')}`); await showSummary(); }
  async function showSummary() { setStep(5); await sleep(200); push('bot', 'Revisa el resumen antes de guardar.'); push('summary'); }

  function sendText() {
    const text = inputValue.trim();
    if (!waiting || !text) return;
    setInputValue('');
    if (waiting.startsWith('check-cond:')) { const itemId = waiting.replace('check-cond:', ''); setWaiting(null); void handleChecklistCondition(text, itemId); return; }
    if (waiting.startsWith('check-measure:')) { const itemId = waiting.replace('check-measure:', ''); setWaiting(null); void handleChecklistMeasure(text, itemId); return; }
    if (waiting.startsWith('finding-cond:')) { const observationId = waiting.replace('finding-cond:', ''); setWaiting(null); void handleFindingCondition(text, observationId); return; }
    if (waiting.startsWith('finding-measure:')) { const observationId = waiting.replace('finding-measure:', ''); setWaiting(null); void handleFindingMeasure(text, observationId); }
  }

  function renderMessage(message: Msg) {
    const resolved = resolvedMessages.has(message.id);
    if (message.t === 'bot') return <BotBubble key={message.id}><p className="text-[15px] leading-[22px] text-[#131313]">{String(message.data ?? '')}</p></BotBubble>;
    if (message.t === 'user') return <UserBubble key={message.id}>{String(message.data ?? '')}</UserBubble>;
    if (message.t === 'typing') return <TypingBubble key={message.id} />;
    if (message.t === 'error') return <ErrorBubble key={message.id} message={(message.data as { message: string }).message} onRetry={retries.current.get(message.id)} />;
    if (message.t === 'areas') { const areas = message.data as AreaResponse[]; return <ChipRow key={message.id} chips={areas.map((item) => item.name)} selected={resolved ? draft.areaName : null} onSelect={(name) => { if (resolved) return; const area = areas.find((item) => item.name === name); if (area) void selectArea(area, message.id); }} />; }
    if (message.t === 'sectors') { const sectors = message.data as SectorResponse[]; return <ChipRow key={message.id} chips={sectors.map((item) => item.name)} selected={resolved ? draft.sectorName : null} onSelect={(name) => { if (resolved) return; const sector = sectors.find((item) => item.name === name); if (sector) void selectSector(sector, message.id); }} />; }
    if (message.t === 'types') { const options = message.data as TypeOption[]; return <QuickOpts key={message.id} options={options.map((item) => ({ value: item.value, label: item.label, icon: item.icon }))} selected={resolved ? draft.inspectionType : null} onSelect={(value) => { if (resolved) return; const option = options.find((item) => item.value === value); if (option) void selectInspectionType(option.value, option.inspectionTypeId, option.label, message.id); }} />; }
    if (message.t === 'dates') return <QuickOpts key={message.id} options={(message.data as string[]).map((value) => ({ value, label: value }))} selected={resolved ? draft.inspectionDate : null} onSelect={(value) => { if (!resolved) void selectInspectionDate(value, message.id); }} />;
    if (message.t === 'loc') return <LocationWidget key={message.id} captured={draft.locationCaptured} label={draft.locationLabel} accuracy={draft.locationAccuracyLabel} capturing={capturing} resolved={resolved} onCapture={() => { void captureChatLocation(message.id); }} />;
    if (message.t === 'templatePick') { const data = message.data as TemplatePickData; return <QuickOpts key={message.id} options={[{ value: 'confirm', label: `Confirmar ${data.template.name}`, icon: 'check' }, { value: 'other', label: 'Elegir otra', icon: 'list' }]} selected={resolved ? 'confirm' : null} onSelect={(value) => { if (resolved) return; if (value === 'confirm') void selectChecklistTemplate(data.template, message.id); if (value === 'other') openChecklistTemplates(data.templates, message.id); }} />; }
    if (message.t === 'templates') { const templates = message.data as InspectionChecklistTemplateResponse[]; return <ChipRow key={message.id} chips={templates.map((item) => item.name)} selected={resolved ? draft.templateName : null} variant="navy" onSelect={(name) => { if (resolved) return; const template = templates.find((item) => item.name === name); if (template) void selectChecklistTemplate(template, message.id); }} />; }
    if (message.t === 'generalPhoto') return <PhotoStepWidget key={message.id} resolved={resolved || Boolean(draft.generalPhoto)} receipt={photoReceiptByMessageId[message.id] ?? (draft.generalPhoto ? { title: 'Foto adjunta ✓', sub: receiptText(draft.generalPhoto.name) } : undefined)} onCapture={(asset) => { if (!resolved) void handleChecklistGeneralPhoto(asset, message.id); }} onSkip={() => pushError('La foto general es obligatoria para checklist normativo.')} />;
    if (message.t === 'question') { const row = message.data as Row; return <QuestionCard key={message.id} row={row} selected={draft.answersByItemId[row.id]} resolved={resolved} onAnswer={(value) => { if (!resolved) void answerChecklistItem(row, value, message.id); }} />; }
    if (message.t === 'itemPhoto') { const row = message.data as Row; const evidence = draft.detailsByItemId[row.id]?.evidence; return <PhotoStepWidget key={message.id} resolved={resolved || Boolean(evidence)} receipt={photoReceiptByMessageId[message.id] ?? (evidence ? { title: 'Foto adjunta ✓', sub: receiptText(evidence.name) } : undefined)} onCapture={(asset) => { if (!resolved) void handleChecklistItemPhoto(asset, row, message.id); }} onSkip={() => pushError('La evidencia fotográfica es obligatoria para ítems NO conformes.')} />; }
    if (message.t === 'findingTypes') { const types = message.data as InspectionFindingTypeResponse[]; return <ChipRow key={message.id} chips={types.map((item) => item.name)} selected={resolved ? draft.findingTypeLabel : null} variant="navy" onSelect={(name) => { if (resolved) return; const found = types.find((item) => item.name === name); if (found) void selectFindingType(found, message.id); }} />; }
    if (message.t === 'findingPhoto') { const data = message.data as FindingPhotoData; const observation = draft.findingObservations.find((item) => item.id === data.observationId); return <PhotoStepWidget key={message.id} resolved={resolved || Boolean(observation?.evidence)} receipt={photoReceiptByMessageId[message.id] ?? (observation?.evidence ? { title: 'Foto adjunta ✓', sub: receiptText(observation.evidence.name) } : undefined)} onCapture={(asset) => { if (!resolved) void handleFindingPhoto(asset, data.observationId, message.id); }} onSkip={() => pushError('Para registrar un hallazgo en chat, la evidencia fotográfica es obligatoria.')} />; }
    if (message.t === 'aiMeasure') { const data = message.data as AiMeasureData; return <AiProposalCard key={message.id} suggestion={data.suggestion} fallback={data.fallback} accepted={resolved} onAccept={() => { if (!resolved) void acceptAiMeasure(message.id, data); }} onEdit={() => { if (!resolved) editAiMeasure(message.id, data); }} />; }
    if (message.t === 'criticality') { const data = message.data as CriticalityData; return <CriticalityCard key={message.id} severities={data.severities} resolved={resolved} onSelect={(severity) => { if (!resolved) void completeFindingCriticality(data.observationId, severity, message.id); }} />; }
    if (message.t === 'sla') { const data = message.data as SlaData; return <SlaConfirmWidget key={message.id} initialDays={data.initialDays} resolved={resolved} onSave={(days) => { if (!resolved) void saveFindingObservation(message.id, data, days); }} />; }
    if (message.t === 'findingNext') return <QuickOpts key={message.id} options={[{ value: 'add', label: 'Agregar otra observación', icon: 'plus' }, { value: 'continue', label: 'Continuar con empresa', icon: 'arrow-right' }]} onSelect={(value) => { if (!resolved) void findingDecision(value as 'add' | 'continue', message.id); }} />;
    if (message.t === 'companySuggestion') { const data = message.data as CompanySuggestionData; return <CompanySuggestionCard key={message.id} company={data.company} suggestion={data.suggestion} fallback={data.fallback} accepted={resolved} onAccept={() => { if (!resolved) void selectCompany(data.company, message.id); }} onOther={() => { if (!resolved) chooseOtherCompany(message.id, data.companies); }} />; }
    if (message.t === 'companies') { const companies = message.data as CompanyResponse[]; return <ChipRow key={message.id} chips={companies.map((item) => item.name)} selected={resolved ? draft.findingCompanyName : null} onSelect={(name) => { if (resolved) return; const company = companies.find((item) => item.name === name); if (company) void selectCompany(company, message.id); }} />; }
    if (message.t === 'people') { const data = message.data as PeopleData; return <PersonnelPicker key={message.id} users={data.users} suggestedUserId={data.suggestedUserId} confirmed={confirmedPeople.has(message.id)} onConfirm={(selected) => { void confirmPeople(selected, message.id); }} />; }
    if (message.t === 'summary') return <SummaryCard key={message.id} rows={checklistRows} onSave={onSave} saving={saving} errorMessage={errorMessage} saveLabel={draft.inspectionType === InspectionType.ENVIRONMENTAL ? '✓ Guardar hallazgo' : '✓ Guardar checklist'} />;
    return null;
  }

  return <><div className="bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"><div className="flex h-[56px] items-center justify-between gap-[8px] px-[8px]"><button type="button" onClick={onBack} className="flex h-[48px] w-[48px] items-center justify-center rounded-full"><ChatBackIcon /></button><div className="flex flex-1 items-center gap-[8px]"><div className="relative h-[38px] w-[38px]"><div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#C8A064] text-[#001E39]"><ChatAureliaIcon /></div><div className="absolute bottom-[2px] right-[1px] h-[10px] w-[10px] rounded-full border-[2px] border-[#002659] bg-[#00B398]" /></div><div><p className="text-[14px] font-bold leading-[17px] text-white">AurelIA</p><div className="mt-[1px] flex items-center gap-[4px]"><span className="h-[6px] w-[6px] rounded-full bg-[#00B398]" /><p className="text-[12px] leading-[14px] text-[rgba(255,255,255,0.62)]">{saving ? 'Pensando' : 'Activo'}</p></div></div></div><button type="button" onClick={onCancelInspection} className="flex h-[48px] w-[48px] items-center justify-center rounded-full"><ChatMoreIcon /></button></div><div className="px-[16px] pb-[7px]"><div className="mb-[5px] flex gap-[3px]">{STEP_LABELS.map((_, index) => <div key={`assistant-step-dot-${index}`} className={`h-[3px] flex-1 rounded ${index < safeStep ? 'bg-[#C8A064]' : index === safeStep ? 'bg-[rgba(200,160,100,0.75)]' : 'bg-[rgba(255,255,255,0.22)]'}`} />)}</div><div className="flex h-[17px] items-center justify-between"><p className="text-[12px] font-bold leading-none text-[rgba(255,255,255,0.72)]">Paso {safeStep + 1} · {STEP_LABELS[safeStep]}</p><p className="text-[12px] font-bold leading-none text-[rgba(255,255,255,0.72)]">{STEP_PCT[safeStep]}</p></div></div></div><div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#F4F6F9] px-[12px] pb-[16px] pt-[12px]">{messages.map(renderMessage)}</div><ChatInput disabled={waiting === null || saving} value={inputValue} onChange={setInputValue} onSend={sendText} /></>;
}
