import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { InspectionType, type AreaResponse, type CompanyResponse, type InspectionFindingSeverityResponse, type InspectionFindingTypeResponse, type InspectionTypeResponse, type SectorResponse, type UserResponse } from '@aurelia/contracts';
import { getCompanyUsers, getInspectionFindingSeverities, getInspectionFindingTypes, getInspectionTypes, getOrganizationAreas, getOrganizationSectors, getResponsibleCompanies, suggestCompany, suggestCorrectiveMeasure } from '../../../../shared/services/inspections.service';
import { useNewInspectionLocation } from '../hooks/useNewInspectionLocation';
import { clearNewInspectionDraftSnapshot, hasNewInspectionDraftProgress, saveNewInspectionDraftSnapshot, type NewInspectionFindingObservationDraft, type NewInspectionPickedAsset, useNewInspectionDraftStore } from '../state/newInspectionDraft.store';
import { ChatAureliaIcon, ChatBackIcon, ChatChecklistIcon, ChatFindingIcon, ChatMoreIcon, ChatSendIcon } from '../icons/AssistantChatIcons';
import { AssistantChatStep as AssistantChatStepV2 } from './AssistantChatStepV2';

interface AssistantChatStepProps {
  onBack: () => void;
  onSave: () => void;
  onCancelInspection: () => void;
  saving: boolean;
  errorMessage: string | null;
  resumeFromDraft?: boolean;
}

type MsgType = 'bot' | 'user' | 'typing' | 'error' | 'areas' | 'sectors' | 'types' | 'date' | 'loc' | 'findingTypes' | 'findingPhoto' | 'aiMeasure' | 'criticality' | 'sla' | 'observationSaved' | 'findingNext' | 'companySuggestion' | 'companies' | 'people' | 'summary';
type Msg = { id: string; t: MsgType; data?: unknown };
type TypeOption = { value: InspectionType; label: string; icon: string; inspectionTypeId: string | null };
type FindingPhotoData = { observationId: string };
type AiMeasureData = { observationId: string; suggestion: string; fallback: boolean };
type CriticalityData = { observationId: string; severities: InspectionFindingSeverityResponse[] };
type SlaData = { observationId: string; initialDays: number; observationNumber: number };
type ObservationSavedData = { observationId: string; index: number };
type CompanySuggestionData = { company: CompanyResponse; companies: CompanyResponse[]; fallback: boolean };
type PeopleData = { users: UserResponse[]; suggestedUserId: string | null };
type PhotoReceipt = { title: string; sub: string };

const STEP_LABELS = ['Identificación', 'Observación', 'Medida y criticidad', 'Más observaciones', 'Empresa y personal', 'Resumen'];
const STEP_PCT = ['14%', '28%', '42%', '57%', '71%', '86%'];
const SLA_OPTIONS = [1, 3, 7, 14];
const FALLBACK_MEASURE = 'Corregir la condición identificada antes del próximo turno. Registrar evidencia fotográfica y notificar al supervisor de área.';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function currentTime() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function formatDate(value: Date) {
  return `${String(value.getDate()).padStart(2, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${value.getFullYear()}`;
}

function parseDateLabel(value: string) {
  const parts = value.split(/[/-]/).map((part) => Number(part));
  const [day, month, year] = parts;
  if (parts.length !== 3 || day === undefined || month === undefined || year === undefined || parts.some((part) => Number.isNaN(part))) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function displayDate(value: string) {
  return value ? value.replaceAll('-', '/') : '';
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDateInput(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return formatDate(date);
}

function monthLabel(value: Date) {
  return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(value);
}

function parseSlaDays(label: string | null | undefined, fallback = 7) {
  const value = Number((label ?? '').match(/(\d+)/)?.[1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function typeId(types: InspectionTypeResponse[], code: InspectionType) {
  return types.find((item) => item.code === code)?.id ?? null;
}

function fileAsset(file: File): NewInspectionPickedAsset {
  return { name: file.name, file };
}

function receiptText(fileName: string) {
  return `${fileName} · GPS ✓ · ${currentTime()}`;
}

function parsePoint(value: string) {
  const match = value.match(/(-?\d+(?:[.,]\d+)?)\s*,\s*(-?\d+(?:[.,]\d+)?)/);
  const latitudeText = match?.[1];
  const longitudeText = match?.[2];
  if (!latitudeText || !longitudeText) return null;
  const latitude = Number(latitudeText.replace(',', '.'));
  const longitude = Number(longitudeText.replace(',', '.'));
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  return { latitude, longitude };
}

function matchSuggestedCompany(companies: CompanyResponse[], suggestion: string) {
  const normalizedSuggestion = normalizeText(suggestion);
  return companies.find((company) => normalizedSuggestion.includes(normalizeText(company.name)) || normalizeText(company.name).includes(normalizedSuggestion)) ?? companies[0] ?? null;
}

function suggestedResponsible(users: UserResponse[]) {
  return users.find((user) => (user.position ?? '').toLowerCase().includes('supervisor')) ?? users[0] ?? null;
}

function initials(value: string) {
  return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function CalendarIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="3" y="4" width="12" height="11" rx="1.6" fill="#131313" /><path d="M3 7h12M6 2.8v2.4M12 2.8v2.4" stroke="#F6FAFF" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function SaveObservationIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.1 1.5h6.5l1.3 1.3v7.7H2.1V1.5Z" fill="currentColor" opacity="0.95" /><path d="M3.5 1.5h4.3v3H3.5v-3Z" fill="white" opacity="0.45" /><rect x="3.8" y="6.5" width="4.4" height="2.7" rx="0.6" fill="white" opacity="0.6" /></svg>;
}

function EvidenceIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 3.7h2l.6-1h2.8l.6 1h2A1.1 1.1 0 0 1 11 4.8v4A1.1 1.1 0 0 1 9.9 10H2.1A1.1 1.1 0 0 1 1 8.9v-4A1.1 1.1 0 0 1 2 3.7Z" fill="#2A7A2E" /><circle cx="6" cy="6.8" r="1.6" fill="white" /></svg>;
}

function CheckMiniIcon() {
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 5.2 4 7l4-4" stroke="#2A7A2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.2 4.2h7.6M5.6 4.2V3.1h2.8v1.1M4.1 5.2l.5 5.7c.1.7.5 1 1.2 1h2.4c.7 0 1.1-.3 1.2-1l.5-5.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function BotMark() {
  return <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#C8A064] text-[#001E39]"><ChatAureliaIcon className="h-[18px] w-[20px]" /></div>;
}

function BotBubble({ children }: { children: ReactNode }) {
  return <div className="mb-[10px] flex w-full items-end gap-[7px]"><BotMark /><div className="max-w-[286px] rounded-[16px] border border-[#E3E3E3] bg-white px-[13px] py-[11px] shadow-[0_1px_3px_rgba(0,0,0,0.12)]"><div>{children}</div><p className="mt-[7px] text-[12px] leading-none text-[#ACACAC]">{currentTime()}</p></div></div>;
}

function UserBubble({ children }: { children: ReactNode }) {
  return <div className="mb-[10px] ml-auto max-w-[78%] rounded-[16px] bg-[#002659] px-[13px] py-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"><div className="text-[13px] font-semibold leading-[18px] text-white">{children}</div><p className="mt-[6px] text-[11px] leading-none text-[rgba(255,255,255,0.55)]">{currentTime()}</p></div>;
}

function TypingBubble() {
  return <div className="mb-[10px] flex w-full items-end gap-[7px]"><BotMark /><div className="inline-flex items-center gap-[4px] rounded-[14px] border border-[#D3D7DE] bg-white px-[14px] py-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"><span className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#9CA3AF]" /><span className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:150ms]" /><span className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:300ms]" /></div></div>;
}

function ErrorBubble({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="mb-[10px] ml-[33px] rounded-[12px] border border-[#F3A7B8] bg-[#FFD4E0] px-[12px] py-[10px] text-[#7A0E23]"><p className="text-[12px] font-semibold">{message}</p>{onRetry ? <button type="button" className="mt-[8px] rounded-[8px] bg-white px-[10px] py-[6px] text-[11px] font-bold" onClick={onRetry}>Reintentar</button> : null}</div>;
}

function ChipRow({ chips, selected, onSelect, variant = 'gold' }: { chips: string[]; selected?: string | null; onSelect: (label: string) => void; variant?: 'gold' | 'navy' }) {
  return <div className="mb-[10px] ml-[33px] flex flex-wrap gap-[8px]">{chips.map((chip) => { const active = selected === chip; const activeClass = variant === 'navy' ? 'border-[#002659] bg-[#002659] text-white' : 'border-[#C8A064] bg-[#C8A064] text-[#001E39]'; return <button key={chip} type="button" onClick={() => onSelect(chip)} className={`min-h-[28px] rounded-full border-[1.5px] px-[13.5px] py-[5px] text-[13px] leading-[16px] ${active ? `${activeClass} font-bold` : 'border-[#D1D1D1] bg-white font-semibold text-[#646464]'}`}>{chip}</button>; })}</div>;
}

function QuickIcon({ icon }: { icon?: string }) {
  if (icon === 'search') return <ChatFindingIcon className="h-[10px] w-[13px]" />;
  if (icon === 'clipboard-check') return <ChatChecklistIcon className="h-[10px] w-[13px]" />;
  if (icon === 'plus') return <span className="text-[16px] leading-none">+</span>;
  if (icon === 'arrow-right') return <span className="text-[15px] leading-none">→</span>;
  return null;
}

function QuickOpts({ options, selected, onSelect }: { options: Array<{ value: string; label: string; icon?: string }>; selected?: string | null; onSelect: (value: string) => void }) {
  return <div className="mb-[10px] ml-[33px] flex flex-col gap-[6px]">{options.map((option) => { const active = selected === option.value || selected === option.label; return <button key={option.value} type="button" onClick={() => onSelect(option.value)} className={`inline-flex min-h-[32px] w-fit items-center gap-[8px] rounded-full border-[1.5px] px-[15px] py-[7px] text-[14px] font-bold leading-[18px] ${active ? 'border-[#002659] bg-[#002659] text-white' : 'border-[#D1D1D1] bg-white text-[#24588B]'}`}><QuickIcon icon={option.icon} />{option.label}</button>; })}</div>;
}

function DateCalendarSheet({ visible, value, onClose, onSelect }: { visible: boolean; value: string; onClose: () => void; onSelect: (value: string) => void }) {
  const selectedDate = parseDateLabel(value) ?? new Date();
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [dateText, setDateText] = useState(() => displayDate(value));

  useEffect(() => {
    if (!visible) return;
    const selected = parseDateLabel(value) ?? new Date();
    setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setDateText(displayDate(value));
  }, [value, visible]);

  if (!visible) return null;

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const calendarStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - offset);
  const days = Array.from({ length: 42 }, (_, index) => new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index));
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  function selectDate(date: Date) {
    const formatted = formatDate(date);
    setDateText(displayDate(formatted));
    onSelect(formatted);
    onClose();
  }

  function handleDateTextChange(event: ChangeEvent<HTMLInputElement>) {
    const nextText = formatDateInput(event.target.value);
    setDateText(nextText);
    const nextValue = parseDateInput(nextText);
    if (!nextValue) return;
    const nextDate = parseDateLabel(nextValue);
    if (nextDate) setViewDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    onSelect(nextValue);
    onClose();
  }

  return <div className="fixed bottom-[16px] right-[20px] top-[16px] z-[1100] flex w-[360px] max-w-[calc(100vw-40px)] items-end overflow-hidden rounded-[22px] bg-black/70" onClick={onClose}><div className="max-h-[92%] w-full overflow-hidden rounded-t-[16px] bg-white px-[14px] pb-[14px] pt-[14px]" onClick={(event) => event.stopPropagation()}><div className="flex flex-col gap-[6px]"><p className="text-[13px] font-bold leading-none text-[#131313]">Fecha</p><div className="flex h-[50px] w-full items-center justify-between rounded-[10px] border-[1.5px] border-[#24588B] bg-[#F6FAFF] px-[15.5px] py-[15px] text-left"><input value={dateText} onChange={handleDateTextChange} inputMode="numeric" maxLength={10} placeholder="dd/mm/aaaa" className="min-w-0 flex-1 bg-transparent text-[13px] leading-[19.5px] text-[#131313] outline-none placeholder:text-[#757575]" /><CalendarIcon /></div></div><div className="mt-[10px] w-full rounded-[10px] border border-[#D1D1D1] bg-white px-[12px] pb-[12px] pt-[12px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]"><div className="flex h-[28px] items-center justify-between"><button type="button" className="flex items-center gap-[4px] text-[14px] font-bold leading-none text-[#131313]" onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}>{monthLabel(viewDate)} <span className="text-[10px]">▼</span></button><div className="flex items-center gap-[10px] text-[#131313]"><button type="button" className="flex h-[28px] w-[28px] items-center justify-center text-[20px] leading-none" onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}>↑</button><button type="button" className="flex h-[28px] w-[28px] items-center justify-center text-[20px] leading-none" onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}>↓</button></div></div><div className="mt-[14px] grid grid-cols-7 text-center text-[14px] font-bold leading-none text-[#131313]">{weekDays.map((day) => <span key={day}>{day}</span>)}</div><div className="mt-[10px] grid grid-cols-7 gap-y-[8px] text-center text-[15px] leading-[30px]">{days.map((date) => { const selected = value && formatDate(date) === value; const currentMonth = date.getMonth() === viewDate.getMonth(); return <button key={date.toISOString()} type="button" onClick={() => selectDate(date)} className={`mx-auto flex h-[30px] w-[30px] items-center justify-center rounded-[6px] ${selected ? 'bg-[#0B84FF] font-bold text-white shadow-[0_0_0_2px_#006FE6]' : currentMonth ? 'text-[#131313]' : 'text-[#888888]'}`}>{date.getDate()}</button>; })}</div><div className="mt-[14px] flex items-center justify-between px-[18px] text-[14px] font-semibold text-[#0B84FF]"><button type="button" onClick={() => { onSelect(''); onClose(); }}>Borrar</button><button type="button" onClick={() => selectDate(new Date())}>Hoy</button></div></div></div></div>;
}

function DateWidget({ value, resolved, onSelect }: { value: string; resolved: boolean; onSelect: (value: string) => void }) {
  const [open, setOpen] = useState(!resolved);
  useEffect(() => { if (!resolved) setOpen(true); }, [resolved]);
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><p className="text-[12px] font-bold text-[#131313]">Fecha</p><button type="button" disabled={resolved} onClick={() => setOpen(true)} className="mt-[8px] flex h-[44px] w-full items-center justify-between rounded-[10px] border-[1.5px] border-[#24588B] bg-[#F6FAFF] px-[12px] text-left text-[13px] text-[#131313] disabled:opacity-80"><span>{displayDate(value) || 'dd/mm/aaaa'}</span><CalendarIcon /></button><DateCalendarSheet visible={open && !resolved} value={value} onClose={() => setOpen(false)} onSelect={onSelect} /></div>;
}

function LocationWidget({ captured, label, capturing, resolved, onCapture, onManual, onContinue }: { captured: boolean; label: string; capturing: boolean; resolved: boolean; onCapture: () => void; onManual: (latitude: number, longitude: number) => void; onContinue: () => void }) {
  const [text, setText] = useState(label);
  useEffect(() => setText(label), [label]);
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]"><p className="text-[12px] font-bold text-[#131313]">Ubicación de la inspección</p><button type="button" className={`mt-[8px] h-[44px] w-full rounded-[10px] text-[12px] font-bold text-white ${captured ? 'bg-[#3A9B3A]' : 'bg-[#C8A064]'}`} onClick={onCapture} disabled={capturing || resolved}>{capturing ? 'Capturando ubicación...' : captured ? 'Ubicación capturada' : 'Capturar ubicación'}</button><input value={text} onChange={(event) => setText(event.target.value)} onBlur={() => { const point = parsePoint(text); if (point) onManual(point.latitude, point.longitude); }} className="mt-[8px] h-[48px] w-full rounded-[8px] border border-[#E3E3E3] bg-[#F4F6F9] px-[12px] text-[11px] font-semibold text-[#131313] outline-none focus:border-[#24588B]" />{captured && !resolved ? <button type="button" className="mt-[8px] h-[36px] w-full rounded-[10px] bg-[#C8A064] text-[12px] font-bold text-white" onClick={onContinue}>Continuar con esta ubicación</button> : null}</div>;
}

function PhotoWidget({ resolved, receipt, onCapture }: { resolved: boolean; receipt?: PhotoReceipt; onCapture: (asset: NewInspectionPickedAsset) => void }) {
  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    onCapture(fileAsset(file));
    event.target.value = '';
  }
  if (resolved && receipt) return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border-[1.5px] border-dashed border-[#D1D1D1]"><div className="flex min-h-[58px] items-center gap-[8px] rounded-[12px] bg-[#E0FFD3] px-[12px] py-[10px] text-[#2A5C16]"><span className="flex h-[16px] w-[16px] items-center justify-center rounded-full bg-[#2A5C16] text-[11px] font-black text-[#E0FFD3]">✓</span><span className="min-w-0"><span className="block truncate text-[12px] font-bold leading-[15px]">{receipt.title}</span><span className="block truncate text-[10px] leading-[13px] text-[#2A5C16]">{receipt.sub}</span></span></div></div>;
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border-[1.5px] border-dashed border-[#D1D1D1] bg-white p-[14px]"><div className="flex flex-col items-center gap-[8px]"><div className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-[#F4F6F9] text-[18px] text-[#646464]">▣</div><p className="text-[12px] font-bold leading-none text-[#333333]">Adjuntar fotografía del hallazgo</p><p className="text-center text-[10px] leading-none text-[#ACACAC]">Fecha, hora y GPS se registran automáticamente</p><label className="flex h-[34px] w-full cursor-pointer items-center justify-center gap-[5px] rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] text-[11px] font-semibold text-[#333333]"><input type="file" className="hidden" accept="image/*" disabled={resolved} onChange={onFile} /><span>▣</span><span>Desde galería</span></label></div></div>;
}

function AiProposalCard({ suggestion, fallback, accepted, onAccept, onEdit }: { suggestion: string; fallback: boolean; accepted: boolean; onAccept: () => void; onEdit: () => void }) {
  return <div className="mb-[10px] ml-[33px] mr-[12px] overflow-hidden rounded-[12px] border-[1.5px] border-[#C8A064] bg-white shadow-[0_2px_8px_rgba(200,160,100,0.15)]"><div className="flex items-center gap-[6px] border-b border-[rgba(200,160,100,0.2)] bg-gradient-to-br from-[#FDF3E3] to-[#FAE8C8] px-[12px] py-[8px]"><span className="text-[11px] text-[#8E6E3E]">✦</span><p className="text-[11px] font-bold text-[#8E6E3E]">Medida sugerida por AurelIA</p>{fallback ? <span className="ml-auto rounded-full bg-white px-[8px] py-[3px] text-[10px] font-bold text-[#8E6E3E]">Base</span> : null}</div><div className="px-[12px] py-[10px]"><p className="mb-[4px] text-[9px] font-bold uppercase tracking-[0.06em] text-[#646464]">Medida correctiva</p><p className="text-[12px] font-medium leading-[18px] text-[#131313]">{suggestion}</p><p className="mt-[8px] border-t border-[#E3E3E3] pt-[7px] text-[10px] leading-[13px] text-[#646464]">↝ Basada en historial 2023–2026 · Gold Fields Salares Norte</p></div><div className="flex gap-[8px] px-[12px] pb-[12px]"><button type="button" disabled={accepted} onClick={onEdit} className="h-[36px] rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-white px-[14px] text-[12px] font-semibold text-[#333333] disabled:opacity-50">✎ Editar</button><button type="button" disabled={accepted} onClick={onAccept} className="h-[36px] flex-1 rounded-[8px] bg-[#00B398] text-[12px] font-bold text-white disabled:opacity-50">✓ Aceptar</button></div></div>;
}

function CriticalityCard({ severities, resolved, onSelect }: { severities: InspectionFindingSeverityResponse[]; resolved: boolean; onSelect: (severity: InspectionFindingSeverityResponse) => void }) {
  return <div className="mb-[10px] ml-[33px] mr-[12px] overflow-hidden rounded-[12px] border border-[#E3E3E3] bg-white"><p className="bg-[#F4F6F9] px-[12px] py-[8px] text-[10px] font-bold uppercase tracking-[0.05em] text-[#646464]">Criticidad</p><div className="grid gap-[8px] p-[12px]">{severities.slice().sort((left, right) => left.sortOrder - right.sortOrder).map((severity) => <button key={severity.id} type="button" disabled={resolved} onClick={() => onSelect(severity)} className="rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] px-[12px] py-[9px] text-left disabled:opacity-50"><span className="block text-[12px] font-bold text-[#131313]">{severity.name}</span><span className="mt-[2px] block text-[10px] leading-[14px] text-[#646464]">{severity.description ?? 'Sin descripción'}</span></button>)}</div></div>;
}

function SlaConfirmWidget({ initialDays, observationNumber, resolved, onSave }: { initialDays: number; observationNumber: number; resolved: boolean; onSave: (days: number) => void }) {
  const [days, setDays] = useState(String(initialDays));
  const numericDays = Number(days);
  const valid = Number.isFinite(numericDays) && numericDays > 0;
  const disabled = resolved || !valid;
  return <><div className="mb-[8px] ml-[33px] mr-[12px] rounded-[10px] border border-[#E3E3E3] bg-white px-[12px] py-[10px]"><p className="mb-[6px] text-[9px] font-bold uppercase tracking-[0.08em] text-[#646464]">SLA · DÍAS HÁBILES PARA RESOLVER</p><div className="mb-[8px] flex flex-wrap gap-[5px]">{SLA_OPTIONS.map((option) => <button key={option} type="button" disabled={resolved} onClick={() => setDays(String(option))} className={`h-[26px] rounded-[7px] border px-[10px] text-[11px] font-semibold ${numericDays === option ? 'border-[#C8A064] bg-[#C8A064] text-[#001E39]' : 'border-[#D1D1D1] bg-[#F4F6F9] text-[#646464]'}`}>{option} día{option === 1 ? '' : 's'}</button>)}</div><div className="flex items-center gap-[8px]"><input value={days} disabled={resolved} onChange={(event) => setDays(event.target.value.replace(/\D/g, '').slice(0, 3))} className="h-[30px] w-[55px] rounded-[7px] border-[1.5px] border-[#D1D1D1] bg-white text-center text-[14px] font-bold text-[#131313] outline-none focus:border-[#C8A064]" /><span className="text-[12px] text-[#646464]">días personalizados</span></div></div><button type="button" disabled={disabled} onClick={() => onSave(numericDays)} className="mb-[10px] ml-[33px] inline-flex h-[36px] items-center justify-center gap-[7px] rounded-full bg-[#00B398] px-[17px] text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(0,179,152,0.22)] disabled:bg-[#D1D1D1] disabled:text-white disabled:shadow-none"><SaveObservationIcon /><span>Guardar observación {observationNumber}</span></button></>;
}

function ObservationSavedCard({ observation, index, onRemove }: { observation: NewInspectionFindingObservationDraft | null; index: number; onRemove: () => void }) {
  if (!observation) return null;
  return <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[10px] border border-[#E3E3E3] bg-white px-[12px] py-[9px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"><div className="flex items-start gap-[8px]"><span className="shrink-0 rounded-[5px] bg-[#E6F3FF] px-[7px] py-[2px] text-[10px] font-bold leading-[14px] text-[#0D3862]">Obs. {index}</span><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold leading-[17px] text-[#131313]">{observation.detectedCondition}</p><div className="mt-[3px] flex flex-wrap items-center gap-[4px]"><span className="rounded-[4px] bg-[#FFEAB8] px-[6px] py-[2px] text-[9px] font-bold leading-[12px] text-[#463100]">{observation.severityLabel ?? 'Manual'} · {parseSlaDays(observation.severityClosureTimeLabel, 7)}d</span><span className="rounded-[4px] bg-[#F4F6F9] px-[6px] py-[2px] text-[9px] font-bold leading-[12px] text-[#646464]">Manual</span>{observation.evidence ? <span className="inline-flex items-center gap-[1px]"><EvidenceIcon /><CheckMiniIcon /></span> : null}</div></div><button type="button" aria-label="Eliminar observación" onClick={onRemove} className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[5px] border border-[#E3E3E3] bg-[#F4F6F9] text-[#646464]"><TrashIcon /></button></div></div>;
}

function CompanySuggestionCard({ company, fallback, accepted, onAccept, onOther }: { company: CompanyResponse; fallback: boolean; accepted: boolean; onAccept: () => void; onOther: () => void }) {
  return <div className="mb-[10px] ml-[33px] mr-[12px] overflow-hidden rounded-[12px] border-[1.5px] border-[#C8A064] bg-white"><div className="flex items-center gap-[6px] bg-[#FAE8C8] px-[12px] py-[8px]"><span className="text-[#8E6E3E]">✦</span><p className="text-[11px] font-bold text-[#8E6E3E]">Empresa sugerida por AurelIA</p>{fallback ? <span className="ml-auto rounded-full bg-white px-[8px] py-[3px] text-[10px] font-bold text-[#8E6E3E]">Base</span> : null}</div><div className="px-[12px] py-[10px]"><p className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#646464]">Empresa responsable</p><p className="mt-[4px] text-[16px] font-bold text-[#131313]">{company.name}</p></div><div className="flex gap-[8px] px-[12px] pb-[12px]"><button type="button" disabled={accepted} onClick={onOther} className="h-[36px] rounded-[8px] border-[1.5px] border-[#D1D1D1] bg-white px-[14px] text-[12px] font-semibold text-[#333333] disabled:opacity-50">☷ Elegir otra</button><button type="button" disabled={accepted} onClick={onAccept} className="h-[36px] flex-1 rounded-[8px] bg-[#00B398] text-[12px] font-bold text-white disabled:opacity-50">✓ Confirmar</button></div></div>;
}

function PersonnelPicker({ users, suggestedUserId, confirmed, onConfirm }: { users: UserResponse[]; suggestedUserId: string | null; confirmed: boolean; onConfirm: (users: UserResponse[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(suggestedUserId ? [suggestedUserId] : []);
  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
  return <div className="mb-[10px] ml-[33px] mr-[12px] flex flex-col gap-[6px]">{users.map((user) => { const active = selectedIds.includes(user.id); return <button key={user.id} type="button" disabled={confirmed} onClick={() => setSelectedIds((current) => current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id])} className={`flex min-h-[48px] items-center gap-[10px] rounded-[10px] border-[1.5px] px-[12px] py-[8px] text-left ${active ? 'border-[#00B398] bg-[#C5FFF6]' : 'border-[#D1D1D1] bg-white'}`}><span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#C8A064] text-[11px] font-bold text-[#001E39]">{initials(user.fullName)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-bold text-[#131313]">{user.fullName}</span><span className="block truncate text-[10px] text-[#646464]">{user.position ?? 'Responsable'}</span></span>{user.id === suggestedUserId ? <span className="rounded-[3px] bg-[#FDF3E3] px-[5px] py-[1px] text-[9px] font-bold text-[#8E6E3E]">✦ Sugerido</span> : null}<span className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-[#00B398] bg-[#00B398] text-[9px] text-white' : 'border-[#D1D1D1]'}`}>{active ? '✓' : ''}</span></button>; })}<button type="button" disabled={confirmed || selectedUsers.length === 0} onClick={() => onConfirm(selectedUsers)} className="mt-[4px] h-[36px] w-fit rounded-full bg-[#00B398] px-[18px] text-[12px] font-bold text-white disabled:opacity-50">→ Confirmar y ver resumen</button></div>;
}

function SummaryCard({ onSave, saving, errorMessage }: { onSave: () => void; saving: boolean; errorMessage: string | null }) {
  const state = useNewInspectionDraftStore();
  const saved = state.findingObservations.filter((item) => item.saved);
  return <div className="mb-[10px] ml-[33px] mr-[12px] grid gap-[10px]"><div className="overflow-hidden rounded-[10px] border border-[#E3E3E3] bg-white"><div className="bg-[#001E39] px-[12px] py-[7px]"><p className="text-[11px] font-bold text-white">Datos generales</p></div><p className="border-b border-[#E3E3E3] px-[12px] py-[7px] text-[11px]"><span className="text-[#646464]">Inspector</span><b className="float-right">{state.inspectorName}</b></p><p className="border-b border-[#E3E3E3] px-[12px] py-[7px] text-[11px]"><span className="text-[#646464]">Área · Sector</span><b className="float-right">{[state.areaName, state.sectorName].filter(Boolean).join(' · ')}</b></p><p className="px-[12px] py-[7px] text-[11px]"><span className="text-[#646464]">Empresa EECC</span><b className="float-right">{state.findingCompanyName ?? '—'}</b></p></div><div className="overflow-hidden rounded-[10px] border border-[#E3E3E3] bg-white"><div className="bg-[#001E39] px-[12px] py-[7px]"><p className="text-[11px] font-bold text-white">{saved.length} Observaciones</p></div><div className="grid gap-[6px] p-[12px]">{saved.map((item, index) => <div key={item.id} className="rounded-[8px] border border-[#E3E3E3] p-[10px]"><span className="rounded-[5px] bg-[#E6F3FF] px-[7px] py-[2px] text-[10px] font-bold text-[#0D3862]">Obs. {index + 1}</span><p className="mt-[6px] text-[12px]">{item.detectedCondition}</p><p className="mt-[4px] text-[10px] text-[#646464]">SLA: {item.severityClosureTimeLabel ?? '—'}</p></div>)}</div></div>{errorMessage ? <p className="rounded-[8px] bg-[#FFD4E0] px-[10px] py-[8px] text-[12px] font-semibold text-[#7A0E23]">{errorMessage}</p> : null}<button type="button" onClick={onSave} disabled={saving} className="h-[48px] rounded-[12px] bg-[#35A137] text-[15px] font-bold text-white disabled:opacity-70">{saving ? 'Guardando…' : '✓ Guardar inspección'}</button></div>;
}

function ChatInput({ disabled, value, onChange, onSend }: { disabled: boolean; value: string; onChange: (value: string) => void; onSend: () => void }) {
  return <div className="border-t border-[#E3E3E3] bg-white px-[12px] pb-[8px] pt-[9px]"><div className="flex w-full gap-[8px]"><input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSend(); }} placeholder="O escribe aquí…" className="h-[41px] flex-1 rounded-full border-[1.5px] border-[#D1D1D1] bg-[#F4F6F9] px-[15px] text-[15px] outline-none placeholder:text-[#ACACAC] disabled:text-[#ACACAC]" /><button type="button" disabled={disabled || !value.trim()} onClick={onSend} className="flex h-[38px] min-w-[38px] items-center justify-center rounded-full bg-[#C8A064] text-[#001E39] disabled:opacity-50"><ChatSendIcon /></button></div><div className="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" /></div>;
}

export function AssistantChatStep(props: AssistantChatStepProps) {
  const draft = useNewInspectionDraftStore();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const booted = useRef(false);
  const retries = useRef<Map<string, () => void>>(new Map());
  const [messages, setMessages] = useState<Msg[]>([]);
  const [resolvedMessages, setResolvedMessages] = useState<Set<string>>(new Set());
  const [confirmedPeople, setConfirmedPeople] = useState<Set<string>>(new Set());
  const [photoReceiptByMessageId, setPhotoReceiptByMessageId] = useState<Record<string, PhotoReceipt>>({});
  const [waiting, setWaiting] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [fallbackToV2, setFallbackToV2] = useState(false);
  const { captureLocation, capturing, locationError } = useNewInspectionLocation();
  const safeStep = Math.max(0, Math.min(step, STEP_LABELS.length - 1));

  function push(t: MsgType, data?: unknown) { sequence.current += 1; const message = { id: String(sequence.current), t, data }; setMessages((prev) => [...prev, message]); return message.id; }
  function clearTyping() { setMessages((prev) => prev.filter((message) => message.t !== 'typing')); }
  function markResolved(messageId: string) { setResolvedMessages((prev) => new Set(prev).add(messageId)); }
  function pushError(message: string, retry?: () => void) { const id = push('error', { message }); if (retry) retries.current.set(id, retry); }

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
  useEffect(() => useNewInspectionDraftStore.subscribe((state) => saveNewInspectionDraftSnapshot(state)), []);
  useEffect(() => { if (booted.current) return; booted.current = true; if (props.resumeFromDraft && hasNewInspectionDraftProgress(useNewInspectionDraftStore.getState())) void resumeChat(); else startFresh(); }, []);

  if (fallbackToV2) return <AssistantChatStepV2 {...props} resumeFromDraft />;

  function resetChatState() { retries.current.clear(); setMessages([]); setResolvedMessages(new Set()); setConfirmedPeople(new Set()); setPhotoReceiptByMessageId({}); setWaiting(null); setInputValue(''); setStep(0); }
  function startFresh() { clearNewInspectionDraftSnapshot(); useNewInspectionDraftStore.getState().reset(); resetChatState(); void beginAreaSelection(); }
  async function resumeChat() { resetChatState(); const state = useNewInspectionDraftStore.getState(); if (state.inspectionType !== InspectionType.ENVIRONMENTAL && state.inspectionTypeLabel) { setFallbackToV2(true); return; } push('bot', 'Retomé tu borrador. Continuemos.'); if (!state.areaId) { await beginAreaSelection(); return; } if (!state.sectorId) { await beginSectorSelection(state.areaId); return; } if (!state.locationCaptured) { push('bot', 'Capturemos la ubicación obligatoria.'); push('loc'); return; } await askFindingType(); }
  async function beginAreaSelection() { push('typing'); try { const areas = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'areas'], queryFn: getOrganizationAreas, staleTime: 300000 }); clearTyping(); push('bot', `¡Hola, ${useNewInspectionDraftStore.getState().inspectorName}! Soy AurelIA. ¿En qué área estás hoy?`); push('areas', areas); } catch { clearTyping(); pushError('No pude cargar áreas.', () => { void beginAreaSelection(); }); } }
  async function beginSectorSelection(areaId: string) { push('typing'); try { const sectors = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'sectors', areaId], queryFn: () => getOrganizationSectors(areaId), staleTime: 300000 }); clearTyping(); push('bot', `Perfecto, ${useNewInspectionDraftStore.getState().areaName}. Ahora el sector.`); push('sectors', sectors); } catch { clearTyping(); pushError('No pude cargar sectores.', () => { void beginSectorSelection(areaId); }); } }
  async function selectArea(area: AreaResponse, messageId: string) { markResolved(messageId); draft.setArea(area.id, area.name); push('user', area.name); await beginSectorSelection(area.id); }
  async function selectSector(sector: SectorResponse, messageId: string) { markResolved(messageId); draft.setSector(sector.id, sector.name); push('user', sector.name); push('typing'); try { const types = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'inspection-types'], queryFn: getInspectionTypes, staleTime: 300000 }); clearTyping(); push('bot', `${useNewInspectionDraftStore.getState().areaName} · ${sector.name}. ¿Qué tipo de inspección es?`); push('types', [{ value: InspectionType.ENVIRONMENTAL, label: 'Hallazgo', icon: 'search', inspectionTypeId: typeId(types, InspectionType.ENVIRONMENTAL) }, { value: InspectionType.REGULATORY, label: 'Checklist normativo', icon: 'clipboard-check', inspectionTypeId: typeId(types, InspectionType.REGULATORY) }] as TypeOption[]); } catch { clearTyping(); pushError('No pude cargar tipos.', () => { void selectSector(sector, messageId); }); } }
  async function selectInspectionType(value: InspectionType, inspectionTypeId: string | null, label: string, messageId: string) { markResolved(messageId); draft.setInspectionType(value, label); push('user', label); if (!inspectionTypeId) { pushError('No se encontró este tipo en catálogo.'); return; } if (value !== InspectionType.ENVIRONMENTAL) { setFallbackToV2(true); return; } await sleep(200); push('bot', 'Selecciona la fecha de inspección.'); push('date'); }
  async function selectInspectionDate(value: string, messageId: string) { if (!value || resolvedMessages.has(messageId)) return; markResolved(messageId); draft.setInspectionDate(value); push('user', value); await sleep(200); push('bot', 'Capturemos la ubicación obligatoria.'); push('loc'); }
  async function captureChatLocation(messageId: string) { const ok = await captureLocation(); if (!ok) { pushError(locationError ?? 'No se pudo capturar la ubicación.'); return; } await continueAfterLocation(messageId); }
  async function continueAfterLocation(messageId: string) { if (resolvedMessages.has(messageId)) return; markResolved(messageId); push('user', `Ubicación capturada · ${useNewInspectionDraftStore.getState().locationAccuracyLabel}`); await askFindingType(); }
  function setManualLocation(latitude: number, longitude: number) { draft.setLocation({ label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)} +- 0.0 m`, accuracy: '+- 0.0 m', latitude, longitude, altitude: draft.altitude }); }
  async function askFindingType() { push('typing'); try { const types = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'finding-types'], queryFn: getInspectionFindingTypes, staleTime: 300000 }); clearTyping(); setStep(1); push('bot', 'Selecciona el tipo de hallazgo.'); push('findingTypes', types); } catch { clearTyping(); pushError('No pude cargar tipos de hallazgo.', () => { void askFindingType(); }); } }
  async function selectFindingType(type: InspectionFindingTypeResponse, messageId: string) { markResolved(messageId); draft.setFindingType(type.id, type.name); push('user', type.name); await startFindingObservation(); }
  async function startFindingObservation() { setStep(1); const id = draft.addFindingObservation(); await sleep(200); const state = useNewInspectionDraftStore.getState(); push('bot', `Cuéntame la condición subestándar que detectaste en ${state.areaName} · ${state.sectorName}.`); setWaiting(`finding-cond:${id}`); }
  async function handleFindingCondition(text: string, observationId: string) { draft.updateFindingObservation(observationId, { detectedCondition: text }); push('user', text); await sleep(200); push('bot', 'Entendido. Adjunta una foto del hallazgo:'); push('findingPhoto', { observationId } as FindingPhotoData); setWaiting(null); }
  async function handleFindingPhoto(file: NewInspectionPickedAsset, observationId: string, messageId: string) { setPhotoReceiptByMessageId((prev) => ({ ...prev, [messageId]: { title: 'Foto adjunta ✓', sub: receiptText(file.name) } })); markResolved(messageId); draft.updateFindingObservation(observationId, { evidence: file }); const state = useNewInspectionDraftStore.getState(); const observation = state.findingObservations.find((item) => item.id === observationId); if (!observation) return; push('typing'); let suggestion = FALLBACK_MEASURE; let fallback = true; try { const response = await suggestCorrectiveMeasure({ area: state.areaName ?? '', sector: state.sectorName ?? '', description: observation.detectedCondition }); suggestion = response.suggestion; fallback = response.fallback; } catch { suggestion = FALLBACK_MEASURE; fallback = true; } clearTyping(); push('bot', `Foto recibida. Analicé el historial de ${state.areaName} y te propongo:`); push('aiMeasure', { observationId, suggestion, fallback } as AiMeasureData); push('bot', 'O escribe tu propia medida en el campo de texto.'); setWaiting(`finding-measure:${observationId}`); }
  async function acceptAiMeasure(messageId: string, data: AiMeasureData) { markResolved(messageId); draft.updateFindingObservation(data.observationId, { correctiveAction: data.suggestion }); push('user', '✓ Medida aceptada'); setWaiting(null); await askCriticality(data.observationId); }
  function editAiMeasure(messageId: string, data: AiMeasureData) { markResolved(messageId); push('bot', 'Escribe tu medida correctiva.'); setWaiting(`finding-measure:${data.observationId}`); }
  async function handleFindingMeasure(text: string, observationId: string) { draft.updateFindingObservation(observationId, { correctiveAction: text }); push('user', text); await askCriticality(observationId); }
  async function askCriticality(observationId: string) { setStep(2); push('typing'); try { const severities = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'finding-severities'], queryFn: getInspectionFindingSeverities, staleTime: 300000 }); clearTyping(); push('bot', 'Definamos la criticidad del hallazgo.'); push('criticality', { observationId, severities } as CriticalityData); } catch { clearTyping(); pushError('No pude cargar criticidades.'); } }
  async function completeCriticality(observationId: string, severity: InspectionFindingSeverityResponse, messageId: string) { markResolved(messageId); draft.updateFindingObservation(observationId, { severityId: severity.id, severityLabel: severity.name, severityClosureTimeLabel: severity.closureTimeLabel }); const index = useNewInspectionDraftStore.getState().findingObservations.filter((item) => item.saved).length + 1; await sleep(200); push('bot', 'Confirma el SLA para esta observación.'); push('sla', { observationId, initialDays: parseSlaDays(severity.closureTimeLabel, 7), observationNumber: index } as SlaData); }
  async function saveObservation(messageId: string, data: SlaData, days: number) { markResolved(messageId); const state = useNewInspectionDraftStore.getState(); const target = state.findingObservations.find((item) => item.id === data.observationId); if (!target) return; if (!target.detectedCondition.trim() || !target.correctiveAction.trim() || !target.evidence || !target.severityId) { pushError('La observación está incompleta.'); return; } const index = state.findingObservations.filter((item) => item.saved).length + 1; draft.updateFindingObservation(data.observationId, { severityClosureTimeLabel: `${days} días`, saved: true }); push('user', `✓ Observación ${index} guardada`); await sleep(200); setStep(3); push('bot', `Llevas ${index} observación. Revisa antes de continuar:`); push('observationSaved', { observationId: data.observationId, index } as ObservationSavedData); push('bot', '¿Agregar otra observación o continuamos con la empresa?'); push('findingNext'); }
  async function findingDecision(value: 'add' | 'continue', messageId: string) { markResolved(messageId); const saved = useNewInspectionDraftStore.getState().findingObservations.filter((item) => item.saved).length; if (value === 'add') { await startFindingObservation(); return; } if (!saved) { pushError('Debes guardar al menos una observación antes de continuar.'); return; } await askCompany(); }
  async function askCompany() { push('typing'); try { const companies = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'companies'], queryFn: getResponsibleCompanies, staleTime: 300000 }); clearTyping(); if (!companies.length) { pushError('No hay empresas disponibles.'); return; } let suggestion = companies[0].name; let fallback = true; try { const state = useNewInspectionDraftStore.getState(); const response = await suggestCompany({ area: state.areaName ?? '', sector: state.sectorName ?? '', availableCompanies: companies.map((company) => company.name) }); suggestion = response.suggestion; fallback = response.fallback; } catch { fallback = true; } const company = matchSuggestedCompany(companies, suggestion); if (!company) { pushError('No pude sugerir empresa.'); return; } setStep(4); push('bot', `Basándome en el historial de ${useNewInspectionDraftStore.getState().areaName} · ${useNewInspectionDraftStore.getState().sectorName}, te propongo:`); push('companySuggestion', { company, companies, fallback } as CompanySuggestionData); } catch { clearTyping(); pushError('No pude cargar empresas.'); } }
  async function selectCompany(company: CompanyResponse, messageId: string) { markResolved(messageId); draft.setFindingCompany(company.id, company.name); push('user', `✓ ${company.name} confirmada`); await askPeople(company.id); }
  function chooseOtherCompany(messageId: string, companies: CompanyResponse[]) { markResolved(messageId); push('bot', 'Selecciona otra empresa responsable.'); push('companies', companies); }
  async function askPeople(companyId: string) { push('typing'); try { const users = await queryClient.fetchQuery({ queryKey: ['inspections', 'assistant-chat', 'people', companyId], queryFn: () => getCompanyUsers(companyId), staleTime: 300000 }); clearTyping(); if (!users.length) { pushError('No hay personal asociado a esta empresa.'); return; } const suggested = suggestedResponsible(users); push('bot', `Para ${useNewInspectionDraftStore.getState().findingCompanyName}, sugiero este personal. Selecciona uno o más:`); push('people', { users, suggestedUserId: suggested?.id ?? null } as PeopleData); } catch { clearTyping(); pushError('No pude cargar personal.'); } }
  async function confirmPeople(users: UserResponse[], messageId: string) { setConfirmedPeople((prev) => new Set(prev).add(messageId)); if (!users.length) return; draft.setFindingResponsibles(users.map((item) => item.id)); push('user', `✓ Personal: ${users.map((item) => item.fullName).join(', ')}`); await showSummary(); }
  async function showSummary() { setStep(5); await sleep(200); push('bot', '¡Listo! Revisa el resumen antes de guardar:'); push('summary'); }
  function removeObservation(id: string) { draft.removeFindingObservation(id); push('user', 'Observación eliminada'); }
  function sendText() { const text = inputValue.trim(); if (!waiting || !text) return; setInputValue(''); if (waiting.startsWith('finding-cond:')) { const id = waiting.replace('finding-cond:', ''); setWaiting(null); void handleFindingCondition(text, id); return; } if (waiting.startsWith('finding-measure:')) { const id = waiting.replace('finding-measure:', ''); setWaiting(null); void handleFindingMeasure(text, id); } }

  function renderMessage(message: Msg) {
    const resolved = resolvedMessages.has(message.id);
    if (message.t === 'bot') return <BotBubble key={message.id}><p className="text-[15px] leading-[22px] text-[#131313]">{String(message.data ?? '')}</p></BotBubble>;
    if (message.t === 'user') return <UserBubble key={message.id}>{String(message.data ?? '')}</UserBubble>;
    if (message.t === 'typing') return <TypingBubble key={message.id} />;
    if (message.t === 'error') return <ErrorBubble key={message.id} message={(message.data as { message: string }).message} onRetry={retries.current.get(message.id)} />;
    if (message.t === 'areas') { const areas = message.data as AreaResponse[]; return <ChipRow key={message.id} chips={areas.map((item) => item.name)} selected={resolved ? draft.areaName : null} onSelect={(name) => { const area = areas.find((item) => item.name === name); if (!resolved && area) void selectArea(area, message.id); }} />; }
    if (message.t === 'sectors') { const sectors = message.data as SectorResponse[]; return <ChipRow key={message.id} chips={sectors.map((item) => item.name)} selected={resolved ? draft.sectorName : null} onSelect={(name) => { const sector = sectors.find((item) => item.name === name); if (!resolved && sector) void selectSector(sector, message.id); }} />; }
    if (message.t === 'types') { const options = message.data as TypeOption[]; return <QuickOpts key={message.id} options={options.map((item) => ({ value: item.value, label: item.label, icon: item.icon }))} selected={resolved ? draft.inspectionType : null} onSelect={(value) => { const option = options.find((item) => item.value === value); if (!resolved && option) void selectInspectionType(option.value, option.inspectionTypeId, option.label, message.id); }} />; }
    if (message.t === 'date') return <DateWidget key={message.id} value={draft.inspectionDate} resolved={resolved} onSelect={(value) => { if (!resolved) void selectInspectionDate(value, message.id); }} />;
    if (message.t === 'loc') return <LocationWidget key={message.id} captured={draft.locationCaptured} label={draft.locationLabel} capturing={capturing} resolved={resolved} onCapture={() => { void captureChatLocation(message.id); }} onManual={setManualLocation} onContinue={() => { void continueAfterLocation(message.id); }} />;
    if (message.t === 'findingTypes') { const types = message.data as InspectionFindingTypeResponse[]; return <ChipRow key={message.id} chips={types.map((item) => item.name)} selected={resolved ? draft.findingTypeLabel : null} variant="navy" onSelect={(name) => { const type = types.find((item) => item.name === name); if (!resolved && type) void selectFindingType(type, message.id); }} />; }
    if (message.t === 'findingPhoto') { const data = message.data as FindingPhotoData; const observation = draft.findingObservations.find((item) => item.id === data.observationId); return <PhotoWidget key={message.id} resolved={resolved || Boolean(observation?.evidence)} receipt={photoReceiptByMessageId[message.id] ?? (observation?.evidence ? { title: 'Foto adjunta ✓', sub: receiptText(observation.evidence.name) } : undefined)} onCapture={(item) => { if (!resolved) void handleFindingPhoto(item, data.observationId, message.id); }} />; }
    if (message.t === 'aiMeasure') { const data = message.data as AiMeasureData; return <AiProposalCard key={message.id} suggestion={data.suggestion} fallback={data.fallback} accepted={resolved} onAccept={() => { if (!resolved) void acceptAiMeasure(message.id, data); }} onEdit={() => { if (!resolved) editAiMeasure(message.id, data); }} />; }
    if (message.t === 'criticality') { const data = message.data as CriticalityData; return <CriticalityCard key={message.id} severities={data.severities} resolved={resolved} onSelect={(severity) => { if (!resolved) void completeCriticality(data.observationId, severity, message.id); }} />; }
    if (message.t === 'sla') { const data = message.data as SlaData; return <SlaConfirmWidget key={message.id} initialDays={data.initialDays} observationNumber={data.observationNumber} resolved={resolved} onSave={(days) => { if (!resolved) void saveObservation(message.id, data, days); }} />; }
    if (message.t === 'observationSaved') { const data = message.data as ObservationSavedData; const observation = draft.findingObservations.find((item) => item.id === data.observationId) ?? null; return <ObservationSavedCard key={message.id} observation={observation} index={data.index} onRemove={() => removeObservation(data.observationId)} />; }
    if (message.t === 'findingNext') return <QuickOpts key={message.id} options={[{ value: 'add', label: 'Agregar otra observación', icon: 'plus' }, { value: 'continue', label: 'Continuar con empresa', icon: 'arrow-right' }]} onSelect={(value) => { if (!resolved) void findingDecision(value as 'add' | 'continue', message.id); }} />;
    if (message.t === 'companySuggestion') { const data = message.data as CompanySuggestionData; return <CompanySuggestionCard key={message.id} company={data.company} fallback={data.fallback} accepted={resolved} onAccept={() => { if (!resolved) void selectCompany(data.company, message.id); }} onOther={() => { if (!resolved) chooseOtherCompany(message.id, data.companies); }} />; }
    if (message.t === 'companies') { const companies = message.data as CompanyResponse[]; return <ChipRow key={message.id} chips={companies.map((item) => item.name)} selected={resolved ? draft.findingCompanyName : null} onSelect={(name) => { const company = companies.find((item) => item.name === name); if (!resolved && company) void selectCompany(company, message.id); }} />; }
    if (message.t === 'people') { const data = message.data as PeopleData; return <PersonnelPicker key={message.id} users={data.users} suggestedUserId={data.suggestedUserId} confirmed={confirmedPeople.has(message.id)} onConfirm={(selected) => { void confirmPeople(selected, message.id); }} />; }
    if (message.t === 'summary') return <SummaryCard key={message.id} onSave={props.onSave} saving={props.saving} errorMessage={props.errorMessage} />;
    return null;
  }

  return <><div className="bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"><div className="flex h-[56px] items-center justify-between gap-[8px] px-[8px]"><button type="button" onClick={props.onBack} className="flex h-[48px] w-[48px] items-center justify-center rounded-full"><ChatBackIcon /></button><div className="flex flex-1 items-center gap-[8px]"><div className="relative h-[38px] w-[38px]"><div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#C8A064] text-[#001E39]"><ChatAureliaIcon /></div><div className="absolute bottom-[2px] right-[1px] h-[10px] w-[10px] rounded-full border-[2px] border-[#002659] bg-[#00B398]" /></div><div><p className="text-[14px] font-bold leading-[17px] text-white">AurelIA</p><div className="mt-[1px] flex items-center gap-[4px]"><span className="h-[6px] w-[6px] rounded-full bg-[#00B398]" /><p className="text-[12px] leading-[14px] text-[rgba(255,255,255,0.62)]">{props.saving ? 'Pensando' : 'Activo'}</p></div></div></div><button type="button" onClick={props.onCancelInspection} className="flex h-[48px] w-[48px] items-center justify-center rounded-full"><ChatMoreIcon /></button></div><div className="px-[16px] pb-[7px]"><div className="mb-[5px] flex gap-[3px]">{STEP_LABELS.map((_, index) => <div key={`assistant-step-dot-${index}`} className={`h-[3px] flex-1 rounded ${index < safeStep ? 'bg-[#C8A064]' : index === safeStep ? 'bg-[rgba(200,160,100,0.75)]' : 'bg-[rgba(255,255,255,0.22)]'}`} />)}</div><div className="flex h-[17px] items-center justify-between"><p className="text-[12px] font-bold leading-none text-[rgba(255,255,255,0.72)]">Paso {safeStep + 1} · {STEP_LABELS[safeStep]}</p><p className="text-[12px] font-bold leading-none text-[rgba(255,255,255,0.72)]">{STEP_PCT[safeStep]}</p></div></div></div><div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#F4F6F9] px-[12px] pb-[16px] pt-[12px]">{messages.map(renderMessage)}</div><ChatInput disabled={waiting === null || props.saving} value={inputValue} onChange={setInputValue} onSend={sendText} /></>;
}
