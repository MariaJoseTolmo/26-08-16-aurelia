import { useState } from 'react';

const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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

function CalendarInputIcon() {
  return <svg className="size-[24px] shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden><rect x="4" y="5.5" width="16" height="15" rx="2" fill="#131313" /><path d="M4 10h16M8 3.5v4M16 3.5v4" stroke="#f6faff" strokeWidth="2" strokeLinecap="round" /></svg>;
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

export function InspectionTableDateFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div className="flex h-[26px] w-[123px] items-center justify-center overflow-visible rounded-[8px] border border-[#d1d1d1] bg-white px-[8px]">
        <input className="min-w-0 flex-1 border-0 bg-transparent p-0 font-['Inter:Regular',sans-serif] text-[13px] font-normal leading-[normal] text-[#131313] outline-none placeholder:text-[#acacac]" value={value} onChange={(event) => onChange(formatTypedDate(event.target.value))} placeholder="dd-mm-aaaa" type="text" />
        <button className="flex size-[18px] shrink-0 items-center justify-center" type="button" onClick={() => setOpen((current) => !current)} aria-label="Abrir calendario"><CalendarInputIcon /></button>
      </div>
      {open ? <CalendarPopup value={value} onSelect={(date) => { onChange(date); setOpen(false); }} /> : null}
    </div>
  );
}
