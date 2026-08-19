import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, fontWeight, spacing } from '../../shared/theme/tokens';
import { formatLocationLabel } from '../../shared/utils/geo.utils';
import { FieldBox, FieldLabel, FormCard, LocationMapPreview, OfflineBanner, SelectBox } from '../../shared/components/form/ManualFormUi';
import { ManualFlowFooter, ManualFlowHeader } from '../../shared/components/form/ManualFlowScaffold';
import { useMobileInspectionAssignmentScope } from '../../shared/stores/mobileInspectionAssignmentScope.store';
import { useMobileSession } from '../auth/mobileSession.store';
import { useManualInspectionDraft } from './manualInspection.store';
import { useManualInspectionCatalogs } from './useManualInspectionCatalogs';
import { useManualConnectivityStatus } from './useManualConnectivityStatus';
import { useManualInspectionLocation } from './useManualInspectionLocation';
import { useManualInspectionFlowStore } from './manualInspectionFlow.store';
import { removeManualInspectionDraft } from './manualInspectionDrafts.storage';
import { usePersistManualInspectionDraft } from './hooks/usePersistManualInspectionDraft';
import { ManualFormStepper, SelectSheet, type SelectSheetOption } from './ManualSelectionUi';

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={styles.fieldGroup}><FieldLabel>{label}</FieldLabel>{children}</View>;
}

function formatDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const year = value.getFullYear();
  return `${day}-${month}-${year}`;
}

function buildDateOptions(): SelectSheetOption[] {
  return Array.from({ length: 21 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const label = formatDate(date);
    const description = index === 0 ? 'Hoy' : index === 1 ? 'Ayer' : new Intl.DateTimeFormat('es-CL', { weekday: 'long' }).format(date);
    return { id: label, label, description };
  });
}

export function ManualIdentificationConnected() {
  usePersistManualInspectionDraft();
  const draft = useManualInspectionDraft();
  const user = useMobileSession((state) => state.user);
  const scopeLoaded = useMobileInspectionAssignmentScope((state) => state.loaded);
  const inspectorCompanyName = useMobileInspectionAssignmentScope((state) => state.inspectorCompanyName);
  const hydrateAssignmentScope = useMobileInspectionAssignmentScope((state) => state.hydrate);
  const setInspectorIdentity = useManualInspectionDraft((state) => state.setInspectorIdentity);
  const activePicker = useManualInspectionFlowStore((state) => state.activePicker);
  const currentStep = useManualInspectionFlowStore((state) => state.currentStep);
  const openPicker = useManualInspectionFlowStore((state) => state.openPicker);
  const closePicker = useManualInspectionFlowStore((state) => state.closePicker);
  const goToIdentification = useManualInspectionFlowStore((state) => state.goToIdentification);
  const goToType = useManualInspectionFlowStore((state) => state.goToType);
  const { online, hasSession } = useManualConnectivityStatus();
  const { areas, sectors, loadingAreas, loadingSectors, catalogErrorMessage } = useManualInspectionCatalogs();
  const { captureLocation, capturing, locationError } = useManualInspectionLocation();
  const inspectorName = user?.fullName ?? draft.inspectorName;
  const resolvedInspectorCompanyName = inspectorCompanyName ?? user?.companyName ?? draft.inspectorCompanyName;
  const areaOptions = useMemo<SelectSheetOption[]>(() => areas.map((area) => ({ id: area.id, label: area.name, description: area.code })), [areas]);
  const sectorOptions = useMemo<SelectSheetOption[]>(() => sectors.map((sector) => ({ id: sector.id, label: sector.name, description: sector.code })), [sectors]);
  const dateOptions = useMemo<SelectSheetOption[]>(buildDateOptions, []);
  const canContinue = Boolean(draft.areaId && draft.sectorId && draft.inspectionDateSelected && draft.locationCaptured);
  const catalogEmptyText = catalogErrorMessage ?? 'No hay catálogos disponibles para operar offline';

  React.useEffect(() => {
    void hydrateAssignmentScope(user);
  }, [hydrateAssignmentScope, user]);

  React.useEffect(() => {
    if (!scopeLoaded) return;
    setInspectorIdentity(inspectorName, resolvedInspectorCompanyName);
  }, [inspectorName, resolvedInspectorCompanyName, scopeLoaded, setInspectorIdentity]);

  React.useEffect(() => {
    goToIdentification();
  }, [goToIdentification]);

  function cancel() {
    closePicker();
    if (draft.draftId) void removeManualInspectionDraft(draft.draftId);
    router.replace('/inspection/start');
  }

  function selectArea(option: SelectSheetOption) {
    draft.setArea(option.id, option.label);
    closePicker();
  }

  function selectSector(option: SelectSheetOption) {
    draft.setSector(option.id, option.label);
    closePicker();
  }

  function selectDate(option: SelectSheetOption) {
    draft.setInspectionDate(option.label);
    closePicker();
  }

  async function capture() {
    const ok = await captureLocation();
    if (!ok && locationError) Alert.alert('Ubicación', locationError);
  }

  function adjustLocation(coords: { latitude: number; longitude: number }) {
    draft.setLocation({
      label: formatLocationLabel(coords.latitude, coords.longitude, draft.locationAccuracyLabel),
      accuracy: draft.locationAccuracyLabel,
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: draft.altitude,
    });
  }

  function next() {
    if (!canContinue) {
      Alert.alert('Faltan datos', 'Completa área, sector, fecha y ubicación antes de continuar.');
      return;
    }
    goToType();
    router.push('/inspection/manual/type');
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <ManualFlowHeader title="Identificación" subtitle="Paso 1 de 5" badge="GF HSE" />
          <OfflineBanner online={online} hasSession={hasSession} />
          <ManualFormStepper activeStep={currentStep} steps={['Datos', 'Tipo', 'Obs.', 'Resumen']} />
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
            <View><Text style={styles.title}>Identificación</Text><Text style={styles.subtitle}>Completa los datos del inspector y de la inspección antes de continuar</Text></View>
            <FormCard icon={<FontAwesome5 name="user-tag" size={11} color={colors.blueLink} />} title="Datos del inspector" subtitle="¿Quién está realizando esta inspección?">
              <LabeledField label="Inspector *"><FieldBox value={inspectorName} /></LabeledField>
              <LabeledField label="Empresa del inspector *"><FieldBox value={resolvedInspectorCompanyName} /></LabeledField>
            </FormCard>
            <FormCard icon={<FontAwesome5 name="map-marked-alt" size={11} color={colors.teal} />} title="Datos de la inspección" subtitle="¿Dónde y cuándo se realiza esta inspección?">
              <View style={styles.twoColumns}>
                <View style={styles.column}><LabeledField label="Área *"><SelectBox value={draft.areaName ?? '-Seleccionar-'} loading={loadingAreas} onPress={() => openPicker('area')} /></LabeledField></View>
                <View style={styles.column}><LabeledField label="Sector *"><SelectBox value={draft.sectorName ?? '-Seleccionar-'} loading={loadingSectors} disabled={!draft.areaId} onPress={() => openPicker('sector')} /></LabeledField></View>
              </View>
              <LabeledField label="Fecha de inspección *"><FieldBox value={draft.inspectionDateSelected ? draft.inspectionDate : '-Seleccionar-'} variant="input" onPress={() => openPicker('date')} right={<FontAwesome5 name="calendar-alt" size={16} color={colors.primary} />} /></LabeledField>
              <View style={styles.locationHeader}><FieldLabel>Ubicación *</FieldLabel><TouchableOpacity style={styles.infoButton} activeOpacity={0.7}><FontAwesome5 name="info" size={13} color={colors.blueLink} /></TouchableOpacity></View>
              <TouchableOpacity style={[styles.locationButton, !draft.locationCaptured && styles.locationButtonPending]} activeOpacity={0.8} onPress={capture} disabled={capturing}>
                <FontAwesome5 name={draft.locationCaptured ? 'check-circle' : 'crosshairs'} size={14} color={colors.white} />
                <Text style={styles.locationButtonText}>{capturing ? 'Capturando ubicación...' : draft.locationCaptured ? 'Ubicación capturada' : 'Capturar ubicación'}</Text>
              </TouchableOpacity>
              {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
              <FieldBox value={draft.locationLabel} variant="input" />
              <LocationMapPreview latitude={draft.latitude} longitude={draft.longitude} accuracyLabel={draft.locationAccuracyLabel} onCoordinateChange={adjustLocation} />
              <View style={styles.hintRow}><FontAwesome5 name="hand-point-up" size={11} color={colors.blueLink} /><Text style={styles.hintText}>Toca el mapa para ajustar manualmente la ubicación del pin</Text></View>
            </FormCard>
          </ScrollView>
          <ManualFlowFooter secondaryLabel="Cancelar" onSecondary={cancel} onPrimary={next} primaryDisabled={!canContinue} />
          <SelectSheet visible={activePicker === 'area'} title="Seleccionar área" subtitle="Catálogo online/cache local" options={areaOptions} selectedId={draft.areaId} loading={loadingAreas} emptyText={catalogEmptyText} onClose={closePicker} onSelect={selectArea} />
          <SelectSheet visible={activePicker === 'sector'} title="Seleccionar sector" subtitle={draft.areaName ?? 'Selecciona un área primero'} options={sectorOptions} selectedId={draft.sectorId} loading={loadingSectors} emptyText={catalogEmptyText} onClose={closePicker} onSelect={selectSector} />
          <SelectSheet visible={activePicker === 'date'} title="Fecha de inspección" subtitle="Selecciona la fecha del registro" options={dateOptions} selectedId={draft.inspectionDateSelected ? draft.inspectionDate : null} onClose={closePicker} onSelect={selectDate} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navyDark },
  screen: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { flex: 1 },
  contentInner: { gap: 12, paddingHorizontal: 14, paddingTop: 14, paddingBottom: spacing.md },
  title: { fontSize: 18, lineHeight: 21.6, fontWeight: fontWeight.bold, color: colors.primary },
  subtitle: { marginTop: 4, fontSize: 12, lineHeight: 16.8, color: colors.muted },
  fieldGroup: { gap: 6 },
  twoColumns: { flexDirection: 'row', gap: 8 },
  column: { flex: 1 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoButton: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.blueLink, alignItems: 'center', justifyContent: 'center' },
  locationButton: { height: 48, borderRadius: 10, backgroundColor: '#3A9B3A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  locationButtonPending: { backgroundColor: colors.gold },
  locationButtonText: { fontSize: 13, fontWeight: fontWeight.bold, color: colors.white },
  errorText: { marginTop: -4, fontSize: 11, lineHeight: 15, color: '#BD3B5B' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hintText: { fontSize: 11, lineHeight: 14.3, color: colors.muted },
});