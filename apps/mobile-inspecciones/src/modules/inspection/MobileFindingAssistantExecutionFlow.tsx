import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  InspectionDetailEvidenceResponse,
  InspectionDetailFindingItemResponse,
  InspectionDetailResponse,
} from '@aurelia/contracts';
import { BotBubble } from '../../shared/components/chat/BotBubble';
import { UserBubble } from '../../shared/components/chat/UserBubble';
import { TypingIndicator } from '../../shared/components/chat/TypingIndicator';
import { QuickOpt } from '../../shared/components/chat/QuickOpts';
import { ChatInput } from '../../shared/components/layout/ChatInput';
import { PhotoSourceSheet } from '../../shared/components/form/PhotoSourceSheet';
import { SparklesMark } from '../../shared/components/icons/SparklesMark';
import { API_URL } from '../../shared/services/http-client';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { useMobileSession } from '../auth/mobileSession.store';
import type { MobileFindingEvidenceInput } from './hooks/useMobileInspectionManagement';
import { suggestMobileFindingExecutionAction } from './services/mobileFindingAssistantExecution.service';

type AssistantPhase = 'details' | 'response' | 'summary' | 'done';

type ExtraBubble = {
  id: string;
  from: 'agent' | 'user';
  text: string;
};

type Props = {
  detail: InspectionDetailResponse;
  item: InspectionDetailFindingItemResponse;
  index: number;
  itemLabel: 'Obs.' | 'Ítem';
  pending: boolean;
  onBack: () => void;
  onCancel: () => void;
  onFinish: () => void;
  onSubmit: (description: string, evidence: MobileFindingEvidenceInput) => Promise<void>;
};

const apiOrigin = API_URL.replace(/\/api\/?$/, '');
const photoReceivedText = 'Foto recibida ✓. Te propongo esta descripción basada en la medida solicitada. Acéptala o edítala.';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function formatDate(value: string | null | undefined): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

function formatDateTime(value: string | null | undefined): string {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Sin fecha registrada';
  return `${formatDate(value)} · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function daysLabel(value: string | null | undefined): string {
  if (!value) return 'XX días hábiles';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'XX días hábiles';
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
  return `${days} días hábiles`;
}

function firstName(value: string | null | undefined, fallback: string): string {
  return value?.trim().split(/\s+/)[0] || fallback;
}

function evidenceUrl(evidence: InspectionDetailEvidenceResponse | undefined): string | null {
  if (!evidence) return null;
  if (evidence.fileId) return `${apiOrigin}/api/files/${encodeURIComponent(evidence.fileId)}/content`;
  if (!evidence.url) return null;
  if (evidence.url.startsWith('http')) return evidence.url;
  if (evidence.url.startsWith('/api/')) return `${apiOrigin}${evidence.url}`;
  return evidence.url;
}

function severityColors(label: string): { background: string; color: string } {
  const normalized = label.toLowerCase();
  if (normalized.includes('crít') || normalized.includes('crit') || normalized.includes('grave')) {
    return { background: colors.dangerSurf, color: colors.dangerTxt };
  }
  if (normalized.includes('alto')) return { background: colors.ocreSurf, color: colors.ocreTxt };
  if (normalized.includes('moder')) return { background: '#FBE1D0', color: '#69462E' };
  return { background: colors.successSurf, color: colors.successTxt };
}

function AssistantHeader({
  phase,
  subtitle,
  onBack,
}: {
  phase: AssistantPhase;
  subtitle: string;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const stepIndex = phase === 'details' ? 0 : phase === 'response' ? 1 : 2;
  const labels = ['Paso 1 · Detalles del hallazgo', 'Paso 2 · Tu respuesta', 'Paso 3 · Resumen'];
  const percents = ['33%', '66%', '100%'];

  return (
    <View style={[styles.headerWrapper, { paddingTop: insets.top }]}> 
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerBack} onPress={onBack} accessibilityLabel="Volver">
          <Feather name="arrow-left" size={22} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Ejecutar observación</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            <Text style={styles.headerStatusDot}>● </Text>AurelIA · Asistente EECC · {subtitle}
          </Text>
        </View>
        <View style={styles.eeccBadge}><Text style={styles.eeccBadgeText}>EECC</Text></View>
        <TouchableOpacity style={styles.headerMenu} accessibilityLabel="Más opciones">
          <FontAwesome5 name="ellipsis-v" size={14} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>
      <View style={styles.headerProgress}>
        <View style={styles.headerProgressBars}>
          {[0, 1, 2].map((step) => (
            <View
              key={step}
              style={[
                styles.headerProgressBar,
                step < stepIndex && styles.headerProgressDone,
                step === stepIndex && styles.headerProgressActive,
              ]}
            />
          ))}
        </View>
        <View style={styles.headerProgressLabels}>
          <Text style={styles.headerProgressText}>{labels[stepIndex]}</Text>
          <Text style={styles.headerProgressText}>{percents[stepIndex]}</Text>
        </View>
      </View>
    </View>
  );
}

function FindingContextCard({
  item,
  index,
  itemLabel,
}: {
  item: InspectionDetailFindingItemResponse;
  index: number;
  itemLabel: 'Obs.' | 'Ítem';
}) {
  const token = useMobileSession((state) => state.accessToken);
  const beforeEvidence = item.beforeEvidence[0];
  const uri = evidenceUrl(beforeEvidence);
  const severity = severityColors(item.severityLabel);

  return (
    <View style={styles.indentedBlock}>
      <View style={styles.findingCard}>
        <View style={styles.findingCardHeader}>
          <Text style={styles.findingCardTitle}>{itemLabel} {index + 1}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severity.background }]}>
            <Text style={[styles.severityBadgeText, { color: severity.color }]}>{item.severityLabel}</Text>
          </View>
        </View>
        <View style={styles.beforePhoto}>
          {uri ? (
            <Image
              source={{ uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
              style={styles.beforePhotoImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.beforePhotoEmpty}>
              <Feather name="image" size={28} color={colors.blueLink} />
              <Text style={styles.beforePhotoEmptyText}>Foto Antes · {itemLabel} {index + 1}</Text>
            </View>
          )}
          <View style={styles.beforePhotoLabel}><Text style={styles.beforePhotoLabelText}>FOTO ANTES</Text></View>
          {beforeEvidence?.capturedAt ? (
            <View style={styles.beforePhotoDate}><Text style={styles.beforePhotoDateText}>{formatDateTime(beforeEvidence.capturedAt)}</Text></View>
          ) : null}
        </View>
        <View style={styles.findingRows}>
          <View style={styles.findingRow}>
            <Text style={styles.findingRowLabel}>CONDICIÓN</Text>
            <Text style={styles.findingRowValue}>{item.condition || '—'}</Text>
          </View>
          <View style={styles.findingRow}>
            <Text style={styles.findingRowLabel}>MEDIDA SOLICITADA</Text>
            <Text style={styles.findingRowValue}>{item.proposedCorrectiveAction || '—'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function SlaContextCard({ item }: { item: InspectionDetailFindingItemResponse }) {
  return (
    <View style={styles.indentedBlock}>
      <View style={styles.slaCard}>
        <Feather name="clock" size={18} color={colors.ocreTxt} />
        <View style={styles.slaCopy}>
          <Text style={styles.slaTitle}>Fecha límite: {formatDate(item.dueAt)}</Text>
          <Text style={styles.slaSubtitle}>{daysLabel(item.dueAt)} · <Text style={styles.slaStrong}>SLA vigente</Text></Text>
        </View>
      </View>
    </View>
  );
}

function PhotoInput({
  evidence,
  onPress,
}: {
  evidence: MobileFindingEvidenceInput | null;
  onPress: () => void;
}) {
  if (evidence) {
    return (
      <TouchableOpacity style={styles.loadedPhoto} onPress={onPress} activeOpacity={0.84}>
        <View style={styles.loadedPhotoIcon}><Feather name="camera" size={16} color={colors.white} /></View>
        <Text style={styles.loadedPhotoName} numberOfLines={1}>{evidence.filename}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.photoInput} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.photoInputIcon}><Feather name="camera" size={18} color={colors.muted} /></View>
      <Text style={styles.photoInputTitle}>Adjuntar foto de evidencia</Text>
      <Text style={styles.photoInputHint}>Fecha, hora y GPS se registran automáticamente</Text>
      <View style={styles.photoInputActions}>
        <View style={styles.photoInputAction}><Feather name="camera" size={11} color={colors.body} /><Text style={styles.photoInputActionText}>Tomar foto</Text></View>
        <View style={styles.photoInputAction}><Feather name="image" size={11} color={colors.body} /><Text style={styles.photoInputActionText}>Desde galería</Text></View>
      </View>
    </TouchableOpacity>
  );
}

function ResponseCard({
  item,
  evidence,
  suggestion,
  editing,
  accepted,
  description,
  onPhoto,
  onAccept,
  onEdit,
  onDescriptionChange,
  onSaveDescription,
}: {
  item: InspectionDetailFindingItemResponse;
  evidence: MobileFindingEvidenceInput | null;
  suggestion: string | null;
  editing: boolean;
  accepted: boolean;
  description: string;
  onPhoto: () => void;
  onAccept: () => void;
  onEdit: () => void;
  onDescriptionChange: (value: string) => void;
  onSaveDescription: () => void;
}) {
  return (
    <View style={styles.indentedBlock}>
      <View style={styles.responseCard}>
        <View style={styles.responseHeader}>
          <Feather name="camera" size={11} color={colors.teal} />
          <Text style={styles.responseHeaderText}>FOTO DESPUÉS — EVIDENCIA DE CORRECCIÓN</Text>
        </View>
        <View style={styles.responsePhotoSection}><PhotoInput evidence={evidence} onPress={onPhoto} /></View>
        <View style={styles.responseDescriptionSection}>
          <Text style={styles.responseLabel}>DESCRIPCIÓN DE LA ACCIÓN TOMADA</Text>
          {suggestion && !editing ? (
            <View style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <SparklesMark size={11} color={colors.goldDark} />
                <Text style={styles.suggestionHeaderText}>Acción sugerida por AurelIA</Text>
                <View style={styles.mockBadge}><Text style={styles.mockBadgeText}>MOCK</Text></View>
              </View>
              <Text style={styles.suggestionText}>{suggestion}</Text>
              <View style={styles.suggestionActions}>
                <TouchableOpacity style={styles.editButton} onPress={onEdit} disabled={accepted}>
                  <Feather name="edit-2" size={11} color={accepted ? colors.placeholder : colors.body} />
                  <Text style={[styles.editButtonText, accepted && styles.disabledText]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.acceptButton, accepted && styles.acceptButtonDisabled]} onPress={onAccept} disabled={accepted}>
                  <Feather name="check" size={12} color={colors.white} />
                  <Text style={styles.acceptButtonText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          {editing ? (
            <View>
              <TextInput
                value={description}
                onChangeText={onDescriptionChange}
                multiline
                textAlignVertical="top"
                placeholder={item.proposedCorrectiveAction || 'Describe la acción que tomaste…'}
                placeholderTextColor={colors.placeholder}
                style={styles.descriptionInput}
              />
              <TouchableOpacity style={styles.saveDescriptionButton} onPress={onSaveDescription}>
                <Text style={styles.saveDescriptionText}>Guardar descripción</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {!suggestion && !editing ? (
            <Text style={styles.responseEmptyText}>Adjunta una foto para que AurelIA proponga una descripción inicial.</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}


function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryRowLabel}>{label}</Text>
      <View style={styles.summaryRowValueWrap}>{typeof children === 'string' ? <Text style={styles.summaryRowValue}>{children}</Text> : children}</View>
    </View>
  );
}

function SummaryCard({ detail, item, index, itemLabel, evidence, description, summaryAt }: { detail: InspectionDetailResponse; item: InspectionDetailFindingItemResponse; index: number; itemLabel: 'Obs.' | 'Ítem'; evidence: MobileFindingEvidenceInput; description: string; summaryAt: string | null }) {
  const token = useMobileSession((state) => state.accessToken);
  const responsible = item.responsibleUsers[0];
  const beforeEvidence = item.beforeEvidence[0];
  const beforeUri = evidenceUrl(beforeEvidence);
  const severity = severityColors(item.severityLabel);
  const companyName = item.responsibleCompanyName ?? responsible?.companyName ?? detail.general.companyName ?? '—';
  const inspectionLabel = [detail.header.inspectionNumber, detail.general.areaName, detail.general.sectorName ?? detail.general.locationLabel].filter(Boolean).join(' · ');
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryHeaderTitle} numberOfLines={1}>Observación {detail.header.inspectionNumber} · {itemLabel} {index + 1}</Text>
        <View style={styles.summaryStatus}><Text style={styles.summaryStatusText}>Ejecutado</Text></View>
      </View>
      <View style={styles.summaryPhotos}>
        <View style={styles.summaryPhotoBox}>
          <View style={styles.summaryPhotoLabel}><Text style={styles.summaryPhotoLabelText}>ANTES · INSPECTOR</Text></View>
          <View style={[styles.summaryPhotoBody, styles.summaryPhotoBefore]}>
            {beforeUri ? <Image source={{ uri: beforeUri, headers: token ? { Authorization: `Bearer ${token}` } : undefined }} style={styles.summaryPhotoImage} resizeMode="cover" /> : <View style={styles.summaryPhotoPlaceholder}><Feather name="image" size={22} color={colors.blueLink} /><Text style={styles.summaryPhotoBeforeText}>Foto original</Text></View>}
          </View>
        </View>
        <View style={styles.summaryPhotoBox}>
          <View style={styles.summaryPhotoLabel}><Text style={styles.summaryPhotoLabelText}>DESPUÉS · EECC</Text></View>
          <View style={[styles.summaryPhotoBody, styles.summaryPhotoAfter]}>
            <Image source={{ uri: evidence.uri }} style={styles.summaryPhotoImage} resizeMode="cover" />
          </View>
        </View>
      </View>
      <SummaryRow label="Ejecutado por">{responsible?.fullName ?? 'Responsable EECC'}</SummaryRow>
      <SummaryRow label="Empresa">{companyName}</SummaryRow>
      <SummaryRow label="Fecha y hora">{formatDateTime(summaryAt)}</SummaryRow>
      <SummaryRow label="Inspección">{inspectionLabel}</SummaryRow>
      <SummaryRow label="Criticidad"><View style={[styles.summarySeverity, { backgroundColor: severity.background }]}><Text style={[styles.summarySeverityText, { color: severity.color }]}>{item.severityLabel}</Text></View></SummaryRow>
      <View style={styles.summaryAction}><Text style={styles.summaryActionLabel}>Acción tomada</Text><Text style={styles.summaryActionText}>{description}</Text></View>
    </View>
  );
}

function DoneScreen({
  item,
  index,
  itemLabel,
  submittedAt,
}: {
  item: InspectionDetailFindingItemResponse;
  index: number;
  itemLabel: 'Obs.' | 'Ítem';
  submittedAt: string | null;
}) {
  const responsible = item.responsibleUsers[0];
  const executedAt = submittedAt ?? new Date().toISOString();
  return (
    <View style={styles.doneBody}>
      <View style={styles.doneIcon}><Feather name="check" size={36} color={colors.white} /></View>
      <Text style={styles.doneTitle}>¡Observación ejecutada!</Text>
      <Text style={styles.doneDescription}>
        La observación <Text style={styles.doneStrong}>{itemLabel} {index + 1}</Text> fue marcada como <Text style={styles.doneTeal}>Ejecutada</Text> y quedará pendiente de revisión.
      </Text>
      <View style={styles.notificationCard}>
        <View style={styles.notificationHeading}>
          <View style={styles.notificationIcon}><Feather name="bell" size={14} color={colors.white} /></View>
          <Text style={styles.notificationTitle}>Notificaciones enviadas</Text>
        </View>
        <View style={styles.notificationRow}>
          <Feather name="shield" size={12} color={colors.tealTxt} />
          <View style={styles.notificationCopy}>
            <Text style={styles.notificationPerson}>Admin GF HSE</Text>
            <Text style={styles.notificationMeta}>Revisará la evidencia para aprobar o rechazar</Text>
          </View>
        </View>
        <View style={styles.notificationDivider} />
        <View style={styles.notificationRow}>
          <Feather name="user" size={12} color={colors.tealTxt} />
          <View style={styles.notificationCopy}>
            <Text style={styles.notificationPerson}>{responsible?.fullName ?? 'Responsable EECC'}</Text>
            <Text style={styles.notificationMeta}>Fue notificado de la ejecución</Text>
          </View>
        </View>
      </View>
      <View style={styles.doneMetrics}>
        <View style={styles.doneMetric}>
          <Text style={styles.doneMetricValue}>{firstName(responsible?.fullName, 'EECC')}</Text>
          <Text style={styles.doneMetricLabel}>Ejecutado por</Text>
        </View>
        <View style={styles.doneMetric}>
          <Text style={[styles.doneMetricValue, styles.doneMetricTime]}>{currentTime()}</Text>
          <Text style={styles.doneMetricLabel}>Hora de ejecución</Text>
        </View>
      </View>
      <Text style={styles.doneBrand}>AurelIA · Gold Fields Salares Norte{`\n`}{formatDate(executedAt)}</Text>
    </View>
  );
}

export function MobileFindingAssistantExecutionFlow({
  detail,
  item,
  index,
  itemLabel,
  pending,
  onBack,
  onCancel,
  onFinish,
  onSubmit,
}: Props) {
  const [phase, setPhase] = useState<AssistantPhase>('details');
  const [evidence, setEvidence] = useState<MobileFindingEvidenceInput | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acknowledgement, setAcknowledgement] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [summaryAt, setSummaryAt] = useState<string | null>(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [extraBubbles, setExtraBubbles] = useState<ExtraBubble[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const subtitle = detail.general.locationLabel?.trim()
    || detail.general.sectorName?.trim()
    || detail.general.areaName?.trim()
    || 'Sin ubicación';

  const canConfirm = Boolean(evidence && accepted && description.trim() && !pending && !submitting);

  useEffect(() => {
    setPhase('details');
    setEvidence(null);
    setSuggestion(null);
    setDescription('');
    setEditing(false);
    setLoadingSuggestion(false);
    setAccepted(false);
    setAcknowledgement(null);
    setSubmitting(false);
    setSubmittedAt(null);
    setSummaryAt(null);
    setPhotoSheetVisible(false);
    setExtraBubbles([]);
  }, [item.findingId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (phase === 'done' || phase === 'summary') scrollRef.current?.scrollTo({ y: 0, animated: false });
      else scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [phase, evidence, suggestion, description, editing, loadingSuggestion, accepted, extraBubbles.length]);

  async function pick(source: 'camera' | 'gallery') {
    setPhotoSheetVisible(false);
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Debes autorizar el acceso para adjuntar la fotografía posterior.');
      return;
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;

    const nextEvidence: MobileFindingEvidenceInput = {
      uri: asset.uri,
      filename: asset.fileName ?? `evidencia-despues-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    };
    setEvidence(nextEvidence);
    setAccepted(false);
    setAcknowledgement(null);
    setLoadingSuggestion(true);
    try {
      const [action] = await Promise.all([
        suggestMobileFindingExecutionAction({ item, areaLabel: subtitle }),
        sleep(420),
      ]);
      setSuggestion(action);
      setDescription(action);
      setEditing(false);
    } finally {
      setLoadingSuggestion(false);
    }
  }

  function startResponse() {
    setPhase('response');
    setExtraBubbles((current) => [...current, { id: `${Date.now()}-start`, from: 'user', text: 'Sí, iniciar respuesta' }]);
  }

  function askQuestion() {
    const stamp = Date.now();
    setExtraBubbles((current) => [
      ...current,
      { id: `${stamp}-question`, from: 'user', text: 'Tengo una consulta' },
      { id: `${stamp}-answer`, from: 'agent', text: 'Claro, puedes revisar la condición detectada, la medida solicitada, la evidencia inicial y el SLA vigente antes de continuar.' },
    ]);
  }

  function sendFreeText(text: string) {
    const stamp = Date.now();
    setExtraBubbles((current) => [
      ...current,
      { id: `${stamp}-user`, from: 'user', text },
      { id: `${stamp}-agent`, from: 'agent', text: 'Recibido. Mantengo el contexto de esta observación para ayudarte a completar la ejecución.' },
    ]);
  }

  function acceptSuggestion() {
    if (!suggestion) return;
    setDescription(suggestion);
    setEditing(false);
    setAccepted(true);
    setAcknowledgement('✓ Descripción aceptada');
  }

  function saveDescription() {
    const value = description.trim();
    if (!value) return;
    setDescription(value);
    setEditing(false);
    setAccepted(true);
    setAcknowledgement('✓ Descripción guardada');
  }

  function showSummary() {
    if (!evidence || !accepted || !description.trim()) return;
    setSummaryAt(new Date().toISOString());
    setPhase('summary');
  }

  function editSummary() {
    setPhase('response');
    setEditing(true);
    setAccepted(false);
    setAcknowledgement(null);
  }

  async function confirmExecution() {
    if (!evidence || !description.trim() || !canConfirm) return;
    setSubmitting(true);
    try {
      await onSubmit(description.trim(), evidence);
      setSubmittedAt(new Date().toISOString());
      setPhase('done');
    } catch (error) {
      Alert.alert('No se pudo ejecutar la observación', error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    if (phase === 'summary') {
      setPhase('response');
      return;
    }
    if (phase === 'response') {
      setPhase('details');
      return;
    }
    onBack();
  }

  const renderedBubbles = useMemo(
    () => extraBubbles.map((bubble) => bubble.from === 'agent'
      ? <BotBubble key={bubble.id} text={bubble.text} />
      : <UserBubble key={bubble.id} text={bubble.text} />),
    [extraBubbles],
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AssistantHeader phase={phase} subtitle={subtitle} onBack={phase === 'done' ? onCancel : handleBack} />
      <ScrollView
        ref={scrollRef}
        style={styles.chatBody}
        contentContainerStyle={phase === 'done' ? styles.doneScrollContent : styles.chatContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {phase === 'done' ? (
          <DoneScreen item={item} index={index} itemLabel={itemLabel} submittedAt={submittedAt} />
        ) : phase === 'summary' && evidence ? (
          <>
            <BotBubble text="Revisa el resumen completo antes de confirmar:" />
            <SummaryCard detail={detail} item={item} index={index} itemLabel={itemLabel} evidence={evidence} description={description} summaryAt={summaryAt} />
            <BotBubble text="¿Todo correcto? Al confirmar, el hallazgo quedará como **Ejecutado** y el Admin GF e Inspector serán notificados para aprobar." />
            <View style={styles.quickOptions}><QuickOpt label="Editar algo" icon="pen" onPress={editSummary} /></View>
          </>
        ) : (
          <>
            <BotBubble text={`¡Hola! 👋 Iniciaste el flujo asistido para ejecutar la **${itemLabel} ${index + 1}**. Revisa los detalles antes de continuar:`} />
            <FindingContextCard item={item} index={index} itemLabel={itemLabel} />
            <SlaContextCard item={item} />
            {renderedBubbles}
            {phase === 'details' ? (
              <>
                <BotBubble text="¿Estás listo para registrar tu respuesta?" />
                <View style={styles.quickOptions}>
                  <QuickOpt label="Sí, iniciar respuesta" icon="arrow-right" variant="teal" onPress={startResponse} />
                  <QuickOpt label="Tengo una consulta" icon="search" onPress={askQuestion} />
                </View>
              </>
            ) : null}
            {phase === 'response' ? (
              <>
                <BotBubble text="Perfecto. Completa tu respuesta: sube la foto **Después** y describe la acción que tomaste." />
                <ResponseCard
                  item={item}
                  evidence={evidence}
                  suggestion={suggestion}
                  editing={editing}
                  accepted={accepted}
                  description={description}
                  onPhoto={() => setPhotoSheetVisible(true)}
                  onAccept={acceptSuggestion}
                  onEdit={() => {
                    setEditing(true);
                    setAccepted(false);
                    setAcknowledgement(null);
                  }}
                  onDescriptionChange={(value) => {
                    setDescription(value);
                    setAccepted(false);
                    setAcknowledgement(null);
                  }}
                  onSaveDescription={saveDescription}
                />
                {loadingSuggestion ? <TypingIndicator /> : null}
                {evidence && suggestion && !loadingSuggestion ? <BotBubble text={photoReceivedText} /> : null}
                {accepted && acknowledgement ? <UserBubble text={acknowledgement} /> : null}
                {accepted ? (
                  <View style={styles.continueWrap}>
                    <TouchableOpacity style={[styles.continueButton, !canConfirm && styles.continueButtonDisabled]} onPress={showSummary} disabled={!canConfirm}>
                      <Feather name="arrow-right" size={12} color={colors.white} />
                      <Text style={styles.continueButtonText}>Continuar al resumen</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      {phase === 'done' ? (
        <View style={styles.doneFooter}>
          <TouchableOpacity style={styles.doneButton} onPress={onFinish}>
            <Feather name="arrow-left" size={14} color={colors.navy} />
            <Text style={styles.doneButtonText}>Volver a observaciones</Text>
          </TouchableOpacity>
          <View style={styles.homeIndicator} />
        </View>
      ) : phase === 'summary' ? (
        <View style={styles.summaryFooter}>
          <TouchableOpacity style={[styles.summaryConfirmButton, !canConfirm && styles.continueButtonDisabled]} onPress={() => { void confirmExecution(); }} disabled={!canConfirm}>
            {submitting || pending ? <ActivityIndicator size="small" color={colors.white} /> : <Feather name="check" size={15} color={colors.white} />}
            <Text style={styles.summaryConfirmText}>{submitting || pending ? 'Guardando…' : 'Confirmar ejecución'}</Text>
          </TouchableOpacity>
          <View style={styles.homeIndicator} />
        </View>
      ) : (
        <ChatInput onSend={sendFreeText} disabled={pending || submitting} />
      )}

      <PhotoSourceSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        onCamera={() => { void pick('camera'); }}
        onGallery={() => { void pick('gallery'); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  headerWrapper: { backgroundColor: colors.navyDark },
  headerBar: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  headerBack: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, paddingHorizontal: 4 },
  headerTitle: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.semibold },
  headerSubtitle: { marginTop: 1, color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 14 },
  headerStatusDot: { color: colors.teal, fontSize: 10 },
  eeccBadge: { minHeight: 22, borderRadius: 16, backgroundColor: colors.teal, justifyContent: 'center', paddingHorizontal: 10 },
  eeccBadgeText: { color: colors.white, fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  headerMenu: { width: 36, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  headerProgress: { paddingHorizontal: 16, paddingTop: 7, paddingBottom: 7 },
  headerProgressBars: { flexDirection: 'row', gap: 3, marginBottom: 5 },
  headerProgressBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  headerProgressDone: { backgroundColor: colors.teal },
  headerProgressActive: { backgroundColor: 'rgba(0,179,152,0.45)' },
  headerProgressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  headerProgressText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, lineHeight: 11, fontWeight: fontWeight.semibold },
  chatBody: { flex: 1, backgroundColor: colors.surface },
  chatContent: { paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 24 },
  doneScrollContent: { flexGrow: 1 },
  indentedBlock: { marginLeft: 33, marginBottom: 10 },
  findingCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  findingCardHeader: { minHeight: 38, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 9 },
  findingCardTitle: { flex: 1, color: colors.white, fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },
  severityBadge: { minHeight: 20, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 8 },
  severityBadgeText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  beforePhoto: { height: 110, overflow: 'hidden', backgroundColor: '#D8EFF9' },
  beforePhotoImage: { width: '100%', height: '100%' },
  beforePhotoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  beforePhotoEmptyText: { color: colors.muted, fontSize: 10, lineHeight: 12 },
  beforePhotoLabel: { position: 'absolute', top: 8, left: 10, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3 },
  beforePhotoLabelText: { color: colors.white, fontSize: 9, lineHeight: 11, letterSpacing: 1.5, fontWeight: fontWeight.bold },
  beforePhotoDate: { position: 'absolute', bottom: 8, right: 10, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 7, paddingVertical: 3 },
  beforePhotoDateText: { color: 'rgba(255,255,255,0.85)', fontSize: 9, lineHeight: 11 },
  findingRows: { gap: 7, paddingHorizontal: 12, paddingVertical: 10 },
  findingRow: { flexDirection: 'row', gap: 8 },
  findingRowLabel: { width: 72, color: colors.muted, fontSize: 9, lineHeight: 12, letterSpacing: 0.45, fontWeight: fontWeight.bold },
  findingRowValue: { flex: 1, color: colors.primary, fontSize: 12, lineHeight: 17, fontWeight: fontWeight.medium },
  slaCard: { minHeight: 58, borderRadius: 10, borderWidth: 1.5, borderColor: '#E8A06A', backgroundColor: colors.ocreSurf, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  slaCopy: { flex: 1 },
  slaTitle: { color: colors.ocreTxt, fontSize: 11, lineHeight: 14, fontWeight: fontWeight.bold },
  slaSubtitle: { marginTop: 2, color: colors.ocreTxt, fontSize: 10, lineHeight: 13 },
  slaStrong: { fontWeight: fontWeight.bold },
  quickOptions: { marginLeft: 33, alignItems: 'flex-start', gap: 7, marginBottom: 10 },
  responseCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden' },
  responseHeader: { minHeight: 33, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  responseHeaderText: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 12, letterSpacing: 0.5, fontWeight: fontWeight.bold },
  responsePhotoSection: { padding: 12 },
  photoInput: { minHeight: 158, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderMid, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  photoInputIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  photoInputTitle: { marginTop: 8, color: colors.body, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  photoInputHint: { marginTop: 4, color: colors.placeholder, fontSize: 10, lineHeight: 13, textAlign: 'center' },
  photoInputActions: { width: '100%', marginTop: 10, flexDirection: 'row', gap: 8 },
  photoInputAction: { flex: 1, height: 34, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  photoInputActionText: { color: colors.body, fontSize: 11, lineHeight: 13, fontWeight: fontWeight.semibold },
  loadedPhoto: { minHeight: 58, borderRadius: 10, backgroundColor: colors.ok, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  loadedPhotoIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  loadedPhotoName: { flex: 1, color: colors.white, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  responseDescriptionSection: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  responseLabel: { marginBottom: 6, color: colors.muted, fontSize: 10, lineHeight: 12, letterSpacing: 0.5, fontWeight: fontWeight.bold },
  suggestionCard: { borderRadius: 10, borderWidth: 1.5, borderColor: colors.gold, backgroundColor: colors.white, overflow: 'hidden' },
  suggestionHeader: { minHeight: 31, borderBottomWidth: 1, borderBottomColor: 'rgba(200,160,100,0.2)', backgroundColor: '#FAE8C8', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7 },
  suggestionHeaderText: { flex: 1, color: colors.goldDark, fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  mockBadge: { minHeight: 16, borderRadius: 4, backgroundColor: colors.gold, justifyContent: 'center', paddingHorizontal: 6 },
  mockBadgeText: { color: colors.navy, fontSize: 8, lineHeight: 10, fontWeight: fontWeight.bold },
  suggestionText: { color: colors.primary, fontSize: 12, lineHeight: 18, fontWeight: fontWeight.medium, paddingHorizontal: 12, paddingVertical: 10 },
  suggestionActions: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 10 },
  editButton: { height: 34, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 12 },
  editButtonText: { color: colors.body, fontSize: 12, lineHeight: 14, fontWeight: fontWeight.semibold },
  disabledText: { color: colors.placeholder },
  acceptButton: { flex: 1, height: 34, borderRadius: 8, backgroundColor: colors.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  acceptButtonDisabled: { backgroundColor: 'rgba(0,179,152,0.5)' },
  acceptButtonText: { color: colors.white, fontSize: 12, lineHeight: 14, fontWeight: fontWeight.bold },
  descriptionInput: { minHeight: 86, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: colors.white, color: colors.primary, fontSize: 12, lineHeight: 18, paddingHorizontal: 12, paddingVertical: 10 },
  saveDescriptionButton: { marginTop: 8, height: 36, borderRadius: 8, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  saveDescriptionText: { color: colors.white, fontSize: 12, lineHeight: 14, fontWeight: fontWeight.bold },
  responseEmptyText: { color: colors.placeholder, fontSize: 11, lineHeight: 16 },
  continueWrap: { marginLeft: 33, alignItems: 'flex-start', marginBottom: 10 },
  continueButton: { minHeight: 34, borderRadius: 20, backgroundColor: colors.teal, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7 },
  continueButtonDisabled: { opacity: 0.55 },
  continueButtonText: { color: colors.white, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.semibold },
  summaryCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  summaryHeader: { minHeight: 36, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  summaryHeaderTitle: { flex: 1, color: colors.white, fontSize: 11, lineHeight: 14, fontWeight: fontWeight.bold },
  summaryStatus: { minHeight: 18, borderRadius: 5, backgroundColor: colors.tealSurf, justifyContent: 'center', paddingHorizontal: 7, marginLeft: 8 },
  summaryStatusText: { color: colors.tealTxt, fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  summaryPhotos: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  summaryPhotoBox: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  summaryPhotoLabel: { minHeight: 21, backgroundColor: colors.navy, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  summaryPhotoLabelText: { color: 'rgba(255,255,255,0.72)', fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  summaryPhotoBody: { height: 80, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  summaryPhotoBefore: { backgroundColor: '#D8EFF9' },
  summaryPhotoAfter: { backgroundColor: '#D9F8C8' },
  summaryPhotoImage: { width: '100%', height: '100%' },
  summaryPhotoPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  summaryPhotoBeforeText: { color: colors.muted, fontSize: 9, lineHeight: 11 },
  summaryRow: { minHeight: 37, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 12, paddingVertical: 8 },
  summaryRowLabel: { width: 80, color: colors.muted, fontSize: 10, lineHeight: 15, fontWeight: fontWeight.medium },
  summaryRowValueWrap: { flex: 1, minWidth: 0, justifyContent: 'center' },
  summaryRowValue: { color: colors.primary, fontSize: 11, lineHeight: 15, fontWeight: fontWeight.semibold },
  summarySeverity: { alignSelf: 'flex-start', minHeight: 18, borderRadius: 5, justifyContent: 'center', paddingHorizontal: 7 },
  summarySeverityText: { fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  summaryAction: { gap: 4, paddingHorizontal: 12, paddingVertical: 8 },
  summaryActionLabel: { color: colors.muted, fontSize: 10, lineHeight: 13, fontWeight: fontWeight.medium },
  summaryActionText: { color: colors.primary, fontSize: 11, lineHeight: 17 },
  summaryFooter: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  summaryConfirmButton: { height: 48, borderRadius: 14, backgroundColor: colors.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  summaryConfirmText: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
  doneBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  doneIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', shadowColor: colors.teal, shadowOpacity: 0.32, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  doneTitle: { marginTop: 18, color: colors.teal, fontSize: 20, lineHeight: 24, fontWeight: fontWeight.bold },
  doneDescription: { maxWidth: 280, marginTop: 14, color: colors.muted, fontSize: 13, lineHeight: 21, textAlign: 'center' },
  doneStrong: { color: colors.primary, fontWeight: fontWeight.bold },
  doneTeal: { color: colors.teal, fontWeight: fontWeight.bold },
  notificationCard: { width: '100%', maxWidth: 300, marginTop: 18, borderRadius: 12, borderWidth: 1.5, borderColor: colors.teal, backgroundColor: colors.tealSurf, paddingHorizontal: 16, paddingVertical: 14 },
  notificationHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  notificationIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  notificationTitle: { color: colors.tealTxt, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  notificationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  notificationCopy: { flex: 1 },
  notificationPerson: { color: colors.tealTxt, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  notificationMeta: { marginTop: 1, color: colors.tealTxt, fontSize: 10, lineHeight: 14 },
  notificationDivider: { height: 1, marginVertical: 10, backgroundColor: 'rgba(0,179,152,0.35)' },
  doneMetrics: { width: '100%', maxWidth: 300, marginTop: 14, flexDirection: 'row', gap: 8 },
  doneMetric: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', padding: 10 },
  doneMetricValue: { color: colors.primary, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
  doneMetricTime: { color: colors.teal },
  doneMetricLabel: { marginTop: 2, color: colors.muted, fontSize: 9, lineHeight: 11 },
  doneBrand: { marginTop: 14, color: colors.placeholder, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  doneFooter: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  doneButton: { height: 48, borderRadius: 14, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  doneButtonText: { color: colors.navy, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
  homeIndicator: { alignSelf: 'center', width: 120, height: 4, marginTop: 10, borderRadius: 2, backgroundColor: colors.borderMid },
});
