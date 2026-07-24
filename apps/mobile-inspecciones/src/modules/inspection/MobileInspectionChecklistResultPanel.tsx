import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  InspectionAnswerValue,
  type InspectionDetailChecklistItemResponse,
  type InspectionDetailChecklistResultResponse,
} from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';

function answerLabel(value: string | null | undefined) {
  if (value === InspectionAnswerValue.COMPLIANT) return 'SÍ';
  if (value === InspectionAnswerValue.NOT_COMPLIANT) return 'NO';
  if (value === InspectionAnswerValue.NOT_APPLICABLE) return 'N/A';
  if (value === InspectionAnswerValue.PARTIAL) return 'PARCIAL';
  if (value === InspectionAnswerValue.NOT_OBSERVED) return 'N/O';
  return '—';
}

function answerTone(value: string | null | undefined) {
  if (value === InspectionAnswerValue.NOT_COMPLIANT) return { backgroundColor: colors.dangerSurf, color: colors.dangerTxt };
  if (value === InspectionAnswerValue.PARTIAL) return { backgroundColor: colors.warnSurf, color: colors.warnTxt };
  if (value === InspectionAnswerValue.NOT_APPLICABLE || value === InspectionAnswerValue.NOT_OBSERVED) {
    return { backgroundColor: '#f7f7f7', color: colors.muted };
  }
  if (value === InspectionAnswerValue.COMPLIANT) return { backgroundColor: colors.successSurf, color: colors.successTxt };
  return { backgroundColor: colors.border, color: colors.placeholder };
}

function percentage(value: number): `${number}%` {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function SummaryMetric({
  value,
  label,
  backgroundColor,
  color,
}: {
  value: number;
  label: string;
  backgroundColor: string;
  color: string;
}) {
  return (
    <View style={[styles.metric, { backgroundColor }]}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color }]}>{label}</Text>
    </View>
  );
}

function ResultItem({ item, index }: { item: InspectionDetailChecklistItemResponse; index: number }) {
  const value = item.answer?.value ?? null;
  const tone = answerTone(value);
  const isNo = value === InspectionAnswerValue.NOT_COMPLIANT;
  const comment = item.answer?.text ?? item.answer?.notes ?? '';

  return (
    <View style={[styles.item, isNo && styles.itemNo]}>
      <Text style={[styles.itemNumber, isNo && styles.itemNumberNo]}>{index + 1}</Text>
      <View style={styles.itemCopy}>
        <Text style={[styles.question, isNo && styles.questionNo]}>{item.question}</Text>
        {comment.trim() ? <Text style={[styles.comment, isNo && styles.commentNo]}>Comentario: {comment}</Text> : null}
      </View>
      <View style={[styles.answer, { backgroundColor: tone.backgroundColor }]}>
        <Text style={[styles.answerText, { color: tone.color }]}>{answerLabel(value)}</Text>
      </View>
    </View>
  );
}

export function MobileInspectionChecklistResultPanel({ result }: { result: InspectionDetailChecklistResultResponse | null }) {
  if (!result) {
    return <View style={styles.empty}><Text style={styles.emptyText}>No hay resultado de checklist disponible.</Text></View>;
  }

  const items = result.sections.flatMap((section) => section.items);
  const neutral = result.summary.notApplicable + result.summary.notObserved;
  const neutralLabel = result.summary.partial > 0 ? 'N/A · Parcial' : 'N/A · No aplica';
  const neutralValue = neutral + result.summary.partial;
  const total = Math.max(result.summary.total, 1);
  const compliantWidth = percentage((result.summary.compliant / total) * 100);
  const notCompliantWidth = percentage((result.summary.notCompliant / total) * 100);
  const neutralWidth = percentage((neutralValue / total) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionIcon}>☷</Text>
        <Text style={styles.sectionTitle}>RESUMEN · {result.summary.total} ÍTEMS</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRail}>
          <View style={[styles.summarySegment, styles.compliantSegment, { width: compliantWidth }]} />
          <View style={[styles.summarySegment, styles.notCompliantSegment, { width: notCompliantWidth }]} />
          <View style={[styles.summarySegment, styles.neutralSegment, { width: neutralWidth }]} />
        </View>
        <View style={styles.metricGrid}>
          <SummaryMetric value={result.summary.compliant} label="✓ · SÍ · Conforme" backgroundColor={colors.successSurf} color={colors.successTxt} />
          <SummaryMetric value={result.summary.notCompliant} label="× · NO · Requieren corrección" backgroundColor={colors.dangerSurf} color={colors.dangerTxt} />
          <SummaryMetric value={neutralValue} label={neutralLabel} backgroundColor="#f7f7f7" color={colors.muted} />
          <SummaryMetric value={result.summary.unanswered} label="Sin respuesta" backgroundColor={colors.border} color={colors.placeholder} />
        </View>
      </View>

      <View style={[styles.sectionHeading, styles.detailHeading]}>
        <Text style={styles.sectionIcon}>☷</Text>
        <Text style={styles.sectionTitle}>DETALLE ÍTEM A ÍTEM</Text>
      </View>
      <View style={styles.items}>
        {items.length
          ? items.map((item, index) => <ResultItem key={item.checklistItemId} item={item} index={index} />)
          : <Text style={styles.emptyText}>No hay ítems de checklist para mostrar.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.white, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionIcon: { color: colors.blueLink, fontSize: 13, lineHeight: 14 },
  sectionTitle: { color: colors.muted, fontSize: 11, letterSpacing: 0.55, fontWeight: fontWeight.bold },
  summaryCard: { marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: '#f7f7f7', padding: 15 },
  summaryRail: { height: 6, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.border, flexDirection: 'row' },
  summarySegment: { height: 6 },
  compliantSegment: { backgroundColor: colors.ok },
  notCompliantSegment: { backgroundColor: '#c4365a' },
  neutralSegment: { backgroundColor: colors.borderMid },
  metricGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48.8%', minHeight: 60, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 9 },
  metricValue: { fontSize: 20, lineHeight: 23, fontWeight: fontWeight.bold },
  metricLabel: { marginTop: 2, fontSize: 10, lineHeight: 13 },
  detailHeading: { marginTop: 20, marginBottom: 10 },
  items: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.white },
  item: { minHeight: 42, flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  itemNo: { backgroundColor: colors.dangerSurf },
  itemNumber: { minWidth: 14, paddingTop: 2, color: colors.placeholder, fontSize: 10, fontWeight: fontWeight.bold },
  itemNumberNo: { color: colors.danger },
  itemCopy: { flex: 1 },
  question: { color: colors.body, fontSize: 12, lineHeight: 17 },
  questionNo: { color: colors.dangerTxt, fontWeight: fontWeight.semibold },
  comment: { marginTop: 5, color: colors.body, fontSize: 10, lineHeight: 14 },
  commentNo: { color: colors.dangerTxt },
  answer: { minHeight: 16, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 2 },
  answerText: { fontSize: 9, fontWeight: fontWeight.bold },
  empty: { minHeight: 180, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: colors.white },
  emptyText: { paddingVertical: 24, color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', fontWeight: fontWeight.semibold },
});