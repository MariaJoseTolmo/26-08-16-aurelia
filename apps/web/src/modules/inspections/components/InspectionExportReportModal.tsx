import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { downloadInspectionPeriodicReport } from '../../../shared/services/periodic-inspection-reports.service';
import { InspectionExportCaretIcon, InspectionExportCloseIcon, InspectionExportInfoIcon } from './InspectionExportReportIcons';

export type InspectionExportFormat = 'excel' | 'pdf';

type InspectionType = 'all' | 'open' | 'closed';
type OpenDropdown = 'year' | 'period' | null;

type PeriodOption = {
  value: string;
  label: string;
};

type Props = {
  open: boolean;
  format: InspectionExportFormat | null;
  initialInspectionState?: InspectionType;
  onClose: () => void;
};

const periodOptions: PeriodOption[] = [
  { value: 'year', label: 'Todo el año' },
  { value: 'q1', label: 'T1 · Ene–Mar' },
  { value: 'm1', label: 'Enero' },
  { value: 'm2', label: 'Febrero' },
  { value: 'm3', label: 'Marzo' },
  { value: 'q2', label: 'T2 · Abr–Jun' },
  { value: 'm4', label: 'Abril' },
  { value: 'm5', label: 'Mayo' },
  { value: 'm6', label: 'Junio' },
  { value: 'q3', label: 'T3 · Jul–Sep' },
  { value: 'm7', label: 'Julio' },
  { value: 'm8', label: 'Agosto' },
  { value: 'm9', label: 'Septiembre' },
  { value: 'q4', label: 'T4 · Oct–Dic' },
  { value: 'm10', label: 'Octubre' },
  { value: 'm11', label: 'Noviembre' },
  { value: 'm12', label: 'Diciembre' },
];

function ExportDropdown({ label, open, widthClass, menuWidthClass, children, onToggle }: { label: string; open: boolean; widthClass: string; menuWidthClass: string; children: ReactElement; onToggle: () => void }) {
  return (
    <div className={`relative h-[36px] min-w-0 ${widthClass}`}>
      <button type="button" className="flex h-[36px] w-full items-center justify-between rounded-[8px] border border-[#d1d1d1] bg-white px-[9px] font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[normal] text-[#131313]" aria-haspopup="listbox" aria-expanded={open} onClick={onToggle}>
        <span className="truncate">{label}</span>
        <InspectionExportCaretIcon open={open} />
      </button>
      {open ? <div className={`absolute left-0 top-[44px] z-[10100] ${menuWidthClass}`}>{children}</div> : null}
    </div>
  );
}

function DropdownMenu({ children, maxHeightClass = '' }: { children: ReactElement | ReactElement[]; maxHeightClass?: string }) {
  return <div className={`flex w-full flex-col items-start overflow-y-auto rounded-[12px] border border-[#d1d1d1] bg-white p-[8px] shadow-[0px_4px_8px_rgba(19,19,19,0.24)] ${maxHeightClass}`}>{children}</div>;
}

function DropdownOption({ selected, children, onClick }: { selected: boolean; children: string; onClick: () => void }) {
  return <button type="button" className={`flex h-[40px] w-full shrink-0 items-center overflow-hidden rounded-[8px] px-[8px] py-[12px] text-left font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313] ${selected ? 'bg-[#e3e3e3]' : 'bg-white hover:bg-[#e3e3e3]'}`} role="option" aria-selected={selected} onClick={onClick}>{children}</button>;
}

function InspectionTypeChip({ active, children, onClick, widthClass }: { active: boolean; children: string; onClick: () => void; widthClass: string }) {
  return <button type="button" className={`h-[25px] shrink-0 rounded-[8px] border-[1.5px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold leading-[normal] ${widthClass} ${active ? 'border-[#e8c86a] bg-[#ffeab8] text-[#463100]' : 'border-[#d1d1d1] bg-[#f4f6f9] text-[#646464]'}`} aria-pressed={active} onClick={onClick}>{children}{active ? ' ✓' : ''}</button>;
}

export function InspectionExportReportModal({ open, format, initialInspectionState = 'all', onClose }: Props): ReactElement | null {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 4 }, (_, index) => currentYear - index), [currentYear]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [year, setYear] = useState(currentYear);
  const [period, setPeriod] = useState('year');
  const [inspectionType, setInspectionType] = useState<InspectionType>(initialInspectionState);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [isExporting, setIsExporting] = useState(false);
  const periodLabel = periodOptions.find((option) => option.value === period)?.label ?? 'Todo el año';
  const formatLabel = format === 'excel' ? 'Excel' : 'PDF';
  const actionLabel = isExporting ? `Generando ${formatLabel}…` : `Exportar ${formatLabel}`;

  useEffect(() => {
    if (!open) return;
    setYear(currentYear);
    setPeriod('year');
    setInspectionType(initialInspectionState);
    setOpenDropdown(null);
    setIsExporting(false);
  }, [currentYear, initialInspectionState, open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || isExporting) return;
      if (openDropdown) setOpenDropdown(null);
      else onClose();
    }
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) setOpenDropdown(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isExporting, onClose, open, openDropdown]);

  async function handleExport() {
    if (!format || isExporting) return;
    setIsExporting(true);
    setOpenDropdown(null);
    try {
      await downloadInspectionPeriodicReport(format === 'excel' ? 'xlsx' : 'pdf', {
        year,
        period,
        inspectionState: inspectionType,
      });
      setIsExporting(false);
      onClose();
    } catch {
      setIsExporting(false);
      window.alert(`No fue posible generar el informe ${formatLabel}. Intenta nuevamente.`);
    }
  }

  if (!open || !format) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/60" role="presentation" onMouseDown={(event) => { if (!isExporting && event.target === event.currentTarget) onClose(); }}>
      <div ref={rootRef} className="flex h-[329px] w-[495px] max-w-[calc(100vw-32px)] flex-col items-start justify-center gap-[32px] rounded-[16px] bg-white p-[16px]" role="dialog" aria-modal="true" aria-label={`Configurar exportación ${formatLabel}`} aria-busy={isExporting}>
        <div className="flex h-[32px] w-full shrink-0 items-center justify-between">
          <InspectionExportInfoIcon />
          <button type="button" className="flex size-[16px] items-center justify-center disabled:cursor-not-allowed disabled:opacity-40" aria-label="Cerrar" disabled={isExporting} onClick={onClose}><InspectionExportCloseIcon /></button>
        </div>

        <div className="flex w-full shrink-0 flex-col items-start gap-[8px]">
          <h2 className="w-full font-['Inter:Bold',sans-serif] text-[18px] font-bold leading-[22px] tracking-[0.36px] text-[#2a2a2a]">Exportar informe de inspecciones</h2>
          <p className="w-full font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">Seleccione un periodo de tiempo para la exportación</p>
          <div className={`flex h-[36px] w-full items-center gap-[8px] ${isExporting ? 'pointer-events-none opacity-60' : ''}`}>
            <ExportDropdown label={String(year)} open={openDropdown === 'year'} widthClass="flex-1" menuWidthClass="w-[228px]" onToggle={() => setOpenDropdown((current) => current === 'year' ? null : 'year')}>
              <DropdownMenu>
                {years.map((option) => <DropdownOption key={option} selected={option === year} onClick={() => { setYear(option); setOpenDropdown(null); }}>{String(option)}</DropdownOption>)}
              </DropdownMenu>
            </ExportDropdown>
            <ExportDropdown label={periodLabel} open={openDropdown === 'period'} widthClass="flex-1" menuWidthClass="w-[235px]" onToggle={() => setOpenDropdown((current) => current === 'period' ? null : 'period')}>
              <DropdownMenu maxHeightClass="max-h-[192px]">
                {periodOptions.map((option) => <DropdownOption key={option.value} selected={option.value === period} onClick={() => { setPeriod(option.value); setOpenDropdown(null); }}>{option.label}</DropdownOption>)}
              </DropdownMenu>
            </ExportDropdown>
          </div>
          <p className="w-full font-['Inter:Regular',sans-serif] text-[14px] font-normal leading-[22.7px] tracking-[0.28px] text-[#131313]">Seleccione el tipo de inspecciones que desea exportar</p>
          <div className={`flex h-[25px] items-center gap-[8px] ${isExporting ? 'pointer-events-none opacity-60' : ''}`}>
            <InspectionTypeChip active={inspectionType === 'all'} widthClass="w-[64px]" onClick={() => setInspectionType('all')}>Todas</InspectionTypeChip>
            <InspectionTypeChip active={inspectionType === 'open'} widthClass="w-[65px]" onClick={() => setInspectionType('open')}>Abiertas</InspectionTypeChip>
            <InspectionTypeChip active={inspectionType === 'closed'} widthClass="w-[68px]" onClick={() => setInspectionType('closed')}>Cerradas</InspectionTypeChip>
          </div>
        </div>

        <div className="flex h-[40px] w-full shrink-0 items-center justify-end gap-[12px]">
          <button type="button" className="flex h-[40px] flex-1 items-center justify-center rounded-[8px] border border-[#c8a064] bg-white px-[16px] py-[8px] font-['Inter:Bold',sans-serif] text-[14px] font-bold leading-[22.7px] tracking-[0.28px] text-[#c8a064] disabled:cursor-not-allowed disabled:opacity-50" disabled={isExporting} onClick={onClose}>Cancelar</button>
          <button type="button" className="flex h-[40px] flex-1 items-center justify-center gap-[8px] rounded-[8px] bg-[#c8a064] px-[16px] py-[8px] font-['Inter:Bold',sans-serif] text-[14px] font-bold leading-[22.7px] tracking-[0.28px] text-white disabled:cursor-wait disabled:opacity-80" disabled={isExporting} onClick={() => { void handleExport(); }}>
            {isExporting ? <span className="size-[14px] shrink-0 animate-spin rounded-full border-2 border-white/50 border-t-white" aria-hidden="true" /> : null}
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
