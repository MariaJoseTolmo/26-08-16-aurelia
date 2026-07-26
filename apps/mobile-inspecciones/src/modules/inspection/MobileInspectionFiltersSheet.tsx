import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { InspectionManagementTableFilterOptionsResponse } from '@aurelia/contracts';
import type {
  MobileInspectionManagementFilters,
  MobileInspectionManagementMode,
} from '../../shared/services/inspections.api';
import { colors, fontWeight } from '../../shared/theme/tokens';
import {
  AreaSectorFilter,
  DateFilterField,
  NumericFilterField,
  ObservationMultiSelectFilter,
  SingleSelectFilter,
  UrgencyFilter,
  type MobileInspectionFilterControlKey,
} from './MobileInspectionFilterControls';

type FilterKey = Exclude<keyof MobileInspectionManagementFilters, 'page' | 'pageSize'>;

type Props = {
  visible: boolean;
  mode: MobileInspectionManagementMode;
  value: MobileInspectionManagementFilters;
  options: InspectionManagementTableFilterOptionsResponse;
  onClose: () => void;
  onApply: (filters: MobileInspectionManagementFilters) => void;
};

type ActiveFilter = {
  key: FilterKey;
  label: string;
};

const filterKeys: FilterKey[] = [
  'id',
  'date',
  'inspector',
  'area',
  'company',
  'type',
  'urgency',
  'count',
  'obs',
  'daysMin',
  'daysMax',
  'closure',
];

const observationLabels: Record<string, string> = {
  executed: 'Ejecutadas',
  open: 'Abiertas',
  closed: 'Cerradas',
  rejected: 'Rechazadas',
};

function CloseIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Path
        d="M9 9L23 23M23 9L9 23"
        stroke="#131313"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FilterIcon() {
  return (
    <Svg width={12.5} height={10} viewBox="0 0 12.5 10">
      <Path d="M0.5 0.75H12L7.35 5.55V9.1L5.15 8.05V5.55L0.5 0.75Z" fill="#24588B" />
    </Svg>
  );
}

function clean(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function inspectionNumberLabel(value: string): string {
  return value.startsWith('#') ? value : `#${value}`;
}

function observationFilterLabel(value: string): string {
  return value
    .split(',')
    .map((item) => observationLabels[item.trim()] ?? item.trim())
    .filter(Boolean)
    .join(', ');
}

function urgencyFilterLabel(value: string): string {
  if (value === 'sla_overdue') return 'SLA vencido';
  return value.replace(/\s*·\s*/g, ' - ');
}

function buildActiveFilters(filters: MobileInspectionManagementFilters): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  if (filters.id?.trim()) {
    active.push({ key: 'id', label: `Nº: ${inspectionNumberLabel(filters.id.trim())}` });
  }
  if (filters.date?.trim()) active.push({ key: 'date', label: `Fecha: ${filters.date.trim()}` });
  if (filters.inspector?.trim()) {
    active.push({ key: 'inspector', label: `Inspector: ${filters.inspector.trim()}` });
  }
  if (filters.area?.trim()) active.push({ key: 'area', label: `Área: ${filters.area.trim()}` });
  if (filters.company?.trim()) {
    active.push({ key: 'company', label: `Empresa: ${filters.company.trim()}` });
  }
  if (filters.type?.trim()) active.push({ key: 'type', label: `Tipo: ${filters.type.trim()}` });
  if (filters.urgency?.trim()) {
    active.push({ key: 'urgency', label: `Urgencia: ${urgencyFilterLabel(filters.urgency.trim())}` });
  }
  if (filters.count?.trim()) active.push({ key: 'count', label: `Nº obs.: ${filters.count.trim()}` });
  if (filters.obs?.trim()) {
    active.push({ key: 'obs', label: `Obs.: ${observationFilterLabel(filters.obs.trim())}` });
  }
  if (filters.daysMin?.trim()) {
    active.push({ key: 'daysMin', label: `Días mín.: ${filters.daysMin.trim()}` });
  }
  if (filters.daysMax?.trim()) {
    active.push({ key: 'daysMax', label: `Días máx.: ${filters.daysMax.trim()}` });
  }
  if (filters.closure?.trim()) {
    active.push({ key: 'closure', label: `Cierre: ${filters.closure.trim()}%` });
  }
  return active;
}

function FieldSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldSection}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function normalizeRange(
  minimumValue: string | undefined,
  maximumValue: string | undefined,
): { minimum?: string; maximum?: string } {
  const minimum = clean(minimumValue);
  const maximum = clean(maximumValue);
  if (!minimum || !maximum) return { minimum, maximum };
  const minNumber = Number(minimum);
  const maxNumber = Number(maximum);
  if (!Number.isFinite(minNumber) || !Number.isFinite(maxNumber) || minNumber <= maxNumber) {
    return { minimum, maximum };
  }
  return { minimum: maximum, maximum: minimum };
}

export function countMobileInspectionFilters(filters: MobileInspectionManagementFilters): number {
  return filterKeys.reduce((total, key) => {
    const value = filters[key];
    return total + (typeof value === 'string' && value.trim() ? 1 : 0);
  }, 0);
}

export function MobileInspectionFiltersSheet({
  visible,
  mode,
  value,
  options,
  onClose,
  onApply,
}: Props) {
  const [draft, setDraft] = useState<MobileInspectionManagementFilters>(value);
  const [openControl, setOpenControl] = useState<MobileInspectionFilterControlKey | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setOpenControl(null);
    }
  }, [value, visible]);

  const activeFilters = useMemo(() => buildActiveFilters(draft), [draft]);

  function update(key: FilterKey, nextValue: string | undefined) {
    setDraft((current) => ({ ...current, [key]: nextValue, page: 1 }));
  }

  function toggleControl(key: MobileInspectionFilterControlKey) {
    setOpenControl((current) => current === key ? null : key);
  }

  function cancel() {
    setDraft(value);
    setOpenControl(null);
    onClose();
  }

  function apply() {
    const days = normalizeRange(draft.daysMin, draft.daysMax);
    const next: MobileInspectionManagementFilters = {
      page: 1,
      pageSize: value.pageSize,
      id: clean(draft.id),
      date: clean(draft.date),
      inspector: clean(draft.inspector),
      area: clean(draft.area),
      company: clean(draft.company),
      type: clean(draft.type),
      urgency: clean(draft.urgency),
      count: clean(draft.count),
      obs: clean(draft.obs),
      daysMin: days.minimum,
      daysMax: days.maximum,
      closure: clean(draft.closure),
    };
    setOpenControl(null);
    onApply(next);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={cancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={cancel}
          accessibilityLabel="Cerrar filtros"
        />
        <View
          style={styles.panel}
          accessible
          accessibilityLabel={
            mode === 'history'
              ? 'Filtros del historial de inspecciones'
              : 'Filtros de gestión de inspecciones'
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={cancel}
              accessibilityRole="button"
              accessibilityLabel="Cerrar filtros"
            >
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.activeFiltersBar}>
            <View style={styles.activeFiltersTitleRow}>
              <FilterIcon />
              <Text style={styles.activeFiltersTitle}>Filtros activos:</Text>
            </View>
            {activeFilters.length > 0 ? (
              <View style={styles.activeFiltersWrap}>
                {activeFilters.map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={styles.activeFilterChip}
                    onPress={() => update(filter.key, undefined)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar filtro ${filter.label}`}
                  >
                    <Text style={styles.activeFilterChipText}>{filter.label}</Text>
                    <Text style={styles.activeFilterChipClose}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <FieldSection label="Número">
              <NumericFilterField
                value={draft.id}
                placeholder="#"
                onChange={(text) => update('id', text)}
              />
            </FieldSection>

            <FieldSection label="Fecha">
              <DateFilterField
                value={draft.date}
                open={openControl === 'date'}
                onToggle={() => toggleControl('date')}
                onChange={(next) => update('date', next)}
              />
            </FieldSection>

            <FieldSection label="Inspector">
              <SingleSelectFilter
                value={draft.inspector}
                placeholder="Todos los inspectores"
                allLabel="Todos los inspectores"
                values={options.inspectors}
                open={openControl === 'inspector'}
                onToggle={() => toggleControl('inspector')}
                onChange={(next) => update('inspector', next)}
              />
            </FieldSection>

            <FieldSection label="Área y sector">
              <AreaSectorFilter
                value={draft.area}
                values={options.areas}
                open={openControl === 'area'}
                onToggle={() => toggleControl('area')}
                onChange={(next) => update('area', next)}
              />
            </FieldSection>

            <FieldSection label="Empresa">
              <SingleSelectFilter
                value={draft.company}
                placeholder="Todas las empresas"
                allLabel="Todas las empresas"
                values={options.companies}
                open={openControl === 'company'}
                onToggle={() => toggleControl('company')}
                onChange={(next) => update('company', next)}
              />
            </FieldSection>

            <FieldSection label="Tipo">
              <SingleSelectFilter
                value={draft.type}
                placeholder="Todos"
                allLabel="Todos"
                values={options.types}
                open={openControl === 'type'}
                onToggle={() => toggleControl('type')}
                onChange={(next) => update('type', next)}
              />
            </FieldSection>

            <FieldSection label="Urgencia máxima">
              <UrgencyFilter
                value={draft.urgency}
                values={options.urgencies}
                open={openControl === 'urgency'}
                onToggle={() => toggleControl('urgency')}
                onChange={(next) => update('urgency', next)}
              />
            </FieldSection>

            <FieldSection label="Número de observaciones">
              <NumericFilterField
                value={draft.count}
                placeholder="#"
                onChange={(text) => update('count', text)}
              />
            </FieldSection>

            <FieldSection label="Observaciones">
              <ObservationMultiSelectFilter
                value={draft.obs}
                open={openControl === 'obs'}
                onToggle={() => toggleControl('obs')}
                onChange={(next) => update('obs', next)}
              />
            </FieldSection>

            <FieldSection label="Días">
              <View style={styles.rangeRow}>
                <View style={styles.rangeInputWrap}>
                  <NumericFilterField
                    value={draft.daysMin}
                    placeholder="Min"
                    onChange={(text) => update('daysMin', text)}
                  />
                </View>
                <Text style={styles.rangeSeparator}>-</Text>
                <View style={styles.rangeInputWrap}>
                  <NumericFilterField
                    value={draft.daysMax}
                    placeholder="Máx"
                    onChange={(text) => update('daysMax', text)}
                  />
                </View>
              </View>
            </FieldSection>

            <FieldSection label="Cierre">
              <NumericFilterField
                value={draft.closure}
                placeholder="#%"
                percentage
                onChange={(text) => update('closure', text)}
              />
            </FieldSection>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancel}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={apply}
              accessibilityRole="button"
            >
              <Text style={styles.applyButtonText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(19,19,19,0.75)' },
  panel: {
    height: '94.5%',
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: colors.white,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  title: {
    flex: 1,
    color: '#2A2A2A',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.32,
    fontWeight: fontWeight.bold,
  },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  activeFiltersBar: {
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EFF4FF',
  },
  activeFiltersTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeFiltersTitle: {
    color: '#0D3862',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: fontWeight.semibold,
  },
  activeFiltersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#B4D1ED',
    backgroundColor: '#E6F3FF',
    padding: 9,
  },
  activeFilterChipText: {
    color: '#0D3862',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: fontWeight.semibold,
  },
  activeFilterChipClose: {
    color: '#0D3862',
    fontSize: 10,
    lineHeight: 10,
    fontFamily: 'Arial',
  },
  content: { flex: 1, backgroundColor: colors.white },
  contentInner: { paddingBottom: 4 },
  fieldSection: {
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3E3',
    backgroundColor: colors.white,
  },
  fieldLabel: {
    color: '#131313',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: fontWeight.bold,
  },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rangeInputWrap: { flex: 1 },
  rangeSeparator: {
    color: '#131313',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: fontWeight.bold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E3E3E3',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 14,
  },
  cancelButton: {
    height: 50,
    minWidth: 104,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#C8A064',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#C8A064',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: fontWeight.bold,
  },
  applyButton: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#C8A064',
    shadowColor: '#C8A064',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: fontWeight.bold,
  },
});
