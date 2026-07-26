import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { fontWeight } from '../../shared/theme/tokens';

export type MobileInspectionFilterControlKey =
  | 'date'
  | 'inspector'
  | 'area'
  | 'company'
  | 'type'
  | 'urgency'
  | 'obs';

type SelectOption = {
  value: string;
  label: string;
};

type OpenControlProps = {
  open: boolean;
  onToggle: () => void;
};

const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const observationOptions: SelectOption[] = [
  { value: 'open', label: 'Abiertas' },
  { value: 'executed', label: 'Ejecutadas' },
  { value: 'closed', label: 'Cerradas' },
];

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function CaretIcon({ open = false }: { open?: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" style={open ? styles.caretOpen : undefined}>
      <Path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#131313" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Rect x={4} y={5.5} width={16} height={15} rx={2} fill="#131313" />
      <Path d="M4 10H20M8 3.5V7.5M16 3.5V7.5" stroke="#F6FAFF" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function BackIcon() {
  return (
    <Svg width={22} height={23} viewBox="0 0 22 23">
      <Path d="M13.75 5.5L7.75 11.5L13.75 17.5" stroke="#131313" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked ? (
        <Svg width={12} height={12} viewBox="0 0 12 12">
          <Path d="M2.2 6.1L4.7 8.45L9.8 3.35" stroke="#FFFFFF" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : null}
    </View>
  );
}

function MonthArrow({ direction }: { direction: 'previous' | 'next' }) {
  const path = direction === 'previous' ? 'M9 11L5 7L9 3' : 'M5 3L9 7L5 11';
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d={path} stroke="#131313" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function sanitizeIntegerInput(value: string): string {
  return value.replace(/\D/g, '');
}

export function sanitizePercentageInput(value: string): string {
  const digits = sanitizeIntegerInput(value).slice(0, 3);
  if (!digits) return '';
  return String(Math.min(100, Number(digits)));
}

export function formatTypedFilterDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function parseFilterDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parts = value.split(/[/-]/).map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const [day, month, yearValue] = parts;
  const year = yearValue < 100 ? 2000 + yearValue : yearValue;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function formatFullDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function calendarMonthLabel(date: Date): string {
  const value = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(date);
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function NumericFilterField({
  value,
  placeholder,
  onChange,
  percentage = false,
  keyboardType = 'number-pad',
}: {
  value: string | undefined;
  placeholder: string;
  onChange: (value: string) => void;
  percentage?: boolean;
  keyboardType?: KeyboardTypeOptions;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value ?? ''}
      onChangeText={(text) => onChange(percentage ? sanitizePercentageInput(text) : sanitizeIntegerInput(text))}
      placeholder={placeholder}
      placeholderTextColor="#757575"
      keyboardType={keyboardType}
      style={[styles.field, focused && styles.fieldFocused]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function DropdownMenu({
  options,
  selectedValue,
  onSelect,
}: {
  options: SelectOption[];
  selectedValue?: string;
  onSelect: (option: SelectOption) => void;
}) {
  return (
    <View style={styles.dropdownMenu}>
      {options.map((option) => {
        const selected = option.value === selectedValue;
        return (
          <TouchableOpacity
            key={`${option.value}-${option.label}`}
            style={[styles.dropdownRow, selected && styles.dropdownRowSelected]}
            onPress={() => onSelect(option)}
            activeOpacity={0.75}
          >
            <Text style={[styles.dropdownRowText, selected && styles.dropdownRowTextSelected]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function SingleSelectFilter({
  value,
  placeholder,
  values,
  allLabel,
  open,
  onToggle,
  onChange,
}: {
  value: string | undefined;
  placeholder: string;
  values: string[];
  allLabel: string;
  onChange: (value: string | undefined) => void;
} & OpenControlProps) {
  const options = useMemo<SelectOption[]>(() => [
    { value: '', label: allLabel },
    ...unique(values).map((item) => ({ value: item, label: item })),
  ], [allLabel, values]);

  return (
    <View>
      <TouchableOpacity style={[styles.selectField, open && styles.fieldFocused]} onPress={onToggle} activeOpacity={0.8}>
        <Text style={[styles.fieldText, !value && styles.placeholder]} numberOfLines={1}>{value || placeholder}</Text>
        <CaretIcon open={open} />
      </TouchableOpacity>
      {open ? (
        <DropdownMenu
          options={options}
          selectedValue={value ?? ''}
          onSelect={(option) => {
            onChange(option.value || undefined);
            onToggle();
          }}
        />
      ) : null}
    </View>
  );
}

function CalendarPanel({ value, onSelect }: { value?: string; onSelect: (value: string | undefined) => void }) {
  const selectedDate = parseFilterDate(value);
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate) setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [value]);

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - offset);
  const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));

  return (
    <View style={styles.calendarPanel}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarMonth}>{calendarMonthLabel(viewDate)}</Text>
        <View style={styles.calendarNavigation}>
          <TouchableOpacity style={styles.calendarNavigationButton} onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
            <MonthArrow direction="previous" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.calendarNavigationButton} onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
            <MonthArrow direction="next" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.calendarWeekRow}>
        {weekDays.map((day, index) => <Text key={`${day}-${index}`} style={styles.calendarWeekDay}>{day}</Text>)}
      </View>
      <View style={styles.calendarGrid}>
        {days.map((day) => {
          const selected = Boolean(selectedDate && day.toDateString() === selectedDate.toDateString());
          const muted = day.getMonth() !== viewDate.getMonth();
          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={[styles.calendarDay, selected && styles.calendarDaySelected]}
              onPress={() => onSelect(formatFullDate(day))}
            >
              <Text style={[styles.calendarDayText, muted && styles.calendarDayMuted, selected && styles.calendarDayTextSelected]}>{day.getDate()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.calendarActions}>
        <TouchableOpacity onPress={() => onSelect(undefined)}><Text style={styles.calendarActionText}>Borrar</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onSelect(formatFullDate(new Date()))}><Text style={styles.calendarActionText}>Hoy</Text></TouchableOpacity>
      </View>
    </View>
  );
}

export function DateFilterField({
  value,
  open,
  onToggle,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
} & OpenControlProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <View style={[styles.selectField, (open || focused) && styles.fieldFocused]}>
        <TextInput
          value={value ?? ''}
          onChangeText={(text) => onChange(formatTypedFilterDate(text))}
          placeholder="dd-mm-aaaa"
          placeholderTextColor="#757575"
          keyboardType="number-pad"
          style={styles.dateInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity style={styles.calendarButton} onPress={onToggle} accessibilityLabel="Abrir calendario">
          <CalendarIcon />
        </TouchableOpacity>
      </View>
      {open ? <CalendarPanel value={value} onSelect={(next) => { onChange(next); onToggle(); }} /> : null}
    </View>
  );
}

type AreaSectorEntry = {
  value: string;
  area: string;
  sector?: string;
};

function parseAreaSectorOptions(values: string[]): AreaSectorEntry[] {
  return unique(values).map((value) => {
    const parts = value.split(/\s*·\s*/).map((part) => part.trim()).filter(Boolean);
    return { value, area: parts[0] ?? value, sector: parts.slice(1).join(' · ') || undefined };
  });
}

export function AreaSectorFilter({
  value,
  values,
  open,
  onToggle,
  onChange,
}: {
  value: string | undefined;
  values: string[];
  onChange: (value: string | undefined) => void;
} & OpenControlProps) {
  const entries = useMemo(() => parseAreaSectorOptions(values), [values]);
  const selectedEntry = entries.find((entry) => entry.value === value);
  const [areaStage, setAreaStage] = useState<string | null>(null);
  const areas = useMemo(() => unique(entries.map((entry) => entry.area)), [entries]);

  useEffect(() => {
    if (!open) setAreaStage(null);
  }, [open]);

  function chooseArea(area: string) {
    const matches = entries.filter((entry) => entry.area === area);
    const sectors = matches.filter((entry) => entry.sector);
    if (sectors.length === 0 && matches[0]) {
      onChange(matches[0].value);
      onToggle();
      return;
    }
    setAreaStage(area);
  }

  const sectorEntries = areaStage ? entries.filter((entry) => entry.area === areaStage && entry.sector) : [];

  return (
    <View>
      <TouchableOpacity style={[styles.selectField, open && styles.fieldFocused]} onPress={onToggle} activeOpacity={0.8}>
        <Text style={[styles.fieldText, !value && styles.placeholder]} numberOfLines={1}>{selectedEntry?.value ?? 'Todas las áreas'}</Text>
        <CaretIcon open={open} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.dropdownMenu}>
          {areaStage ? (
            <>
              <TouchableOpacity style={styles.dropdownHeaderRow} onPress={() => setAreaStage(null)}>
                <BackIcon />
                <Text style={styles.dropdownHeaderText}>Sectores de {areaStage}</Text>
              </TouchableOpacity>
              {sectorEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.value}
                  style={[styles.dropdownRow, entry.value === value && styles.dropdownRowSelected]}
                  onPress={() => { onChange(entry.value); onToggle(); }}
                >
                  <Text style={[styles.dropdownRowText, entry.value === value && styles.dropdownRowTextSelected]}>{entry.sector}</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              <TouchableOpacity style={[styles.dropdownRow, !value && styles.dropdownRowSelected]} onPress={() => { onChange(undefined); onToggle(); }}>
                <Text style={[styles.dropdownRowText, !value && styles.dropdownRowTextSelected]}>Todas las áreas</Text>
              </TouchableOpacity>
              {areas.map((area) => (
                <TouchableOpacity
                  key={area}
                  style={[styles.dropdownRow, selectedEntry?.area === area && styles.dropdownRowSelected]}
                  onPress={() => chooseArea(area)}
                >
                  <Text style={[styles.dropdownRowText, selectedEntry?.area === area && styles.dropdownRowTextSelected]}>{area}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

type UrgencyEntry = {
  value: string;
  state: string;
  severity?: string;
};

function parseUrgencyOptions(values: string[]): UrgencyEntry[] {
  return unique(values).map((value) => {
    const parts = value.split(/\s*(?:·|-)\s*/).map((part) => part.trim()).filter(Boolean);
    return { value, state: parts[0] ?? value, severity: parts.slice(1).join(' - ') || undefined };
  });
}

function urgencyDisplayValue(value: string | undefined): string {
  if (!value) return 'Todos';
  if (value === 'sla_overdue') return 'SLA vencido';
  return value.replace(/\s*·\s*/g, ' - ');
}

export function UrgencyFilter({
  value,
  values,
  open,
  onToggle,
  onChange,
}: {
  value: string | undefined;
  values: string[];
  onChange: (value: string | undefined) => void;
} & OpenControlProps) {
  const entries = useMemo(() => parseUrgencyOptions(values), [values]);
  const [stateStage, setStateStage] = useState<string | null>(null);
  const states = useMemo(() => unique(entries.map((entry) => entry.state)), [entries]);

  useEffect(() => {
    if (!open) setStateStage(null);
  }, [open]);

  function chooseState(state: string) {
    if (state === 'SLA vencido') {
      onChange('sla_overdue');
      onToggle();
      return;
    }
    const matching = entries.filter((entry) => entry.state === state);
    if (matching.length === 1 && !matching[0]?.severity) {
      onChange(matching[0]?.value);
      onToggle();
      return;
    }
    setStateStage(state);
  }

  const stageEntries = stateStage ? entries.filter((entry) => entry.state === stateStage && entry.severity) : [];

  return (
    <View>
      <TouchableOpacity style={[styles.selectField, open && styles.fieldFocused]} onPress={onToggle} activeOpacity={0.8}>
        <Text style={[styles.fieldText, !value && styles.placeholder]} numberOfLines={1}>{urgencyDisplayValue(value)}</Text>
        <CaretIcon open={open} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.dropdownMenu}>
          {stateStage ? (
            <>
              <TouchableOpacity style={styles.dropdownHeaderRow} onPress={() => setStateStage(null)}>
                <BackIcon />
                <Text style={styles.dropdownHeaderText}>Criticidad para {stateStage}</Text>
              </TouchableOpacity>
              {stageEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.value}
                  style={[styles.dropdownRow, entry.value === value && styles.dropdownRowSelected]}
                  onPress={() => { onChange(entry.value); onToggle(); }}
                >
                  <Text style={[styles.dropdownRowText, entry.value === value && styles.dropdownRowTextSelected]}>{entry.severity}</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              <TouchableOpacity style={[styles.dropdownRow, !value && styles.dropdownRowSelected]} onPress={() => { onChange(undefined); onToggle(); }}>
                <Text style={[styles.dropdownRowText, !value && styles.dropdownRowTextSelected]}>Todos</Text>
              </TouchableOpacity>
              {states.map((state) => (
                <TouchableOpacity key={state} style={styles.dropdownRow} onPress={() => chooseState(state)}>
                  <Text style={styles.dropdownRowText}>{state}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.dropdownRow, value === 'sla_overdue' && styles.dropdownRowSelected]} onPress={() => chooseState('SLA vencido')}>
                <Text style={[styles.dropdownRowText, value === 'sla_overdue' && styles.dropdownRowTextSelected]}>SLA vencido</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

function observationDisplayValue(value: string | undefined): string {
  const selected = value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
  if (selected.length === 0) return 'Todos';
  return observationOptions.filter((option) => selected.includes(option.value)).map((option) => option.label).join(', ');
}

export function ObservationMultiSelectFilter({
  value,
  open,
  onToggle,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
} & OpenControlProps) {
  const selected = useMemo(() => value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [], [value]);

  function toggleOption(optionValue: string) {
    const next = selected.includes(optionValue)
      ? selected.filter((item) => item !== optionValue)
      : [...selected, optionValue];
    onChange(next.length > 0 ? next.join(',') : undefined);
  }

  return (
    <View>
      <TouchableOpacity style={[styles.selectField, open && styles.fieldFocused]} onPress={onToggle} activeOpacity={0.8}>
        <Text style={[styles.fieldText, selected.length === 0 && styles.placeholder]} numberOfLines={1}>{observationDisplayValue(value)}</Text>
        <CaretIcon open={open} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity style={styles.multiSelectRow} onPress={() => onChange(undefined)}>
            <Checkbox checked={selected.length === 0} />
            <Text style={styles.dropdownRowText}>Todos</Text>
          </TouchableOpacity>
          {observationOptions.map((option) => (
            <TouchableOpacity key={option.value} style={styles.multiSelectRow} onPress={() => toggleOption(option.value)}>
              <Checkbox checked={selected.includes(option.value)} />
              <Text style={styles.dropdownRowText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D1D1',
    backgroundColor: '#F6FAFF',
    paddingHorizontal: 15.5,
    paddingVertical: 0,
    color: '#131313',
    fontSize: 13,
    lineHeight: 19.5,
  },
  fieldFocused: { borderColor: '#24588B' },
  selectField: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D1D1',
    backgroundColor: '#F6FAFF',
    paddingHorizontal: 15.5,
  },
  fieldText: { flex: 1, color: '#131313', fontSize: 13, lineHeight: 19.5 },
  placeholder: { color: '#757575' },
  caretOpen: { transform: [{ rotate: '180deg' }] },
  dateInput: { flex: 1, height: 48, paddingVertical: 0, color: '#131313', fontSize: 13, lineHeight: 19.5 },
  calendarButton: { width: 32, height: 42, alignItems: 'flex-end', justifyContent: 'center' },
  dropdownMenu: {
    marginTop: 10,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 8,
    shadowColor: '#131313',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  dropdownRow: { minHeight: 40, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8 },
  dropdownRowSelected: { backgroundColor: '#F0F0F0' },
  dropdownRowText: { color: '#131313', fontSize: 14, lineHeight: 22.7, letterSpacing: 0.28 },
  dropdownRowTextSelected: { fontWeight: fontWeight.semibold },
  dropdownHeaderRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8 },
  dropdownHeaderText: { flex: 1, color: '#131313', fontSize: 14, lineHeight: 22.7, letterSpacing: 0.28, fontWeight: fontWeight.semibold },
  multiSelectRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: '#131313', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: '#C8A064', backgroundColor: '#C8A064' },
  calendarPanel: {
    marginTop: 10,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#646464',
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#131313',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarMonth: { color: '#131313', fontSize: 15, lineHeight: 19, fontWeight: fontWeight.bold },
  calendarNavigation: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  calendarNavigationButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  calendarWeekRow: { marginTop: 20, flexDirection: 'row' },
  calendarWeekDay: { width: '14.2857%', color: '#131313', fontSize: 12, lineHeight: 15, textAlign: 'center', fontWeight: fontWeight.bold },
  calendarGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', rowGap: 7 },
  calendarDay: { width: '14.2857%', height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  calendarDaySelected: { backgroundColor: '#0B84FF' },
  calendarDayText: { color: '#131313', fontSize: 12, lineHeight: 15 },
  calendarDayMuted: { color: '#888888' },
  calendarDayTextSelected: { color: '#FFFFFF', fontWeight: fontWeight.bold },
  calendarActions: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  calendarActionText: { color: '#0B84FF', fontSize: 13, lineHeight: 16, fontWeight: fontWeight.semibold },
});
