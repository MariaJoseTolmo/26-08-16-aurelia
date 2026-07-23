import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import type { InspectionManagementTableFilterOptionsResponse } from '@aurelia/contracts';
import type { MobileInspectionManagementFilters, MobileInspectionManagementMode } from '../../shared/services/inspections.api';
import { colors, fontWeight } from '../../shared/theme/tokens';

type FilterKey = 'inspector' | 'area' | 'company' | 'type' | 'urgency' | 'obs';

type Props = {
  visible: boolean;
  mode: MobileInspectionManagementMode;
  value: MobileInspectionManagementFilters;
  options: InspectionManagementTableFilterOptionsResponse;
  onClose: () => void;
  onApply: (filters: MobileInspectionManagementFilters) => void;
};

const observationOptions = [
  { value: '', label: 'Todas' },
  { value: 'executed', label: 'Ejecutadas' },
  { value: 'open', label: 'Abiertas' },
  { value: 'closed', label: 'Cerradas' },
  { value: 'rejected', label: 'Rechazadas' },
];

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function OptionGroup({
  label,
  selected,
  options,
  onSelect,
}: {
  label: string;
  selected: string;
  options: Array<{ value: string; label: string }>;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <TouchableOpacity
              key={`${label}-${option.value || 'all'}`}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.75}
            >
              {active ? <FontAwesome5 name="check" size={9} color={colors.white} /> : null}
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function countMobileInspectionFilters(filters: MobileInspectionManagementFilters): number {
  return ['id', 'inspector', 'area', 'company', 'type', 'urgency', 'obs'].reduce((total, key) => {
    const value = filters[key as keyof MobileInspectionManagementFilters];
    return total + (typeof value === 'string' && value.trim() ? 1 : 0);
  }, 0);
}

export function MobileInspectionFiltersSheet({ visible, mode, value, options, onClose, onApply }: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [value, visible]);

  const normalizedOptions = useMemo(() => ({
    inspectors: unique(options.inspectors),
    areas: unique(options.areas),
    companies: unique(options.companies),
    types: unique(options.types),
    urgencies: unique(options.urgencies),
  }), [options]);

  function update(key: FilterKey | 'id', nextValue: string) {
    setDraft((current) => ({ ...current, [key]: nextValue, page: 1 }));
  }

  function reset() {
    const next = { page: 1, pageSize: value.pageSize } as MobileInspectionManagementFilters;
    setDraft(next);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Filtrar inspecciones</Text>
              <Text style={styles.subtitle}>{mode === 'history' ? 'Historial cerrado' : 'Gestión activa'}</Text>
            </View>
            <TouchableOpacity style={styles.close} onPress={onClose}>
              <FontAwesome5 name="times" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
            <View style={styles.searchWrap}>
              <FontAwesome5 name="search" size={12} color={colors.muted} />
              <TextInput
                value={draft.id ?? ''}
                onChangeText={(text) => update('id', text)}
                placeholder="Número de inspección"
                placeholderTextColor={colors.placeholder}
                style={styles.searchInput}
                autoCapitalize="none"
              />
            </View>

            <OptionGroup
              label="Inspector"
              selected={draft.inspector ?? ''}
              options={[{ value: '', label: 'Todos' }, ...normalizedOptions.inspectors.map((item) => ({ value: item, label: item }))]}
              onSelect={(next) => update('inspector', next)}
            />
            <OptionGroup
              label="Tipo"
              selected={draft.type ?? ''}
              options={[{ value: '', label: 'Todos' }, ...normalizedOptions.types.map((item) => ({ value: item, label: item }))]}
              onSelect={(next) => update('type', next)}
            />
            <OptionGroup
              label="Estado / urgencia"
              selected={draft.urgency ?? ''}
              options={[{ value: '', label: 'Todas' }, ...normalizedOptions.urgencies.map((item) => ({ value: item, label: item }))]}
              onSelect={(next) => update('urgency', next)}
            />
            <OptionGroup
              label="Observaciones"
              selected={draft.obs ?? ''}
              options={observationOptions}
              onSelect={(next) => update('obs', next)}
            />
            <OptionGroup
              label="Área"
              selected={draft.area ?? ''}
              options={[{ value: '', label: 'Todas' }, ...normalizedOptions.areas.map((item) => ({ value: item, label: item }))]}
              onSelect={(next) => update('area', next)}
            />
            <OptionGroup
              label="Empresa"
              selected={draft.company ?? ''}
              options={[{ value: '', label: 'Todas' }, ...normalizedOptions.companies.map((item) => ({ value: item, label: item }))]}
              onSelect={(next) => update('company', next)}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={reset}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={() => onApply(draft)}>
              <Text style={styles.applyText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.58)' },
  panel: { maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.white, paddingTop: 9 },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: colors.borderMid },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerCopy: { flex: 1 },
  title: { color: colors.primary, fontSize: 18, lineHeight: 22, fontWeight: fontWeight.bold },
  subtitle: { marginTop: 3, color: colors.muted, fontSize: 11 },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f2f2' },
  content: { maxHeight: 540 },
  contentInner: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18, gap: 18 },
  searchWrap: { height: 48, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#f6faff', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: colors.primary, fontSize: 13, paddingVertical: 0 },
  group: { gap: 8 },
  groupLabel: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold },
  optionRow: { gap: 7, paddingRight: 18 },
  option: { minHeight: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.borderMid, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 12 },
  optionActive: { borderColor: colors.teal, backgroundColor: colors.teal },
  optionText: { color: colors.body, fontSize: 11, fontWeight: fontWeight.semibold },
  optionTextActive: { color: colors.white },
  footer: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 22 },
  clearButton: { height: 48, flex: 1, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: colors.gold, fontSize: 14, fontWeight: fontWeight.bold },
  applyButton: { height: 48, flex: 1.4, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  applyText: { color: colors.white, fontSize: 14, fontWeight: fontWeight.bold },
});
