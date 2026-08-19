import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent, type ReactNode } from 'react';
import { useSessionStore } from '../../../../shared/stores/session.store';
import { useNewInspectionCatalogs } from '../hooks/useNewInspectionCatalogs';
import { useNewInspectionLocation } from '../hooks/useNewInspectionLocation';
import { useNewInspectionDraftStore } from '../state/newInspectionDraft.store';
import { useNewInspectionFlowStore } from '../state/newInspectionFlow.store';
import { SelectSheet, type SelectSheetOption } from '../components/SelectSheet';

interface IdentificationStepProps {
  onCancel: () => void;
  onNext: () => void;
}

interface LocationPoint {
  latitude: number;
  longitude: number;
}

function formatDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const year = value.getFullYear();
  return `${day}-${month}-${year}`;
}

function parseDateLabel(value: string): Date | null {
  const parts = value.split(/[/-]/).map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function displayDate(value: string) {
  return value ? value.replaceAll('-', '/') : 'dd-mm-aaaa';
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDateInput(value: string): string | null {
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

function formatLocationLabel(latitude: number, longitude: number, accuracy: string) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)} ${accuracy}`;
}

function parseLocationText(value: string): { latitude: number; longitude: number; accuracy: string | null } | null {
  const match = value.match(/(-?\d+(?:[.,]\d+)?)\s*,\s*(-?\d+(?:[.,]\d+)?)(?:.*?(\+?-?\s*\d+(?:[.,]\d+)?\s*m))?/i);
  if (!match) return null;
  const latitude = Number(match[1]?.replace(',', '.'));
  const longitude = Number(match[2]?.replace(',', '.'));
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  const accuracy = match[3]?.replace(',', '.').replace(/\s+/g, ' ').trim() ?? null;
  return { latitude, longitude, accuracy };
}

function clampLatitude(value: number) {
  return Math.max(-85, Math.min(85, value));
}

function latLngToWorld(latitude: number, longitude: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const sin = Math.sin((clampLatitude(latitude) * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function worldToLatLng(x: number, y: number, zoom: number): LocationPoint {
  const scale = 256 * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { latitude, longitude };
}

function HeaderIcon({ tone }: { tone: 'inspector' | 'inspection' }) {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden="true">
      {tone === 'inspector' ? (
        <path d="M7 5.7a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Zm-4.8 5.1c.5-2.1 2.4-3.6 4.8-3.6s4.3 1.5 4.8 3.6" fill="#24588B" />
      ) : (
        <path d="M2 2.5h5.3v2H2v-2Zm6.6.4 1.1-1.1 1.2 1.2 2-2 1.1 1.1-3.1 3.1-2.3-2.3ZM2 6.4h10v1.4H2V6.4Zm0 3h7v1.4H2V9.4Z" fill="#00B398" />
      )}
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-hidden="true">
      <path d="m1 1 11 9M2.2 4.1c2.5-1.8 5.8-1.8 8.3 0M4.5 6.1c1.2-.7 2.7-.7 3.9 0" stroke="#C8A064" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.8" stroke="#24588B" strokeWidth="1.5" />
      <path d="M9 7.5v5" stroke="#24588B" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="9" cy="5.1" r="1" fill="#24588B" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="12" height="11" rx="1.6" fill="#131313" />
      <path d="M3 7h12M6 2.8v2.4M12 2.8v2.4" stroke="#F6FAFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path d="M1 7h15M10.5 1.5 16 7l-5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CaretDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="m4.5 7 4.5 4 4.5-4" stroke="#131313" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DateCalendarSheet({ visible, value, onClose, onSelect }: { visible: boolean; value: string; onClose: () => void; onSelect: (value: string) => void }) {
  const selectedDate = parseDateLabel(value) ?? new Date();
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [dateText, setDateText] = useState(() => displayDate(value));

  useEffect(() => {
    if (!visible) return;
    setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    setDateText(displayDate(value));
  }, [selectedDate.getFullYear(), selectedDate.getMonth(), value, visible]);

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
    if (!nextText) onSelect('');
    if (!nextValue) return;
    const nextDate = parseDateLabel(nextValue);
    if (nextDate) setViewDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    onSelect(nextValue);
  }

  function handleDateTextBlur() {
    const nextValue = parseDateInput(dateText);
    if (nextValue) {
      setDateText(displayDate(nextValue));
      onSelect(nextValue);
      return;
    }
    if (!dateText) {
      onSelect('');
      return;
    }
    setDateText(displayDate(value));
  }

  return (
    <div className="fixed bottom-[16px] right-[20px] top-[16px] z-[1100] flex w-[360px] max-w-[calc(100vw-40px)] items-end overflow-hidden rounded-[22px] bg-black/70" onClick={onClose}>
      <div className="max-h-[92%] w-full overflow-hidden rounded-t-[16px] bg-white px-[14px] pb-[14px] pt-[14px]" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-col gap-[6px]">
          <p className="text-[13px] font-bold leading-none text-[#131313]">Fecha</p>
          <div className="flex h-[50px] w-full items-center justify-between rounded-[10px] border-[1.5px] border-[#24588B] bg-[#F6FAFF] px-[15.5px] py-[15px] text-left">
            <input value={dateText} onChange={handleDateTextChange} onBlur={handleDateTextBlur} inputMode="numeric" maxLength={10} placeholder="dd/mm/aaaa" className="min-w-0 flex-1 bg-transparent text-[13px] leading-[19.5px] text-[#131313] outline-none placeholder:text-[#757575]" />
            <CalendarIcon />
          </div>
        </div>

        <div className="mt-[10px] w-full rounded-[10px] border border-[#D1D1D1] bg-white px-[12px] pb-[12px] pt-[12px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]">
          <div className="flex h-[28px] items-center justify-between">
            <button type="button" className="flex items-center gap-[4px] text-[14px] font-bold leading-none text-[#131313]" onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}>
              {monthLabel(viewDate)} <span className="text-[10px]">▼</span>
            </button>
            <div className="flex items-center gap-[10px] text-[#131313]">
              <button type="button" className="flex h-[28px] w-[28px] items-center justify-center text-[20px] leading-none" onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}>↑</button>
              <button type="button" className="flex h-[28px] w-[28px] items-center justify-center text-[20px] leading-none" onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}>↓</button>
            </div>
          </div>
          <div className="mt-[14px] grid grid-cols-7 text-center text-[14px] font-bold leading-none text-[#131313]">
            {weekDays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-[10px] grid grid-cols-7 gap-y-[8px] text-center text-[15px] leading-[30px]">
            {days.map((date) => {
              const selected = value && formatDate(date) === value;
              const currentMonth = date.getMonth() === viewDate.getMonth();
              return (
                <button key={date.toISOString()} type="button" onClick={() => selectDate(date)} className={`mx-auto flex h-[30px] w-[30px] items-center justify-center rounded-[6px] ${selected ? 'bg-[#0B84FF] font-bold text-white shadow-[0_0_0_2px_#006FE6]' : currentMonth ? 'text-[#131313]' : 'text-[#888888]'}`}>
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-[14px] flex items-center justify-between px-[18px] text-[14px] font-semibold text-[#0B84FF]">
            <button type="button" onClick={() => { setDateText(''); onSelect(''); onClose(); }}>Borrar</button>
            <button type="button" onClick={() => selectDate(new Date())}>Hoy</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPreview({ latitude, longitude, accuracyLabel, altitude, onPick }: { latitude: number | null; longitude: number | null; accuracyLabel: string; altitude: number | null; onPick: (point: LocationPoint) => void }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const zoom = 15;
  const center = { latitude: latitude ?? -26.02888, longitude: longitude ?? -69.18732 };
  const centerWorld = latLngToWorld(center.latitude, center.longitude, zoom);
  const viewWidth = 332;
  const viewHeight = 120;
  const centerTileX = Math.floor(centerWorld.x / 256);
  const centerTileY = Math.floor(centerWorld.y / 256);
  const tiles = [-1, 0, 1].flatMap((row) => [-1, 0, 1].map((column) => ({ row, column })));

  function handleMapClick(event: MouseEvent<HTMLDivElement>) {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = centerWorld.x + event.clientX - rect.left - rect.width / 2;
    const y = centerWorld.y + event.clientY - rect.top - rect.height / 2;
    onPick(worldToLatLng(x, y, zoom));
  }

  return (
    <div ref={mapRef} role="button" tabIndex={0} className="relative h-[120px] w-full cursor-crosshair overflow-hidden rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#E6EEE8]" onClick={handleMapClick}>
      {tiles.map(({ row, column }) => {
        const tileX = centerTileX + column;
        const tileY = centerTileY + row;
        const maxTile = 2 ** zoom;
        const wrappedX = ((tileX % maxTile) + maxTile) % maxTile;
        const left = tileX * 256 - centerWorld.x + viewWidth / 2;
        const top = tileY * 256 - centerWorld.y + viewHeight / 2;
        return <img key={`${row}-${column}`} alt="" draggable={false} referrerPolicy="no-referrer" src={`https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`} className="absolute h-[256px] w-[256px] select-none" style={{ left, top }} />;
      })}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M14 2.5c-5 0-9 3.9-9 8.8 0 6.7 9 14.2 9 14.2s9-7.5 9-14.2c0-4.9-4-8.8-9-8.8Z" fill="#BD3B5B" />
          <circle cx="14" cy="11.2" r="2.4" fill="#2A1A04" />
        </svg>
      </div>
      <div className="absolute bottom-[11px] left-[8px] rounded-[4px] bg-[rgba(0,0,0,0.7)] px-[8px] py-[3px] text-[10px] font-semibold leading-[12px] text-white">{latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Ubicación estimada'}</div>
      <div className="absolute bottom-[11px] right-[8px] rounded-[4px] bg-[rgba(0,179,152,0.88)] px-[8px] py-[3px] text-[10px] font-semibold leading-[12px] text-white">{altitude !== null ? `${altitude.toFixed(1)} m` : accuracyLabel}</div>
    </div>
  );
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

function SectionCard({ icon, title, subtitle, children, heightClass }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode; heightClass?: string }) {
  return (
    <div className={`w-full rounded-[12px] border border-[#E3E3E3] bg-white p-[15px] shadow-[0_1px_1.5px_rgba(0,0,0,0.05)] ${heightClass ?? ''}`}>
      <div className="flex h-[15px] items-center gap-[7px] pb-[2px]">
        {icon}
        <p className="text-[11px] font-bold uppercase leading-none tracking-[0.66px] text-[#646464]">{title}</p>
      </div>
      <p className="mt-[4px] text-[12px] leading-[16.8px] text-[#646464]">{subtitle}</p>
      {children}
    </div>
  );
}

function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <p className="text-[13px] font-bold leading-[15.5px] text-[#131313]">{label}</p>
      {children}
    </div>
  );
}

function FieldBox({ value, interactive = false, disabled = false, right, onClick }: { value: string; interactive?: boolean; disabled?: boolean; right?: ReactNode; onClick?: () => void; }) {
  return (
    <button
      type="button"
      className={`flex h-[50px] w-full items-center justify-between gap-[8px] rounded-[10px] px-[12px] text-left ${
        interactive ? 'border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF]' : 'bg-[#EEEEEE]'
      } ${disabled ? 'opacity-65' : ''}`}
      onClick={onClick}
      disabled={!onClick || disabled}
    >
      <span className="truncate text-[14px] font-medium leading-none text-[#131313]">{value}</span>
      {right}
    </button>
  );
}

function ManualStepper() {
  const steps = [
    { label: 'Datos', active: true },
    { label: 'Tipo', active: false },
    { label: 'Obs.', active: false },
    { label: 'Resumen', active: false },
  ];

  return (
    <div className="shrink-0 border-b border-[#E3E3E3] bg-white px-[14px] pb-[9px] pt-[10px]">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={step.label} className="relative h-[35px] w-[83px] shrink-0">
            {index < steps.length - 1 ? <div className="absolute left-[33px] top-[11px] h-[2px] w-[73px] bg-[#D1D1D1]" /> : null}
            <div className={`absolute left-[22.2px] top-0 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white text-[9px] font-bold ${step.active ? 'border-[2px] border-[#C8A064] text-[#C8A064]' : 'border-[1.5px] border-[#D1D1D1] text-[#ACACAC]'}`}>{index + 1}</div>
            <p className={`absolute top-[25px] w-full text-center text-[8px] leading-[9.6px] ${step.active ? 'font-semibold text-[#8E6E3E]' : 'text-[#ACACAC]'}`}>{step.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-[6px] h-[2px] w-full overflow-hidden rounded-[2px] bg-[#E3E3E3]">
        <div className="h-[2px] w-[10px] rounded-[2px] bg-gradient-to-r from-[#8E6E3E] to-[#C8A064]" />
      </div>
    </div>
  );
}

export function IdentificationStep({ onCancel, onNext }: IdentificationStepProps) {
  const user = useSessionStore((state) => state.user);
  const draft = useNewInspectionDraftStore();
  const flow = useNewInspectionFlowStore();
  const online = useOnlineStatus();
  const { areas, sectors, loadingAreas, loadingSectors, catalogErrorMessage } = useNewInspectionCatalogs();
  const { captureLocation, capturing, locationError } = useNewInspectionLocation();
  const [locationText, setLocationText] = useState(draft.locationLabel);

  useEffect(() => {
    setLocationText(draft.locationLabel);
  }, [draft.locationLabel]);

  const areaOptions = useMemo<SelectSheetOption[]>(
    () => areas.map((area) => ({ id: area.id, label: area.name })),
    [areas],
  );

  const sectorOptions = useMemo<SelectSheetOption[]>(
    () => sectors.map((sector) => ({ id: sector.id, label: sector.name })),
    [sectors],
  );

  const inspectorName = user?.fullName ?? draft.inspectorName;
  const inspectorCompanyName = draft.inspectorCompanyName;
  const canContinue = Boolean(draft.areaId && draft.sectorId && draft.inspectionDate && draft.locationCaptured);
  const showOfflineBanner = !online || !user;

  function selectArea(option: SelectSheetOption) {
    draft.setArea(option.id, option.label);
    flow.closePicker();
  }

  function selectSector(option: SelectSheetOption) {
    draft.setSector(option.id, option.label);
    flow.closePicker();
  }

  function selectDate(value: string) {
    draft.setInspectionDate(value);
  }

  function setLocationFromPoint(point: LocationPoint) {
    const accuracy = draft.locationAccuracyLabel && draft.locationAccuracyLabel !== 'Sin precision' ? draft.locationAccuracyLabel : '+- 0.0 m';
    draft.setLocation({
      label: formatLocationLabel(point.latitude, point.longitude, accuracy),
      accuracy,
      latitude: point.latitude,
      longitude: point.longitude,
      altitude: draft.altitude,
    });
  }

  function applyManualLocation() {
    const parsed = parseLocationText(locationText);
    if (!parsed) return;
    const accuracy = parsed.accuracy ?? (draft.locationAccuracyLabel && draft.locationAccuracyLabel !== 'Sin precision' ? draft.locationAccuracyLabel : '+- 0.0 m');
    draft.setLocation({
      label: formatLocationLabel(parsed.latitude, parsed.longitude, accuracy),
      accuracy,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      altitude: draft.altitude,
    });
  }

  async function handleCaptureLocation() {
    await captureLocation();
  }

  function handleNext() {
    if (!canContinue) return;
    onNext();
  }

  return (
    <>
      <div className="h-[56px] shrink-0 bg-[#002659] text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
        <div className="flex h-full items-center gap-[4px] px-[4px]">
          <div className="min-w-0 flex-1 px-[4px]">
            <p className="truncate text-[14px] font-semibold leading-[17px] text-white">Identificación</p>
            <p className="mt-[1px] truncate text-[11px] leading-[14px] text-[rgba(255,255,255,0.55)]">Paso 1 de 5</p>
          </div>
          <div className="pr-[4px]">
            <div className="flex h-[20px] w-[56px] items-center justify-center rounded-[16px] bg-[#C8A064]">
              <span className="text-[10px] font-bold leading-none text-[#001E39]">GF HSE</span>
            </div>
          </div>
        </div>
      </div>

      {showOfflineBanner ? (
        <div className="flex h-[23px] shrink-0 items-center gap-[7px] border-b border-[#C8A064] bg-[#2A1A04] px-[16px] pb-[6px] pt-[5px]">
          <OfflineIcon />
          <span className="text-[11px] font-semibold leading-none text-[#C8A064]">Sin red · guardando localmente</span>
        </div>
      ) : null}

      <ManualStepper />

      <div className="flex-1 overflow-y-auto bg-[#F7F7F7] px-[14px] pb-[16px] pt-[14px]">
        <div>
          <p className="text-[18px] font-bold leading-[21.6px] text-[#131313]">Identificación</p>
          <p className="mt-[4px] w-[329px] text-[12px] leading-[16.8px] text-[#646464]">
            Completa los datos del inspector y de la inspección antes de continuar
          </p>
        </div>

        <SectionCard icon={<HeaderIcon tone="inspector" />} title="Datos del inspector" subtitle="¿Quién está realizando esta inspección?" heightClass="mt-[12px]">
          <div className="mt-[10px] grid gap-[10px]">
            <LabeledField label="Inspector *">
              <FieldBox value={inspectorName} />
            </LabeledField>
            <LabeledField label="Empresa del inspector *">
              <FieldBox value={inspectorCompanyName} />
            </LabeledField>
          </div>
        </SectionCard>

        <SectionCard icon={<HeaderIcon tone="inspection" />} title="Datos de la inspección" subtitle="¿Dónde y cuándo se realiza esta inspección?" heightClass="mt-[12px]">
          <div className="mt-[10px] grid grid-cols-2 gap-[8px]">
            <LabeledField label="Área *">
              <FieldBox
                value={loadingAreas ? 'Cargando...' : draft.areaName ?? '-Seleccionar-'}
                interactive
                right={<CaretDown />}
                onClick={() => flow.openPicker('area')}
              />
            </LabeledField>
            <LabeledField label="Sector *">
              <FieldBox
                value={loadingSectors ? 'Cargando...' : draft.sectorName ?? '-Seleccionar-'}
                interactive
                disabled={!draft.areaId}
                right={<CaretDown />}
                onClick={() => flow.openPicker('sector')}
              />
            </LabeledField>
          </div>

          <div className="mt-[10px]">
            <LabeledField label="Fecha de inspección *">
              <FieldBox
                value={displayDate(draft.inspectionDate)}
                interactive
                right={<CalendarIcon />}
                onClick={() => flow.openPicker('date')}
              />
            </LabeledField>
          </div>

          <div className="mt-[10px] flex items-center justify-between">
            <p className="text-[13px] font-bold leading-[15.5px] text-[#131313]">Ubicación *</p>
            <button type="button" className="flex h-[20px] w-[20px] items-center justify-center rounded-full" aria-label="Información de ubicación"><InfoIcon /></button>
          </div>

          <button
            type="button"
            className={`mt-[6px] flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[10px] text-[13px] font-bold text-white ${
              draft.locationCaptured ? 'bg-[#3A9B3A]' : 'bg-[#C8A064]'
            }`}
            onClick={handleCaptureLocation}
            disabled={capturing}
          >
            <span>{draft.locationCaptured ? '✓' : '◎'}</span>
            {capturing ? 'Capturando ubicación...' : draft.locationCaptured ? 'Ubicación capturada' : 'Capturar ubicación'}
          </button>

          {locationError ? <p className="mt-[6px] text-[11px] text-[#BD3B5B]">{locationError}</p> : null}
          {catalogErrorMessage ? <p className="mt-[6px] text-[11px] text-[#BD3B5B]">{catalogErrorMessage}</p> : null}

          <input
            value={locationText}
            onChange={(event) => setLocationText(event.target.value)}
            onBlur={applyManualLocation}
            onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
            className="mt-[8px] flex h-[50px] w-full rounded-[10px] border-[1.5px] border-[#D1D1D1] bg-[#F6FAFF] px-[12px] text-[14px] font-normal text-[#131313] outline-none"
            placeholder="latitud, longitud +- precisión"
          />
          <div className="mt-[8px]">
            <MapPreview latitude={draft.latitude} longitude={draft.longitude} accuracyLabel={draft.locationAccuracyLabel} altitude={draft.altitude} onPick={setLocationFromPoint} />
          </div>
          <div className="mt-[8px] flex h-[16px] items-center gap-[4px] text-[11px] leading-[14.3px] text-[#646464]">
            <span className="text-[#24588B]">↳</span>
            <span className="truncate">Haz click en el mapa para ajustar la ubicación manualmente</span>
          </div>
        </SectionCard>
      </div>

      <div className="shrink-0 border-t border-[#E3E3E3] bg-white pb-[8px] pt-[10px]">
        <div className="flex w-full gap-[10px] px-[14px]">
          <button
            type="button"
            className="!flex !h-[50px] !w-auto !min-w-0 !shrink-0 !items-center !justify-center !rounded-[14px] !border-[2px] !border-[#C8A064] !bg-white !px-[20px] !text-[14px] !font-bold !text-[#C8A064]"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`!flex !h-[50px] !w-auto !min-w-0 !flex-1 !items-center !justify-center !gap-[8px] !rounded-[14px] !text-[14px] !font-bold !shadow-[0_2px_4px_rgba(200,160,100,0.25)] ${
              canContinue ? '!bg-[#C8A064] !text-white' : '!bg-[#E3E3E3] !text-[#9AA0A6] !shadow-none'
            }`}
            onClick={handleNext}
            disabled={!canContinue}
          >
            Continuar
            <ArrowRightIcon />
          </button>
        </div>
        <div className="mx-auto mb-[4px] mt-[14px] h-[4px] w-[120px] rounded-[2px] bg-[#D1D1D1]" />
      </div>

      <SelectSheet
        visible={flow.activePicker === 'area'}
        title="Seleccionar área"
        subtitle="Catálogo online/cache local"
        options={areaOptions}
        selectedId={draft.areaId}
        loading={loadingAreas}
        emptyText="No hay catálogos disponibles"
        onClose={flow.closePicker}
        onSelect={selectArea}
      />

      <SelectSheet
        visible={flow.activePicker === 'sector'}
        title="Seleccionar sector"
        subtitle={draft.areaName ?? 'Selecciona un área primero'}
        options={sectorOptions}
        selectedId={draft.sectorId}
        loading={loadingSectors}
        emptyText="No hay sectores disponibles"
        onClose={flow.closePicker}
        onSelect={selectSector}
      />

      <DateCalendarSheet visible={flow.activePicker === 'date'} value={draft.inspectionDate} onClose={flow.closePicker} onSelect={selectDate} />
    </>
  );
}
