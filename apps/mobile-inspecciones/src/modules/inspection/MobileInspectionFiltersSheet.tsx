import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import type { InspectionManagementTableFilterOptionsResponse } from '@aurelia/contracts';
import type {
  MobileInspectionManagementFilters,
  MobileInspectionManagementMode,
} from '../../shared/services/inspections.api';
import { colors, fontWeight } from '../../shared/theme/tokens';

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

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function clean(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function inspectionNumberLabel(value: string): string {
  return value.startsWith('#') ? value : `#${value}`;
}

function buildActiveFilters(filters: MobileInspectionManagementFilters): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  if (filters.id?.trim()) active.push({ key: 'id', label: `N°: ${inspectionNumberLabel(filters.id.trim())}` });
  if (filters.date?.trim()) active.push({ key: 'date', label: `Fecha: ${filters.date.trim()}` });
  if (filters.inspector?.trim()) active.push({ key: 'inspector', label: `Inspector: ${filters.inspector.trim()}` });
  if (filters.area?.trim()) active.push({ key: 'area', label: `Área: ${filters.area.trim()}` });
  if (filters.company?.trim()) active.push({ key: 'company', label: `Empresa: ${filters.company.trim()}` });
  if (filters.type?.trim()) active.push({ key: 'type', label: `Tipo: ${filters.type.trim()}` });
  if (filters.urgency?.trim()) active.push({ key: 'urgency', label: `Urgencia: ${filters.urgency.trim()}` });
  if (filters.count?.trim()) active.push({ key: 'count', label: `N° obs.: ${filters.count.trim()}` });
  if (filters.obs?.trim()) active.push({ key: 'obs', label: `Obs.: ${observationLabels[filters.obs.trim()] ?? filters.obs.trim()}` });
  if (filters.daysMin?.trim()) active.push({ key: 'daysMin', label: `Días mín.: ${filters.daysMin.trim()}` });
  if (filters.daysMax?.trim()) active.push({ key: 'daysMax', label: `Días máx.: ${filters.daysMax.trim()}` });
  if (filters.closure?.trim()) active.push({ key: 'closure', label: `Cierre: ${filters.closure.trim()}%` });
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

function SelectField({
  value,
  placeholder,
  optionCount,
}: {
  value: string | undefined;
  placeholder: string;
  optionCount: number;
}) {
  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled
      style={styles.selectField}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityHint={`${optionCount} opciones disponibles. La interacción se habilitará en la siguiente iteración.`}
    >
      <Text style={[styles.inputText, !value?.trim() && styles.placeholderText]} numberOfLines={1}>
        {value?.trim() || placeholder}
      </Text>
      <FontAwesome5 name="caret-down" size={18} color="#131313" solid />
    </TouchableOpacity>
  );
}

export function countMobileInspectionFilters(filters: MobileInspectionManagementFilters): number {
  return filterKeys.reduce((total, key) => {
    const value = filters[key];
    return total + (typeof value === 'string' && value.trim() ? 1 : 0);
  }, 0);
}

export function MobileInspectionFiltersSheet({ visible, mode, value, options, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<MobileInspectionManagementFilters>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [value, visible]);

  const optionCounts = useMemo(() => ({
    inspectors: unique(options.inspectors).length,
    areas: unique(options.areas).length,
    companies: unique(options.companies).length,
    types: unique(options.types).length,
    urgencies: unique(options.urgencies).length,
    observations: 4,
  }), [options]);

  const activeFilters = useMemo(() => buildActiveFilters(draft), [draft]);

  function update(key: FilterKey, nextValue: string | undefined) {
    setDraft((current) => ({ ...current, [key]: nextValue, page: 1 }));
  }

  function cancel() {
    setDraft(value);
    onClose();
  }

  function apply() {
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
      daysMin: clean(draft.daysMin),
      daysMax: clean(draft.daysMax),
      closure: clean(draft.closure),
    };
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
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={cancel} accessibilityLabel="Cerrar filtros" />
        <View
          style={styles.panel}
          accessible
          accessibilityLabel={mode === 'history' ? 'Filtros del historial de inspecciones' : 'Filtros de gestión de inspecciones'}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <TouchableOpacity style={styles.closeButton} onPress={cancel} accessibilityRole="button" accessibilityLabel="Cerrar filtros">
              <FontAwesome5 name="times" size={25} color="#131313" />
            </TouchableOpacity>
          </View>

          <View style={styles.activeFiltersBar}>
            <View style={styles.activeFiltersTitleRow}>
              <FontAwesome5 name="filter" size={12} color="#24588B" solid />
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
              <TextInput
                value={draft.id ?? ''}
                onChangeText={(text) => update('id', text)}
                placeholder="#"
                placeholderTextColor="#757575"
                keyboardType="number-pad"
                style={styles.textField}
              />
            </FieldSection>

            <FieldSection label="Fecha">
              <View style={styles.iconTextField}>
                <TextInput
                  value={draft.date ?? ''}
                  onChangeText={(text) => update('date', text)}
                  placeholder="dd-mm-aaaa"
                  placeholderTextColor="#757575"
                  style={styles.iconTextInput}
                />
                <FontAwesome5 name="calendar" size={19} color="#131313" solid />
              </View>
            </FieldSection>

            <FieldSection label="Inspector">
              <SelectField value={draft.inspector} placeholder="Todos los inspectores" optionCount={optionCounts.inspectors} />
            </FieldSection>

            <FieldSection label="Área y sector">
              <SelectField value={draft.area} placeholder="Todas las áreas" optionCount={optionCounts.areas} />
            </FieldSection>

            <FieldSection label="Empresa">
              <SelectField value={draft.company} placeholder="Todas las empresas" optionCount={optionCounts.companies} />
            </FieldSection>

            <FieldSection label="Tipo">
              <SelectField value={draft.type} placeholder="Todos" optionCount={optionCounts.types} />
            </FieldSection>

            <FieldSection label="Urgencia máxima">
              <SelectField value={draft.urgency} placeholder="Todas" optionCount={optionCounts.urgencies} />
            </FieldSection>

            <FieldSection label="Número de observaciones">
              <TextInput
                value={draft.count ?? ''}
                onChangeText={(text) => update('count', text)}
                placeholder="#"
                placeholderTextColor="#757575"
                keyboardType="number-pad"
                style={styles.textField}
              />
            </FieldSection>

            <FieldSection label="Observaciones">
              <SelectField
                value={draft.obs ? observationLabels[draft.obs] ?? draft.obs : undefined}
                placeholder="Todos"
                optionCount={optionCounts.observations}
              />
            </FieldSection>

            <FieldSection label="Días">
              <View style={styles.rangeRow}>
                <TextInput
                  value={draft.daysMin ?? ''}
                  onChangeText={(text) => update('daysMin', text)}
                  placeholder="Min"
                  placeholderTextColor="#757575"
                  keyboardType="number-pad"
                  style={styles.rangeInput}
                />
                <Text style={styles.rangeSeparator}>-</Text>
                <TextInput
                  value={draft.daysMax ?? ''}
                  onChangeText={(text) => update('daysMax', text)}
                  placeholder="Máx"
                  placeholderTextColor="#757575"
                  keyboardType="number-pad"
                  style={styles.rangeInput}
                />
              </View>
            </FieldSection>

            <FieldSection label="Cierre">
              <TextInput
                value={draft.closure ?? ''}
                onChangeText={(text) => update('closure', text)}
                placeholder="#%"
                placeholderTextColor="#757575"
                keyboardType="decimal-pad"
                style={styles.textField}
              />
            </FieldSection>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancel} accessibilityRole="button">
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={apply} accessibilityRole="button">
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
    minHeight: 54,
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EFF4FF',
  },
  activeFiltersTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeFiltersTitle: { color: '#0D3862', fontSize: 11, lineHeight: 13, fontWeight: fontWeight.semibold },
  activeFiltersWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  activeFilterChip: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#B4D1ED',
    backgroundColor: '#E6F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeFilterChipText: { color: '#0D3862', fontSize: 10, lineHeight: 12, fontWeight: fontWeight.semibold },
  activeFilterChipClose: { color: '#0D3862', fontSize: 12, lineHeight: 12 },
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
  fieldLabel: { color: '#131313', fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold },
  textField: {
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
  iconTextField: {
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
  iconTextInput: { flex: 1, height: 48, paddingVertical: 0, color: '#131313', fontSize: 13, lineHeight: 19.5 },
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
  inputText: { flex: 1, color: '#131313', fontSize: 13, lineHeight: 19.5 },
  placeholderText: { color: '#757575' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rangeInput: {
    flex: 1,
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
  rangeSeparator: { color: '#131313', fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold },
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
  cancelButtonText: { color: '#C8A064', fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
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
  applyButtonText: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
});