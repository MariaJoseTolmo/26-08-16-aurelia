import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { InspectionAnswerValue, type InspectionChecklistItem, type InspectionChecklistTemplateResponse } from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { ManualFlowFooter, ManualFlowHeader } from '../../shared/components/form/ManualFlowScaffold';
import { OfflineBanner } from '../../shared/components/form/ManualFormUi';
import { ManualFormStepper } from './ManualSelectionUi';
import { useInspectionChecklistTemplates } from './hooks/useInspectionChecklistTemplates';
import { useSaveManualInspectionOffline } from './hooks/useSaveManualInspectionOffline';
import { useManualConnectivityStatus } from './useManualConnectivityStatus';
import { useManualInspectionDraft, type ManualChecklistItemDetail } from './manualInspection.store';
import { useManualInspectionFlowStore } from './manualInspectionFlow.store';

type ChecklistItemRow = InspectionChecklistItem & { sectionTitle: string };

type SummaryObservation = {
  index: number;
  item: ChecklistItemRow;
  detail: ManualChecklistItemDetail;
};

function getTemplateItems(template: InspectionChecklistTemplateResponse | undefined): ChecklistItemRow[] {
  if (!template) return [];
  return template.sections
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((section) => section.items
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ ...item, sectionTitle: section.title })));
}

function trimLocationLabel(value: string): string {
  return value.replace(/ ± .*/, '').trim();
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome5 name={icon} size={10} color={colors.muted} />
        <Text style={styles.cardHeaderText}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, mono && styles.summaryValueMono]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function ResultsCard({ totalCount, yesCount, noCount, naCount }: { totalCount: number; yesCount: number; noCount: number; naCount: number }) {
  return (
    <SectionCard title={`Resultado · ${totalCount} ítems`} icon="clipboard-check">
      <SummaryRow label="SÍ" value={`✓  ${yesCount} ítems conformes`} />
      <View style={styles.resultNoRow}>
        <Text style={styles.summaryLabel}>NO</Text>
        <Text style={styles.resultNoValue}>×  {noCount} · obs. registradas</Text>
      </View>
      <SummaryRow label="N/A" value={`${naCount} ítems`} />
    </SectionCard>
  );
}

function ObservationsCard({ observations }: { observations: SummaryObservation[] }) {
  if (observations.length === 0) return null;
  return (
    <SectionCard title={`Observaciones (${observations.length})`} icon="tasks">
      {observations.map((observation) => (
        <View key={observation.item.id} style={styles.observationBox}>
          <View style={styles.observationBadges}>
            <View style={styles.obsBadge}><Text style={styles.obsBadgeText}>Ítem. Nº{observation.index + 1}</Text></View>
            <View style={styles.highBadge}><Text style={styles.highBadgeText}>Alto</Text></View>
          </View>
          <Text style={styles.observationDescription}>{observation.detail.detectedCondition || observation.item.question}</Text>
          <View style={styles.slaRow}>
            <Text style={styles.summaryLabel}>SLA calculado</Text>
            <Text style={styles.slaValue}>xx días hábiles</Text>
          </View>
        </View>
      ))}
    </SectionCard>
  );
}

function ResponsiblesCard({ companyName, inspectorName }: { companyName: string | null; inspectorName: string }) {
  if (!companyName) return null;
  return (
    <SectionCard title="Responsables" icon="user-tie">
      <SummaryRow label="EECC" value={companyName} />
      <View style={styles.personRow}>
        <View style={styles.avatarGold}><Text style={styles.avatarGoldText}>NA</Text></View>
        <View style={styles.personCopy}>
          <Text style={styles.personName}>{inspectorName}</Text>
          <Text style={styles.personRole}>Coordinador</Text>
        </View>
        <View style={styles.youBadge}><Text style={styles.youBadgeText}>Tú</Text></View>
      </View>
      <View style={styles.personRow}>
        <View style={styles.avatarBlue}><Text style={styles.avatarBlueText}>NA</Text></View>
        <View style={styles.personCopy}>
          <Text style={styles.personName}>Responsable pendiente</Text>
          <Text style={styles.personRole}>Inspector</Text>
        </View>
      </View>
    </SectionCard>
  );
}

function OfflineNotice() {
  return (
    <View style={styles.offlineNotice}>
      <FontAwesome5 name="info-circle" size={18} color={colors.white} />
      <View style={styles.offlineCopy}>
        <Text style={styles.offlineTitle}>Guardado offline</Text>
        <Text style={styles.offlineDescription}>Este proceso cuenta con guardado localmente. En caso que no cuente con señal, el formulario será enviado una vez esta sea recuperada.</Text>
      </View>
    </View>
  );
}

export function ManualInspectionSummaryScreen() {
  const { online, hasSession } = useManualConnectivityStatus();
  const draft = useManualInspectionDraft();
  const setLastSavedResult = useManualInspectionDraft((state) => state.setLastSavedResult);
  const goToObservations = useManualInspectionFlowStore((state) => state.goToObservations);
  const goToSummary = useManualInspectionFlowStore((state) => state.goToSummary);
  const templatesQuery = useInspectionChecklistTemplates();
  const saveMutation = useSaveManualInspectionOffline();
  const selectedTemplate = templatesQuery.data?.find((template) => template.id === draft.templateId);
  const items = useMemo(() => getTemplateItems(selectedTemplate), [selectedTemplate]);
  const indexedItems = useMemo(() => items.map((item, index) => ({ ...item, index })), [items]);
  const values = items.map((item) => draft.answersByItemId[item.id]);
  const yesCount = values.filter((value) => value === InspectionAnswerValue.COMPLIANT).length;
  const noCount = values.filter((value) => value === InspectionAnswerValue.NOT_COMPLIANT).length;
  const naCount = values.filter((value) => value === InspectionAnswerValue.NOT_APPLICABLE).length;
  const observations = items
    .map((item, index) => ({ item, index, detail: draft.detailsByItemId[item.id] ?? {} }))
    .filter((observation) => draft.answersByItemId[observation.item.id] === InspectionAnswerValue.NOT_COMPLIANT);

  React.useEffect(() => {
    goToSummary();
  }, [goToSummary]);

  function back() {
    goToObservations();
    router.replace('/inspection/manual/observations');
  }

  function save() {
    if (!selectedTemplate) {
      Alert.alert('Plantilla no disponible', 'No se pudo encontrar la plantilla seleccionada para guardar la inspección.');
      return;
    }
    saveMutation.mutate(
      { draft, template: selectedTemplate, items: indexedItems, trySyncNow: online && hasSession },
      {
        onSuccess: (result) => {
          setLastSavedResult(result);
          router.replace('/inspection/manual/saved');
        },
        onError: () => {
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
            <View style={styles.copyBlock}>
              <Text style={styles.title}>Resumen</Text>
              <Text style={styles.subtitle}>Revisa antes de guardar · se sincronizará al recuperar red</Text>
            </View>
            <SectionCard title="Quién realizó la inspección" icon="user-tie">
              <SummaryRow label="Nombre" value={draft.inspectorName} />
              <SummaryRow label="Empresa" value={draft.inspectorCompanyName} />
            </SectionCard>
            <SectionCard title="Donde y cuándo" icon="map-marked-alt">
              <SummaryRow label="Área · Sector" value={`${draft.areaName ?? '-'} · ${draft.sectorName ?? '-'}`} />
              <SummaryRow label="Fecha" value={draft.inspectionDate} />
              <SummaryRow label="Tipo" value={draft.inspectionTypeLabel} />
              <SummaryRow label="Plantilla" value={draft.templateName ?? '-'} />
              <SummaryRow label="Código" value={draft.templateCode ?? '-'} />
              <SummaryRow label="Ubicación UTM" value={trimLocationLabel(draft.locationLabel)} mono />
            </SectionCard>
            <ResultsCard totalCount={items.length} yesCount={yesCount} noCount={noCount} naCount={naCount} />
            <ObservationsCard observations={observations} />
            <ResponsiblesCard companyName={draft.findingCompanyName} inspectorName={draft.inspectorName} />
            <OfflineNotice />
          </ScrollView>
          <ManualFlowFooter secondaryLabel="Atrás" secondaryIcon="arrow-left" onSecondary={back} onPrimary={save} primaryLabel={saveMutation.isPending ? 'Guardando...' : 'Guardar inspección'} primaryVariant="success" primaryIcon="check" primaryDisabled={saveMutation.isPending} />
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
  copyBlock: { gap: 4 },
  title: { fontSize: 18, lineHeight: 21.6, fontWeight: fontWeight.bold, color: colors.primary },
  subtitle: { fontSize: 12, lineHeight: 16.8, color: colors.muted },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  cardHeader: { minHeight: 29, backgroundColor: '#F7F7F7', borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  cardHeaderText: { fontSize: 10, lineHeight: 13, fontWeight: fontWeight.bold, color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  summaryRow: { minHeight: 34, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 9, gap: 12 },
  summaryLabel: { fontSize: 12, lineHeight: 14.5, fontWeight: fontWeight.medium, color: colors.muted },
  summaryValue: { flex: 1, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.primary, textAlign: 'right' },
  summaryValueMono: { fontFamily: 'monospace', fontSize: 11 },
  resultNoRow: { minHeight: 34, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 9, gap: 12 },
  resultNoValue: { fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: '#570B1D', textAlign: 'right' },
  observationBox: { paddingHorizontal: 12, paddingTop: 9, paddingBottom: 10, gap: 8 },
  observationBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  obsBadge: { height: 19, borderRadius: 6, backgroundColor: '#E6F3FF', justifyContent: 'center', paddingHorizontal: 8 },
  obsBadgeText: { fontSize: 11, fontWeight: fontWeight.bold, color: '#24588B' },
  highBadge: { height: 20, borderRadius: 8, backgroundColor: '#FFE1CD', justifyContent: 'center', paddingHorizontal: 8 },
  highBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: '#532A0E' },
  observationDescription: { fontSize: 12, lineHeight: 16.8, color: colors.primary },
  slaRow: { borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
  slaValue: { fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.primary },
  personRow: { borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  avatarGold: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarBlue: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.blueLink, alignItems: 'center', justifyContent: 'center' },
  avatarGoldText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.navy },
  avatarBlueText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.white },
  personCopy: { flex: 1 },
  personName: { fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.primary },
  personRole: { marginTop: 1, fontSize: 11, lineHeight: 14, color: colors.muted },
  youBadge: { height: 16, borderRadius: 5, backgroundColor: '#C5FFF6', justifyContent: 'center', paddingHorizontal: 7 },
  youBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.teal },
  offlineNotice: { borderRadius: 12, backgroundColor: '#4A90C4', flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  offlineCopy: { flex: 1 },
  offlineTitle: { fontSize: 13, lineHeight: 17, fontWeight: fontWeight.bold, color: colors.white },
  offlineDescription: { marginTop: 2, fontSize: 11, lineHeight: 15.4, color: 'rgba(255,255,255,0.88)' },
});
