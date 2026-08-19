import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '../../theme/tokens';

const PROBABILITIES = [
  { value: 1, label: '1 · Muy improbable' },
  { value: 2, label: '2 · Improbable' },
  { value: 3, label: '3 · Posible' },
  { value: 4, label: '4 · Probable' },
  { value: 5, label: '5 · Casi seguro' },
];

const CONSEQUENCES = [
  { value: 1, label: '1 · Insignificante' },
  { value: 2, label: '2 · Menor' },
  { value: 3, label: '3 · Moderado' },
  { value: 4, label: '4 · Mayor' },
  { value: 5, label: '5 · Catastrófico' },
];

const SLA_BY_LEVEL: Record<string, number> = { Bajo: 14, Medio: 7, Alto: 3, Crítico: 1 };
const RESULT_COLORS: Record<string, { backgroundColor: string; borderColor: string; color: string }> = {
  Bajo: { backgroundColor: colors.successSurf, borderColor: '#A8DFA0', color: colors.successTxt },
  Medio: { backgroundColor: colors.warnSurf, borderColor: '#E8C86A', color: colors.warnTxt },
  Alto: { backgroundColor: colors.ocreSurf, borderColor: '#E8A06A', color: colors.ocreTxt },
  Crítico: { backgroundColor: colors.dangerSurf, borderColor: '#E090A8', color: colors.dangerTxt },
};

interface CriticalityWidgetProps {
  resolved?: boolean;
  onComplete: (probability: number, consequence: number, level: string, slaDays: number) => void;
}

function level(probability: number, consequence: number): string {
  const score = (probability - 1) + (consequence - 1);
  if (score <= 1) return 'Bajo';
  if (score <= 3) return 'Medio';
  if (score <= 5) return 'Alto';
  return 'Crítico';
}

function Chip({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.75} disabled={disabled} onPress={onPress} style={[styles.chip, selected && styles.chipSelected, disabled && !selected && styles.chipDisabled]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function CriticalityWidget({ resolved = false, onComplete }: CriticalityWidgetProps) {
  const [probability, setProbability] = useState<number | null>(null);
  const [consequence, setConsequence] = useState<number | null>(null);

  function selectProbability(value: number) {
    if (resolved || probability) return;
    setProbability(value);
  }

  function selectConsequence(value: number) {
    if (resolved || consequence || !probability) return;
    setConsequence(value);
    finish(probability, value);
  }

  function finish(nextProbability: number, nextConsequence: number) {
    const nextLevel = level(nextProbability, nextConsequence);
    onComplete(nextProbability, nextConsequence, nextLevel, SLA_BY_LEVEL[nextLevel] ?? 7);
  }

  const currentLevel = probability && consequence ? level(probability, consequence) : null;
  const currentSla = currentLevel ? SLA_BY_LEVEL[currentLevel] ?? 7 : null;
  const resultColors = currentLevel ? RESULT_COLORS[currentLevel] ?? RESULT_COLORS.Medio : RESULT_COLORS.Medio;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>PROBABILIDAD · ¿QUÉ TAN PROBABLE ES QUE OCURRA?</Text>
      <View style={styles.sectionBody}>
        <View style={styles.chips}>{PROBABILITIES.map((item) => <Chip key={item.value} label={item.label} selected={probability === item.value} disabled={resolved || Boolean(probability)} onPress={() => selectProbability(item.value)} />)}</View>
      </View>
      {probability ? (
        <View>
          <Text style={styles.sectionHeader}>CONSECUENCIA · ¿QUÉ TAN GRAVE SERÍA EL IMPACTO?</Text>
          <View style={styles.sectionBody}>
            <View style={styles.chips}>{CONSEQUENCES.map((item) => <Chip key={item.value} label={item.label} selected={consequence === item.value} disabled={resolved || Boolean(consequence)} onPress={() => selectConsequence(item.value)} />)}</View>
            {currentLevel ? (
              <View style={[styles.resultBox, { backgroundColor: resultColors.backgroundColor, borderColor: resultColors.borderColor }]}>
                <View>
                  <Text style={[styles.resultMeta, { color: resultColors.color }]}>NIVEL · P{probability}×C{consequence}</Text>
                  <Text style={[styles.resultLevel, { color: resultColors.color }]}>{currentLevel}</Text>
                </View>
                <View style={styles.slaBlock}>
                  <Text style={[styles.slaMeta, { color: resultColors.color }]}>SLA sugerido</Text>
                  <Text style={[styles.slaText, { color: resultColors.color }]}>{currentSla} días</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 33,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    textTransform: 'uppercase',
  },
  sectionBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.borderMid,
    borderRadius: radius.sm + 2,
    borderWidth: 1.5,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  chipSelected: {
    backgroundColor: colors.warnSurf,
    borderColor: '#E8C86A',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  chipTextSelected: {
    color: colors.warnTxt,
  },
  resultBox: {
    alignItems: 'center',
    borderRadius: radius.sm + 2,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  resultMeta: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  resultLevel: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  slaBlock: {
    alignItems: 'flex-end',
  },
  slaMeta: {
    fontSize: 9,
    marginBottom: 2,
  },
  slaText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
