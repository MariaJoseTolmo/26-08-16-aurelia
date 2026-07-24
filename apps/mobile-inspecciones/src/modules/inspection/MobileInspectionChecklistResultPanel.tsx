import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
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
  if (value === InspectionAnswerValue.NOT_COMPLIANT) {
    return { backgroundColor: colors.dangerSurf, color: colors.dangerTxt };
  }
  if (value === InspectionAnswerValue.PARTIAL) {
    return { backgroundColor: colors.warnSurf, color: colors.warnTxt };
  }
  if (value === InspectionAnswerValue.NOT_APPLICABLE || value === InspectionAnswerValue.NOT_OBSERVED) {
    return { backgroundColor: '#f1f1f1', color: colors.muted };
  }
  if (value === InspectionAnswerValue.COMPLIANT) {
    return { backgroundColor: colors.successSurf, color: colors.successTxt };
  }
  return { backgroundColor: colors.border, color: colors.placeholder };
}

type SummaryColumnProps = {
  value: number;
  label: string;
  color: string;
  bordered?: boolean;
};

function SummaryColumn({ value, label, color, bordered = false }: SummaryColumnProps) {
  return (
    <View style={[styles.summaryColumn, bordered && styles.summaryColumnBorder]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
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
        {comment.trim() ? (
          <Text style={[styles.comment, isNo && styles.commentNo]}>Comentario: {comment}</Text>
        ) : null}
      </View>
      <View style={[styles.answer, { backgroundColor: tone.backgroundColor }]}>
        <Text style={[styles.answerText, { color: tone.color }]}>{answerLabel(value)}</Text>
      </View>
    </View>
  );
}

export function MobileInspectionChecklistResultPanel({ result }: { result: InspectionDetailChecklistResultResponse | null }) {
  if (!result) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No hay resultado de checklist disponible.</Text>
      </View>
    );
  }

  const items = result.sections.flatMap((section) => section.items);
  const neutral = result.summary.notApplicable + result.summary.notObserved;
  const supplementary = result.summary.partial + result.summary.unanswered;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <SummaryColumn value={result.summary.compliant} label="SÍ" color={colors.successTxt} />
        <SummaryColumn value={result.summary.notCompliant} label="NO" color={colors.dangerTxt} bordered />
        <SummaryColumn value={neutral} label="N/A" color={colors.muted} bordered />
      </View>

      {supplementary > 0 ? (
        <View style={styles.supplementaryRow}>
          <Text style={styles.supplementaryText}>
            {result.summary.partial} parciales · {result.summary.unanswered} sin respuesta
          </Text>
        </View>
      ) : null}

      <View style={styles.sectionHeading}>
        <FontAwesome5 name="list-ol" size={11} color={colors.blueLink} />
        <Text style={styles.sectionTitle}>DETALLE ÍTEM A ÍTEM</Text>
      </View>

      <View style={styles.items}>
        {items.length ? (
          items.map((item, index) => (
            <ResultItem key={item.checklistItemId} item={item} index={index} />
          ))
        ) : (
          <Text style={styles.emptyText}>No hay ítems de checklist para mostrar.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    minHeight: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1.5,
    elevation: 1,
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  summaryColumnBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  summaryValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
  summaryLabel: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: fontWeight.semibold,
  },
  supplementaryRow: {
    minHeight: 28,
    marginTop: 8,
    borderRadius: 7,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  supplementaryText: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 13,
  },
  sectionHeading: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.55,
    fontWeight: fontWeight.bold,
  },
  items: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  item: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  itemNo: {
    backgroundColor: colors.dangerSurf,
  },
  itemNumber: {
    width: 18,
    paddingTop: 2,
    color: colors.placeholder,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: fontWeight.bold,
  },
  itemNumberNo: {
    color: colors.danger,
  },
  itemCopy: {
    flex: 1,
  },
  question: {
    color: colors.body,
    fontSize: 12,
    lineHeight: 17,
  },
  questionNo: {
    color: colors.dangerTxt,
    fontWeight: fontWeight.semibold,
  },
  comment: {
    marginTop: 5,
    color: colors.body,
    fontSize: 10,
    lineHeight: 14,
  },
  commentNo: {
    color: colors.dangerTxt,
  },
  answer: {
    minHeight: 18,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  answerText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: fontWeight.bold,
  },
  empty: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  emptyText: {
    paddingVertical: 24,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: fontWeight.semibold,
  },
});