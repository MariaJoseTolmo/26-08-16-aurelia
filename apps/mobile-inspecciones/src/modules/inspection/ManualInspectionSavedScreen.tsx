import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { OfflineBanner } from '../../shared/components/form/ManualFormUi';
import { ManualFlowHeader } from '../../shared/components/form/ManualFlowScaffold';
import { notifyDesktop } from '../../shared/bridge/desktop-launch-bridge';
import { useManualConnectivityStatus } from './useManualConnectivityStatus';
import { useManualInspectionDraft } from './manualInspection.store';
import { useManualInspectionFlowStore } from './manualInspectionFlow.store';
import { removeManualInspectionDraft } from './manualInspectionDrafts.storage';

function CompletionLine() {
  return (
    <View style={styles.lineWrap}>
      <View style={styles.line} />
    </View>
  );
}

export function ManualInspectionSavedScreen() {
  const { online, hasSession } = useManualConnectivityStatus();
  const result = useManualInspectionDraft((state) => state.lastSavedResult);
  const areaId = useManualInspectionDraft((state) => state.areaId);
  const areaName = useManualInspectionDraft((state) => state.areaName);
  const sectorId = useManualInspectionDraft((state) => state.sectorId);
  const sectorName = useManualInspectionDraft((state) => state.sectorName);
  const draftId = useManualInspectionDraft((state) => state.draftId);
  const resetDraft = useManualInspectionDraft((state) => state.reset);
  const setArea = useManualInspectionDraft((state) => state.setArea);
  const setSector = useManualInspectionDraft((state) => state.setSector);
  const resetFlow = useManualInspectionFlowStore((state) => state.resetFlow);
  const goToIdentification = useManualInspectionFlowStore((state) => state.goToIdentification);
  const mode = result?.mode ?? 'checklist';
  const yesCount = result?.yesCount ?? 0;
  const totalCount = result?.totalCount ?? 0;
  const closed = result?.closed ?? false;
  const title = mode === 'finding'
    ? 'Hallazgo guardado'
    : closed ? 'Inspección guardada y cerrada' : 'Inspección guardada';
  const description = mode === 'finding'
    ? `Guardado con ${totalCount} observaciones. Aparecerá de inmediato en gestión de inspecciones y se sincronizará al recuperar red.`
    : closed
      ? `Guardada con ${yesCount} ítems marcados en “Sí”. Esta inspección podrá ser revisada en inspecciones cerradas.`
      : 'Guardada con observaciones abiertas. Esta inspección podrá ser revisada en gestión de inspecciones.';

  React.useEffect(() => {
    if (!result) return;
    notifyDesktop('aurelia:inspection:saved', { inspectionId: result.inspectionId, mode: result.mode });
  }, [result]);

  function newInspection() {
    if (draftId) void removeManualInspectionDraft(draftId);
    resetDraft();
    resetFlow();
    router.replace('/inspection/start');
  }

  function newSameArea() {
    const nextAreaId = areaId;
    const nextAreaName = areaName;
    const nextSectorId = sectorId;
    const nextSectorName = sectorName;
    if (draftId) void removeManualInspectionDraft(draftId);
    resetDraft();
    resetFlow();
    if (nextAreaId && nextAreaName) setArea(nextAreaId, nextAreaName);
    if (nextSectorId && nextSectorName) setSector(nextSectorId, nextSectorName);
    goToIdentification();
    router.replace('/inspection/manual/identification');
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <ManualFlowHeader title="Guardado" subtitle="SGA · Gold Fields Salares Norte" badge="GF HSE" />
          <OfflineBanner online={online} hasSession={hasSession} />
          <CompletionLine />
          <View style={styles.content}>
            <View style={styles.successIcon}>
              <FontAwesome5 name="check" size={34} color={colors.white} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.82} onPress={newInspection}>
                <FontAwesome5 name="plus" size={15} color={colors.navy} />
                <Text style={styles.primaryText}>Nueva inspección</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.75} onPress={newSameArea}>
                <FontAwesome5 name="sync-alt" size={15} color={colors.gold} />
                <Text style={styles.secondaryText}>Nueva · misma área</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.footer}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navyDark },
  screen: { flex: 1, backgroundColor: '#F7F7F7' },
  lineWrap: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14 },
  line: { height: 2, borderRadius: 2, backgroundColor: colors.gold },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 38, paddingBottom: 88 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#3A9B3A', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 18, lineHeight: 22, fontWeight: fontWeight.bold, color: '#3A9B3A', textAlign: 'center' },
  description: { marginTop: 14, maxWidth: 260, fontSize: 13, lineHeight: 19.5, color: colors.muted, textAlign: 'center' },
  buttons: { width: '100%', maxWidth: 280, gap: 8, marginTop: 28 },
  primaryButton: { height: 50, borderRadius: 14, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  primaryText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.navy },
  secondaryButton: { height: 50, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  secondaryText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.gold },
  footer: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center', paddingTop: 18, paddingBottom: 8 },
  homeIndicator: { width: 120, height: 4, borderRadius: 2, backgroundColor: colors.borderMid },
});
