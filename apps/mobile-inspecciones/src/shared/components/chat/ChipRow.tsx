import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InspectionAnswerValue, InspectionType } from '@aurelia/contracts';
import { colors, fontWeight, spacing } from '../../theme/tokens';
import { useMobileInspectionAssignmentScope } from '../../stores/mobileInspectionAssignmentScope.store';
import { useManualInspectionDraft } from '../../../modules/inspection/manualInspection.store';
import { ChatCompanyPicker } from './ChatCompanyPicker';

export type ChipVariant = 'default' | 'selected-gold' | 'selected-navy';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  onPress?: () => void;
}

export function Chip({ label, variant = 'default', onPress }: ChipProps) {
  const selected = variant !== 'default';
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={selected}
      onPress={onPress}
      style={[styles.chip, chipVariantStyle[variant]]}
    >
      <Text style={[styles.chipText, chipTextVariantStyle[variant]]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface ChipRowProps {
  chips: string[];
  selected?: string | null;
  onSelect?: (value: string) => void;
  variant?: 'gold' | 'navy';
}

export function ChipRow({ chips, selected, onSelect, variant = 'gold' }: ChipRowProps) {
  const canSelectCompany = useMobileInspectionAssignmentScope((state) => state.canSelectCompany);
  const assignedCompanyName = useMobileInspectionAssignmentScope((state) => state.companyName);
  const inspectionType = useManualInspectionDraft((state) => state.inspectionType);
  const findingObservations = useManualInspectionDraft((state) => state.findingObservations);
  const answersByItemId = useManualInspectionDraft((state) => state.answersByItemId);
  const findingCompanyId = useManualInspectionDraft((state) => state.findingCompanyId);
  const findingCompanyName = useManualInspectionDraft((state) => state.findingCompanyName);
  const confirmedRef = React.useRef(false);

  const hasSavedFinding = findingObservations.some((item) => item.saved);
  const hasChecklistFinding = Object.values(answersByItemId).some(
    (answer) => answer === InspectionAnswerValue.NOT_COMPLIANT,
  );
  const unresolvedCompanyStage = !selected && !findingCompanyId && (
    (inspectionType === InspectionType.ENVIRONMENTAL && hasSavedFinding) ||
    (inspectionType === InspectionType.REGULATORY && hasChecklistFinding)
  );
  const resolvedCompanyStage = Boolean(selected && findingCompanyName && selected === findingCompanyName);
  const companySelector = unresolvedCompanyStage || resolvedCompanyStage;
  const lockedCompany = !canSelectCompany && Boolean(assignedCompanyName) && companySelector;

  React.useEffect(() => {
    if (!lockedCompany || selected === assignedCompanyName || confirmedRef.current || !assignedCompanyName) return;
    confirmedRef.current = true;
    onSelect?.(assignedCompanyName);
  }, [assignedCompanyName, lockedCompany, onSelect, selected]);

  if (lockedCompany) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedLabel}>Empresa responsable</Text>
        <View style={styles.lockedField}><Text style={styles.lockedValue}>{assignedCompanyName}</Text></View>
      </View>
    );
  }

  if (companySelector) {
    return (
      <ChatCompanyPicker
        companies={chips}
        selected={selected}
        onSelect={(companyName) => onSelect?.(companyName)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {chips.map((chip) => {
        const isSelected = selected === chip;
        const chipVariant: ChipVariant = isSelected
          ? variant === 'gold' ? 'selected-gold' : 'selected-navy'
          : 'default';
        return (
          <Chip key={chip} label={chip} variant={chipVariant} onPress={() => onSelect?.(chip)} />
        );
      })}
    </View>
  );
}

const chipVariantStyle: Record<ChipVariant, object> = {
  default: { borderColor: '#D1D1D1', backgroundColor: colors.white },
  'selected-gold': { borderColor: '#C8A064', backgroundColor: '#C8A064' },
  'selected-navy': { borderColor: '#002659', backgroundColor: '#002659' },
};

const chipTextVariantStyle: Record<ChipVariant, object> = {
  default: { color: '#646464' },
  'selected-gold': { color: '#001E39' },
  'selected-navy': { color: colors.white },
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    marginLeft: 33,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 28,
    paddingHorizontal: 13.5,
    paddingVertical: 5,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    lineHeight: 16,
  },
  lockedContainer: {
    marginBottom: 10,
    marginLeft: 33,
    marginRight: 12,
    padding: 12,
    backgroundColor: colors.white,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    borderWidth: 1,
  },
  lockedLabel: {
    color: '#131313',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  lockedField: {
    height: 50,
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#F6FAFF',
    borderColor: '#24588B',
    borderRadius: 10,
    borderWidth: 1.5,
  },
  lockedValue: {
    color: '#131313',
    fontSize: 13,
    fontWeight: fontWeight.semibold,
  },
});