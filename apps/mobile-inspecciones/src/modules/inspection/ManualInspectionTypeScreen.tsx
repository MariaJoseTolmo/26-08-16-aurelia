import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { InspectionType } from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { ManualFlowFooter, ManualFlowHeader } from '../../shared/components/form/ManualFlowScaffold';
import { OfflineBanner } from '../../shared/components/form/ManualFormUi';
import { ManualFormStepper } from './ManualSelectionUi';
import { useInspectionChecklistTemplates } from './hooks/useInspectionChecklistTemplates';
import { usePersistManualInspectionDraft } from './hooks/usePersistManualInspectionDraft';
import { useManualConnectivityStatus } from './useManualConnectivityStatus';
import { useManualInspectionDraft } from './manualInspection.store';
import { useManualInspectionFlowStore } from './manualInspectionFlow.store';

type ManualTypeOption = {
  type: InspectionType;
  title: string;
  description: string;
  icon: string;
};

function buildTypeOptions(templateCount: number | null, templatesLoading: boolean): ManualTypeOption[] {
  const templateText = templatesLoading
    ? 'Cargando plantillas · ítems NO generan hallazgo automático'
    : `${templateCount ?? 0} plantillas disponibles · ítems NO generan hallazgo automático`;

  return [
    {
      type: InspectionType.ENVIRONMENTAL,
      title: 'Hallazgo',
      description: 'Condición subestándar detectada · cada observación se registra individualmente con foto',
      icon: 'search',
    },
    {
      type: InspectionType.REGULATORY,
      title: 'Checklist normativo',
      description: templateText,
      icon: 'check',
    },
  ];
}

function TypeOptionCard({ option, selected, onPress }: { option: ManualTypeOption; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.optionCard, selected ? styles.optionCardSelected : styles.optionCardIdle]} activeOpacity={0.82} onPress={onPress}>
      <View style={[styles.optionIcon, selected ? styles.optionIconSelected : styles.optionIconIdle]}>
        <FontAwesome5 name={option.icon} size={16} color={selected ? colors.gold : '#646464'} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, selected ? styles.optionTitleSelected : styles.optionTitleIdle]}>{option.title}</Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function ManualInspectionTypeScreen() {
  usePersistManualInspectionDraft();
  const { online, hasSession } = useManualConnectivityStatus();
  const draft = useManualInspectionDraft();
  const setInspectionType = useManualInspectionDraft((state) => state.setInspectionType);
  const goToIdentification = useManualInspectionFlowStore((state) => state.goToIdentification);
  const goToObservations = useManualInspectionFlowStore((state) => state.goToObservations);
  const goToType = useManualInspectionFlowStore((state) => state.goToType);
  const templatesQuery = useInspectionChecklistTemplates();
  const templateCount = templatesQuery.data?.length ?? null;
  const typeOptions = React.useMemo(() => buildTypeOptions(templateCount, templatesQuery.isLoading), [templateCount, templatesQuery.isLoading]);
  const canContinue = draft.inspectionTypeSelected;

  React.useEffect(() => {
    goToType();
  }, [goToType]);

  function back() {
    goToIdentification();
    router.replace('/inspection/manual/identification');
  }

  function next() {
    if (!canContinue) return;
    goToObservations();
    router.push('/inspection/manual/observations');
  }

  function selectType(option: ManualTypeOption) {
    setInspectionType(option.type, option.title);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <ManualFlowHeader title="Tipo de inspección" subtitle="Paso 2 de 5" badge="GF HSE" onBack={back} />
          <OfflineBanner online={online} hasSession={hasSession} />
          <ManualFormStepper activeStep={2} steps={['Datos', 'Tipo', 'Obs.', 'Resumen']} />
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
            <View style={styles.copyBlock}>
              <Text style={styles.title}>Tipo de inspección</Text>
              <Text style={styles.subtitle}>Define la naturaleza del registro que realizarás en esta visita</Text>
            </View>
            <View style={styles.options}>
              {typeOptions.map((option) => (
                <TypeOptionCard
                  key={option.type}
                  option={option}
                  selected={draft.inspectionTypeSelected && draft.inspectionType === option.type}
                  onPress={() => selectType(option)}
                />
              ))}
            </View>
          </ScrollView>
          <ManualFlowFooter secondaryLabel="Atrás" secondaryIcon="arrow-left" onSecondary={back} onPrimary={next} primaryDisabled={!canContinue} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navyDark },
  screen: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24 },
  copyBlock: { gap: 4 },
  title: { fontSize: 18, lineHeight: 21.6, fontWeight: fontWeight.bold, color: colors.primary },
  subtitle: { fontSize: 12, lineHeight: 16.8, color: colors.muted },
  options: { marginTop: 12, gap: 12 },
  optionCard: { minHeight: 68, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15.5, paddingVertical: 15.5, gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 1.5, shadowOffset: { width: 0, height: 1 } },
  optionCardIdle: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: '#E3E3E3' },
  optionCardSelected: { backgroundColor: '#FDF8F1', borderWidth: 1.5, borderColor: colors.gold },
  optionIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  optionIconIdle: { backgroundColor: '#F7F7F7' },
  optionIconSelected: { backgroundColor: '#FDF0DC' },
  optionCopy: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 14, lineHeight: 18, fontWeight: fontWeight.bold },
  optionTitleIdle: { color: colors.primary },
  optionTitleSelected: { color: '#8E6E3E' },
  optionDescription: { fontSize: 11, lineHeight: 14.3, color: colors.muted },
});