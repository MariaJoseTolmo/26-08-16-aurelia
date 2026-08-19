import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { InspectionAnswerValue, type InspectionChecklistItem, type InspectionChecklistTemplateResponse, type UserResponse } from '@aurelia/contracts';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { FieldLabel, OfflineBanner, SelectBox } from '../../shared/components/form/ManualFormUi';
import { PhotoSourceSheet } from '../../shared/components/form/PhotoSourceSheet';
import { ManualFlowFooter, ManualFlowHeader } from '../../shared/components/form/ManualFlowScaffold';
import { MISSING_MOBILE_BOOTSTRAP_MESSAGE } from '../../shared/offline/local-catalogs';
import { ManualFormStepper, SelectSheet, type SelectSheetOption } from './ManualSelectionUi';
import { useInspectionChecklistTemplates } from './hooks/useInspectionChecklistTemplates';
import { useManualInspectionCompanies } from './hooks/useManualInspectionCompanies';
import { usePersistManualInspectionDraft } from './hooks/usePersistManualInspectionDraft';
import { fetchResponsibleUsersLocalFirst } from '../../shared/services/api/inspection-responsibles.api';
import { useManualConnectivityStatus } from './useManualConnectivityStatus';
import { useManualInspectionDraft, type ManualChecklistItemDetail, type ManualPickedAsset } from './manualInspection.store';
import { useManualInspectionFlowStore } from './manualInspectionFlow.store';

type ChecklistItemRow = InspectionChecklistItem & { sectionTitle: string };
type PickerKind = 'template' | 'company';

const answerOptions = [
  { label: 'SÍ', value: InspectionAnswerValue.COMPLIANT },
  { label: 'NO', value: InspectionAnswerValue.NOT_COMPLIANT },
  { label: 'N/A', value: InspectionAnswerValue.NOT_APPLICABLE },
];

function getItemsCount(template: InspectionChecklistTemplateResponse): number {
  return template.sections.reduce((total, section) => total + section.items.length, 0);
}

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

function templateToOption(template: InspectionChecklistTemplateResponse): SelectSheetOption {
  return { id: template.id, label: template.name, description: `${template.code} · ${getItemsCount(template)} ítems` };
}

function getTemplateHeaderTitle(template: InspectionChecklistTemplateResponse): string {
  return template.name.replace(/^Almacenamiento de\s+/i, '').replace(/\s*-\s*/g, ' – ').trim() || template.name;
}

function getAssetName(asset: ImagePicker.ImagePickerAsset, fallback: string): string {
  if (asset.fileName) return asset.fileName;
  const uriName = asset.uri.split('/').pop();
  return uriName && uriName.includes('.') ? uriName : fallback;
}

async function pickImageFromGallery(fallbackName: string): Promise<ManualPickedAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permiso requerido', 'Activa el permiso de galería para adjuntar imágenes.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.75 });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: getAssetName(asset, fallbackName) };
}

async function pickImageFromCamera(fallbackName: string): Promise<ManualPickedAsset | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permiso requerido', 'Activa el permiso de cámara para tomar fotografías.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.75 });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: getAssetName(asset, fallbackName) };
}

function TemplateMeta({ code, itemsCount }: { code: string | null; itemsCount: number | null }) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaItem}><FontAwesome5 name="hashtag" size={13} color={colors.muted} /><Text style={styles.metaText}>{code ?? 'Sin código'}</Text></View>
      <View style={styles.metaItem}><FontAwesome5 name="list-ul" size={13} color={colors.muted} /><Text style={styles.metaText}>{itemsCount ?? 0} ítems</Text></View>
    </View>
  );
}

function TemplateCard({ loading, error, empty, errorMessage, onOpen, onRetry }: { loading: boolean; error: boolean; empty: boolean; errorMessage: string | null; onOpen: () => void; onRetry: () => void }) {
  const draft = useManualInspectionDraft();
  const disabled = loading || error || empty;
  return (
    <View style={styles.templateCard}>
      <View style={styles.fieldGroup}>
        <FieldLabel>Seleccione la plantilla *</FieldLabel>
        <SelectBox value={draft.templateName ?? 'Seleccione'} loading={loading} disabled={disabled} onPress={onOpen} />
      </View>
      {loading ? <View style={styles.stateRow}><ActivityIndicator size="small" color={colors.gold} /><Text style={styles.stateText}>Sincronizando catálogos de inspección</Text></View> : null}
      {error ? <TouchableOpacity style={styles.stateRow} onPress={onRetry} activeOpacity={0.75}><FontAwesome5 name="exclamation-circle" size={13} color="#BD3B5B" /><Text style={styles.errorText}>{errorMessage ?? MISSING_MOBILE_BOOTSTRAP_MESSAGE}. Toca para reintentar.</Text></TouchableOpacity> : null}
      {empty ? <View style={styles.stateRow}><FontAwesome5 name="inbox" size={13} color={colors.muted} /><Text style={styles.stateText}>No hay plantillas activas disponibles.</Text></View> : null}
      {!loading && !error && !empty ? <TemplateMeta code={draft.templateCode} itemsCount={draft.templateItemsCount} /> : null}
    </View>
  );
}

function ProgressCard({ answeredCount, totalCount }: { answeredCount: number; totalCount: number }) {
  const width: `${number}%` = totalCount ? `${(answeredCount / totalCount) * 100}%` : '0%';
  return <View style={styles.progressCard}><Text style={styles.progressText}>{answeredCount} de {totalCount} respondidos</Text><View style={styles.progressRail}><View style={[styles.progressFill, { width }]} /></View></View>;
}

function AttachmentButton({ asset, emptyTitle, onPick, compact = false }: { asset: ManualPickedAsset | null | undefined; emptyTitle: string; onPick: () => void; compact?: boolean }) {
  if (asset) {
    return (
      <TouchableOpacity style={[styles.attachmentDone, compact && styles.attachmentDoneCompact]} activeOpacity={0.75} onPress={onPick}>
        <View style={styles.attachmentIconBox}><FontAwesome5 name="camera" size={14} color={colors.white} /></View>
        <Text style={styles.attachmentText} numberOfLines={1}>{asset.name}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.photoBox} activeOpacity={0.75} onPress={onPick}>
      <Text style={styles.photoIcon}>📷</Text>
      <Text style={styles.photoTitle}>{emptyTitle}</Text>
      <Text style={styles.photoSubtitle}>Fecha, hora y GPS automáticos</Text>
    </TouchableOpacity>
  );
}

function ReferencePhotoBox() {
  const generalPhoto = useManualInspectionDraft((state) => state.generalPhoto);
  const setGeneralPhoto = useManualInspectionDraft((state) => state.setGeneralPhoto);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <View style={styles.photoWrap}>
      {!generalPhoto ? <Text style={styles.photoLabel}>Foto referencial general para la inspección *</Text> : null}
      <AttachmentButton asset={generalPhoto} emptyTitle="Tomar foto o galería" onPick={() => setPickerOpen(true)} />
      <PhotoSourceSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onGallery={async () => {
          setPickerOpen(false);
          const asset = await pickImageFromGallery('foto_general_de_inspeccion.jpg');
          if (asset) setGeneralPhoto(asset);
        }}
        onCamera={async () => {
          setPickerOpen(false);
          const asset = await pickImageFromCamera('foto_general_de_inspeccion.jpg');
          if (asset) setGeneralPhoto(asset);
        }}
      />
    </View>
  );
}

function ChecklistAnswerButton({ label, value, selected, onPress }: { label: string; value: InspectionAnswerValue; selected: boolean; onPress: () => void }) {
  const selectedStyle = value === InspectionAnswerValue.COMPLIANT ? styles.answerButtonYes : value === InspectionAnswerValue.NOT_COMPLIANT ? styles.answerButtonNo : styles.answerButtonNa;
  return <TouchableOpacity style={[styles.answerButton, selected && selectedStyle]} activeOpacity={0.75} onPress={onPress}><Text style={[styles.answerButtonText, selected && styles.answerButtonTextSelected]}>{label}</Text></TouchableOpacity>;
}

function OptionalCommentBox({ detail, onChange }: { detail: ManualChecklistItemDetail; onChange: (detail: Partial<ManualChecklistItemDetail>) => void }) {
  return <View style={styles.optionalCommentWrap}><Text style={styles.conditionalLabel}>Comentario (Opcional)</Text><TextInput style={styles.textArea} multiline value={detail.comment ?? ''} placeholder="Describa una condición o comentario de mejora a modo de consideración si lo desea." placeholderTextColor="#757575" onChangeText={(comment) => onChange({ comment })} /></View>;
}

function FindingDetailBox({ index, detail, onChange }: { index: number; detail: ManualChecklistItemDetail; onChange: (detail: Partial<ManualChecklistItemDetail>) => void }) {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <View style={styles.findingBox}>
      <View style={styles.findingHeader}><View style={styles.findingBadges}><View style={styles.obsBadge}><Text style={styles.obsBadgeText}>Obs. {index + 1}</Text></View><View style={styles.highBadge}><Text style={styles.highBadgeText}>Alto</Text></View></View><View style={styles.deleteBadge}><FontAwesome5 name="trash" size={12} color="#C4365A" /></View></View>
      <View style={styles.inputGroupWhite}><Text style={styles.upperLabel}>Condición detectada *</Text><TextInput style={styles.detailTextArea} multiline value={detail.detectedCondition ?? ''} placeholder="Describa la condición detectada." placeholderTextColor="#757575" onChangeText={(detectedCondition) => onChange({ detectedCondition })} /></View>
      <View style={styles.inputGroupGray}><Text style={styles.upperLabel}>Medida correctiva propuesta *</Text><TextInput style={styles.detailTextArea} multiline value={detail.correctiveAction ?? ''} placeholder="Indique la medida correctiva propuesta." placeholderTextColor="#757575" onChangeText={(correctiveAction) => onChange({ correctiveAction })} /></View>
      <View style={styles.evidenceWrap}><AttachmentButton asset={detail.evidence} emptyTitle="Adjuntar foto" onPick={() => setPickerOpen(true)} compact /></View>
      <View style={styles.slaRow}><Text style={styles.slaLabel}>SLA calculado</Text><Text style={styles.slaValue}>xx días hábiles</Text></View>
      <PhotoSourceSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onGallery={async () => {
          setPickerOpen(false);
          const asset = await pickImageFromGallery(`foto_obs${index + 1}.jpg`);
          if (asset) onChange({ evidence: asset });
        }}
        onCamera={async () => {
          setPickerOpen(false);
          const asset = await pickImageFromCamera(`foto_obs${index + 1}.jpg`);
          if (asset) onChange({ evidence: asset });
        }}
      />
    </View>
  );
}

function ChecklistItem({ item, index, answer, detail, onAnswer, onDetailChange }: { item: ChecklistItemRow; index: number; answer?: InspectionAnswerValue; detail: ManualChecklistItemDetail; onAnswer: (value: InspectionAnswerValue) => void; onDetailChange: (detail: Partial<ManualChecklistItemDetail>) => void }) {
  const isCompliant = answer === InspectionAnswerValue.COMPLIANT;
  const isNotCompliant = answer === InspectionAnswerValue.NOT_COMPLIANT;
  const isNotApplicable = answer === InspectionAnswerValue.NOT_APPLICABLE;
  return (
    <View style={[styles.itemWrap, isCompliant && styles.itemWrapYes, isNotCompliant && styles.itemWrapNo, isNotApplicable && styles.itemWrapNa]}>
      <View style={styles.questionRow}><Text style={styles.itemIndex}>{index + 1}</Text><Text style={styles.questionText}>{item.question}</Text></View>
      <View style={styles.answerRow}>{answerOptions.map((option) => <ChecklistAnswerButton key={option.value} label={option.label} value={option.value} selected={answer === option.value} onPress={() => onAnswer(option.value)} />)}</View>
      {isNotCompliant ? <FindingDetailBox index={index} detail={detail} onChange={onDetailChange} /> : null}
      {isCompliant ? <OptionalCommentBox detail={detail} onChange={onDetailChange} /> : null}
    </View>
  );
}

function ChecklistItemsCard({ template, items }: { template: InspectionChecklistTemplateResponse; items: ChecklistItemRow[] }) {
  const draft = useManualInspectionDraft();
  const setAnswer = useManualInspectionDraft((state) => state.setAnswer);
  const setItemDetail = useManualInspectionDraft((state) => state.setItemDetail);
  const headerTitle = getTemplateHeaderTitle(template);
  return (
    <View style={styles.itemsCard}>
      <View style={styles.itemsHeader}><Text style={styles.itemsHeaderTitle}>{headerTitle}</Text><Text style={styles.itemsHeaderCode}>{template.code}</Text></View>
      {items.length === 0 ? <View style={styles.emptyItemsBox}><Text style={styles.stateText}>Esta plantilla no tiene ítems activos.</Text></View> : items.map((item, index) => <ChecklistItem key={item.id} item={item} index={index} answer={draft.answersByItemId[item.id]} detail={draft.detailsByItemId[item.id] ?? {}} onAnswer={(value) => setAnswer(item.id, value)} onDetailChange={(detail) => setItemDetail(item.id, detail)} />)}
    </View>
  );
}

function responsibleUserLabel(user: UserResponse) {
  const profile = user.position || user.roles?.[0]?.name || 'Sin perfil';
  return `${user.fullName} - ${profile}`;
}

function selectedUsersLabel(users: UserResponse[], selectedIds: string[]) {
  const selected = users.filter((user) => selectedIds.includes(user.id));
  if (selected.length === 0) return 'Seleccione personal responsable';
  if (selected.length === 1) return selected[0].fullName;
  return `${selected.length} responsables seleccionados`;
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
          <View style={styles.responsibleSheetFooter}><TouchableOpacity style={styles.responsibleDone} activeOpacity={0.75} onPress={onClose}><Text style={styles.responsibleDoneText}>Listo</Text></TouchableOpacity></View>
        </View>
      </View>
    </Modal>
  );
}

function ResponsibleBlock({ onOpenCompany, onOpenUsers, companiesLoading, usersLoading, usersDisabled, responsibleText }: { onOpenCompany: () => void; onOpenUsers: () => void; companiesLoading: boolean; usersLoading: boolean; usersDisabled: boolean; responsibleText: string }) {
  const draft = useManualInspectionDraft();
  return <View style={styles.responsibleCard}><Text style={styles.responsibleTitle}>Responsables</Text><View style={styles.fieldGroup}><FieldLabel>Empresa encargada de los hallazgos</FieldLabel><SelectBox value={draft.findingCompanyName ?? 'Seleccione empresa'} loading={companiesLoading} onPress={onOpenCompany} /></View><View style={styles.fieldGroup}><FieldLabel>Personal encargado de los hallazgos</FieldLabel><SelectBox value={responsibleText} loading={usersLoading} disabled={usersDisabled} onPress={onOpenUsers} /></View></View>;
}

function hasRequiredFindingDetail(detail: ManualChecklistItemDetail | undefined) {
  return Boolean(detail?.detectedCondition?.trim() && detail.correctiveAction?.trim() && detail.evidence);
}

export function ManualChecklistTemplateScreen() {
  usePersistManualInspectionDraft();
  const { online, hasSession } = useManualConnectivityStatus();
  const draft = useManualInspectionDraft();
  const setTemplate = useManualInspectionDraft((state) => state.setTemplate);
  const setFindingCompany = useManualInspectionDraft((state) => state.setFindingCompany);
  const setFindingResponsibles = useManualInspectionDraft((state) => state.setFindingResponsibles);
  const activePicker = useManualInspectionFlowStore((state) => state.activePicker) as PickerKind | null;
  const openPicker = useManualInspectionFlowStore((state) => state.openPicker);
  const closePicker = useManualInspectionFlowStore((state) => state.closePicker);
  const goToType = useManualInspectionFlowStore((state) => state.goToType);
  const goToObservations = useManualInspectionFlowStore((state) => state.goToObservations);
  const goToSummary = useManualInspectionFlowStore((state) => state.goToSummary);
  const templatesQuery = useInspectionChecklistTemplates();
  const companiesQuery = useManualInspectionCompanies();
  const [userOptions, setUserOptions] = React.useState<UserResponse[]>([]);
  const [usersPickerOpen, setUsersPickerOpen] = React.useState(false);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [usersError, setUsersError] = React.useState<string | null>(null);
  const templates = templatesQuery.data ?? [];
  const companies = companiesQuery.data ?? [];
  const selectedTemplate = templates.find((template) => template.id === draft.templateId);
  const items = useMemo(() => getTemplateItems(selectedTemplate), [selectedTemplate]);
  const templateOptions = useMemo<SelectSheetOption[]>(() => templates.map(templateToOption), [templates]);
  const companyOptions = useMemo<SelectSheetOption[]>(() => companies.map((company) => ({ id: company.id, label: company.name, description: company.code ?? undefined })), [companies]);
  const answeredCount = items.filter((item) => Boolean(draft.answersByItemId[item.id])).length;
  const hasFindings = items.some((item) => draft.answersByItemId[item.id] === InspectionAnswerValue.NOT_COMPLIANT);
  const missingFindingDetails = items.some((item) => draft.answersByItemId[item.id] === InspectionAnswerValue.NOT_COMPLIANT && !hasRequiredFindingDetail(draft.detailsByItemId[item.id]));
  const responsibleText = selectedUsersLabel(userOptions, draft.findingResponsibleIds);
  const canContinue = Boolean(selectedTemplate && draft.generalPhoto && items.length > 0 && answeredCount === items.length && !missingFindingDetails && (!hasFindings || (draft.findingCompanyId && draft.findingResponsibleIds.length > 0)));
  const catalogErrorMessage = templatesQuery.error instanceof Error ? templatesQuery.error.message : null;
  const catalogEmptyText = catalogErrorMessage ?? MISSING_MOBILE_BOOTSTRAP_MESSAGE;

  React.useEffect(() => { goToObservations(); }, [goToObservations]);

  React.useEffect(() => {
    let mounted = true;
    if (!draft.findingCompanyId) {
      setUserOptions([]);
      setUsersLoading(false);
      setUsersError(null);
      return () => { mounted = false; };
    }
    setUsersLoading(true);
    setUsersError(null);
    fetchResponsibleUsersLocalFirst(draft.findingCompanyId)
      .then((users) => {
        if (!mounted) return;
        setUserOptions(users);
        setUsersLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setUserOptions([]);
        setUsersError('No se pudo cargar el personal asociado.');
        setUsersLoading(false);
      });
    return () => { mounted = false; };
  }, [draft.findingCompanyId]);

  function back() { closePicker(); goToType(); router.replace('/inspection/manual/type'); }
  function selectTemplate(option: SelectSheetOption) { const template = templates.find((item) => item.id === option.id); if (!template) return; setTemplate({ id: template.id, name: template.name, code: template.code, itemsCount: getItemsCount(template) }); closePicker(); }
  function selectCompany(option: SelectSheetOption) { setFindingCompany(option.id, option.label); closePicker(); setUsersPickerOpen(false); }
  function toggleUser(userId: string) {
    const next = draft.findingResponsibleIds.includes(userId)
      ? draft.findingResponsibleIds.filter((id) => id !== userId)
      : [...draft.findingResponsibleIds, userId];
    setFindingResponsibles(next);
  }
  function next() {
    if (!draft.generalPhoto) { Alert.alert('Foto requerida', 'Adjunta la foto referencial general antes de continuar.'); return; }
    if (answeredCount !== items.length) { Alert.alert('Ítems pendientes', 'Responde todos los ítems antes de continuar.'); return; }
    if (missingFindingDetails) { Alert.alert('Hallazgos incompletos', 'Cada ítem marcado como NO requiere condición detectada, medida correctiva y foto.'); return; }
    if (hasFindings && !draft.findingCompanyId) { Alert.alert('Responsable requerido', 'Selecciona la empresa encargada de los hallazgos.'); return; }
    if (hasFindings && draft.findingResponsibleIds.length === 0) { Alert.alert('Responsables requeridos', 'Selecciona al menos un responsable para los hallazgos.'); return; }
    goToSummary(); router.push('/inspection/manual/summary');
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <ManualFlowHeader title="Observaciones" subtitle="Paso 3 de 5" badge="GF HSE" onBack={back} />
          <OfflineBanner online={online} hasSession={hasSession} />
          <ManualFormStepper activeStep={3} steps={['Datos', 'Tipo', 'Ítems', 'Resumen']} />
          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
            <View style={styles.copyBlock}><Text style={styles.title}>Checklist normativo</Text><Text style={styles.subtitle}>Responde todos los ítems · los NO quedarán registrados como observaciones</Text></View>
            <TemplateCard loading={templatesQuery.isLoading} error={templatesQuery.isError} empty={!templatesQuery.isLoading && !templatesQuery.isError && templates.length === 0} errorMessage={catalogErrorMessage} onOpen={() => openPicker('template')} onRetry={templatesQuery.refetch} />
            {selectedTemplate ? <><ProgressCard answeredCount={answeredCount} totalCount={items.length} /><ReferencePhotoBox /><ChecklistItemsCard template={selectedTemplate} items={items} />{hasFindings ? <ResponsibleBlock onOpenCompany={() => openPicker('company')} onOpenUsers={() => setUsersPickerOpen(true)} companiesLoading={companiesQuery.isLoading} usersLoading={usersLoading} usersDisabled={!draft.findingCompanyId} responsibleText={responsibleText} /> : null}</> : null}
          </ScrollView>
          <ManualFlowFooter secondaryLabel="Atrás" secondaryIcon="arrow-left" onSecondary={back} onPrimary={next} primaryDisabled={!canContinue} />
          <SelectSheet visible={activePicker === 'template'} title="Seleccione la plantilla" subtitle="Plantillas normativas disponibles" options={templateOptions} selectedId={draft.templateId} loading={templatesQuery.isLoading} emptyText={catalogEmptyText} onClose={closePicker} onSelect={selectTemplate} />
          <SelectSheet visible={activePicker === 'company'} title="Empresa encargada" subtitle="Empresas contratistas disponibles" options={companyOptions} selectedId={draft.findingCompanyId} loading={companiesQuery.isLoading} emptyText={catalogEmptyText} onClose={closePicker} onSelect={selectCompany} />
          <UsersPickerModal visible={usersPickerOpen} users={userOptions} loading={usersLoading} errorMessage={usersError} selectedIds={draft.findingResponsibleIds} companySelected={Boolean(draft.findingCompanyId)} onClose={() => setUsersPickerOpen(false)} onToggle={toggleUser} />
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
  templateCard: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 15.5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 1.5, shadowOffset: { width: 0, height: 1 } },
  fieldGroup: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, lineHeight: 14, color: colors.muted },
  stateRow: { minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 6 },
  stateText: { fontSize: 11, lineHeight: 14, color: colors.muted },
  errorText: { fontSize: 11, lineHeight: 14, color: '#BD3B5B' },
  progressCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 13, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 1.5, shadowOffset: { width: 0, height: 1 } },
  progressText: { fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.primary },
  progressRail: { marginTop: 8, height: 6, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#3A9B3A' },
  photoWrap: { gap: 6 },
  photoLabel: { fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold, color: colors.primary },
  photoBox: { minHeight: 98, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.borderMid, backgroundColor: '#F6FAFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  photoIcon: { fontSize: 28, lineHeight: 34 },
  photoTitle: { marginTop: 6, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.semibold, color: colors.muted, textAlign: 'center' },
  photoSubtitle: { marginTop: 3, fontSize: 11, lineHeight: 14, color: colors.placeholder, textAlign: 'center' },
  attachmentDone: { minHeight: 56, borderRadius: 8, backgroundColor: '#3A9B3A', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  attachmentDoneCompact: { minHeight: 54 },
  attachmentIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  attachmentText: { flex: 1, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.white },
  itemsCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  itemsHeader: { minHeight: 36, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  itemsHeaderTitle: { fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.white },
  itemsHeaderCode: { fontSize: 10, lineHeight: 12, color: 'rgba(255,255,255,0.45)' },
  itemWrap: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  itemWrapYes: { borderLeftColor: '#3A9B3A' },
  itemWrapNo: { borderLeftColor: '#C4365A' },
  itemWrapNa: { borderLeftColor: colors.borderMid },
  questionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 2, paddingHorizontal: 12, paddingTop: 11, paddingBottom: 6 },
  itemIndex: { minWidth: 14, paddingTop: 1, fontSize: 10, lineHeight: 13, fontWeight: fontWeight.bold, color: colors.placeholder },
  questionText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.primary },
  answerRow: { flexDirection: 'row', gap: 6, paddingLeft: 32, paddingRight: 12 },
  answerButton: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#F6FAFF', alignItems: 'center', justifyContent: 'center' },
  answerButtonYes: { backgroundColor: '#3A9B3A', borderColor: '#3A9B3A' },
  answerButtonNo: { backgroundColor: '#C4365A', borderColor: '#C4365A' },
  answerButtonNa: { backgroundColor: '#EFEFEF', borderColor: colors.placeholder },
  answerButtonText: { fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.primary, textAlign: 'center' },
  answerButtonTextSelected: { color: colors.white },
  optionalCommentWrap: { gap: 6, paddingLeft: 32, paddingRight: 12, paddingTop: 8 },
  conditionalLabel: { fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold, color: colors.primary },
  textArea: { minHeight: 80, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#F6FAFF', paddingHorizontal: 15.5, paddingVertical: 14.5, fontSize: 13, lineHeight: 19.5, color: colors.primary, textAlignVertical: 'top' },
  findingBox: { marginLeft: 32, marginRight: 12, marginTop: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, padding: 13.5, gap: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 1.5, shadowOffset: { width: 0, height: 1 } },
  findingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  findingBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  obsBadge: { height: 19, borderRadius: 6, backgroundColor: '#E6F3FF', justifyContent: 'center', paddingHorizontal: 8 },
  obsBadgeText: { fontSize: 11, fontWeight: fontWeight.bold, color: '#24588B' },
  highBadge: { height: 20, borderRadius: 8, backgroundColor: '#FFE1CD', justifyContent: 'center', paddingHorizontal: 8 },
  highBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: '#532A0E' },
  deleteBadge: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#FFD0DB', alignItems: 'center', justifyContent: 'center' },
  inputGroupWhite: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 11, paddingVertical: 9 },
  inputGroupGray: { borderRadius: 8, backgroundColor: '#F7F7F7', paddingHorizontal: 10, paddingVertical: 8 },
  upperLabel: { fontSize: 9, lineHeight: 12, fontWeight: fontWeight.bold, color: colors.muted, letterSpacing: 1.5, textTransform: 'uppercase' },
  detailTextArea: { minHeight: 44, width: '100%', paddingTop: 3, paddingHorizontal: 0, paddingBottom: 0, fontSize: 12, lineHeight: 16.8, color: colors.primary, textAlignVertical: 'top' },
  evidenceWrap: { borderTopWidth: 1.5, borderTopColor: colors.gold, backgroundColor: '#FFFDF7', paddingTop: 9.5, paddingBottom: 8 },
  slaRow: { borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 9 },
  slaLabel: { fontSize: 12, lineHeight: 15, fontWeight: fontWeight.medium, color: colors.muted },
  slaValue: { fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold, color: colors.primary },
  responsibleCard: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 13.5, gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 1.5, shadowOffset: { width: 0, height: 1 } },
  responsibleTitle: { fontSize: 18, lineHeight: 21.6, fontWeight: fontWeight.bold, color: colors.primary },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdropLight: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.32)' },
  responsibleSheet: { maxHeight: '86%', backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', shadowColor: '#131313', shadowOpacity: 0.24, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  responsibleHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D1D1', marginTop: 22, marginBottom: 22 },
  responsibleSheetTitle: { color: colors.primary, fontSize: 14, lineHeight: 18, fontWeight: fontWeight.bold, paddingHorizontal: 22, paddingBottom: 14 },
  responsibleList: { paddingHorizontal: 8, paddingVertical: 8 },
  responsibleEmpty: { color: colors.muted, fontSize: 14, lineHeight: 20, paddingHorizontal: 14, paddingVertical: 16 },
  userOption: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: colors.gold, backgroundColor: colors.gold },
  userOptionText: { flex: 1, color: colors.primary, fontSize: 14, lineHeight: 22.7, letterSpacing: 0.28 },
  responsibleSheetFooter: { borderTopWidth: 1, borderTopColor: '#E3E3E3', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 14 },
  responsibleDone: { height: 44, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  responsibleDoneText: { color: colors.goldDark, fontSize: 13, fontWeight: fontWeight.bold },
  emptyItemsBox: { padding: 14 },
});
