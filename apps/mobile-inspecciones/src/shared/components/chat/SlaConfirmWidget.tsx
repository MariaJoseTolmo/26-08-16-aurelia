import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, fontWeight } from '../../theme/tokens';
import { useManualInspectionDraft } from '../../../modules/inspection/manualInspection.store';

const OPTIONS = [1, 3, 7, 14];

interface SlaConfirmWidgetProps {
  initialDays: number;
  observationNumber?: number;
  resolved?: boolean;
  onSave: (days: number) => void;
}

interface SavedObservationCardProps {
  observationId: string;
}

function parseSlaDays(label: string | null | undefined, fallback: number): number {
  const value = Number((label ?? '').match(/(\d+)/)?.[1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function SavedObservationCard({ observationId }: SavedObservationCardProps) {
  const observations = useManualInspectionDraft((state) => state.findingObservations);
  const removeObservation = useManualInspectionDraft((state) => state.removeFindingObservation);
  const observationIndex = observations.findIndex((item) => item.id === observationId);
  const observation = observationIndex >= 0 ? observations[observationIndex] : null;

  if (!observation?.saved) return null;

  return (
    <View style={styles.savedCard}>
      <View style={styles.savedRow}>
        <Text style={styles.observationBadge}>Obs. {observationIndex + 1}</Text>
        <View style={styles.savedCopy}>
          <Text numberOfLines={1} style={styles.savedCondition}>{observation.detectedCondition}</Text>
          <View style={styles.savedMetaRow}>
            <Text style={styles.severityBadge}>
              {observation.severityLabel ?? 'Manual'} · {parseSlaDays(observation.severityClosureTimeLabel, 7)}d
            </Text>
            <Text style={styles.manualBadge}>{observation.correctiveActionSource === 'ai' ? 'IA' : 'Manual'}</Text>
            {observation.evidence ? (
              <View style={styles.evidenceMark}>
                <FontAwesome5 name="camera" size={10} color="#2A7A2E" />
                <Text style={styles.evidenceCheck}>✓</Text>
              </View>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          accessibilityLabel={`Eliminar observación ${observationIndex + 1}`}
          activeOpacity={0.7}
          onPress={() => removeObservation(observation.id)}
          style={styles.removeButton}
        >
          <FontAwesome5 name="trash-alt" size={12} color="#646464" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function SlaConfirmWidget({
  initialDays,
  observationNumber = 1,
  resolved = false,
  onSave,
}: SlaConfirmWidgetProps) {
  const [days, setDays] = React.useState(String(initialDays));
  const stableObservationNumber = React.useRef(observationNumber);

  React.useEffect(() => {
    setDays(String(initialDays));
  }, [initialDays]);

  const numericDays = Number(days);
  const valid = Number.isFinite(numericDays) && numericDays > 0;

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.title}>SLA · DÍAS HÁBILES PARA RESOLVER</Text>
        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const selected = numericDays === option;
            return (
              <TouchableOpacity
                key={option}
                activeOpacity={0.75}
                disabled={resolved}
                onPress={() => setDays(String(option))}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option} día{option === 1 ? '' : 's'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.customRow}>
          <TextInput
            editable={!resolved}
            keyboardType="number-pad"
            onChangeText={(value) => setDays(value.replace(/\D/g, '').slice(0, 3))}
            selectionColor="#C8A064"
            style={styles.input}
            value={days}
          />
          <Text style={styles.customText}>días personalizados</Text>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={resolved || !valid}
        onPress={() => onSave(numericDays)}
        style={[styles.saveButton, (resolved || !valid) && styles.disabled]}
      >
        <FontAwesome5 name="save" size={10} color={colors.white} solid />
        <Text style={styles.saveText}>Guardar observación {stableObservationNumber.current}</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    marginLeft: 33,
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderColor: '#E3E3E3',
    borderRadius: 10,
    borderWidth: 1,
  },
  title: {
    marginBottom: 6,
    color: '#646464',
    fontSize: 9,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  options: {
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  option: {
    height: 26,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F9',
    borderColor: '#D1D1D1',
    borderRadius: 7,
    borderWidth: 1,
  },
  optionSelected: {
    backgroundColor: '#C8A064',
    borderColor: '#C8A064',
  },
  optionText: {
    color: '#646464',
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  optionTextSelected: {
    color: '#001E39',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    width: 55,
    height: 30,
    padding: 0,
    color: '#131313',
    fontSize: 14,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    backgroundColor: colors.white,
    borderColor: '#D1D1D1',
    borderRadius: 7,
    borderWidth: 1.5,
  },
  customText: {
    color: '#646464',
    fontSize: 12,
  },
  saveButton: {
    height: 36,
    marginBottom: 10,
    marginLeft: 33,
    paddingHorizontal: 17,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#00B398',
    borderRadius: 999,
    shadowColor: '#00B398',
    shadowOpacity: 0.22,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  saveText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  disabled: {
    opacity: 0.5,
  },
  savedCard: {
    width: 'auto',
    marginBottom: 10,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.white,
    borderColor: '#E3E3E3',
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  observationBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    color: '#0D3862',
    fontSize: 10,
    fontWeight: fontWeight.bold,
    lineHeight: 14,
    backgroundColor: '#E6F3FF',
    borderRadius: 5,
  },
  savedCopy: {
    minWidth: 0,
    flex: 1,
  },
  savedCondition: {
    color: '#131313',
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    lineHeight: 17,
  },
  savedMetaRow: {
    marginTop: 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: '#463100',
    fontSize: 9,
    fontWeight: fontWeight.bold,
    lineHeight: 12,
    backgroundColor: '#FFEAB8',
    borderRadius: 4,
  },
  manualBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: '#646464',
    fontSize: 9,
    fontWeight: fontWeight.bold,
    lineHeight: 12,
    backgroundColor: '#F4F6F9',
    borderRadius: 4,
  },
  evidenceMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  evidenceCheck: {
    color: '#2A7A2E',
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  removeButton: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F9',
    borderColor: '#E3E3E3',
    borderRadius: 5,
    borderWidth: 1,
  },
});