import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme/tokens';
import type { ObservacionDraft } from '../../../modules/inspection/useInspectionFlow';

interface Props {
  inspectionTypeName: string | null;
  inspectorName: string;
  areaName: string | null;
  sectorName: string | null;
  companyName: string | null;
  personnelNames: string[];
  observations: ObservacionDraft[];
  onSubmit: () => void;
  submitted?: boolean;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function badgeStyle(level: string | null) {
  if (level === 'Crítico') return styles.badgeDanger;
  if (level === 'Alto') return styles.badgeOcre;
  if (level === 'Medio') return styles.badgeWarn;
  return styles.badgeSuccess;
}

export function SubmitWidget({ inspectionTypeName, inspectorName, areaName, sectorName, companyName, personnelNames, observations, onSubmit, submitted = false }: Props) {
  const typeLabel = inspectionTypeName ?? 'Inspección';
  const areaSector = [areaName, sectorName].filter(Boolean).join(' · ') || '—';
  const company = companyName ?? '—';
  const people = personnelNames.length > 0 ? personnelNames.join(' · ') : '—';
  const obsCount = observations.length;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Datos generales</Text>
          <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{typeLabel}</Text></View>
        </View>
        <SummaryRow label="Inspector" value={inspectorName} />
        <SummaryRow label="Área · Sector" value={areaSector} />
        <SummaryRow label="Empresa EECC" value={company} />
        <SummaryRow label="Responsables" value={people} />
      </View>

      <View style={styles.card}>
        <View style={styles.header}><Text style={styles.headerText}>{obsCount} Observaciones</Text></View>
        <View style={styles.obsBody}>
          {observations.map((obs, index) => (
            <View key={`${obs.desc}-${index}`} style={styles.obsCard}>
              <View style={styles.obsTop}>
                <Text style={styles.obsNumber}>Obs. {index + 1}</Text>
                <View style={styles.obsBadges}>
                  <View style={[styles.badge, badgeStyle(obs.nivel)]}><Text style={styles.badgeText}>{obs.nivel ?? '?'}</Text></View>
                  <View style={styles.aiBadge}><Text style={styles.aiText}>{obs.medidaOrigen === 'ia' ? 'IA' : 'Manual'}</Text></View>
                </View>
              </View>
              <Text style={styles.obsDesc}>{truncate(obs.desc ?? 'Sin descripción', 58)}</Text>
              <Text style={styles.obsMeta}>SLA: {obs.sla} días · P{obs.prob ?? '?'}×C{obs.cons ?? '?'}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.questionBox}><Text style={styles.questionText}>¿Todo correcto?</Text></View>
      <TouchableOpacity activeOpacity={0.75} style={styles.modifyButton}>
        <Text style={styles.modifyText}>✎ Modificar algo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.submitButton, submitted && styles.submitButtonDisabled]} onPress={submitted ? undefined : onSubmit} disabled={submitted} activeOpacity={0.85}>
        <Text style={styles.submitText}>{submitted ? 'Guardando…' : '✓ Guardar inspección'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginLeft: 0,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  headerText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  typeBadge: {
    backgroundColor: colors.tealSurf,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    color: colors.tealTxt,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  summaryRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: fontSize.xs,
    width: 92,
  },
  summaryValue: {
    color: colors.primary,
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  obsBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  obsCard: {
    borderColor: colors.border,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  obsTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  obsNumber: {
    backgroundColor: colors.blueSurf,
    borderRadius: 4,
    color: colors.blueTxt,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  obsBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeWarn: { backgroundColor: colors.warnSurf },
  badgeOcre: { backgroundColor: colors.ocreSurf },
  badgeDanger: { backgroundColor: colors.dangerSurf },
  badgeSuccess: { backgroundColor: colors.successSurf },
  badgeText: {
    color: colors.warnTxt,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  aiBadge: {
    backgroundColor: '#FDF3E3',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiText: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  obsDesc: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: 3,
  },
  obsMeta: {
    color: colors.muted,
    fontSize: fontSize.xs,
  },
  questionBox: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginLeft: 33,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  questionText: {
    color: colors.primary,
    fontSize: fontSize.base,
  },
  modifyButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.borderMid,
    borderRadius: radius.full,
    borderWidth: 1,
    marginLeft: 33,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  modifyText: {
    color: colors.blueTxt,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.ok,
    borderRadius: radius.md + 4,
    height: 48,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
