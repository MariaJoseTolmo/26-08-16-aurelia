import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontWeight } from '../../theme/tokens';
import { useMobileInspectionAssignmentScope } from '../../stores/mobileInspectionAssignmentScope.store';
import type { CompanyResponse } from '../../services/api/organization.api';

type SuggestedCompany = Pick<CompanyResponse, 'id' | 'name'>;

interface CompanySuggestionCardProps {
  company: SuggestedCompany;
  reason: string;
  disabled?: boolean;
  onConfirm: () => void;
  onChooseOther: () => void;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function CompanySuggestionCard(props: CompanySuggestionCardProps) {
  const canSelectCompany = useMobileInspectionAssignmentScope((state) => state.canSelectCompany);
  const assignedCompanyId = useMobileInspectionAssignmentScope((state) => state.companyId);
  const assignedCompanyName = useMobileInspectionAssignmentScope((state) => state.companyName);
  const confirmedRef = React.useRef(false);
  const disabled = props.disabled ?? false;
  const locked = !canSelectCompany && Boolean(assignedCompanyId);
  const showSuggestion = Boolean(props.reason) && normalizeText(props.reason) !== normalizeText(props.company.name);

  React.useEffect(() => {
    if (!locked || disabled || confirmedRef.current || props.company.id !== assignedCompanyId) return;
    confirmedRef.current = true;
    props.onConfirm();
  }, [assignedCompanyId, disabled, locked, props]);

  if (locked) {
    return (
      <View style={styles.lockedCard}>
        <Text style={styles.lockedLabel}>Empresa responsable</Text>
        <View style={styles.lockedField}>
          <Text style={styles.lockedValue}>{assignedCompanyName ?? props.company.name}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sparkle}>✦</Text>
        <Text style={styles.headerText}>Empresa responsable sugerida</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.companyName}>{props.company.name}</Text>
        {showSuggestion ? <Text style={styles.suggestion}>Sugerencia IA: {props.reason}</Text> : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={disabled}
          onPress={props.onConfirm}
          style={[styles.primaryButton, disabled && styles.disabled]}
        >
          <Text style={styles.primaryText}>Confirmar empresa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={disabled}
          onPress={props.onChooseOther}
          style={[styles.secondaryButton, disabled && styles.disabled]}
        >
          <Text style={styles.secondaryText}>Elegir otra</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    marginLeft: 33,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderColor: '#C8A064',
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#C8A064',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lockedCard: {
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
    marginTop: 8,
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
  header: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAE8C8',
    borderBottomColor: 'rgba(200,160,100,0.25)',
    borderBottomWidth: 1,
  },
  sparkle: {
    color: '#8E6E3E',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  headerText: {
    color: '#8E6E3E',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  companyName: {
    color: '#131313',
    fontSize: 16,
    fontWeight: fontWeight.bold,
    lineHeight: 20,
  },
  suggestion: {
    marginTop: 5,
    color: '#646464',
    fontSize: 11,
    lineHeight: 16,
  },
  actions: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    height: 38,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B398',
    borderColor: '#00B398',
    borderRadius: 10,
    borderWidth: 1.5,
  },
  primaryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  secondaryButton: {
    height: 38,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderColor: '#C8A064',
    borderRadius: 10,
    borderWidth: 1.5,
  },
  secondaryText: {
    color: '#8E6E3E',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  disabled: {
    opacity: 0.55,
  },
});