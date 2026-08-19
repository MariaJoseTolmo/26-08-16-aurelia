import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { InspectionAnswerValue } from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { OfflineBanner } from '../../shared/components/form/ManualFormUi';
import { ManualFlowHeader } from '../../shared/components/form/ManualFlowScaffold';
import { ManualFormStepper } from './ManualSelectionUi';
import { useInspectionChecklistTemplates } from './hooks/useInspectionChecklistTemplates';
import { usePersistManualInspectionDraft } from './hooks/usePersistManualInspectionDraft';
import { useSaveManualInspectionOffline } from './hooks/useSaveManualInspectionOffline';
import { markManualInspectionDraftCompleted } from './manualInspectionDrafts.storage';
import { useManualConnectivityStatus } from './useManualConnectivityStatus';
import { useManualInspectionDraft } from './manualInspection.store';
import { useManualInspectionFlowStore } from './manualInspectionFlow.store';

function trimLocationLabel(value: string): string {
  return value.replace(/ ± .*/, '').trim();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function ManualInspectionSummaryFixedScreen() {
  usePersistManualInspectionDraft();
  const { online, hasSession } = useManualConnectivityStatus();
  const draft = useManualInspectionDraft();
  const setLastSavedResult = useManualInspectionDraft((state) => state.setLastSavedResult);
  const goToObservations = useManualInspectionFlowStore((state) => state.goToObservations);
  const goToSummary = useManualInspectionFlowStore((state) => state.goToSummary);
  const templatesQuery = useInspectionChecklistTemplates();
  const saveMutation = useSaveManualInspectionOffline();
  const [savingStarted, setSavingStarted] = React.useState(false);
  const selectedTemplate = templatesQuery.data?.find((template) => template.id === draft.templateId);
  const items = React.useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.sections
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((section) => section.items.slice().sort((a, b) => a.sortOrder - b.sortOrder));
  }, [selectedTemplate]);
  const indexedItems = React.useMemo(() => items.map((item, index) => ({ ...item, index })), [items]);
  const values = items.map((item) => draft.answersByItemId[item.id]);
  const yesCount = values.filter((value) => value === InspectionAnswerValue.COMPLIANT).length;
  const noCount = values.filter((value) => value === InspectionAnswerValue.NOT_COMPLIANT).length;
  const naCount = values.filter((value) => value === InspectionAnswerValue.NOT_APPLICABLE).length;
  const saving = savingStarted || saveMutation.isPending;

  React.useEffect(() => {
    goToSummary();
  }, [goToSummary]);

  function back() {
    goToObservations();
    router.replace('/inspection/manual/observations');
  }

  function save() {
    if (saving) return;
    if (!selectedTemplate) {
      Alert.alert('Plantilla no disponible', 'No se pudo encontrar la plantilla seleccionada para guardar la inspección.');
      return;
    }
    setSavingStarted(true);
    saveMutation.mutate(
      { draft, template: selectedTemplate, items: indexedItems, trySyncNow: online && hasSession },
      {
        onSuccess: (result) => {
          if (draft.draftId) void markManualInspectionDraftCompleted(draft.draftId);
          setLastSavedResult(result);
          router.replace('/inspection/manual/saved');
        },
        onError: () => {
          setSavingStarted(false);
          Alert.alert('No se pudo guardar', 'No se pudo escribir el formulario en la cola local. Intenta nuevamente.');
        },
      },
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <ManualFlowHeader title="Observaciones" subtitle="Paso 4 de 5" badge="GF HSE" onBack={back} />
          <OfflineBanner online={online} hasSession={hasSession} />
          <ManualFormStepper activeStep={4} steps={['Datos', 'Tipo', 'Ítems', 'Resumen']} />
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Resumen</Text>
            <Text style={styles.subtitle}>Revisa antes de guardar · se sincronizará al recuperar red</Text>
            <Card title="Quién realizó la inspección">
              <Row label="Nombre" value={draft.inspectorName} />
              <Row label="Empresa" value={draft.inspectorCompanyName} />
            </Card>
            <Card title="Dónde y cuándo">
              <Row label="Área · Sector" value={`${draft.areaName ?? '-'} · ${draft.sectorName ?? '-'}`} />
              <Row label="Fecha" value={draft.inspectionDate} />
              <Row label="Tipo" value={draft.inspectionTypeLabel} />
              <Row label="Plantilla" value={draft.templateName ?? '-'} />
              <Row label="Código" value={draft.templateCode ?? '-'} />
              <Row label="Ubicación UTM" value={trimLocationLabel(draft.locationLabel)} />
            </Card>
            <Card title={`Resultado · ${items.length} ítems`}>
              <Row label="SÍ" value={`✓ ${yesCount} ítems conformes`} />
              <Row label="NO" value={`× ${noCount} obs. registradas`} />
              <Row label="N/A" value={`${naCount} ítems`} />
            </Card>
            <View style={styles.notice}>
              <FontAwesome5 name="info-circle" size={18} color={colors.white} />
              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>Guardado offline</Text>
                <Text style={styles.noticeText}>El formulario se guardará localmente y se enviará cuando exista conexión.</Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              <Pressable style={styles.secondaryButton} onPress={back} hitSlop={6}>
                <FontAwesome5 name="arrow-left" size={14} color={colors.gold} />
                <Text style={styles.secondaryText}>Atrás</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, saving && styles.primaryButtonDisabled]} onPress={save} disabled={saving} hitSlop={6}>
                <FontAwesome5 name="check" size={14} color={saving ? colors.placeholder : colors.white} />
                <Text style={[styles.primaryText, saving && styles.primaryTextDisabled]}>{saving ? 'Guardando...' : 'Guardar inspección'}</Text>
              </Pressable>
            </View>
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
  content: { flex: 1 },
  contentInner: { gap: 12, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24 },
  title: { fontSize: 18, lineHeight: 21.6, fontWeight: fontWeight.bold, color: colors.primary },
  subtitle: { marginTop: -8, fontSize: 12, lineHeight: 16.8, color: colors.muted },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' },
  cardTitle: { backgroundColor: '#F7F7F7', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 12, paddingVertical: 8, fontSize: 10, fontWeight: fontWeight.bold, color: colors.muted, textTransform: 'uppercase' },
  row: { minHeight: 34, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 9 },
  rowLabel: { fontSize: 12, fontWeight: fontWeight.medium, color: colors.muted },
  rowValue: { flex: 1, fontSize: 12, fontWeight: fontWeight.bold, color: colors.primary, textAlign: 'right' },
  notice: { borderRadius: 12, backgroundColor: '#4A90C4', flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  noticeCopy: { flex: 1 },
  noticeTitle: { fontSize: 13, lineHeight: 17, fontWeight: fontWeight.bold, color: colors.white },
  noticeText: { marginTop: 2, fontSize: 11, lineHeight: 15.4, color: 'rgba(255,255,255,0.88)' },
  footer: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, paddingHorizontal: 14, alignItems: 'center' },
  footerButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  secondaryButton: { height: 50, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  secondaryText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.gold },
  primaryButton: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#3A9B3A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonDisabled: { backgroundColor: '#E3E3E3' },
  primaryText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.white },
  primaryTextDisabled: { color: colors.placeholder },
  homeIndicator: { width: 120, height: 4, borderRadius: 2, backgroundColor: colors.borderMid, marginTop: 14, marginBottom: 8 },
});
