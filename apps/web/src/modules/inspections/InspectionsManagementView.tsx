import { useMemo, useState, type ReactNode } from 'react';
import type { InspectionManagementKpisResponse, InspectionManagementTableFilterOptionsResponse, InspectionManagementTableRowResponse } from '@aurelia/contracts';
import { useInspectionManagementKpis } from '../../shared/hooks/useInspectionManagementKpis';
import { useInspectionManagementTable } from '../../shared/hooks/useInspectionManagementTable';
import type { InspectionManagementPageSize, InspectionManagementTableParams } from '../../shared/services/inspections.service';
import type { InspectionDetailModalRecord } from './components/InspectionDetailModal';
import { InspectionDetailModalDataBridge } from './components/InspectionDetailModalDataBridge';
import { ClearFiltersIcon } from './components/InspectionManagementIcons';
import { NewInspectionModalController } from './new-inspection/NewInspectionModalController';

type KpiIconKind = 'total' | 'open' | 'approval' | 'closed';
type BadgeTone = 'blue' | 'mint' | 'pink' | 'orange' | 'yellow' | 'green';
type BadgeIcon = 'search' | 'checklist' | 'clock' | 'check' | 'alert';
type SortDirection = 'asc' | 'desc';
type SortKey = 'id' | 'date' | 'inspector' | 'area' | 'company' | 'type' | 'urgency' | 'count' | 'obs' | 'days' | 'closure';

type KpiCardProps = {
  icon: KpiIconKind;
  iconColor: string;
  label: string;
  value: string;
  helper: string;
  valueClass?: string;
};

type Row = {
  uniqueKey: string;
  inspectionId: string;
  id: string;
  date: string;
  inspector: string;
  area: string;
  company: string;
  type: string;
  urgency: string;
  urgencyTone: BadgeTone;
  count: number;
  obs: string[];
  days: number;
  closure: number;
  height: number;
};

type SelectedInspectionDetail = {
  inspectionId: string;
  record: InspectionDetailModalRecord;
};

type TableFilters = {
  id: string;
  date: string;
  inspector: string;
  area: string;
  company: string;
  type: string;
  urgency: string;
  count: string;
  obs: string;
  daysMin: string;
  daysMax: string;
  closure: string;
};

type TableFilterKey = keyof TableFilters;

type ActiveFilter = {
  key: TableFilterKey;
  label: string;
};

type SortState = {
  key: SortKey;
  direction: SortDirection;
} | null;

const tableColumns = [72, 147, 199, 208, 197, 132, 196, 84, 155, 132, 119, 83.5];
const tableWidth = tableColumns.reduce((total, width) => total + width, 0);
const numberFormatter = new Intl.NumberFormat('es-CL');
const percentFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const pageSizeOptions: InspectionManagementPageSize[] = [10, 25, 50];
const emptyTableFilters: TableFilters = { id: '', date: '', inspector: '', area: '', company: '', type: '', urgency: '', count: '', obs: '', daysMin: '', daysMax: '', closure: '' };
const emptyFilterOptions: InspectionManagementTableFilterOptionsResponse = { inspectors: [], areas: [], companies: [], types: [], urgencies: [] };
const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`;
}

function formatDeltaHelper(data: InspectionManagementKpisResponse) {
  const direction = data.inspectionsDeltaPercent > 0 ? '↑' : data.inspectionsDeltaPercent < 0 ? '↓' : '→';
  return `${direction} ${formatPercent(Math.abs(data.inspectionsDeltaPercent))} vs ${data.previousYear}`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function formatInspectionNumber(value: string) {
  return value.startsWith('#') ? value : `#${value}`;
}

function formatObservationBadges(row: InspectionManagementTableRowResponse) {
  const badges: string[] = [];
  if (row.observations.executed > 0) badges.push(`${row.observations.executed} Ejec.`);
  if (row.observations.open > 0) badges.push(`${row.observations.open} Abier.`);
  if (row.observations.closed > 0) badges.push(`${row.observations.closed} Cer`);
  if (badges.length === 0) badges.push('Sin obs.');
  return badges;
}

function getRowHeight(badges: string[]) {
  if (badges.length >= 3) return 80;
  if (badges.length <= 1) return 42;
  return 61;
}

function getUrgencyTone(row: InspectionManagementTableRowResponse): BadgeTone {
  if (row.urgencySeverity === 'critical' || row.urgencySeverity === 'high') return 'pink';
  if (row.urgencySeverity === 'medium') return row.urgencyLabel.startsWith('Ejecutada') ? 'orange' : 'yellow';
  if (row.urgencySeverity === 'low') return 'green';
  return 'blue';
}

function buildTableRows(rows: InspectionManagementTableRowResponse[] | undefined): Row[] {
  return (rows ?? []).map((row) => {
    const badges = formatObservationBadges(row);
    return {
      uniqueKey: row.inspectionId,
      inspectionId: row.inspectionId,
      id: formatInspectionNumber(row.inspectionNumber),
      date: formatDate(row.date),
      inspector: row.inspector,
      area: row.areaSector,
      company: row.company,
      type: row.type,
      urgency: row.urgencyLabel,
      urgencyTone: getUrgencyTone(row),
      count: row.observationsCount,
      obs: badges,
      days: row.daysOpen,
      closure: row.closureRate,
      height: getRowHeight(badges),
    };
  });
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
}

function buildActiveFilters(filters: TableFilters): ActiveFilter[] {
  const chips: ActiveFilter[] = [];
  if (filters.id) chips.push({ key: 'id', label: `N°: ${filters.id}` });
  if (filters.date) chips.push({ key: 'date', label: `Fecha: ${filters.date}` });
  if (filters.inspector) chips.push({ key: 'inspector', label: `Inspector: ${filters.inspector}` });
  if (filters.area) chips.push({ key: 'area', label: `Área: ${filters.area}` });
  if (filters.company) chips.push({ key: 'company', label: `Empresa: ${filters.company}` });
  if (filters.type) chips.push({ key: 'type', label: `Tipo: ${filters.type}` });
  if (filters.urgency) chips.push({ key: 'urgency', label: `Urgencia: ${filters.urgency}` });
  if (filters.count) chips.push({ key: 'count', label: `N° obs.: ${filters.count}` });
  if (filters.obs === 'executed') chips.push({ key: 'obs', label: 'Obs.: ejecutadas' });
  if (filters.obs === 'open') chips.push({ key: 'obs', label: 'Obs.: abiertas' });
  if (filters.obs === 'closed') chips.push({ key: 'obs', label: 'Obs.: cerradas' });
  if (filters.daysMin) chips.push({ key: 'daysMin', label: `Días mín.: ${filters.daysMin}` });
  if (filters.daysMax) chips.push({ key: 'daysMax', label: `Días máx.: ${filters.daysMax}` });
  if (filters.closure) chips.push({ key: 'closure', label: `Cierre: ${filters.closure}%` });
  return chips;
}

function buildManagementKpis(data: InspectionManagementKpisResponse | undefined, isLoading: boolean, isError: boolean) {
  const currentYear = new Date().getFullYear();
  if (isLoading) return { year: currentYear, totalInspections: '...', totalHelper: 'Cargando datos...', openInspections: '...', openHelper: 'Cargando observaciones...', pendingApproval: '...', closedFindingsRate: '...' };
  if (isError || !data) return { year: currentYear, totalInspections: '—', totalHelper: 'No disponible', openInspections: '—', openHelper: 'No disponible', pendingApproval: '—', closedFindingsRate: '—' };
  return {
    year: data.year,
    totalInspections: formatNumber(data.totalInspections),
    totalHelper: formatDeltaHelper(data),
    openInspections: formatNumber(data.openInspections),
    openHelper: `${formatNumber(data.openFindings)} observaciones pendientes`,
    pendingApproval: formatNumber(data.pendingApprovalInspections),
    closedFindingsRate: formatPercent(data.closedFindingsRate),
  };
}

function parseRowDate(value: string) {
  const [dayText, monthText, yearText] = value.split('-');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  if (!day || !month || Number.isNaN(year)) return 0;
  return new Date(year < 100 ? 2000 + year : year, month - 1, day).getTime();
}

function sortableValue(row: Row, key: SortKey) {
  if (key === 'date') return parseRowDate(row.date);
  if (key === 'count' || key === 'days' || key === 'closure') return row[key];
  if (key === 'obs') return row.obs.join(' ');
  return row[key].toString().toLocaleLowerCase();
}

function sortRows(rows: Row[], sort: SortState) {
  if (!sort) return rows;
  const modifier = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => {
    const leftValue = sortableValue(left, sort.key);
    const rightValue = sortableValue(right, sort.key);
    if (typeof leftValue === 'number' && typeof rightValue === 'number') return (leftValue - rightValue) * modifier;
    return leftValue.localeCompare(rightValue, 'es', { numeric: true, sensitivity: 'base' }) * modifier;
  });
}

function nextSort(current: SortState, key: SortKey): SortState {
  if (!current || current.key !== key) return { key, direction: 'asc' };
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

function parseFilterDate(value: string) {
  const parts = value.split(/[/-]/).map((part) => Number(part));
  const [day, month, year] = parts;
  if (parts.length !== 3 || !day || !month || !year || parts.some((part) => Number.isNaN(part))) return null;
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(fullYear, month - 1, day);
  if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function formatFullDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatTypedDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function calendarMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(date);
}

function expandedYearDate(value: string) {
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];
  if (!day || !month || !year) return value;
  return `${day}-${month}-${year.length === 2 ? `20${year}` : year}`;
}

function readObsCount(row: Row, token: string) {
  const item = row.obs.find((value) => value.toLowerCase().includes(token));
  if (!item) return 0;
  const value = Number(item.match(/\d+/)?.[0] ?? 0);
  return Number.isNaN(value) ? 0 : value;
}

function buildInspectionDetailRecord(row: Row): InspectionDetailModalRecord {
  const kind = row.type.toLowerCase().includes('check') ? 'checklist' : 'finding';
  const title = row.company && !row.area.includes(row.company) ? `${row.area} · ${row.company}` : row.area;
  const date = expandedYearDate(row.date);
  return {
    id: row.id,
    title,
    kind,
    metadataLine1: kind === 'checklist' ? 'Checklist · SUSPEL - General - FR-00007' : `${row.type} · ${date} · Campamento Antiguo`,
    metadataLine2: kind === 'checklist' ? `${date} · Campamento Antiguo` : 'Tipo de hallazgo: [Tipo seleccionado en el form de insp]',
    progressPercent: row.closure,
    counts: {
      executed: readObsCount(row, 'ejec'),
      open: readObsCount(row, 'abier'),
      closed: readObsCount(row, 'cer'),
      rejected: 1,
    },
  };
}

function KpiIcon({ kind, color }: { kind: KpiIconKind; color: string }) {
  const className = 'h-[11px] w-[13.75px] shrink-0';
  if (kind === 'total') return <svg className={className} fill="none" viewBox="0 0 13.75 11" aria-hidden><rect x="2.25" y="0.75" width="7.5" height="9.5" rx="1.2" stroke={color} strokeWidth="1.5" /><path d="M4.25 3.2h3.4M4.25 5.4h3.4M4.25 7.6h2" stroke={color} strokeWidth="1.2" strokeLinecap="round" /></svg>;
  if (kind === 'open') return <svg className={className} fill="none" viewBox="0 0 13.75 11" aria-hidden><circle cx="6.875" cy="5.5" r="4.85" fill={color} /><path d="M6.875 2.65v3l2.15 1.25" stroke="white" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (kind === 'approval') return <svg className={className} fill="none" viewBox="0 0 13.75 11" aria-hidden><circle cx="6.875" cy="5.5" r="4.85" fill={color} /><path d="M6.875 2.75v3" stroke="white" strokeWidth="1.25" strokeLinecap="round" /><circle cx="6.875" cy="8" r="0.65" fill="white" /></svg>;
  return <svg className={className} fill="none" viewBox="0 0 13.75 11" aria-hidden><circle cx="6.875" cy="5.5" r="4.85" fill={color} /><path d="M4.7 5.55l1.35 1.35 2.95-3.1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CaretIcon() {
  return <svg className="h-[10px] w-[12.5px] shrink-0" fill="none" viewBox="0 0 13 10" aria-hidden><path d="M3 3.5L6.25 6.5L9.5 3.5" stroke="#131313" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SortIcon({ gold = false, direction, active = false }: { gold?: boolean; direction?: SortDirection; active?: boolean }) {
  const baseFill = gold ? '#c8a064' : 'rgba(255,255,255,0.7)';
  const activeFill = gold ? '#f1c982' : '#ffffff';
  const upFill = active && direction === 'asc' ? activeFill : baseFill;
  const downFill = active && direction === 'desc' ? activeFill : baseFill;
  return <svg className="h-[10px] w-[12.5px] shrink-0" fill="none" viewBox="0 0 13 10" aria-hidden><path d="M6.25 1L10 4.5H2.5L6.25 1Z" fill={upFill} /><path d="M6.25 9L2.5 5.5H10L6.25 9Z" fill={downFill} /></svg>;
}

function FilterIcon() {
  return <svg className="h-[10px] w-[12.5px] shrink-0" fill="none" viewBox="0 0 13 10" aria-hidden><path d="M1.5 1.25h10L7.75 5.4v2.2L5.25 8.75V5.4L1.5 1.25Z" fill="#24588b" /></svg>;
}

function CalendarInputIcon() {
  return <svg className="size-[24px] shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden><rect x="4" y="5.5" width="16" height="15" rx="2" fill="#131313" /><path d="M4 10h16M8 3.5v4M16 3.5v4" stroke="#f6faff" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function FileIcon() {
  return <svg className="h-[12px] w-[15px] shrink-0" fill="none" viewBox="0 0 15 12" aria-hidden><path d="M4 1.2h4.4L11 3.8v7H4z" fill="#333" /><path d="M8.4 1.2v2.6H11" stroke="white" strokeWidth="0.8" strokeLinejoin="round" /></svg>;
}

function PlusIcon() {
  return <svg className="h-[12px] w-[15px] shrink-0" fill="none" viewBox="0 0 15 12" aria-hidden><path d="M7.5 2.3v7.4M3.8 6h7.4" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function BadgeMiniIcon({ icon, color }: { icon: BadgeIcon; color: string }) {
  if (icon === 'search') return <svg className="h-[9px] w-[11.25px] shrink-0" fill="none" viewBox="0 0 12 9" aria-hidden><circle cx="4.8" cy="4" r="2.2" stroke={color} strokeWidth="1.5" /><path d="M6.5 5.8L8.7 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>;
  if (icon === 'checklist') return <svg className="h-[9px] w-[11.25px] shrink-0" fill="none" viewBox="0 0 12 9" aria-hidden><rect x="2" y="1" width="6.4" height="7" rx="1" stroke={color} strokeWidth="1.3" /><path d="M3.8 4.5l1 .9 1.8-2" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (icon === 'check') return <svg className="h-[8px] w-[10px] shrink-0" fill="none" viewBox="0 0 10 8" aria-hidden><circle cx="4" cy="4" r="3.3" fill={color} /><path d="M2.4 4.1l1 1 2.2-2.2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (icon === 'alert') return <svg className="h-[8px] w-[10px] shrink-0" fill="none" viewBox="0 0 10 8" aria-hidden><circle cx="4" cy="4" r="3.3" fill={color} /><path d="M4 2.2v2.1" stroke="white" strokeWidth="1" strokeLinecap="round" /><circle cx="4" cy="5.8" r="0.45" fill="white" /></svg>;
  return <svg className="h-[8px] w-[10px] shrink-0" fill="none" viewBox="0 0 10 8" aria-hidden><circle cx="4" cy="4" r="3.3" fill={color} /><path d="M4 2.2v2.1l1.4.8" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function MoreIcon() {
  return <svg className="h-[12px] w-[15px] shrink-0" fill="none" viewBox="0 0 15 12" aria-hidden><circle cx="3.5" cy="6" r="1.35" fill="#646464" /><circle cx="7.5" cy="6" r="1.35" fill="#646464" /><circle cx="11.5" cy="6" r="1.35" fill="#646464" /></svg>;
}

function KpiCard({ icon, iconColor, label, value, helper, valueClass = 'text-[#131313]' }: KpiCardProps) {
  return (
    <div className="flex h-[92.5px] min-w-0 flex-col items-start rounded-[8px] border border-[#e3e3e3] bg-white px-[17px] py-[15px] drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.05)]">
      <div className="flex h-[14px] w-full items-center gap-[6px]"><KpiIcon kind={icon} color={iconColor} /><p className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold uppercase leading-[normal] tracking-[0.44px] text-[#646464]">{label}</p></div>
      <div className="h-[33px] w-full pt-[4px]"><p className={`whitespace-nowrap font-['Inter:Bold',sans-serif] text-[24px] font-bold leading-[normal] ${valueClass}`}>{value}</p></div>
      <div className="h-[16px] w-full pt-[3px]"><p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[11px] font-normal leading-[normal] text-[#646464]">{helper}</p></div>
    </div>
  );
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <button className="flex h-[18px] items-center gap-[5px] rounded-[4px] border border-[#b4d1ed] bg-[#e6f3ff] px-[9px] py-[3px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold leading-[normal] text-[#0d3862]" type="button" onClick={onRemove}><span className="whitespace-nowrap">{label}</span><span className="font-['Arial:Regular',sans-serif] text-[10px] font-normal leading-[10px] text-[#0d3862]">×</span></button>;
}

function TableActions({ onNewInspection }: { onNewInspection: () => void }) {
  return <div className="flex shrink-0 items-center gap-[8px]"><button className="flex h-[36px] w-[117.5px] shrink-0 items-center gap-[6px] rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[13.5px] py-[1.5px] text-[12px] font-semibold text-[#333]" type="button"><FileIcon /><span className="font-['Inter:Semi_Bold',sans-serif]">Exportar</span><CaretIcon /></button><button className="flex h-[36px] w-[159px] shrink-0 items-center gap-[7px] rounded-[6px] bg-[#c8a064] px-[16px] py-[10.5px] text-[12px] font-bold text-white" type="button" onClick={onNewInspection}><PlusIcon /><span className="font-['Inter:Bold',sans-serif]">Nueva inspección</span></button></div>;
}

function ActiveFiltersBar({ filters, onRemove, onNewInspection }: { filters: ActiveFilter[]; onRemove: (key: TableFilterKey) => void; onNewInspection: () => void }) {
  if (filters.length === 0) return <div className="flex min-h-[38px] w-full justify-end pt-[16px]"><TableActions onNewInspection={onNewInspection} /></div>;
  return <div className="flex min-h-[38px] w-full flex-wrap items-center justify-between gap-[12px] pt-[16px]"><div className="flex min-h-[38px] min-w-[280px] flex-1 items-center gap-[10px] overflow-x-auto bg-[#eef5ff] px-[14px] py-[10px]"><div className="flex shrink-0 items-center gap-[6px]"><FilterIcon /><span className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold leading-[13px] text-[#24588b]">Filtros activos:</span></div>{filters.map((filter) => <ActiveFilterChip key={filter.key} label={filter.label} onRemove={() => onRemove(filter.key)} />)}</div><TableActions onNewInspection={onNewInspection} /></div>;
}

function Badge({ children, tone, icon, small = false }: { children: string; tone: BadgeTone; icon?: BadgeIcon; small?: boolean }) {
  const classes: Record<BadgeTone, string> = { blue: 'bg-[#e6f3ff] text-[#0d3862]', mint: 'bg-[#c5fff6] text-[#006153]', pink: 'bg-[#ffd0db] text-[#570b1d]', orange: 'bg-[#ffe1cd] text-[#532a0e]', yellow: 'bg-[#ffeab8] text-[#463100]', green: 'bg-[#e0ffd3] text-[#2a5c16]' };
  const iconColor: Record<BadgeTone, string> = { blue: '#0d3862', mint: '#006153', pink: '#570b1d', orange: '#532a0e', yellow: '#463100', green: '#2a5c16' };
  return <span className={`inline-flex items-center rounded-[6px] px-[8px] py-[2px] font-['Inter:Bold',sans-serif] font-bold leading-[normal] ${small ? 'gap-[2px] text-[9px]' : 'gap-[4px] text-[10px]'} ${classes[tone]}`}>{icon ? <BadgeMiniIcon icon={icon} color={iconColor[tone]} /> : null}{children}</span>;
}

function TableFilterShell({ children, width }: { children: ReactNode; width: number }) {
  return <div className="flex h-[26px] items-center justify-center overflow-visible rounded-[8px] border border-[#d1d1d1] bg-white px-[8px]" style={{ width: `${width}px` }}>{children}</div>;
}

function TableTextFilter({ value, onChange, width, placeholder, type = 'text' }: { value: string; onChange: (value: string) => void; width: number; placeholder: string; type?: 'text' | 'number' }) {
  return <TableFilterShell width={width}><input className="min-w-0 flex-1 border-0 bg-transparent p-0 font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[normal] text-[#131313] outline-none placeholder:text-[#acacac]" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} /></TableFilterShell>;
}

function CalendarPopup({ value, onSelect }: { value: string; onSelect: (value: string) => void }) {
  const selectedDate = parseFilterDate(value);
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - offset);
  const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));

  return (
    <div className="absolute left-0 top-[32px] z-[80] w-[364px] rounded-[2px] border-[1.5px] border-[#646464] bg-white p-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between">
        <button type="button" className="flex items-center gap-[6px] font-['Inter:Bold',sans-serif] text-[19px] font-bold leading-none text-[#131313]" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>{calendarMonthLabel(viewDate)} <span className="text-[13px]">▼</span></button>
        <div className="flex items-center gap-[24px] pr-[14px] text-[42px] leading-none text-[#131313]">
          <button type="button" className="h-[42px] w-[42px] leading-none" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>↑</button>
          <button type="button" className="h-[42px] w-[42px] leading-none" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>↓</button>
        </div>
      </div>
      <div className="mt-[30px] grid grid-cols-7 text-center font-['Inter:Bold',sans-serif] text-[19px] font-bold leading-none text-[#131313]">{weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="mt-[22px] grid grid-cols-7 gap-y-[18px] text-center font-['Inter:Regular',sans-serif] text-[20px] leading-[36px] text-[#131313]">
        {days.map((day) => {
          const selected = selectedDate && day.toDateString() === selectedDate.toDateString();
          const muted = day.getMonth() !== viewDate.getMonth();
          return <button key={day.toISOString()} type="button" className={`mx-auto flex h-[36px] w-[36px] items-center justify-center rounded-[4px] ${selected ? 'bg-[#0b84ff] font-bold text-white shadow-[0_0_0_3px_#006fe6]' : muted ? 'text-[#888]' : 'text-[#131313]'}`} onClick={() => onSelect(formatFullDate(day))}>{day.getDate()}</button>;
        })}
      </div>
      <div className="mt-[28px] flex items-center justify-between px-[22px] font-['Inter:Semi_Bold',sans-serif] text-[20px] font-semibold leading-none text-[#0b84ff]">
        <button type="button" onClick={() => onSelect('')}>Borrar</button>
        <button type="button" onClick={() => onSelect(formatFullDate(new Date()))}>Hoy</button>
      </div>
    </div>
  );
}

function TableDateFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="relative"><TableFilterShell width={123}><input className="min-w-0 flex-1 border-0 bg-transparent p-0 font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[normal] text-[#131313] outline-none placeholder:text-[#acacac]" value={value} onChange={(event) => onChange(formatTypedDate(event.target.value))} placeholder="dd-mm-aaaa" type="text" /><button className="flex size-[18px] shrink-0 items-center justify-center" type="button" onClick={() => setOpen((current) => !current)}><CalendarInputIcon /></button></TableFilterShell>{open ? <CalendarPopup value={value} onSelect={(date) => { onChange(date); setOpen(false); }} /> : null}</div>;
}

function TableSelectFilter({ value, onChange, width, allLabel, options }: { value: string; onChange: (value: string) => void; width: number; allLabel: string; options: string[] }) {
  return <TableFilterShell width={width}><select className="min-w-0 flex-1 border-0 bg-transparent p-0 font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[normal] text-[#131313] outline-none" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{allLabel}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></TableFilterShell>;
}

function TableObservationFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <TableFilterShell width={131}><select className="min-w-0 flex-1 border-0 bg-transparent p-0 font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[normal] text-[#131313] outline-none" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Todos</option><option value="executed">Ejecutadas</option><option value="open">Abiertas</option><option value="closed">Cerradas</option></select></TableFilterShell>;
}

function HeaderCell({ children, gold = false, sortKey, sort, onSort }: { children: string; gold?: boolean; sortKey: SortKey; sort: SortState; onSort: (key: SortKey) => void }) {
  const active = sort?.key === sortKey;
  return <th className="h-[32px] border-r border-[#122e47] bg-[#001e39] px-[12px] py-0 text-left align-middle"><button className="flex h-[32px] items-center gap-[3px] whitespace-nowrap" type="button" onClick={() => onSort(sortKey)}><span className={`font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold uppercase leading-[11px] tracking-[0.44px] ${gold ? 'text-[#c8a064]' : 'text-[rgba(255,255,255,0.7)]'}`}>{children}</span><SortIcon gold={gold} active={active} direction={active ? sort.direction : undefined} /></button></th>;
}

function ActionHeaderCell() {
  return <th className="h-[32px] bg-[#001e39] px-[12px] py-0 text-left align-middle"><div className="flex h-[32px] items-center"><span className="font-['Inter:Bold',sans-serif] text-[10px] font-bold uppercase leading-[10px] tracking-[0.4px] text-[rgba(255,255,255,0.7)]">Acciones</span></div></th>;
}

function FilterCell({ children }: { children: ReactNode }) {
  return <td className="h-[37px] border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px] align-middle">{children}</td>;
}

function DataCell({ children, center = false, bold = false }: { children: ReactNode; center?: boolean; bold?: boolean }) {
  return <td className={`border-r border-b border-[#e3e3e3] bg-white px-[12px] py-[13.5px] align-middle font-['Inter:${bold ? 'Semi_Bold' : 'Regular'}',sans-serif] text-[12px] leading-[normal] text-[#333] ${center ? 'text-center' : 'text-left'} ${bold ? 'font-semibold text-[#131313]' : 'font-normal'}`}>{children}</td>;
}

function IdCell({ value }: { value: string }) {
  return <td className="border-r border-b border-[#e3e3e3] bg-white px-[12px] py-[13.5px] align-middle font-['Inter:Bold',sans-serif] text-[12px] font-bold leading-[normal] text-[#24588b]">{value}</td>;
}

function DaysCell({ value }: { value: number }) {
  const color = value > 12 ? '#570b1d' : value < 5 ? '#2a5c16' : '#463100';
  return <td className="border-r border-b border-[#e3e3e3] bg-white px-[12px] py-[13.5px] text-center align-middle font-['Inter:Bold',sans-serif] text-[12px] font-bold leading-[normal]" style={{ color }}>{value}</td>;
}

function ProgressCell({ value }: { value: number }) {
  const barColor = value < 50 ? '#bd3b5b' : '#e8a820';
  const textColor = value < 50 ? '#570b1d' : '#463100';
  return <td className="border-r border-b border-[#e3e3e3] bg-white px-[12px] py-[14px] align-middle"><div className="flex w-[95px] items-center gap-[5px]"><div className="h-[4px] min-w-[36px] flex-[62_0_0] rounded-[2px] bg-[#e3e3e3]"><div className="h-[4px] rounded-[2px]" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: barColor }} /></div><span className="min-w-[28px] text-right font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-[normal]" style={{ color: textColor }}>{formatPercent(value)}</span></div></td>;
}

function PageSizeSelect({ value, onChange }: { value: InspectionManagementPageSize; onChange: (value: InspectionManagementPageSize) => void }) {
  return <div className="relative h-[32px] w-[54px] rounded-[6px] border border-[#d1d1d1] bg-white"><select className="h-full w-full appearance-none rounded-[6px] bg-transparent pl-[11px] pr-[18px] text-center font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold leading-[32px] text-[#646464] outline-none" value={value} onChange={(event) => onChange(Number(event.target.value) as InspectionManagementPageSize)}>{pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select><span className="pointer-events-none absolute right-[8px] top-1/2 flex h-[10px] w-[10px] -translate-y-1/2 items-center justify-center text-[10px] leading-[10px] text-[#646464]">⌄</span></div>;
}

function getObsBadge(item: string) {
  if (item.includes('Ejec')) return { tone: 'mint' as const, icon: 'check' as const };
  if (item.includes('Cer')) return { tone: 'green' as const, icon: 'check' as const };
  if (item.includes('Sin obs')) return { tone: 'blue' as const, icon: 'clock' as const };
  return { tone: 'yellow' as const, icon: 'clock' as const };
}

function ActionsDropdown({ onViewDetails }: { onViewDetails: () => void }) {
  return (
    <div className="absolute right-0 top-[32px] z-[90] flex w-[220px] flex-col items-start rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)]">
      <button type="button" onClick={onViewDetails} className="flex h-[40px] w-full items-center rounded-[8px] bg-white px-[8px] py-[12px] text-left font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">Ver detalles</button>
      <button type="button" className="flex h-[40px] w-full items-center rounded-[8px] px-[8px] py-[12px] text-left font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">PDF (.pdf)</button>
    </div>
  );
}

function InspectionTable({ rows, total, page, totalPages, pageSize, isLoading, isError, filters, options, sort, onSort, onFilterChange, onClearFilters, onPageChange, onPageSizeChange, onViewDetails }: { rows: Row[]; total: number; page: number; totalPages: number; pageSize: InspectionManagementPageSize; isLoading: boolean; isError: boolean; filters: TableFilters; options: InspectionManagementTableFilterOptionsResponse; sort: SortState; onSort: (key: SortKey) => void; onFilterChange: (key: TableFilterKey, value: string) => void; onClearFilters: () => void; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: InspectionManagementPageSize) => void; onViewDetails: (row: Row) => void }) {
  const [openActionKey, setOpenActionKey] = useState<string | null>(null);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const footerText = isLoading ? 'Cargando inspecciones...' : isError ? 'No fue posible cargar las inspecciones' : `Mostrando ${from}–${to} de ${total} inspecciones`;
  const typeOptions = uniqueSorted(options.types);
  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);

  return (
    <div className="w-full overflow-visible rounded-[8px] border border-[#e3e3e3] bg-white shadow-[0px_1px_4px_rgba(0,0,0,0.05)]">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="table-fixed border-collapse" style={{ minWidth: `${tableWidth}px`, width: `${tableWidth}px` }}>
          <colgroup>{tableColumns.map((width, index) => <col key={index} style={{ width: `${width}px` }} />)}</colgroup>
          <thead>
            <tr className="h-[32px]"><HeaderCell sortKey="id" sort={sort} onSort={onSort}>Nº</HeaderCell><HeaderCell sortKey="date" sort={sort} onSort={onSort}>Fecha</HeaderCell><HeaderCell sortKey="inspector" sort={sort} onSort={onSort}>Inspector</HeaderCell><HeaderCell sortKey="area" sort={sort} onSort={onSort}>Área. Sector</HeaderCell><HeaderCell sortKey="company" sort={sort} onSort={onSort}>Empresa</HeaderCell><HeaderCell sortKey="type" sort={sort} onSort={onSort}>Tipo</HeaderCell><HeaderCell sortKey="urgency" sort={sort} onSort={onSort} gold>Urgencia máxima</HeaderCell><HeaderCell sortKey="count" sort={sort} onSort={onSort}>Nº obs</HeaderCell><HeaderCell sortKey="obs" sort={sort} onSort={onSort}>Obs.</HeaderCell><HeaderCell sortKey="days" sort={sort} onSort={onSort}>Días</HeaderCell><HeaderCell sortKey="closure" sort={sort} onSort={onSort}>Cierre</HeaderCell><ActionHeaderCell /></tr>
            <tr className="h-[37px] bg-[#f0f4f8]">
              <FilterCell><TableTextFilter value={filters.id} onChange={(value) => onFilterChange('id', value)} width={48} placeholder="#" /></FilterCell>
              <FilterCell><TableDateFilter value={filters.date} onChange={(value) => onFilterChange('date', value)} /></FilterCell>
              <FilterCell><TableSelectFilter value={filters.inspector} onChange={(value) => onFilterChange('inspector', value)} width={175} allLabel="Todos los inspectores" options={options.inspectors} /></FilterCell>
              <FilterCell><TableSelectFilter value={filters.area} onChange={(value) => onFilterChange('area', value)} width={184} allLabel="Todas las áreas" options={options.areas} /></FilterCell>
              <FilterCell><TableSelectFilter value={filters.company} onChange={(value) => onFilterChange('company', value)} width={173} allLabel="Todas las empresas" options={options.companies} /></FilterCell>
              <FilterCell><TableSelectFilter value={filters.type} onChange={(value) => onFilterChange('type', value)} width={108} allLabel="Todos" options={typeOptions} /></FilterCell>
              <FilterCell><TableSelectFilter value={filters.urgency} onChange={(value) => onFilterChange('urgency', value)} width={172} allLabel="Todas" options={options.urgencies} /></FilterCell>
              <FilterCell><TableTextFilter value={filters.count} onChange={(value) => onFilterChange('count', value)} width={60} placeholder="#" type="number" /></FilterCell>
              <FilterCell><TableObservationFilter value={filters.obs} onChange={(value) => onFilterChange('obs', value)} /></FilterCell>
              <FilterCell><div className="flex items-center gap-[4px]"><TableTextFilter value={filters.daysMin} onChange={(value) => onFilterChange('daysMin', value)} width={47} placeholder="Min" type="number" /><span className="font-['Inter:Regular',sans-serif] text-[13px] text-[#131313]">-</span><TableTextFilter value={filters.daysMax} onChange={(value) => onFilterChange('daysMax', value)} width={47} placeholder="Max" type="number" /></div></FilterCell>
              <FilterCell><TableTextFilter value={filters.closure} onChange={(value) => onFilterChange('closure', value)} width={95} placeholder="#%" type="number" /></FilterCell>
              <td className="h-[37px] border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px] align-middle"><button className="flex h-[26px] w-[59.5px] items-center justify-center gap-[4px] rounded-[5px] border border-[#d1d1d1] bg-white px-px py-[7px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold leading-[normal] text-[#646464]" type="button" onClick={onClearFilters}><ClearFiltersIcon />Limpiar</button></td>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.uniqueKey} style={{ height: `${row.height}px` }}>
                <IdCell value={row.id} />
                <DataCell>{row.date}</DataCell>
                <DataCell bold>{row.inspector}</DataCell>
                <DataCell>{row.area}</DataCell>
                <DataCell>{row.company}</DataCell>
                <DataCell><Badge tone={row.type.toLowerCase().includes('check') ? 'mint' : 'blue'} icon={row.type.toLowerCase().includes('check') ? 'checklist' : 'search'}>{row.type}</Badge></DataCell>
                <DataCell><Badge tone={row.urgencyTone} icon={row.urgency.includes('Ejecutada') ? 'check' : row.urgency.includes('Grave') ? 'alert' : 'clock'}>{row.urgency}</Badge></DataCell>
                <DataCell center>{row.count}</DataCell>
                <DataCell><div className="flex w-[95.5px] flex-col items-start gap-[4px]">{row.obs.map((item, index) => { const badge = getObsBadge(item); return <Badge key={`${row.uniqueKey}-${item}-${index}`} tone={badge.tone} icon={badge.icon} small>{item}</Badge>; })}</div></DataCell>
                <DaysCell value={row.days} />
                <ProgressCell value={row.closure} />
                <td className="border-b border-[#e3e3e3] bg-white px-[12px] py-[8.5px] text-center align-middle">
                  <div className="relative inline-flex">
                    <button className="inline-flex size-[26px] items-center justify-center rounded-[5px] border border-[#e3e3e3] bg-white p-px" type="button" aria-haspopup="menu" aria-expanded={openActionKey === row.uniqueKey} onClick={() => setOpenActionKey((current) => current === row.uniqueKey ? null : row.uniqueKey)}><MoreIcon /></button>
                    {openActionKey === row.uniqueKey ? <ActionsDropdown onViewDetails={() => { onViewDetails(row); setOpenActionKey(null); }} /> : null}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && sortedRows.length === 0 ? <tr className="h-[61px]"><td colSpan={12} className="border-b border-[#e3e3e3] bg-white px-[12px] py-[13.5px] text-center font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">No hay inspecciones para mostrar</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[#e3e3e3] bg-white px-[16px] py-[10px]"><p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#646464]">{footerText}</p><div className="flex items-center gap-[4px]"><button className="size-[32px] rounded-[6px] border border-[#e3e3e3] disabled:opacity-35" disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">‹</button><button className="size-[32px] rounded-[6px] border border-[#c8a064] bg-[#c8a064] font-semibold text-[#001e39]" type="button">{page}</button><button className="size-[32px] rounded-[6px] border border-[#e3e3e3] disabled:opacity-35" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} type="button">›</button></div><div className="flex items-center gap-[8px]"><span className="text-[12px] text-[#646464]">Filas por página</span><PageSizeSelect value={pageSize} onChange={onPageSizeChange} /></div></div>
    </div>
  );
}

export function InspectionsManagementView() {
  const [newInspectionOpen, setNewInspectionOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SelectedInspectionDetail | null>(null);
  const [filters, setFilters] = useState<TableFilters>(emptyTableFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<InspectionManagementPageSize>(10);
  const [sort, setSort] = useState<SortState>(null);
  const kpisQuery = useInspectionManagementKpis();
  const tableParams = useMemo<InspectionManagementTableParams>(() => ({ page, pageSize, ...filters }), [filters, page, pageSize]);
  const tableQuery = useInspectionManagementTable(tableParams);
  const kpis = buildManagementKpis(kpisQuery.data, kpisQuery.isLoading, kpisQuery.isError);
  const tableRows = useMemo(() => buildTableRows(tableQuery.data?.rows), [tableQuery.data?.rows]);
  const filterOptions = tableQuery.data?.filterOptions ?? emptyFilterOptions;
  const activeFilters = useMemo(() => buildActiveFilters(filters), [filters]);
  const total = tableQuery.data?.total ?? 0;
  const totalPages = tableQuery.data?.totalPages ?? 1;

  function updateFilter(key: TableFilterKey, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function removeFilter(key: TableFilterKey) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: '' }));
  }

  function clearFilters() {
    setPage(1);
    setFilters(emptyTableFilters);
  }

  function changePageSize(value: InspectionManagementPageSize) {
    setPage(1);
    setPageSize(value);
  }

  function openNewInspection() {
    setNewInspectionOpen(true);
  }

  function openInspectionDetail(row: Row) {
    setSelectedDetail({ inspectionId: row.inspectionId, record: buildInspectionDetailRecord(row) });
  }

  function handleSort(key: SortKey) {
    setSort((current) => nextSort(current, key));
  }

  return (
    <>
      <div className="flex h-[calc(100vh-56px)] w-full flex-col items-start overflow-x-hidden overflow-y-auto bg-[#f7f7f7] px-[24px] py-[20px]">
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(244px,1fr))] gap-[12px]"><KpiCard icon="total" iconColor="#24588b" label={`Total ${kpis.year}`} value={kpis.totalInspections} helper={kpis.totalHelper} /><KpiCard icon="open" iconColor="#806000" label="Inspecciones abiertas" value={kpis.openInspections} helper={kpis.openHelper} valueClass="text-[#463100]" /><KpiCard icon="approval" iconColor="#bd3b5b" label="Pend. de aprobación" value={kpis.pendingApproval} helper="Ejecutadas esperando Admin GF" valueClass="text-[#bd3b5b]" /><KpiCard icon="closed" iconColor="#53bd49" label="% Obs. cerradas" value={kpis.closedFindingsRate} helper="Meta >99%" valueClass="text-[#2a5c16]" /></div>
        <ActiveFiltersBar filters={activeFilters} onRemove={removeFilter} onNewInspection={openNewInspection} />
        <div className="w-full pt-[16px]"><InspectionTable rows={tableRows} total={total} page={tableQuery.data?.page ?? page} totalPages={totalPages} pageSize={pageSize} isLoading={tableQuery.isLoading} isError={tableQuery.isError} filters={filters} options={filterOptions} sort={sort} onSort={handleSort} onFilterChange={updateFilter} onClearFilters={clearFilters} onPageChange={setPage} onPageSizeChange={changePageSize} onViewDetails={openInspectionDetail} /></div>
      </div>
      <NewInspectionModalController open={newInspectionOpen} onClose={() => setNewInspectionOpen(false)} />
      <InspectionDetailModalDataBridge open={Boolean(selectedDetail)} inspectionId={selectedDetail?.inspectionId ?? null} record={selectedDetail?.record ?? null} onClose={() => setSelectedDetail(null)} />
    </>
  );
}
