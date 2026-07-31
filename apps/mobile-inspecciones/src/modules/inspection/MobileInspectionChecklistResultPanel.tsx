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
    return { backgroundColor: '#f7f7f7', color: colors.muted };
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
  icon?: 'check' | 'times';
  bordered?: boolean;
};

function SummaryColumn({ value, label, color, icon, bordered = false }: SummaryColumnProps) {
  return (
    <View style={[styles.summaryColumn, bordered && styles.summaryColumnBorder]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <View style={styles.summaryCaption}>
        {icon ? <FontAwesome5 name={icon} size={9} color={color} /> : null}
        <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

function ResultItem({
  item,
  index,
  isLast,
}: {
  item: InspectionDetailChecklistItemResponse;
  index: number;
  isLast: boolean;
}) {
  const value = item.answer?.value ?? null;
  const tone = answerTone(value);
  const isNo = value === InspectionAnswerValue.NOT_COMPLIANT;
  const comment = item.answer?.text ?? item.answer?.notes ?? '';

  return (
    <View style={[styles.item, isNo && styles.itemNo, isLast && styles.itemLast]}>
      <Text style={[styles.itemNumber, isNo && styles.itemNumberNo]}>{index + 1}</Text>
      <View style={styles.itemCopy}>
        <Text style={[styles.question, isNo && styles.questionNo]}>{item.question}</Text>
        {comment.trim() ? (
          <View style={styles.commentBlock}>
            <Text style={[styles.commentLabel, isNo && styles.commentNo]}>Comentario:</Text>
            <Text style={[styles.commentText, isNo && styles.commentNo]}>{comment}</Text>
          </View>
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
        <SummaryColumn value={result.summary.compliant} label="SÍ" color={colors.successTxt} icon="check" />
        <SummaryColumn value={result.summary.notCompliant} label="NO" color={colors.dangerTxt} icon="times" bordered />
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
            <ResultItem
              key={item.checklistItemId}
              item={item}
              index={index}
              isLast={index === items.length - 1}
            />
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
    paddingBottom: 24,
  },
  summaryCard: {
    minHeight: 71,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 13,
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
  summaryCaption: {
    marginTop: 2,
    minHeight: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  summaryLabel: {
    fontSize: 11,
    lineHeight: 13,
  },
  supplementaryRow: {
    minHeight: 28,
    marginTop: 8,
    marginHorizontal: 14,
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
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  item: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemNo: {
    backgroundColor: colors.dangerSurf,
  },
  itemNumber: {
    width: 14,
    paddingTop: 1,
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
    lineHeight: 16.8,
  },
  questionNo: {
    color: colors.dangerTxt,
    fontWeight: fontWeight.semibold,
  },
  commentBlock: {
    marginTop: 8,
  },
  commentLabel: {
    color: colors.body,
    fontSize: 12,
    lineHeight: 16.8,
    fontWeight: fontWeight.semibold,
  },
  commentText: {
    color: colors.body,
    fontSize: 12,
    lineHeight: 16.8,
    fontWeight: fontWeight.semibold,
  },
  commentNo: {
    color: colors.dangerTxt,
  },
  answer: {
    minHeight: 16,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  answerText: {
    fontSize: 10,
    lineHeight: 12,
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
