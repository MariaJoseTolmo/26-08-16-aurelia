import React from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import type { CompanyResponse, InspectionFindingSeverityResponse, UserResponse } from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { OfflineBanner } from '../../shared/components/form/ManualFormUi';
import { PhotoSourceSheet } from '../../shared/components/form/PhotoSourceSheet';
import { ManualFlowFooter, ManualFlowHeader } from '../../shared/components/form/ManualFlowScaffold';
import { ManualFormStepper, type SelectSheetOption } from './ManualSelectionUi';
import { fetchInspectionFindingSeveritiesLocalFirst, fetchInspectionFindingTypesLocalFirst } from '../../shared/services/api/inspection-finding-catalogs.api';
import { fetchResponsibleCompaniesLocalFirst, fetchResponsibleUsersLocalFirst } from '../../shared/services/api/inspection-responsibles.api';
import { type ManualFindingObservationDraft, useManualInspectionDraft } from './manualInspection.store';
import { useManualConnectivityStatus } from './useManualConnectivityStatus';
import { useManualInspectionFlowStore } from './manualInspectionFlow.store';
import { removeManualInspectionDraft } from './manualInspectionDrafts.storage';
import { usePersistManualInspectionDraft } from './hooks/usePersistManualInspectionDraft';

type CatalogStatus = { loading: boolean; error: string | null };

function assetName(uri: string) {
  const name = uri.split('/').pop();
  return name && name.includes('.') ? name : 'foto_obs1.jpg';
}

async function pickEvidenceFromGallery(onPick: (uri: string) => void) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== 'granted') {
    Alert.alert('Permiso requerido', 'Activa el permiso de galería para adjuntar imágenes.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: false, selectionLimit: 1 });
  if (!result.canceled && result.assets[0]?.uri) onPick(result.assets[0].uri);
}

async function pickEvidenceFromCamera(onPick: (uri: string) => void) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (permission.status !== 'granted') {
    Alert.alert('Permiso requerido', 'Activa el permiso de cámara para tomar fotografías.');
    return;
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: false });
  if (!result.canceled && result.assets[0]?.uri) onPick(result.assets[0].uri);
}

function selectedSeverity(observation: ManualFindingObservationDraft, severities: InspectionFindingSeverityResponse[]) {
  return severities.find((item) => item.id === observation.severityId || item.name === observation.severityLabel || item.name === observation.probability) ?? null;
}

function severitySlaLabel(severity: InspectionFindingSeverityResponse | null, observation?: ManualFindingObservationDraft) {
  return observation?.severityClosureTimeLabel || severity?.closureTimeLabel || '5 Días';
}

function pluralizeObservation(count: number) {
  return count === 1 ? '1 observación' : `${count} observaciones`;
}

function responsibleUserLabel(user: UserResponse) {
  const profile = user.position || user.roles?.[0]?.name || 'Sin perfil';
  return `${user.fullName} - ${profile}`;
}

function selectedUsersLabel(users: UserResponse[], selectedIds: string[]) {
  const selected = users.filter((user) => selectedIds.includes(user.id));
  if (selected.length === 0) return 'Seleccione al personal';
  if (selected.length === 1) return selected[0].fullName;
  return `${selected.length} personas seleccionadas`;
}

function ObservationCountBanner({ count }: { count: number }) {
  return <View style={styles.countBanner}><View style={styles.countIcon}><FontAwesome5 name="info" size={12} color="#4A90C4" /></View><Text style={styles.countText}>La inspección contiene: {pluralizeObservation(count)}</Text></View>;
}

function EmptyObservationsCard() {
  return <View style={styles.emptyCard}><View style={styles.infoIcon}><FontAwesome5 name="info" size={11} color="#4A90C4" /></View><View style={styles.emptyCopy}><Text style={styles.emptyTitle}>Sin observaciones aún</Text><Text style={styles.emptyText}>Agrega al menos una observación para continuar. Puedes agregar todas las que encontraste en esta visita.</Text></View></View>;
}

function AddObservationButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  return <TouchableOpacity activeOpacity={0.78} disabled={disabled} onPress={onPress} style={[styles.addButton, disabled && styles.addButtonDisabled]}><FontAwesome5 name="plus" size={15} color={disabled ? '#D1D1D1' : '#1E5A92'} /><Text style={[styles.addButtonText, disabled && styles.addButtonTextDisabled]}>Agregar observación</Text></TouchableOpacity>;
}

function CatalogModal({ visible, title, selectedId, options, loading, errorMessage, onClose, onSelect }: { visible: boolean; title: string; selectedId: string | null; options: SelectSheetOption[]; loading: boolean; errorMessage: string | null; onClose: () => void; onSelect: (option: SelectSheetOption) => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>{title}</Text><TouchableOpacity style={styles.modalClose} activeOpacity={0.7} onPress={onClose}><FontAwesome5 name="times" size={24} color="#131313" /></TouchableOpacity></View>
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {loading ? <View style={styles.modalEmpty}><Text style={styles.modalEmptyText}>Cargando opciones...</Text></View> : null}
            {!loading && errorMessage ? <View style={styles.modalEmpty}><Text style={styles.modalEmptyText}>{errorMessage}</Text></View> : null}
            {!loading && !errorMessage && options.length === 0 ? <View style={styles.modalEmpty}><Text style={styles.modalEmptyText}>No hay opciones disponibles. Sincroniza catálogos.</Text></View> : null}
            {!loading && !errorMessage && options.map((option) => <TouchableOpacity key={option.id} style={[styles.modalOption, option.id === selectedId && styles.modalOptionSelected]} activeOpacity={0.72} onPress={() => onSelect(option)}><Text style={[styles.modalOptionText, option.description ? styles.modalOptionTextStrong : null]}>{option.label}</Text>{option.description ? <Text style={styles.modalOptionDescription}>{option.description}</Text> : null}</TouchableOpacity>)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CompanyPickerModal({ visible, companies, loading, errorMessage, selectedId, onClose, onSelect }: { visible: boolean; companies: CompanyResponse[]; loading: boolean; errorMessage: string | null; selectedId: string | null; onClose: () => void; onSelect: (company: CompanyResponse) => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <TouchableOpacity style={styles.modalBackdropLight} activeOpacity={1} onPress={onClose} />
        <View style={styles.responsibleSheet}>
          <View style={styles.responsibleHandle} />
          <Text style={styles.responsibleSheetTitle}>Seleccione la empresa encargada</Text>
          <ScrollView style={styles.responsibleList} showsVerticalScrollIndicator={false}>
            {loading ? <Text style={styles.responsibleEmpty}>Cargando empresas...</Text> : null}
            {!loading && errorMessage ? <Text style={styles.responsibleEmpty}>{errorMessage}</Text> : null}
            {!loading && !errorMessage && companies.map((company) => <TouchableOpacity key={company.id} style={[styles.companyOption, company.id === selectedId && styles.companyOptionSelected]} activeOpacity={0.72} onPress={() => onSelect(company)}><Text style={styles.companyOptionText}>{company.name}</Text></TouchableOpacity>)}
          </ScrollView>
          <View style={styles.responsibleSheetFooter}><TouchableOpacity style={styles.responsibleCancel} activeOpacity={0.75} onPress={onClose}><Text style={styles.responsibleCancelText}>Cancelar</Text></TouchableOpacity></View>
        </View>
      </View>
    </Modal>
  );
}

function UsersPickerModal({ visible, users, loading, errorMessage, selectedIds, companySelected, onClose, onToggle }: { visible: boolean; users: UserResponse[]; loading: boolean; errorMessage: string | null; selectedIds: string[]; companySelected: boolean; onClose: () => void; onToggle: (userId: string) => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <TouchableOpacity style={styles.modalBackdropLight} activeOpacity={1} onPress={onClose} />
        <View style={styles.responsibleSheet}>
          <View style={styles.responsibleHandle} />
          <Text style={styles.responsibleSheetTitle}>Seleccione al personal encargado</Text>
          <ScrollView style={styles.responsibleList} showsVerticalScrollIndicator={false}>
            {!companySelected ? <Text style={styles.responsibleEmpty}>Seleccione una empresa para cargar el personal.</Text> : null}
            {companySelected && loading ? <Text style={styles.responsibleEmpty}>Cargando personal...</Text> : null}
            {companySelected && !loading && errorMessage ? <Text style={styles.responsibleEmpty}>{errorMessage}</Text> : null}
            {companySelected && !loading && !errorMessage && users.length === 0 ? <Text style={styles.responsibleEmpty}>No hay personal asociado a la empresa seleccionada.</Text> : null}
            {companySelected && !loading && !errorMessage && users.map((user) => {
              const checked = selectedIds.includes(user.id);
              return <TouchableOpacity key={user.id} style={styles.userOption} activeOpacity={0.72} onPress={() => onToggle(user.id)}><View style={[styles.checkbox, checked && styles.checkboxChecked]}>{checked ? <FontAwesome5 name="check" size={11} color={colors.white} /> : null}</View><Text style={styles.userOptionText}>{responsibleUserLabel(user)}</Text></TouchableOpacity>;
            })}
          </ScrollView>
          <View style={styles.responsibleSheetFooter}><TouchableOpacity style={styles.responsibleCancel} activeOpacity={0.75} onPress={onClose}><Text style={styles.responsibleCancelText}>Cancelar</Text></TouchableOpacity></View>
        </View>
      </View>
    </Modal>
  );
}

function CancelInspectionModal({ visible, onClose, onConfirm }: { visible: boolean; onClose: () => void; onConfirm: () => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.cancelModalRoot}><View style={styles.cancelModalBackdrop} /><View style={styles.cancelModalCard}><View style={styles.cancelModalTopRow}><View style={styles.cancelModalInfoIcon}><FontAwesome5 name="info" size={18} color="#1E5A92" /></View><TouchableOpacity style={styles.cancelModalClose} activeOpacity={0.7} onPress={onClose}><FontAwesome5 name="times" size={24} color="#111111" /></TouchableOpacity></View><Text style={styles.cancelModalTitle}>Cancelar</Text><Text style={styles.cancelModalBody}>Usted está dando por cancelada esta inspección. Al hacer esto se borrarán todos los datos ingresados y la inspección desaparecerá.{`\n`}¿Estás de acuerdo?</Text><TouchableOpacity style={styles.cancelModalPrimary} activeOpacity={0.82} onPress={onConfirm}><Text style={styles.cancelModalPrimaryText}>Cancelar inspección</Text></TouchableOpacity><TouchableOpacity style={styles.cancelModalSecondary} activeOpacity={0.75} onPress={onClose}><Text style={styles.cancelModalSecondaryText}>Volver al formulario</Text></TouchableOpacity></View></View></Modal>;
}

function PhotoSourceModal({ visible, onClose, onCamera, onGallery }: { visible: boolean; onClose: () => void; onCamera: () => void; onGallery: () => void }) {
  return <PhotoSourceSheet visible={visible} onClose={onClose} onCamera={onCamera} onGallery={onGallery} />;
}

function ObservationForm({ index, observation, severities, severityStatus, onUpdate, onCancelInspection }: { index: number; observation: ManualFindingObservationDraft; severities: InspectionFindingSeverityResponse[]; severityStatus: CatalogStatus; onUpdate: (patch: Partial<Omit<ManualFindingObservationDraft, 'id'>>) => void; onCancelInspection: () => void }) {
  const [severityPickerOpen, setSeverityPickerOpen] = React.useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = React.useState(false);
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const severity = selectedSeverity(observation, severities);
  const slaLabel = severitySlaLabel(severity, observation);
  const complete = Boolean(observation.detectedCondition.trim() && observation.correctiveAction.trim() && observation.evidence && severity);
  const severityOptions = severities.map((item) => ({ id: item.id, label: item.name, description: item.description }));

  function setEvidence(uri: string) { onUpdate({ evidence: { uri, name: assetName(uri) } }); }
  async function handleCamera() { setPhotoPickerOpen(false); await pickEvidenceFromCamera(setEvidence); }
  async function handleGallery() { setPhotoPickerOpen(false); await pickEvidenceFromGallery(setEvidence); }
  function confirmCancelInspection() { setCancelModalOpen(false); onCancelInspection(); }

  return <View style={styles.observationCard}><View style={styles.observationHeader}><FontAwesome5 name="plus-circle" size={12} color="#9B7440" /><Text style={styles.observationTitle}>NUEVA OBSERVACIÓN {index + 1}</Text></View><Text style={styles.fieldLabel}>Condición detectada *</Text><TextInput multiline value={observation.detectedCondition} onChangeText={(value) => onUpdate({ detectedCondition: value })} placeholder="Describe la condición subestándar, su ubicación exacta y la norma que incumple..." placeholderTextColor="#8A8A8A" style={styles.textArea} textAlignVertical="top" /><Text style={styles.fieldLabel}>Fotografía "Antes" *</Text><TouchableOpacity activeOpacity={0.75} onPress={() => setPhotoPickerOpen(true)} style={[styles.photoBox, observation.evidence && styles.photoBoxDone]}>{observation.evidence ? <View style={styles.photoIconDone}><FontAwesome5 name="camera" size={15} color={colors.white} /></View> : <Text style={styles.photoEmoji}>📷</Text>}<View style={styles.photoCopy}><Text style={[styles.photoTitle, observation.evidence && styles.photoTitleDone]}>{observation.evidence?.name ?? 'Tomar foto o galería'}</Text>{!observation.evidence ? <Text style={styles.photoSub}>Fecha, hora y GPS automáticos</Text> : null}</View></TouchableOpacity><Text style={styles.fieldLabel}>Medidas correctivas propuestas</Text><TextInput multiline value={observation.correctiveAction} onChangeText={(value) => onUpdate({ correctiveAction: value })} placeholder="Qué debe hacer la EECC para corregir esta condición..." placeholderTextColor="#8A8A8A" style={styles.textAreaSmall} textAlignVertical="top" /><Text style={styles.criticalityTitle}>Seleccione la criticidad</Text><Text style={styles.criticalitySubtitle}>Califica el riesgo global de esta visita · aplica a las observaciones registradas</Text><TouchableOpacity style={styles.criticalitySelect} activeOpacity={0.75} onPress={() => setSeverityPickerOpen(true)}><Text style={[styles.criticalityValue, !severity && styles.criticalityPlaceholder]}>{severity?.name ?? 'Seleccione'}</Text><FontAwesome5 name="caret-down" size={16} color={colors.primary} /></TouchableOpacity>{severity ? <View style={styles.slaHighlightBox}><View><Text style={styles.slaLabel}>SLA CALCULADO</Text><Text style={styles.slaValue}>{slaLabel}</Text></View><TouchableOpacity style={styles.slaButton} activeOpacity={0.75}><Text style={styles.slaButtonText}>Reasignar SLA</Text></TouchableOpacity></View> : null}<View style={styles.formActions}><TouchableOpacity style={styles.cancelBtn} activeOpacity={0.75} onPress={() => setCancelModalOpen(true)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity disabled={!complete} style={[styles.saveObservationBtn, !complete && styles.saveObservationBtnDisabled]} activeOpacity={0.75} onPress={() => onUpdate({ saved: true })}><Text style={styles.saveObservationText}>✓ Guardar observación</Text></TouchableOpacity></View><CatalogModal visible={severityPickerOpen} title="Criticidad" selectedId={severity?.id ?? null} options={severityOptions} loading={severityStatus.loading} errorMessage={severityStatus.error} onClose={() => setSeverityPickerOpen(false)} onSelect={(option) => { const found = severities.find((item) => item.id === option.id); onUpdate({ severityId: found?.id ?? option.id, severityLabel: option.label, severityDescription: found?.description ?? null, severityClosureTimeLabel: found?.closureTimeLabel ?? '5 Días', probability: option.label, consequence: found?.description ?? null }); setSeverityPickerOpen(false); }} /><PhotoSourceModal visible={photoPickerOpen} onClose={() => setPhotoPickerOpen(false)} onCamera={handleCamera} onGallery={handleGallery} /><CancelInspectionModal visible={cancelModalOpen} onClose={() => setCancelModalOpen(false)} onConfirm={confirmCancelInspection} /></View>;
}

function SavedObservationCard({ observation, index, severity, onDelete }: { observation: ManualFindingObservationDraft; index: number; severity: InspectionFindingSeverityResponse | null; onDelete: () => void }) {
  const severityLabel = observation.severityLabel ?? severity?.name ?? observation.probability ?? 'Sin criticidad';
  const slaLabel = severitySlaLabel(severity, observation);
  return <View style={styles.savedCard}><View style={styles.savedTopRow}><View style={styles.savedBadges}><View style={styles.obsBadge}><Text style={styles.obsBadgeText}>Obs. {index + 1}</Text></View><View style={styles.severityBadge}><Text style={styles.severityBadgeText}>{severityLabel}</Text></View></View><TouchableOpacity style={styles.deleteButton} activeOpacity={0.78} onPress={onDelete}><FontAwesome5 name="trash" size={14} color="#7A0E23" /></TouchableOpacity></View><View style={styles.savedFieldBox}><Text style={styles.savedFieldLabel}>CONDICIÓN DETECTADA</Text><Text style={styles.savedFieldText}>{observation.detectedCondition || 'Sin descripción'}</Text></View><View style={styles.savedMeasureBox}><Text style={styles.savedFieldLabel}>MEDIDA CORRECTIVA PROPUESTA</Text><Text style={styles.savedFieldText}>{observation.correctiveAction || 'Sin medida correctiva'}</Text></View><View style={styles.savedDivider} />{observation.evidence ? <View style={styles.savedEvidence}><View style={styles.savedEvidenceIcon}><FontAwesome5 name="camera" size={16} color={colors.white} /></View><Text style={styles.savedEvidenceText}>{observation.evidence.name}</Text></View> : null}<View style={styles.savedBottomRow}><Text style={styles.savedSlaLabel}>SLA calculado</Text><Text style={styles.savedSlaValue}>{slaLabel}</Text></View></View>;
}

function ResponsiblesCard({ companyName, personnelLabel, personnelDisabled, onOpenCompany, onOpenUsers }: { companyName: string | null; personnelLabel: string; personnelDisabled: boolean; onOpenCompany: () => void; onOpenUsers: () => void }) {
  return <View style={styles.responsiblesCard}><Text style={styles.responsiblesTitle}>Responsables</Text><Text style={styles.responsiblesLabel}>Empresa encargada de los hallazgos</Text><TouchableOpacity style={styles.responsibleSelect} activeOpacity={0.75} onPress={onOpenCompany}><Text style={styles.responsibleSelectText}>{companyName ?? 'Seleccione empresa'}</Text><FontAwesome5 name="caret-down" size={16} color={colors.primary} /></TouchableOpacity><Text style={styles.responsiblesLabel}>Personal encargado de los hallazgos</Text><TouchableOpacity style={[styles.responsibleSelect, personnelDisabled && styles.responsibleSelectDisabled]} activeOpacity={0.75} onPress={onOpenUsers}><Text style={[styles.responsibleSelectText, personnelDisabled && styles.responsibleSelectTextDisabled]}>{personnelLabel}</Text><FontAwesome5 name="caret-down" size={16} color={personnelDisabled ? '#B7B7B7' : colors.primary} /></TouchableOpacity></View>;
}

export function ManualFindingObservationsSeverityScreen() {
  usePersistManualInspectionDraft();
  const { online, hasSession } = useManualConnectivityStatus();
  const draft = useManualInspectionDraft();
  const setFindingType = useManualInspectionDraft((state) => state.setFindingType);
  const addFindingObservation = useManualInspectionDraft((state) => state.addFindingObservation);
  const updateFindingObservation = useManualInspectionDraft((state) => state.updateFindingObservation);
  const removeFindingObservation = useManualInspectionDraft((state) => state.removeFindingObservation);
  const setFindingCompany = useManualInspectionDraft((state) => state.setFindingCompany);
  const setFindingResponsibles = useManualInspectionDraft((state) => state.setFindingResponsibles);
  const resetDraft = useManualInspectionDraft((state) => state.reset);
  const activePicker = useManualInspectionFlowStore((state) => state.activePicker);
  const openPicker = useManualInspectionFlowStore((state) => state.openPicker);
  const closePicker = useManualInspectionFlowStore((state) => state.closePicker);
  const goToType = useManualInspectionFlowStore((state) => state.goToType);
  const goToObservations = useManualInspectionFlowStore((state) => state.goToObservations);
  const resetFlow = useManualInspectionFlowStore((state) => state.resetFlow);
  const [findingTypeOptions, setFindingTypeOptions] = React.useState<SelectSheetOption[]>([]);
  const [findingTypeStatus, setFindingTypeStatus] = React.useState<CatalogStatus>({ loading: true, error: null });
  const [severityOptions, setSeverityOptions] = React.useState<InspectionFindingSeverityResponse[]>([]);
  const [severityStatus, setSeverityStatus] = React.useState<CatalogStatus>({ loading: true, error: null });
  const [companyOptions, setCompanyOptions] = React.useState<CompanyResponse[]>([]);
  const [companyStatus, setCompanyStatus] = React.useState<CatalogStatus>({ loading: true, error: null });
  const [userOptions, setUserOptions] = React.useState<UserResponse[]>([]);
  const [userStatus, setUserStatus] = React.useState<CatalogStatus>({ loading: false, error: null });
  const [companyPickerOpen, setCompanyPickerOpen] = React.useState(false);
  const [usersPickerOpen, setUsersPickerOpen] = React.useState(false);
  const savedObservations = draft.findingObservations.filter((observation) => observation.saved);
  const activeObservation = draft.findingObservations.find((observation) => !observation.saved) ?? null;
  const hasSavedObservations = savedObservations.length > 0;
  const showInitialSelector = !hasSavedObservations && !activeObservation;
  const personnelLabel = selectedUsersLabel(userOptions, draft.findingResponsibleIds);
  const primaryDisabled = !hasSavedObservations || Boolean(activeObservation) || !draft.findingCompanyId || draft.findingResponsibleIds.length === 0;

  React.useEffect(() => { goToObservations(); }, [goToObservations]);

  React.useEffect(() => {
    let mounted = true;
    fetchInspectionFindingTypesLocalFirst().then((items) => { if (!mounted) return; setFindingTypeOptions(items.map((item) => ({ id: item.id, label: item.name }))); setFindingTypeStatus({ loading: false, error: null }); }).catch(() => { if (!mounted) return; setFindingTypeOptions([]); setFindingTypeStatus({ loading: false, error: 'No se pudieron cargar los tipos de hallazgo desde catálogos.' }); });
    fetchInspectionFindingSeveritiesLocalFirst().then((items) => { if (!mounted) return; setSeverityOptions(items); setSeverityStatus({ loading: false, error: null }); }).catch(() => { if (!mounted) return; setSeverityOptions([]); setSeverityStatus({ loading: false, error: 'No se pudo cargar la criticidad desde catálogos.' }); });
    fetchResponsibleCompaniesLocalFirst().then((items) => { if (!mounted) return; setCompanyOptions(items); setCompanyStatus({ loading: false, error: null }); }).catch(() => { if (!mounted) return; setCompanyOptions([]); setCompanyStatus({ loading: false, error: 'No se pudieron cargar las empresas desde catálogos.' }); });
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    if (!draft.findingCompanyId) { setUserOptions([]); setUserStatus({ loading: false, error: null }); return () => { mounted = false; }; }
    setUserStatus({ loading: true, error: null });
    fetchResponsibleUsersLocalFirst(draft.findingCompanyId).then((items) => { if (!mounted) return; setUserOptions(items); setUserStatus({ loading: false, error: null }); }).catch(() => { if (!mounted) return; setUserOptions([]); setUserStatus({ loading: false, error: 'No se pudo cargar el personal asociado.' }); });
    return () => { mounted = false; };
  }, [draft.findingCompanyId]);

  function back() { closePicker(); goToType(); router.replace('/inspection/manual/type'); }
  function selectFindingType(option: SelectSheetOption) { setFindingType(option.id, option.label); closePicker(); }
  function addObservation() { if (!draft.findingTypeId || activeObservation) return; addFindingObservation(); }
  function cancelInspection() {
    closePicker();
    if (draft.draftId) void removeManualInspectionDraft(draft.draftId);
    resetDraft();
    resetFlow();
    router.replace('/inspection/start');
  }
  function selectCompany(company: CompanyResponse) { setFindingCompany(company.id, company.name); setCompanyPickerOpen(false); }
  function toggleUser(userId: string) { const next = draft.findingResponsibleIds.includes(userId) ? draft.findingResponsibleIds.filter((id) => id !== userId) : [...draft.findingResponsibleIds, userId]; setFindingResponsibles(next); }
  function openUsers() { if (!draft.findingCompanyId) return; setUsersPickerOpen(true); }

  return <SafeAreaProvider><SafeAreaView style={styles.safe} edges={['top', 'bottom']}><View style={styles.screen}><ManualFlowHeader title="Observaciones" subtitle="Paso 3 de 5" badge="GF HSE" onBack={back} /><OfflineBanner online={online} hasSession={hasSession} /><ManualFormStepper activeStep={3} steps={['Datos', 'Tipo', 'Obs.', 'Resumen']} /><ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>{showInitialSelector ? <View style={styles.copyBlock}><Text style={styles.title}>Tipo de hallazgo</Text><Text style={styles.subtitle}>Seleccione el tipo de hallazgo antes de continuar con las observaciones para esta inspección.</Text></View> : null}{showInitialSelector ? <TouchableOpacity style={styles.selectBox} activeOpacity={0.75} onPress={() => openPicker('findingType')}><Text style={[styles.selectText, !draft.findingTypeLabel && styles.selectPlaceholder]}>{draft.findingTypeLabel ?? 'Seleccione'}</Text><FontAwesome5 name="caret-down" size={16} color={colors.primary} /></TouchableOpacity> : null}<View style={styles.copyBlock}><Text style={styles.title}>Observaciones</Text><Text style={styles.subtitle}>Registra cada condición detectada en esta visita · una a una</Text></View>{!hasSavedObservations && !activeObservation ? <EmptyObservationsCard /> : null}{hasSavedObservations ? <ObservationCountBanner count={savedObservations.length} /> : null}{savedObservations.map((observation, index) => <SavedObservationCard key={observation.id} observation={observation} index={index} severity={selectedSeverity(observation, severityOptions)} onDelete={() => removeFindingObservation(observation.id)} />)}{activeObservation ? <ObservationForm index={savedObservations.length} observation={activeObservation} severities={severityOptions} severityStatus={severityStatus} onUpdate={(patch) => updateFindingObservation(activeObservation.id, patch)} onCancelInspection={cancelInspection} /> : <AddObservationButton disabled={!draft.findingTypeId} onPress={addObservation} />}{hasSavedObservations ? <ResponsiblesCard companyName={draft.findingCompanyName} personnelLabel={personnelLabel} personnelDisabled={!draft.findingCompanyId} onOpenCompany={() => setCompanyPickerOpen(true)} onOpenUsers={openUsers} /> : null}</ScrollView><ManualFlowFooter secondaryLabel="Atrás" secondaryIcon="arrow-left" onSecondary={back} onPrimary={() => undefined} primaryDisabled={primaryDisabled} /><CatalogModal visible={activePicker === 'findingType'} title="Tipo de hallazgo" selectedId={draft.findingTypeId} options={findingTypeOptions} loading={findingTypeStatus.loading} errorMessage={findingTypeStatus.error} onClose={closePicker} onSelect={selectFindingType} /><CompanyPickerModal visible={companyPickerOpen} companies={companyOptions} loading={companyStatus.loading} errorMessage={companyStatus.error} selectedId={draft.findingCompanyId} onClose={() => setCompanyPickerOpen(false)} onSelect={selectCompany} /><UsersPickerModal visible={usersPickerOpen} users={userOptions} loading={userStatus.loading} errorMessage={userStatus.error} selectedIds={draft.findingResponsibleIds} companySelected={Boolean(draft.findingCompanyId)} onClose={() => setUsersPickerOpen(false)} onToggle={toggleUser} /></View></SafeAreaView></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navyDark },
  screen: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { flex: 1 },
  contentInner: { gap: 12, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24 },
  copyBlock: { gap: 4 },
  title: { fontSize: 18, lineHeight: 21.6, fontWeight: fontWeight.bold, color: colors.primary },
  subtitle: { fontSize: 12, lineHeight: 16.8, color: colors.muted },
  selectBox: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: '#D1D1D1', backgroundColor: '#F6FAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  selectText: { flex: 1, fontSize: 14, lineHeight: 18, fontWeight: fontWeight.medium, color: colors.primary },
  selectPlaceholder: { color: colors.primary },
  countBanner: { minHeight: 58, borderRadius: 12, backgroundColor: '#4A90C4', flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20 },
  countIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  countText: { flex: 1, color: colors.white, fontSize: 14, lineHeight: 18, fontWeight: fontWeight.bold },
  emptyCard: { minHeight: 90, borderRadius: 12, backgroundColor: '#4A90C4', flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingLeft: 14, paddingRight: 12, paddingVertical: 12 },
  infoIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  emptyCopy: { flex: 1, gap: 2 },
  emptyTitle: { fontSize: 13, lineHeight: 16.9, fontWeight: fontWeight.bold, color: colors.white },
  emptyText: { fontSize: 11, lineHeight: 15.4, color: 'rgba(255,255,255,0.88)' },
  addButton: { height: 58, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D1D1', backgroundColor: '#F6FAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  addButtonDisabled: { opacity: 1 },
  addButtonText: { fontSize: 16, fontWeight: fontWeight.bold, color: '#1E5A92' },
  addButtonTextDisabled: { color: '#D1D1D1' },
  observationCard: { borderWidth: 1.5, borderColor: colors.gold, borderRadius: 12, backgroundColor: colors.white, padding: 12, gap: 8 },
  observationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  observationTitle: { color: '#9B7440', fontSize: 12, lineHeight: 16, fontWeight: fontWeight.bold, letterSpacing: 0.3 },
  fieldLabel: { color: colors.primary, fontSize: 13, lineHeight: 17, fontWeight: fontWeight.bold },
  textArea: { minHeight: 78, borderWidth: 1.5, borderColor: '#D1D1D1', borderRadius: 10, backgroundColor: '#F6FAFF', paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, lineHeight: 18, color: colors.primary },
  textAreaSmall: { minHeight: 76, borderWidth: 1.5, borderColor: '#D1D1D1', borderRadius: 10, backgroundColor: '#F6FAFF', paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, lineHeight: 18, color: colors.primary },
  photoBox: { minHeight: 90, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D1D1D1', borderRadius: 10, backgroundColor: '#F6FAFF', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 4 },
  photoBoxDone: { minHeight: 58, borderWidth: 0, borderStyle: 'solid', backgroundColor: '#35A137', flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 14 },
  photoEmoji: { fontSize: 22 },
  photoCopy: { alignItems: 'center' },
  photoIconDone: { width: 42, height: 42, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  photoTitle: { color: colors.muted, fontSize: 13, fontWeight: fontWeight.bold, textAlign: 'center' },
  photoTitleDone: { color: colors.white, textAlign: 'left' },
  photoSub: { color: '#B7B7B7', fontSize: 11, marginTop: 3 },
  criticalityTitle: { color: colors.primary, fontSize: 18, lineHeight: 22, fontWeight: fontWeight.bold, marginTop: 4 },
  criticalitySubtitle: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  criticalitySelect: { minHeight: 48, borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D1D1', backgroundColor: '#F6FAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, gap: 8 },
  criticalityValue: { flex: 1, color: colors.primary, fontSize: 15, lineHeight: 18, fontWeight: fontWeight.medium },
  criticalityPlaceholder: { color: colors.muted },
  slaHighlightBox: { borderWidth: 1.5, borderColor: '#F29A5B', borderRadius: 10, backgroundColor: '#FFDCC4', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 12 },
  slaLabel: { color: '#5E3B24', fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold, letterSpacing: 0.7 },
  slaValue: { color: '#5E3B24', fontSize: 22, lineHeight: 25, fontWeight: fontWeight.bold },
  slaButton: { borderWidth: 1.5, borderColor: '#D1D1D1', borderRadius: 10, backgroundColor: colors.white, minHeight: 45, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  slaButtonText: { color: colors.primary, fontSize: 13, fontWeight: fontWeight.bold },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, height: 44, borderWidth: 1.5, borderColor: colors.gold, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  cancelText: { color: colors.goldDark, fontSize: 13, fontWeight: fontWeight.bold },
  saveObservationBtn: { flex: 1.35, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
  saveObservationBtnDisabled: { backgroundColor: '#D1D1D1' },
  saveObservationText: { color: colors.white, fontSize: 13, fontWeight: fontWeight.bold },
  savedCard: { borderWidth: 1, borderColor: '#E1E1E1', borderRadius: 12, backgroundColor: colors.white, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 16, gap: 10, shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  savedTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  savedBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  obsBadge: { borderRadius: 8, backgroundColor: '#DDF0FF', paddingHorizontal: 10, paddingVertical: 5 },
  obsBadgeText: { color: '#1E5A92', fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  severityBadge: { borderRadius: 8, backgroundColor: '#FFE2CF', paddingHorizontal: 10, paddingVertical: 5 },
  severityBadgeText: { color: '#5E3B24', fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  deleteButton: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#FFD4E0', alignItems: 'center', justifyContent: 'center' },
  savedFieldBox: { borderWidth: 1, borderColor: '#E1E1E1', borderRadius: 8, padding: 12, gap: 6 },
  savedMeasureBox: { borderRadius: 8, backgroundColor: '#F4F4F4', padding: 12, gap: 6 },
  savedFieldLabel: { color: colors.muted, fontSize: 10, lineHeight: 13, letterSpacing: 2, fontWeight: fontWeight.bold },
  savedFieldText: { color: colors.primary, fontSize: 13, lineHeight: 18 },
  savedDivider: { height: 2, backgroundColor: colors.gold, opacity: 0.8 },
  savedEvidence: { minHeight: 72, borderRadius: 8, backgroundColor: '#35A137', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 },
  savedEvidenceIcon: { width: 46, height: 46, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' },
  savedEvidenceText: { color: colors.white, fontSize: 14, fontWeight: fontWeight.bold },
  savedBottomRow: { borderTopWidth: 1, borderTopColor: '#E1E1E1', paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  savedSlaLabel: { color: colors.muted, fontSize: 14 },
  savedSlaValue: { color: colors.primary, fontSize: 14, fontWeight: fontWeight.bold },
  responsiblesCard: { borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: '#E1E1E1', padding: 14, gap: 10, shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  responsiblesTitle: { color: colors.primary, fontSize: 20, lineHeight: 24, fontWeight: fontWeight.bold, marginBottom: 4 },
  responsiblesLabel: { color: colors.primary, fontSize: 13, lineHeight: 17, fontWeight: fontWeight.bold },
  responsibleSelect: { minHeight: 58, borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D1D1', backgroundColor: '#F6FAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, gap: 12 },
  responsibleSelectDisabled: { opacity: 0.7 },
  responsibleSelectText: { flex: 1, color: colors.primary, fontSize: 16, lineHeight: 20, fontWeight: fontWeight.medium },
  responsibleSelectTextDisabled: { color: colors.muted },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.68)' },
  modalBackdropLight: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.32)' },
  modalPanel: { maxHeight: '78%', minHeight: 540, backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  modalHeader: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 22, paddingRight: 22, paddingTop: 8 },
  modalTitle: { flex: 1, fontSize: 18, lineHeight: 22, fontWeight: fontWeight.bold, color: colors.primary },
  modalClose: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  modalList: { flex: 1 },
  modalOption: { minHeight: 88, justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingHorizontal: 22, paddingVertical: 14 },
  modalOptionSelected: { backgroundColor: '#FAFAFA' },
  modalOptionText: { fontSize: 16, lineHeight: 24, color: colors.primary, fontWeight: fontWeight.regular },
  modalOptionTextStrong: { fontWeight: fontWeight.bold },
  modalOptionDescription: { color: colors.primary, fontSize: 15, lineHeight: 22, marginTop: 12 },
  modalEmpty: { minHeight: 120, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  modalEmptyText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  responsibleSheet: { maxHeight: '86%', backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', shadowColor: '#131313', shadowOpacity: 0.24, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  responsibleHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D1D1', marginTop: 22, marginBottom: 22 },
  responsibleSheetTitle: { color: colors.primary, fontSize: 14, lineHeight: 18, fontWeight: fontWeight.bold, paddingHorizontal: 22, paddingBottom: 14 },
  responsibleList: { paddingHorizontal: 8, paddingVertical: 8 },
  responsibleEmpty: { color: colors.muted, fontSize: 14, lineHeight: 20, paddingHorizontal: 14, paddingVertical: 16 },
  companyOption: { height: 40, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 8 },
  companyOptionSelected: { backgroundColor: '#F6FAFF' },
  companyOptionText: { color: colors.primary, fontSize: 14, lineHeight: 22.7, letterSpacing: 0.28 },
  userOption: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: colors.gold, backgroundColor: colors.gold },
  userOptionText: { flex: 1, color: colors.primary, fontSize: 14, lineHeight: 22.7, letterSpacing: 0.28 },
  responsibleSheetFooter: { borderTopWidth: 1, borderTopColor: '#E3E3E3', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 14 },
  responsibleCancel: { height: 44, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  responsibleCancelText: { color: colors.goldDark, fontSize: 13, fontWeight: fontWeight.bold },
  photoSourcePanel: { backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 30 },
  photoSourceHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#D1D1D1', marginBottom: 28 },
  photoSourceHeading: { color: colors.primary, fontSize: 22, lineHeight: 26, fontWeight: fontWeight.bold, marginBottom: 14 },
  photoSourceDescription: { color: colors.muted, fontSize: 16, lineHeight: 22, marginBottom: 22 },
  photoSourceCard: { minHeight: 82, borderWidth: 1.5, borderColor: '#E1E1E1', borderRadius: 12, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  photoSourceIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center' },
  photoSourceTextBox: { flex: 1, gap: 3 },
  photoSourceTitle: { color: colors.primary, fontSize: 18, lineHeight: 22, fontWeight: fontWeight.bold },
  photoSourceSub: { color: colors.muted, fontSize: 14, lineHeight: 18 },
  photoSourceCancel: { minHeight: 54, borderWidth: 1.5, borderColor: colors.gold, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  photoSourceCancelText: { color: colors.goldDark, fontSize: 17, lineHeight: 22, fontWeight: fontWeight.bold },
  cancelModalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  cancelModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.68)' },
  cancelModalCard: { width: '100%', maxWidth: 330, borderRadius: 18, backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 26 },
  cancelModalTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 },
  cancelModalInfoIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: '#1E5A92', alignItems: 'center', justifyContent: 'center' },
  cancelModalClose: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  cancelModalTitle: { color: colors.primary, fontSize: 24, lineHeight: 30, fontWeight: fontWeight.bold, marginBottom: 12 },
  cancelModalBody: { color: colors.primary, fontSize: 18, lineHeight: 28, marginBottom: 34 },
  cancelModalPrimary: { minHeight: 58, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  cancelModalPrimaryText: { color: colors.white, fontSize: 17, lineHeight: 22, fontWeight: fontWeight.bold },
  cancelModalSecondary: { minHeight: 58, borderWidth: 1.5, borderColor: colors.gold, borderRadius: 9, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  cancelModalSecondaryText: { color: colors.goldDark, fontSize: 17, lineHeight: 22, fontWeight: fontWeight.bold },
});
