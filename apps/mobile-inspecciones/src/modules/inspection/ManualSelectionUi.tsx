import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, fontWeight } from '../../shared/theme/tokens';

export interface SelectSheetOption {
  id: string;
  label: string;
  description?: string;
}

interface SelectSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: SelectSheetOption[];
  selectedId?: string | null;
  emptyText?: string;
  loading?: boolean;
  onClose: () => void;
  onSelect: (option: SelectSheetOption) => void;
}

export function ManualFormStepper({ activeStep, steps }: { activeStep: number; steps: string[] }) {
  const progressWidth: `${number}%` = `${(Math.max(1, activeStep) / steps.length) * 100}%`;

  return (
    <View style={styles.stepperWrap}>
      <View style={styles.stepperRow}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === activeStep;
          const completed = stepNumber < activeStep;
          return (
            <View key={step} style={styles.stepItem}>
              {index < steps.length - 1 ? <View style={[styles.stepLine, completed && styles.stepLineCompleted]} /> : null}
              <View style={[styles.stepCircle, active && styles.stepCircleActive, completed && styles.stepCircleCompleted]}>
                <Text style={[styles.stepNumber, active && styles.stepNumberActive, completed && styles.stepNumberCompleted]}>{completed ? '✓' : stepNumber}</Text>
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive, completed && styles.stepLabelCompleted]}>{step}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.progressRail}><View style={[styles.progressFill, { width: progressWidth }]} /></View>
    </View>
  );
}

export function SelectSheet({ visible, title, subtitle, options, selectedId, emptyText = 'Sin opciones disponibles', loading = false, onClose, onSelect }: SelectSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetPanel}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleWrap}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity style={styles.sheetClose} onPress={onClose} activeOpacity={0.7}>
              <FontAwesome5 name="times" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.sheetList} contentContainerStyle={styles.sheetListContent} showsVerticalScrollIndicator={false}>
            {loading ? <Text style={styles.sheetEmpty}>Cargando...</Text> : null}
            {!loading && options.length === 0 ? <Text style={styles.sheetEmpty}>{emptyText}</Text> : null}
            {!loading ? options.map((option) => {
              const selected = option.id === selectedId;
              return (
                <TouchableOpacity key={option.id} style={[styles.sheetOption, selected && styles.sheetOptionSelected]} onPress={() => onSelect(option)} activeOpacity={0.75}>
                  <View style={styles.sheetOptionTextWrap}>
                    <Text style={[styles.sheetOptionLabel, selected && styles.sheetOptionLabelSelected]}>{option.label}</Text>
                    {option.description ? <Text style={styles.sheetOptionDescription}>{option.description}</Text> : null}
                  </View>
                  {selected ? <FontAwesome5 name="check-circle" size={16} color={colors.teal} solid /> : null}
                </TouchableOpacity>
              );
            }) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  stepperWrap: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 9 },
  stepperRow: { flexDirection: 'row', alignItems: 'flex-start', width: '100%' },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepLine: { position: 'absolute', top: 11, left: '50%', right: '-50%', height: 2, backgroundColor: colors.borderMid },
  stepLineCompleted: { backgroundColor: colors.gold },
  stepCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderWidth: 2, borderColor: colors.gold },
  stepCircleCompleted: { borderWidth: 0, backgroundColor: colors.gold },
  stepNumber: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.placeholder },
  stepNumberActive: { color: colors.gold },
  stepNumberCompleted: { color: colors.white },
  stepLabel: { marginTop: 3, fontSize: 8, color: colors.placeholder },
  stepLabelActive: { fontWeight: fontWeight.semibold, color: colors.goldDark },
  stepLabelCompleted: { color: colors.goldDark },
  progressRail: { marginTop: 6, height: 2, borderRadius: 2, backgroundColor: colors.border },
  progressFill: { height: 2, borderRadius: 2, backgroundColor: colors.goldDark },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  sheetPanel: { maxHeight: '72%', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 22 },
  sheetHandle: { alignSelf: 'center', width: 46, height: 4, borderRadius: 2, backgroundColor: colors.borderMid, marginBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 10 },
  sheetTitleWrap: { flex: 1 },
  sheetTitle: { fontSize: 18, lineHeight: 22, fontWeight: fontWeight.bold, color: colors.primary },
  sheetSubtitle: { marginTop: 3, fontSize: 12, lineHeight: 16, color: colors.muted },
  sheetClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center' },
  sheetList: { maxHeight: 420 },
  sheetListContent: { gap: 8, paddingBottom: 12 },
  sheetEmpty: { paddingVertical: 18, textAlign: 'center', fontSize: 13, color: colors.muted },
  sheetOption: { minHeight: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#FAFAFA', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetOptionSelected: { borderColor: colors.teal, backgroundColor: '#E9FFFB' },
  sheetOptionTextWrap: { flex: 1 },
  sheetOptionLabel: { fontSize: 14, lineHeight: 18, fontWeight: fontWeight.semibold, color: colors.primary },
  sheetOptionLabelSelected: { color: colors.teal },
  sheetOptionDescription: { marginTop: 2, fontSize: 11, lineHeight: 14, color: colors.muted },
});
