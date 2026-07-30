import { useMemo, useState, type ReactNode } from 'react';
import type { InspectionHistoryKpisResponse, InspectionManagementTableFilterOptionsResponse, InspectionManagementTableRowResponse } from '@aurelia/contracts';
import { useInspectionHistoryKpis } from '../../shared/hooks/useInspectionHistoryKpis';
import { useInspectionHistoryTable } from '../../shared/hooks/useInspectionHistoryTable';
import type { InspectionManagementPageSize, InspectionManagementTableParams } from '../../shared/services/inspections.service';
import type { InspectionDetailModalRecord } from './components/InspectionDetailModal';
import { InspectionDetailModalDataBridge } from './components/InspectionDetailModalDataBridge';
import { ClearFiltersIcon, HistoryAverageClosureIcon, HistoryClosedInspectionsIcon, HistoryClosedObservationsIcon, HistoryContractorCompaniesIcon, InspectionExportChevronIcon, InspectionExportDocumentIcon } from './components/InspectionManagementIcons';
import { InspectionTableDateFilter } from './components/InspectionTableDateFilter';

type BadgeTone = 'blue' | 'mint' | 'pink' | 'yellow' | 'green';
type TableFilterKey = keyof TableFilters;
type KpiValueTone = 'green' | 'dark';

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

const tableColumns = [72, 147, 199, 208, 197, 132, 196, 84, 155, 132, 119, 83.5];
const tableWidth = tableColumns.reduce((total, width) => total + width, 0);
const pageSizeOptions: InspectionManagementPageSize[] = [10, 25, 50];
const emptyTableFilters: TableFilters = { id: '', date: '', inspector: '', area: '', company: '', type: '', urgency: '', count: '', obs: '', daysMin: '', daysMax: '', closure: '' };
const emptyFilterOptions: InspectionManagementTableFilterOptionsResponse = { inspectors: [], areas: [], companies: [], types: [], urgencies: [] };
const numberFormatter = new Intl.NumberFormat('es-CL');
const percentFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getFullYear()).slice(-2)}`;
}

function expandedYearDate(value: string) {
  const [day, month, year] = value.split('-');
  if (!day || !month || !year) return value;
  return `${day}-${month}-${year.length === 2 ? `20${year}` : year}`;
}

function formatInspectionNumber(value: string) {
  return value.startsWith('#') ? value : `#${value}`;
}

function formatObservationBadges(row: InspectionManagementTableRowResponse) {
  const badges: string[] = [];
  if (row.observations.executed > 0) badges.push(`${row.observations.executed} Ejec.`);
  if (row.observations.open > 0) badges.push(`${row.observations.open} Abier.`);
  if (row.observations.closed > 0) badges.push(`${row.observations.closed} Cer`);
  if (row.observations.rejected > 0) badges.push(`${row.observations.rejected} Rech.`);
  if (badges.length === 0) badges.push('Sin obs.');
  return badges;
}

function getUrgencyTone(row: InspectionManagementTableRowResponse): BadgeTone {
  if (row.urgencyLabel.toLowerCase().includes('cerrada')) return 'green';
  if (row.urgencySeverity === 'critical' || row.urgencySeverity === 'high') return 'pink';
  if (row.urgencySeverity === 'medium') return 'yellow';
  return 'green';
}

function buildRows(rows: InspectionManagementTableRowResponse[] | undefined): Row[] {
  return (rows ?? []).map((row) => {
    const obs = formatObservationBadges(row);
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
      obs,
      days: row.daysOpen,
      closure: row.closureRate,
      height: obs.length >= 3 ? 80 : obs.length <= 1 ? 42 : 61,
    };
  });
}

function buildKpis(data: InspectionHistoryKpisResponse | undefined, isLoading: boolean, isError: boolean) {
  const year = new Date().getFullYear();
  if (isLoading) return { year, closedInspections: '...', averageClosureDays: '...', closedFindingsRate: '...', contractorCompanies: '...' };
  if (isError || !data) return { year, closedInspections: '—', averageClosureDays: '—', closedFindingsRate: '—', contractorCompanies: '—' };
  return {
    year: data.year,
    closedInspections: formatNumber(data.closedInspections),
    averageClosureDays: formatNumber(data.averageClosureDays),
    closedFindingsRate: formatPercent(data.closedFindingsRate),
    contractorCompanies: formatNumber(data.contractorCompanies),
  };
}

function readObsCount(row: Row, token: string) {
  const item = row.obs.find((value) => value.toLowerCase().includes(token));
  return Number(item?.match(/\d+/)?.[0] ?? 0);
}

function buildInspectionDetailRecord(row: Row): InspectionDetailModalRecord {
  const kind = row.type.toLowerCase().includes('check') ? 'checklist' : 'finding';
  const date = expandedYearDate(row.date);
  return {
    id: row.id,
    title: row.company && !row.area.includes(row.company) ? `${row.area} · ${row.company}` : row.area,
    kind,
    metadataLine1: kind === 'checklist' ? `Checklist · ${date}` : `${row.type} · ${date} · ${row.area}`,
    metadataLine2: kind === 'checklist' ? `${date} · inspección cerrada` : 'Tipo de hallazgo: [Tipo seleccionado en el form de insp]',
    progressPercent: row.closure,
    counts: {
      executed: readObsCount(row, 'ejec'),
      open: readObsCount(row, 'abier'),
      closed: readObsCount(row, 'cer'),
      rejected: readObsCount(row, 'rech'),
    },
  };
}

function buildActiveFilters(filters: TableFilters) {
  const chips: Array<{ key: TableFilterKey; label: string }> = [];
  if (filters.id) chips.push({ key: 'id', label: `N°: ${filters.id}` });
  if (filters.date) chips.push({ key: 'date', label: `Fecha cierre: ${filters.date}` });
  if (filters.inspector) chips.push({ key: 'inspector', label: `Inspector: ${filters.inspector}` });
  if (filters.area) chips.push({ key: 'area', label: `Área: ${filters.area}` });
  if (filters.company) chips.push({ key: 'company', label: `Empresa: ${filters.company}` });
  if (filters.type) chips.push({ key: 'type', label: `Tipo: ${filters.type}` });
  if (filters.urgency) chips.push({ key: 'urgency', label: `Urgencia: ${filters.urgency}` });
  if (filters.count) chips.push({ key: 'count', label: `N° obs.: ${filters.count}` });
  if (filters.obs) chips.push({ key: 'obs', label: `Obs.: ${filters.obs}` });
  if (filters.daysMin) chips.push({ key: 'daysMin', label: `Días mín.: ${filters.daysMin}` });
  if (filters.daysMax) chips.push({ key: 'daysMax', label: `Días máx.: ${filters.daysMax}` });
  if (filters.closure) chips.push({ key: 'closure', label: `Cierre: ${filters.closure}%` });
  return chips;
}

function KpiCard({ label, value, helper, icon, valueTone }: { label: string; value: string; helper: string; icon: ReactNode; valueTone: KpiValueTone }) {
  return (
    <div className="flex h-[92.5px] min-w-0 flex-col items-start rounded-[8px] border border-[#e3e3e3] bg-white px-[17px] py-[15px] drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.05)]">
      <div className="flex h-[14px] w-full items-center gap-[6px]">{icon}<p className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold uppercase leading-[normal] tracking-[0.44px] text-[#646464]">{label}</p></div>
      <div className="h-[33px] w-full pt-[4px]"><p className={`whitespace-nowrap font-['Inter:Bold',sans-serif] text-[24px] font-bold leading-[normal] ${valueTone === 'green' ? 'text-[#2a5c16]' : 'text-[#131313]'}`}>{value}</p></div>
      <div className="h-[16px] w-full pt-[3px]"><p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[11px] font-normal leading-[normal] text-[#646464]">{helper}</p></div>
    </div>
  );
}

function TableActions() {
  return <button className="flex h-[36px] w-[117.5px] shrink-0 items-center gap-[6px] rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[13.5px] py-[1.5px] text-[12px] font-semibold text-[#333]" type="button"><InspectionExportDocumentIcon /><span className="font-['Inter:Semi_Bold',sans-serif]">Exportar</span><InspectionExportChevronIcon /></button>;
}

function ActiveFiltersBar({ filters, onRemove }: { filters: Array<{ key: TableFilterKey; label: string }>; onRemove: (key: TableFilterKey) => void }) {
  if (filters.length === 0) return <div className="flex min-h-[38px] w-full justify-end pt-[16px]"><TableActions /></div>;
  return <div className="flex min-h-[38px] w-full flex-wrap items-center justify-between gap-[12px] pt-[16px]"><div className="flex min-h-[38px] min-w-[280px] flex-1 items-center gap-[10px] overflow-x-auto bg-[#eef5ff] px-[14px] py-[10px]"><span className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold leading-[13px] text-[#24588b]">Filtros activos:</span>{filters.map((filter) => <button key={filter.key} className="flex h-[18px] items-center gap-[5px] rounded-[4px] border border-[#b4d1ed] bg-[#e6f3ff] px-[9px] py-[3px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold leading-[normal] text-[#0d3862]" type="button" onClick={() => onRemove(filter.key)}>{filter.label} ×</button>)}</div><TableActions /></div>;
}

function Badge({ children, tone }: { children: string; tone: BadgeTone }) {
  const classes: Record<BadgeTone, string> = { blue: 'bg-[#e6f3ff] text-[#0d3862]', mint: 'bg-[#c5fff6] text-[#006153]', pink: 'bg-[#ffd0db] text-[#570b1d]', yellow: 'bg-[#ffeab8] text-[#463100]', green: 'bg-[#e0ffd3] text-[#2a5c16]' };
  return <span className={`inline-flex items-center rounded-[6px] px-[8px] py-[2px] font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-[normal] ${classes[tone]}`}>{children}</span>;
}

function TableFilterShell({ children, width }: { children: ReactNode; width: number }) {
  return <div className="flex h-[26px] items-center justify-center overflow-visible rounded-[8px] border border-[#d1d1d1] bg-white px-[8px]" style={{ width }}>{children}</div>;
}

function TableTextFilter({ value, onChange, width, placeholder, type = 'text' }: { value: string; onChange: (value: string) => void; width: number; placeholder: string; type?: 'text' | 'number' }) {
  return <TableFilterShell width={width}><input className="min-w-0 flex-1 border-0 bg-transparent p-0 font-['Inter:Regular',sans-serif] text-[13px] text-[#131313] outline-none placeholder:text-[#acacac]" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} /></TableFilterShell>;
}

function TableSelectFilter({ value, onChange, width, allLabel, options }: { value: string; onChange: (value: string) => void; width: number; allLabel: string; options: string[] }) {
  return <TableFilterShell width={width}><select className="min-w-0 flex-1 border-0 bg-transparent p-0 font-['Inter:Regular',sans-serif] text-[13px] text-[#131313] outline-none" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{allLabel}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></TableFilterShell>;
}

function HeaderCell({ children }: { children: string }) {
  return <th className="h-[32px] border-r border-[#122e47] bg-[#001e39] px-[12px] py-0 text-left align-middle"><span className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold uppercase leading-[11px] tracking-[0.44px] text-[rgba(255,255,255,0.7)]">{children}</span></th>;
}

function DataCell({ children, center = false, bold = false }: { children: ReactNode; center?: boolean; bold?: boolean }) {
  return <td className={`border-r border-b border-[#e3e3e3] bg-white px-[12px] py-[13.5px] align-middle text-[12px] leading-[normal] ${center ? 'text-center' : 'text-left'} ${bold ? 'font-semibold text-[#131313]' : 'text-[#333]'}`}>{children}</td>;
}

function PageSizeSelect({ value, onChange }: { value: InspectionManagementPageSize; onChange: (value: InspectionManagementPageSize) => void }) {
  return <select className="h-[32px] w-[54px] rounded-[6px] border border-[#d1d1d1] bg-white text-center text-[12px] font-semibold text-[#646464] outline-none" value={value} onChange={(event) => onChange(Number(event.target.value) as InspectionManagementPageSize)}>{pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

function MoreIcon() {
  return <svg className="h-[12px] w-[15px] shrink-0" fill="none" viewBox="0 0 15 12" aria-hidden><circle cx="3.5" cy="6" r="1.35" fill="#646464" /><circle cx="7.5" cy="6" r="1.35" fill="#646464" /><circle cx="11.5" cy="6" r="1.35" fill="#646464" /></svg>;
}

function ActionsDropdown({ onViewDetails }: { onViewDetails: () => void }) {
  return <div className="absolute right-0 top-[32px] z-[90] flex w-[220px] flex-col items-start rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)]"><button type="button" onClick={onViewDetails} className="flex h-[40px] w-full items-center rounded-[8px] bg-white px-[8px] py-[12px] text-left text-[14px] text-[#131313]">Ver detalles</button><button type="button" className="flex h-[40px] w-full items-center rounded-[8px] px-[8px] py-[12px] text-left text-[14px] text-[#131313]">PDF (.pdf)</button></div>;
}

function InspectionHistoryTable({ rows, total, page, totalPages, pageSize, isLoading, isError, filters, options, onFilterChange, onClearFilters, onPageChange, onPageSizeChange, onViewDetails }: { rows: Row[]; total: number; page: number; totalPages: number; pageSize: InspectionManagementPageSize; isLoading: boolean; isError: boolean; filters: TableFilters; options: InspectionManagementTableFilterOptionsResponse; onFilterChange: (key: TableFilterKey, value: string) => void; onClearFilters: () => void; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: InspectionManagementPageSize) => void; onViewDetails: (row: Row) => void }) {
  const [openActionKey, setOpenActionKey] = useState<string | null>(null);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const footerText = isLoading ? 'Cargando inspecciones cerradas...' : isError ? 'No fue posible cargar el historial' : `Mostrando ${from}–${to} de ${total} inspecciones cerradas`;

  return (
    <div className="w-full overflow-visible rounded-[8px] border border-[#e3e3e3] bg-white shadow-[0px_1px_4px_rgba(0,0,0,0.05)]">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="table-fixed border-collapse" style={{ minWidth: `${tableWidth}px`, width: `${tableWidth}px` }}>
          <colgroup>{tableColumns.map((width, index) => <col key={index} style={{ width: `${width}px` }} />)}</colgroup>
          <thead>
            <tr className="h-[32px]"><HeaderCell>Nº</HeaderCell><HeaderCell>Fecha cierre</HeaderCell><HeaderCell>Inspector</HeaderCell><HeaderCell>Área. Sector</HeaderCell><HeaderCell>Empresa</HeaderCell><HeaderCell>Tipo</HeaderCell><HeaderCell>Urgencia máxima</HeaderCell><HeaderCell>Nº obs</HeaderCell><HeaderCell>Obs.</HeaderCell><HeaderCell>Días</HeaderCell><HeaderCell>Cierre</HeaderCell><HeaderCell>Acciones</HeaderCell></tr>
            <tr className="h-[37px] bg-[#f0f4f8]">
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><TableTextFilter value={filters.id} onChange={(value) => onFilterChange('id', value)} width={48} placeholder="#" /></td>
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><InspectionTableDateFilter value={filters.date} onChange={(value) => onFilterChange('date', value)} /></td>
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><TableSelectFilter value={filters.inspector} onChange={(value) => onFilterChange('inspector', value)} width={175} allLabel="Todos los inspectores" options={options.inspectors} /></td>
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><TableSelectFilter value={filters.area} onChange={(value) => onFilterChange('area', value)} width={184} allLabel="Todas las áreas" options={options.areas} /></td>
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><TableSelectFilter value={filters.company} onChange={(value) => onFilterChange('company', value)} width={173} allLabel="Todas las empresas" options={options.companies} /></td>
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><TableSelectFilter value={filters.type} onChange={(value) => onFilterChange('type', value)} width={108} allLabel="Todos" options={options.types} /></td>
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><TableSelectFilter value={filters.urgency} onChange={(value) => onFilterChange('urgency', value)} width={172} allLabel="Todas" options={options.urgencies} /></td>
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><TableTextFilter value={filters.count} onChange={(value) => onFilterChange('count', value)} width={60} placeholder="#" type="number" /></td>
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><TableSelectFilter value={filters.obs} onChange={(value) => onFilterChange('obs', value)} width={131} allLabel="Todos" options={['executed', 'open', 'closed', 'rejected']} /></td>
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><div className="flex items-center gap-[4px]"><TableTextFilter value={filters.daysMin} onChange={(value) => onFilterChange('daysMin', value)} width={47} placeholder="Min" type="number" /><span>-</span><TableTextFilter value={filters.daysMax} onChange={(value) => onFilterChange('daysMax', value)} width={47} placeholder="Max" type="number" /></div></td>
              <td className="border-r border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><TableTextFilter value={filters.closure} onChange={(value) => onFilterChange('closure', value)} width={95} placeholder="#%" type="number" /></td>
              <td className="border-b border-[#e3e3e3] bg-[#f0f4f8] px-[12px] py-[5.5px]"><button className="flex h-[26px] w-[59.5px] items-center justify-center gap-[4px] rounded-[5px] border border-[#d1d1d1] bg-white px-px py-[7px] text-[10px] font-semibold text-[#646464]" type="button" onClick={onClearFilters}><ClearFiltersIcon />Limpiar</button></td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.uniqueKey} style={{ height: `${row.height}px` }}>
                <td className="border-r border-b border-[#e3e3e3] bg-white px-[12px] py-[13.5px] text-[12px] font-bold text-[#24588b]">{row.id}</td>
                <DataCell>{row.date}</DataCell><DataCell bold>{row.inspector}</DataCell><DataCell>{row.area}</DataCell><DataCell>{row.company}</DataCell>
                <DataCell><Badge tone={row.type.toLowerCase().includes('check') ? 'mint' : 'blue'}>{row.type}</Badge></DataCell>
                <DataCell><Badge tone={row.urgencyTone}>{row.urgency}</Badge></DataCell>
                <DataCell center>{row.count}</DataCell>
                <DataCell><div className="flex w-[95.5px] flex-col items-start gap-[4px]">{row.obs.map((item, index) => <Badge key={`${row.uniqueKey}-${item}-${index}`} tone={item.includes('Cer') ? 'green' : item.includes('Rech') ? 'pink' : item.includes('Ejec') ? 'mint' : 'yellow'}>{item}</Badge>)}</div></DataCell>
                <DataCell center bold>{row.days}</DataCell>
                <td className="border-r border-b border-[#e3e3e3] bg-white px-[12px] py-[14px]"><div className="flex w-[95px] items-center gap-[5px]"><div className="h-[4px] min-w-[36px] flex-[62_0_0] rounded-[2px] bg-[#e3e3e3]"><div className="h-[4px] rounded-[2px] bg-[#53bd49]" style={{ width: `${Math.max(0, Math.min(100, row.closure))}%` }} /></div><span className="min-w-[28px] text-right text-[10px] font-bold text-[#2a5c16]">{formatPercent(row.closure)}</span></div></td>
                <td className="border-b border-[#e3e3e3] bg-white px-[12px] py-[8.5px] text-center"><div className="relative inline-flex"><button className="inline-flex size-[26px] items-center justify-center rounded-[5px] border border-[#e3e3e3] bg-white p-px" type="button" aria-haspopup="menu" aria-expanded={openActionKey === row.uniqueKey} onClick={() => setOpenActionKey((current) => current === row.uniqueKey ? null : row.uniqueKey)}><MoreIcon /></button>{openActionKey === row.uniqueKey ? <ActionsDropdown onViewDetails={() => { onViewDetails(row); setOpenActionKey(null); }} /> : null}</div></td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 ? <tr><td colSpan={12} className="border-b border-[#e3e3e3] bg-white px-[12px] py-[20px] text-center text-[12px] text-[#646464]">No hay inspecciones cerradas para mostrar</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[#e3e3e3] bg-white px-[16px] py-[10px]"><p className="text-[12px] text-[#646464]">{footerText}</p><div className="flex items-center gap-[4px]"><button className="size-[32px] rounded-[6px] border border-[#e3e3e3] disabled:opacity-35" disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">‹</button><button className="size-[32px] rounded-[6px] border border-[#c8a064] bg-[#c8a064] font-semibold text-[#001e39]" type="button">{page}</button><button className="size-[32px] rounded-[6px] border border-[#e3e3e3] disabled:opacity-35" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} type="button">›</button></div><div className="flex items-center gap-[8px]"><span className="text-[12px] text-[#646464]">Filas por página</span><PageSizeSelect value={pageSize} onChange={onPageSizeChange} /></div></div>
    </div>
  );
}

export function InspectionsHistoryView() {
  const [selectedDetail, setSelectedDetail] = useState<SelectedInspectionDetail | null>(null);
  const [filters, setFilters] = useState<TableFilters>(emptyTableFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<InspectionManagementPageSize>(10);
  const kpisQuery = useInspectionHistoryKpis();
  const tableParams = useMemo<InspectionManagementTableParams>(() => ({ page, pageSize, ...filters }), [filters, page, pageSize]);
  const tableQuery = useInspectionHistoryTable(tableParams);
  const kpis = buildKpis(kpisQuery.data, kpisQuery.isLoading, kpisQuery.isError);
  const rows = useMemo(() => buildRows(tableQuery.data?.rows), [tableQuery.data?.rows]);
  const activeFilters = useMemo(() => buildActiveFilters(filters), [filters]);
  const filterOptions = tableQuery.data?.filterOptions ?? emptyFilterOptions;
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

  function openInspectionDetail(row: Row) {
    setSelectedDetail({ inspectionId: row.inspectionId, record: buildInspectionDetailRecord(row) });
  }

  return (
    <>
      <div className="flex h-[calc(100vh-56px)] w-full flex-col items-start overflow-x-hidden overflow-y-auto bg-[#f7f7f7] px-[24px] py-[20px]">
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(244px,1fr))] gap-[12px]"><KpiCard icon={<HistoryClosedInspectionsIcon />} valueTone="green" label="Inspecciones cerradas" value={kpis.closedInspections} helper={`Año ${kpis.year}`} /><KpiCard icon={<HistoryAverageClosureIcon />} valueTone="dark" label="Promedio de cierre" value={kpis.averageClosureDays} helper="días por inspección" /><KpiCard icon={<HistoryClosedObservationsIcon />} valueTone="green" label="% Obs. cerradas" value={kpis.closedFindingsRate} helper="sobre inspecciones cerradas" /><KpiCard icon={<HistoryContractorCompaniesIcon />} valueTone="dark" label="Empresas EECC" value={kpis.contractorCompanies} helper="empresas con al menos 1 insp." /></div>
        <ActiveFiltersBar filters={activeFilters} onRemove={removeFilter} />
        <div className="w-full pt-[16px]"><InspectionHistoryTable rows={rows} total={total} page={tableQuery.data?.page ?? page} totalPages={totalPages} pageSize={pageSize} isLoading={tableQuery.isLoading} isError={tableQuery.isError} filters={filters} options={filterOptions} onFilterChange={updateFilter} onClearFilters={clearFilters} onPageChange={setPage} onPageSizeChange={(value) => { setPage(1); setPageSize(value); }} onViewDetails={openInspectionDetail} /></div>
      </div>
      <InspectionDetailModalDataBridge open={Boolean(selectedDetail)} inspectionId={selectedDetail?.inspectionId ?? null} record={selectedDetail?.record ?? null} onClose={() => setSelectedDetail(null)} />
    </>
  );
}
