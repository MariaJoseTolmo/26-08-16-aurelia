import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useManualInspectionDraft } from './manualInspection.store';
import { useManualInspectionFlowStore } from './manualInspectionFlow.store';
import { ManualFindingObservationsSeverityScreen } from './ManualFindingObservationsSeverityScreen';

export function ManualFindingObservationsScreen() {
  const draft = useManualInspectionDraft();
  const goToSummary = useManualInspectionFlowStore((state) => state.goToSummary);
  const savedObservations = draft.findingObservations.filter((item) => item.saved);
  const activeObservation = draft.findingObservations.find((item) => !item.saved);
  const canContinue = savedObservations.length > 0 && !activeObservation && Boolean(draft.findingCompanyId) && draft.findingResponsibleIds.length > 0;

  function next() {
    if (!canContinue) return;
    goToSummary();
    router.push('/inspection/manual/summary');
  }

  return <View style={styles.root}><ManualFindingObservationsSeverityScreen />{canContinue ? <Pressable style={styles.primaryProxy} onPress={next} hitSlop={4} /> : null}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  primaryProxy: { position: 'absolute', right: 14, bottom: 22, height: 50, left: 122, borderRadius: 14 },
});
