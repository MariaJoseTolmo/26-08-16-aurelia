import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type {
  InspectionDetailEvidenceResponse,
  InspectionDetailFindingItemResponse,
  InspectionDetailResponse,
} from '@aurelia/contracts';
import { API_URL } from '../../shared/services/http-client';
import { PhotoSourceSheet } from '../../shared/components/form/PhotoSourceSheet';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { useMobileSession } from '../auth/mobileSession.store';
import type { MobileFindingEvidenceInput } from './hooks/useMobileInspectionManagement';

type ExecutionStage = 'mode' | 'detail' | 'summary' | 'success';

type Props = {
  visible: boolean;
  detail: InspectionDetailResponse;
  item: InspectionDetailFindingItemResponse;
  index: number;
  itemLabel: 'Obs.' | 'Ítem';
  pending: boolean;
  canReview: boolean;
  onClose: () => void;
  onFinish: () => void;
  onSubmit: (description: string, evidence: MobileFindingEvidenceInput) => Promise<void>;
};

const apiOrigin = API_URL.replace(/\/api\/?$/, '');
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];

function evidenceUrl(evidence: InspectionDetailEvidenceResponse | undefined): string | null {
  if (!evidence) return null;
  if (evidence.fileId) return `${apiOrigin}/api/files/${encodeURIComponent(evidence.fileId)}/content`;
  if (!evidence.url) return null;
  if (evidence.url.startsWith('http')) return evidence.url;
  if (evidence.url.startsWith('/api/')) return `${apiOrigin}${evidence.url}`;
  return evidence.url;
}

function formatDateTime(value: string | null | undefined): string {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Sin fecha registrada';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()} · ${hours}:${minutes}`;
}

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatDueDate(value: string | null | undefined): string {
  if (!value) return 'Sin fecha límite';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha límite';
  return `${weekDays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function severityColors(label: string): { background: string; color: string } {
  const normalized = label.toLowerCase();
  if (normalized.includes('crít') || normalized.includes('crit') || normalized.includes('grave')) {
    return { background: colors.dangerSurf, color: colors.dangerTxt };
  }
  if (normalized.includes('alto')) return { background: colors.ocreSurf, color: colors.ocreTxt };
  if (normalized.includes('moder')) return { background: '#fbe1d0', color: '#69462e' };
  return { background: colors.successSurf, color: colors.successTxt };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'NA';
}

function DetailTextBlock({ label, value, bordered = false }: { label: string; value: string | null; bordered?: boolean }) {
  return (
    <View style={[styles.textBlock, bordered && styles.textBlockBordered]}>
      <Text style={styles.textBlockLabel}>{label}</Text>
      <Text style={styles.textBlockValue}>{value?.trim() || '—'}</Text>
    </View>
  );
}

function Stepper({ stage }: { stage: Extract<ExecutionStage, 'detail' | 'summary'> }) {
  const activeIndex = stage === 'detail' ? 0 : 1;
  const steps = ['Detalle', 'Resumen', 'Confirm.'];
  return (
    <View style={styles.stepper}>
      <View style={styles.stepperRow}>
        {steps.map((label, index) => {
          const completed = index < activeIndex;
          const active = index === activeIndex;
          return (
            <View key={label} style={styles.stepItem}>
              {index < steps.length - 1 ? <View style={styles.stepLine} /> : null}
              <View style={[styles.stepCircle, completed && styles.stepCircleCompleted, active && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, completed && styles.stepNumberCompleted, active && styles.stepNumberActive]}>
                  {completed ? '✓' : index + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, (completed || active) && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.stepperRail}>
        <View style={[styles.stepperRailFill, { width: stage === 'summary' ? '33%' : '0%' }]} />
      </View>
    </View>
  );
}

function EvidencePhoto({
  evidence,
  title,
}: {
  evidence: InspectionDetailEvidenceResponse | undefined;
  title: string;
}) {
  const token = useMobileSession((state) => state.accessToken);
  const uri = evidenceUrl(evidence);
  return (
    <View style={styles.evidencePhoto}>
      {uri ? (
        <Image
          source={{ uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
          style={styles.evidencePhotoImage}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.photoLabel}><Text style={styles.photoLabelText}>{title}</Text></View>
      <View style={styles.photoDate}><Text style={styles.photoDateText}>{formatDateTime(evidence?.capturedAt)}</Text></View>
    </View>
  );
}

function ScreenHeader({
  success,
  inspectionNumber,
  areaLabel,
  roleBadge,
  onBack,
}: {
  success: boolean;
  inspectionNumber: string;
  areaLabel: string;
  roleBadge: string;
  onBack: () => void;
}) {
  return (
    <>
      <View style={styles.header}>
        {!success ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Volver al detalle">
            <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.92)" />
          </TouchableOpacity>
        ) : null}
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{success ? 'Guardado' : 'Detalle del hallazgo'}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={2}>
            {success ? 'SGA · Gold Fields Salares Norte' : `Paso 2 de 4 · ${inspectionNumber} · ${areaLabel}`}
          </Text>
        </View>
        <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{success ? 'GF HSE' : roleBadge}</Text></View>
      </View>
      <View style={styles.offlineBanner}>
        <Feather name="wifi-off" size={11} color={colors.gold} />
        <Text style={styles.offlineText}>Sin red · guardando localmente</Text>
      </View>
    </>
  );
}

function LoadedEvidenceChip({ filename, onPress }: { filename: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.loadedEvidenceChip} onPress={onPress} activeOpacity={0.84}>
      <View style={styles.loadedEvidenceIcon}>
        <Feather name="camera" size={14} color={colors.white} />
      </View>
      <Text style={styles.loadedEvidenceName} numberOfLines={1}>{filename}</Text>
    </TouchableOpacity>
  );
}

function ExecutionModeSelection({
  locationLabel,
  onBack,
  onManual,
}: {
  locationLabel: string;
  onBack: () => void;
  onManual: () => void;
}) {
  return (
    <>
      <View style={styles.modeHeader}>
        <TouchableOpacity style={styles.modeBackButton} onPress={onBack} accessibilityLabel="Volver a la inspección">
          <Feather name="arrow-left" size={22} color="rgba(255,255,255,0.92)" />
        </TouchableOpacity>
        <View style={styles.modeHeaderCopy}>
          <Text style={styles.modeHeaderTitle}>Hallazgo</Text>
          <Text style={styles.modeHeaderSubtitle} numberOfLines={1}>{locationLabel}</Text>
        </View>
        <View style={styles.modeHeaderSpacer} />
      </View>

      <ScrollView
        style={styles.modeBody}
        contentContainerStyle={styles.modeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modeIntro}>
          <Text style={styles.modeQuestion}>¿Cómo deseas ejecutar este hallazgo?</Text>
          <Text style={styles.modeSubtitle}>Puedes usar el asistente IA o el formulario manual</Text>
        </View>

        <View style={styles.assistantCard}>
          <View style={styles.modeCardHeader}>
            <View style={styles.assistantIcon}>
              <FontAwesome5 name="microchip" size={24} color={colors.white} />
            </View>
            <View style={styles.modeCardTitleCopy}>
              <Text style={styles.assistantTitle}>Asistente AurelIA</Text>
              <Text style={styles.modeCardSubtitle}>Modo conversacional con IA</Text>
            </View>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>RECOMENDADO</Text>
            </View>
          </View>

          <Text style={styles.assistantDescription}>
            El asistente te guía con preguntas simples, propone acción correctiva basada en el historial de la faena y reduce el tiempo de registro.
          </Text>

          <View style={styles.benefitList}>
            <View style={styles.benefitRow}>
              <Feather name="check" size={13} color={colors.successTxt} />
              <Text style={styles.benefitText}>Acción correctiva sugerida por IA</Text>
            </View>
            <View style={styles.benefitRow}>
              <Feather name="check" size={13} color={colors.successTxt} />
              <Text style={styles.benefitText}>Funciona online y offline</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.assistantButton}
            disabled
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel="Iniciar con asistente, disponible en una próxima iteración"
          >
            <FontAwesome5 name="magic" size={14} color={colors.navy} />
            <Text style={styles.assistantButtonText}>Iniciar con asistente</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.manualCard}>
          <View style={styles.modeCardHeader}>
            <View style={styles.manualIcon}>
              <FontAwesome5 name="clipboard-list" size={20} color={colors.muted} />
            </View>
            <View style={styles.modeCardTitleCopy}>
              <Text style={styles.manualTitle}>Formulario manual</Text>
              <Text style={styles.modeCardSubtitle}>Wizard de 5 pasos</Text>
            </View>
          </View>

          <Text style={styles.manualDescription}>
            Completa el formulario paso a paso como siempre. Sin asistencia de IA.
          </Text>

          <TouchableOpacity style={styles.manualButton} onPress={onManual} accessibilityRole="button">
            <Text style={styles.manualButtonText}>Usar formulario manual</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.modeFooter}>
        <TouchableOpacity style={styles.modeCancelButton} onPress={onBack} accessibilityRole="button">
          <Text style={styles.modeCancelText}>Cancelar inspección</Text>
        </TouchableOpacity>
        <View style={styles.homeIndicator} />
      </View>
    </>
  );
}

export function MobileFindingExecutionModal({
  visible,
  detail,
  item,
  index,
  itemLabel,
  pending,
  canReview,
  onClose,
  onFinish,
  onSubmit,
}: Props) {
  const [stage, setStage] = useState<ExecutionStage>('mode');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<MobileFindingEvidenceInput | null>(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [executionDate, setExecutionDate] = useState(new Date());
  const severity = severityColors(item.severityLabel);
  const valid = Boolean(evidence && description.trim().length > 0 && !pending);
  const inspectionNumber = detail.header.inspectionNumber.replace(/^#/, '');
  const areaLabel = detail.general.areaName?.trim() || detail.general.sectorName?.trim() || 'Sin área';
  const locationLabel = detail.general.locationLabel?.trim() || detail.general.sectorName?.trim() || detail.general.areaName?.trim() || 'Sin ubicación';
  const roleBadge = canReview ? 'GF HSE' : 'EECC';
  const riskLabel = `Riesgo ${item.severityLabel.toLowerCase()} · SLA extendido por Admin GF`;
  const isRejected = item.statusGroup === 'rejected';
  const responsible = useMemo(
    () => detail.general.responsibles.find((candidate) => candidate.currentUser) ?? detail.general.responsibles[0],
    [detail.general.responsibles],
  );

  useEffect(() => {
    if (!visible) return;
    setStage('mode');
    setDescription('');
    setEvidence(null);
    setPhotoSheetVisible(false);
    setExecutionDate(new Date());
  }, [item.findingId, visible]);

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
    setEvidence({
      uri: asset.uri,
      filename: asset.fileName ?? `evidencia-despues-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  }

  async function sendToAdmin() {
    if (!evidence || !description.trim()) return;
    try {
      await onSubmit(description.trim(), evidence);
      setStage('success');
    } catch (error) {
      Alert.alert('No se pudo enviar la corrección', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  }

  function handleBack() {
    if (stage === 'summary') {
      setStage('detail');
      return;
    }
    if (stage === 'detail') {
      setStage('mode');
      return;
    }
    onClose();
  }

  function handleRequestClose() {
    if (stage === 'success') {
      onFinish();
      return;
    }
    handleBack();
  }

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={handleRequestClose}>
      <View style={[styles.screen, stage === 'mode' && styles.modeScreen]}>
        {stage === 'mode' ? (
          <ExecutionModeSelection
            locationLabel={locationLabel}
            onBack={onClose}
            onManual={() => setStage('detail')}
          />
        ) : null}

        {stage !== 'mode' ? (
          <ScreenHeader
            success={stage === 'success'}
            inspectionNumber={inspectionNumber}
            areaLabel={areaLabel}
            roleBadge={roleBadge}
            onBack={handleBack}
          />
        ) : null}

        {stage === 'success' ? (
          <View style={styles.successProgress}><View style={styles.successProgressFill} /></View>
        ) : stage === 'detail' || stage === 'summary' ? (
          <Stepper stage={stage} />
        ) : null}

        {stage === 'detail' ? (
          <>
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.findingCard}>
                <View style={styles.findingTop}>
                  <View style={styles.pillRow}>
                    <View style={styles.indexPill}><Text style={styles.indexPillText}>{itemLabel} {index + 1}</Text></View>
                    <View style={[styles.severityPill, { backgroundColor: severity.background }]}>
                      <Text style={[styles.severityPillText, { color: severity.color }]}>{item.severityLabel}</Text>
                    </View>
                  </View>
                  <View style={styles.statusPill}>
                    <FontAwesome5 name="circle" size={7} color={colors.muted} solid />
                    <Text style={styles.statusPillText}>{isRejected ? 'Rechazada' : 'Abierta'}</Text>
                  </View>
                </View>

                <View style={styles.findingContent}>
                  <EvidencePhoto evidence={item.beforeEvidence[0]} title="FOTO ANTES" />
                  <DetailTextBlock label="CONDICIÓN DETECTADA" value={item.condition} bordered />
                  <DetailTextBlock label="MEDIDA CORRECTIVA PROPUESTA" value={item.proposedCorrectiveAction} />
                  {isRejected ? <DetailTextBlock label="MOTIVO DE RECHAZO" value={item.rejectionReason} /> : null}

                  <View style={styles.answerPanel}>
                    <Text style={styles.answerTitle}>TU RESPUESTA</Text>
                    {isRejected && item.afterEvidence[0] ? (
                      <EvidencePhoto evidence={item.afterEvidence[0]} title="FOTO DESPUÉS" />
                    ) : null}

                    <Text style={styles.fieldLabel}>{isRejected ? 'Reemplazar foto “Después”' : 'Fotografía “Después” *'}</Text>
                    {evidence ? (
                      <LoadedEvidenceChip filename={evidence.filename} onPress={() => setPhotoSheetVisible(true)} />
                    ) : (
                      <TouchableOpacity
                        style={styles.photoInput}
                        onPress={() => setPhotoSheetVisible(true)}
                        activeOpacity={0.82}
                      >
                        <Text style={styles.cameraEmoji}>📷</Text>
                        <Text style={styles.photoInputTitle}>Tomar foto o galería</Text>
                        <Text style={styles.photoInputHint}>Fecha, hora y GPS automáticos</Text>
                      </TouchableOpacity>
                    )}

                    {isRejected ? (
                      <DetailTextBlock
                        label="DESCRIPCIÓN DE LA ACCIÓN TOMADA"
                        value={item.executedActionDescription}
                        bordered
                      />
                    ) : null}

                    <Text style={[styles.fieldLabel, styles.descriptionLabel]}>
                      {isRejected ? 'Describa la corrección *' : 'Descripción de la acción tomada *'}
                    </Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      placeholder="Describa la acción correctiva ejecutada..."
                      placeholderTextColor="#757575"
                      style={styles.descriptionInput}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.slaCard}>
                <Text style={styles.slaLabel}>FECHA LÍMITE SLA</Text>
                <Text style={styles.slaValue}>{formatDueDate(item.dueAt)} <Text style={styles.slaMeta}>{riskLabel}</Text></Text>
              </View>

              {!evidence ? (
                <View style={styles.blockerCard}>
                  <Text style={styles.blockerText}><Text style={styles.blockerStrong}>BLOQUEANTE:</Text> Debes adjuntar fotografía "Después" en la observación. Sin foto no es posible marcar como Ejecutado.</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={valid ? () => setStage('mode') : onClose}
                  disabled={pending}
                >
                  {valid ? <Feather name="arrow-left" size={14} color={colors.gold} /> : null}
                  <Text style={styles.secondaryButtonText}>{valid ? 'Atrás' : 'Cancelar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, !valid && styles.submitButtonDisabled]}
                  onPress={() => setStage('summary')}
                  disabled={!valid}
                >
                  <Text style={[styles.submitButtonText, !valid && styles.submitButtonTextDisabled]}>Marcar como ejecutado</Text>
                  <Feather name="arrow-right" size={14} color={valid ? colors.white : colors.placeholder} />
                </TouchableOpacity>
              </View>
              <View style={styles.homeIndicator} />
            </View>
          </>
        ) : null}

        {stage === 'summary' ? (
          <>
            <ScrollView style={styles.summaryBody} contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <Feather name="user" size={11} color={colors.muted} />
                  <Text style={styles.summaryCardTitle}>RESPONSABLES</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Fecha ejecución</Text>
                  <Text style={styles.summaryRowValue}>{formatDate(executionDate)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>EECC</Text>
                  <Text style={styles.summaryRowValue}>{detail.general.companyName ?? '—'}</Text>
                </View>
                {responsible ? (
                  <View style={styles.responsibleRow}>
                    <View style={styles.responsibleAvatar}><Text style={styles.responsibleAvatarText}>{initials(responsible.fullName)}</Text></View>
                    <View style={styles.responsibleCopy}>
                      <Text style={styles.responsibleName}>{responsible.fullName}</Text>
                      <Text style={styles.responsibleRole}>{responsible.position ?? responsible.companyName ?? 'Sin cargo'}</Text>
                    </View>
                    {responsible.currentUser ? <View style={styles.youPill}><Text style={styles.youPillText}>Tú</Text></View> : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <Feather name="list" size={11} color={colors.muted} />
                  <Text style={styles.summaryCardTitle}>CORRECCIÓN</Text>
                </View>
                <View style={styles.correctionBody}>
                  <View style={styles.correctionTop}>
                    <View style={styles.pillRow}>
                      <View style={styles.indexPill}><Text style={styles.indexPillText}>{itemLabel} {index + 1}</Text></View>
                      <View style={[styles.severityPill, { backgroundColor: severity.background }]}>
                        <Text style={[styles.severityPillText, { color: severity.color }]}>{item.severityLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.respondedPill}><Text style={styles.respondedPillText}>RESPONDIDA</Text></View>
                  </View>
                  <Text style={styles.correctionDescription}>{description.trim()}</Text>
                  <View style={styles.correctionBulletRow}>
                    <Text style={styles.correctionBullet}>•</Text>
                    <Text style={styles.correctionBulletText}>{isRejected ? 'Se ha reemplazado la fotografía' : 'Se ha adjuntado la fotografía de cierre'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardText}>Al enviar, el Admin GF HSE recibirá una alerta para validar cada observación. Solo el Admin GF puede cambiar el estado a Cerrado definitivamente.</Text>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.footerButtons}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setStage('detail')} disabled={pending}>
                  <Feather name="arrow-left" size={14} color={colors.gold} />
                  <Text style={styles.secondaryButtonText}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendButton} onPress={() => { void sendToAdmin(); }} disabled={pending}>
                  {pending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Text style={styles.sendButtonText}>Enviar al ADMIN GF</Text>
                      <Feather name="arrow-right" size={14} color={colors.white} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.homeIndicator} />
            </View>
          </>
        ) : null}

        {stage === 'success' ? (
          <View style={styles.successBody}>
            <View style={styles.successIcon}>
              <Feather name="check" size={34} color={colors.white} />
            </View>
            <Text style={styles.successTitle}>Corrección de observación{`\n`}marcado como ejecutado</Text>
            <View style={styles.successAlert}>
              <Text style={styles.successAlertText}>Evidencia enviada. El Admin GF HSE ha recibido una alerta para revisar y validar el cierre definitivo de la observación.</Text>
            </View>
            <View style={styles.nextStepCard}>
              <Text style={styles.nextStepTitle}>Próximo paso — Admin GF</Text>
              <Text style={styles.nextStepText}>El Admin GF revisará cada fotografía de cierre. Si cumple el estándar, cambiará el estado a <Text style={styles.nextStepStrong}>Cerrado</Text>. Si no cumple, recibirás notificación de rechazo y el plazo se reactivará obs. por obs.</Text>
            </View>
            <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
              <Text style={styles.finishButtonText}>Ir a Mis hallazgos</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <PhotoSourceSheet
          visible={photoSheetVisible}
          onClose={() => setPhotoSheetVisible(false)}
          onCamera={() => { void pick('camera'); }}
          onGallery={() => { void pick('gallery'); }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f7f7' },
  modeScreen: { backgroundColor: '#f4f6f9' },
  modeHeader: { minHeight: 56, backgroundColor: '#002659', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  modeBackButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  modeHeaderCopy: { flex: 1, paddingHorizontal: 4 },
  modeHeaderTitle: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.semibold },
  modeHeaderSubtitle: { marginTop: 1, color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 14 },
  modeHeaderSpacer: { width: 48 },
  modeBody: { flex: 1, backgroundColor: '#f4f6f9' },
  modeContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, gap: 20 },
  modeIntro: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  modeQuestion: { color: colors.primary, fontSize: 18, lineHeight: 23.4, textAlign: 'center', fontWeight: fontWeight.bold },
  modeSubtitle: { marginTop: 6, color: colors.muted, fontSize: 13, lineHeight: 18.2, textAlign: 'center' },
  assistantCard: { borderRadius: 16, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.white, padding: 22, shadowColor: colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  modeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assistantIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#a77d3e', alignItems: 'center', justifyContent: 'center' },
  modeCardTitleCopy: { flex: 1, minWidth: 0 },
  assistantTitle: { color: '#8e6e3e', fontSize: 15, lineHeight: 18, fontWeight: fontWeight.bold },
  modeCardSubtitle: { marginTop: 2, color: colors.muted, fontSize: 11, lineHeight: 14 },
  recommendedBadge: { minHeight: 20, borderRadius: 4, backgroundColor: colors.gold, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 3 },
  recommendedText: { color: colors.navy, fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  assistantDescription: { marginTop: 12, color: colors.body, fontSize: 12, lineHeight: 19.2 },
  benefitList: { marginTop: 12, gap: 5 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  benefitText: { flex: 1, color: colors.successTxt, fontSize: 11, lineHeight: 14 },
  assistantButton: { height: 46, marginTop: 14, borderRadius: 12, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  assistantButtonText: { color: colors.navy, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
  manualCard: { borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, padding: 21.5 },
  manualIcon: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: '#f4f6f9', alignItems: 'center', justifyContent: 'center' },
  manualTitle: { color: colors.primary, fontSize: 15, lineHeight: 18, fontWeight: fontWeight.bold },
  manualDescription: { marginTop: 10, marginBottom: 12, color: colors.muted, fontSize: 12, lineHeight: 18 },
  manualButton: { height: 42, borderRadius: 12, borderWidth: 2, borderColor: colors.borderMid, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  manualButtonText: { color: colors.body, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.semibold },
  modeFooter: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },
  modeCancelButton: { height: 50, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  modeCancelText: { color: colors.gold, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
  header: { minHeight: 56, backgroundColor: '#002659', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  backButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, paddingHorizontal: 4 },
  headerTitle: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.semibold },
  headerSubtitle: { marginTop: 1, color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 14 },
  roleBadge: { minHeight: 20, marginRight: 4, borderRadius: 16, backgroundColor: colors.gold, justifyContent: 'center', paddingHorizontal: 10 },
  roleBadgeText: { color: colors.navy, fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  offlineBanner: { minHeight: 25, borderBottomWidth: 1, borderBottomColor: colors.gold, backgroundColor: '#2a1a04', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingTop: 5, paddingBottom: 6 },
  offlineText: { color: colors.gold, fontSize: 11, lineHeight: 13, fontWeight: fontWeight.semibold },
  stepper: { minHeight: 89, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 9 },
  stepperRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { flex: 1, height: 35, alignItems: 'center' },
  stepLine: { position: 'absolute', top: 10, left: '50%', width: '100%', height: 2, backgroundColor: colors.borderMid },
  stepCircle: { zIndex: 1, width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  stepCircleCompleted: { borderColor: colors.gold, backgroundColor: colors.gold },
  stepCircleActive: { borderWidth: 2, borderColor: colors.gold },
  stepNumber: { color: colors.placeholder, fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  stepNumberCompleted: { color: colors.white },
  stepNumberActive: { color: colors.gold },
  stepLabel: { marginTop: 3, color: colors.placeholder, fontSize: 8, lineHeight: 10 },
  stepLabelActive: { color: colors.goldDark, fontWeight: fontWeight.bold },
  stepperRail: { height: 2, marginTop: 6, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  stepperRailFill: { height: 2, borderRadius: 2, backgroundColor: colors.gold },
  successProgress: { minHeight: 28, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 14 },
  successProgressFill: { height: 2, borderRadius: 2, backgroundColor: colors.gold },
  body: { flex: 1, backgroundColor: '#f7f7f7' },
  bodyContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, gap: 12 },
  findingCard: { borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#f7f7f7', padding: 13.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 1.5, elevation: 1 },
  findingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  indexPill: { minHeight: 19, borderRadius: 6, backgroundColor: colors.blueSurf, justifyContent: 'center', paddingHorizontal: 8 },
  indexPillText: { color: colors.blueLink, fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },
  severityPill: { minHeight: 19, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  severityPillText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  statusPill: { minHeight: 19, borderRadius: 6, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillText: { color: colors.muted, fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  findingContent: { marginTop: 12, gap: 4 },
  evidencePhoto: { height: 80, borderRadius: 8, overflow: 'hidden', backgroundColor: '#142d50' },
  evidencePhotoImage: { width: '100%', height: '100%' },
  photoLabel: { position: 'absolute', top: 6, left: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 2 },
  photoLabelText: { color: colors.white, fontSize: 9, lineHeight: 11, letterSpacing: 1.5, fontWeight: fontWeight.bold },
  photoDate: { position: 'absolute', right: 8, bottom: 6, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2 },
  photoDateText: { color: 'rgba(255,255,255,0.8)', fontSize: 9, lineHeight: 11 },
  textBlock: { borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 8 },
  textBlockBordered: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 9 },
  textBlockLabel: { color: colors.muted, fontSize: 9, lineHeight: 11, letterSpacing: 1.5, fontWeight: fontWeight.bold },
  textBlockValue: { marginTop: 3, color: colors.primary, fontSize: 12, lineHeight: 17 },
  answerPanel: { marginTop: 0, borderTopWidth: 1.5, borderTopColor: colors.gold, backgroundColor: '#fffdf7', paddingHorizontal: 12, paddingTop: 13.5, paddingBottom: 12, gap: 10 },
  answerTitle: { color: colors.goldDark, fontSize: 11, lineHeight: 13, letterSpacing: 0.66, fontWeight: fontWeight.bold },
  fieldLabel: { color: colors.primary, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold },
  photoInput: { minHeight: 118, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.borderMid, backgroundColor: '#f6faff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  cameraEmoji: { color: colors.primary, fontSize: 28, lineHeight: 32 },
  photoInputTitle: { marginTop: 6, color: colors.muted, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.semibold, textAlign: 'center' },
  photoInputHint: { marginTop: 3, color: colors.placeholder, fontSize: 11, lineHeight: 14, textAlign: 'center' },
  loadedEvidenceChip: { minHeight: 60, borderRadius: 8, backgroundColor: '#3a9b3a', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  loadedEvidenceIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  loadedEvidenceName: { flex: 1, color: colors.white, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  descriptionLabel: { marginTop: 2 },
  descriptionInput: { minHeight: 80, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#f6faff', color: colors.primary, fontSize: 13, lineHeight: 19.5, paddingHorizontal: 15.5, paddingVertical: 14.5 },
  slaCard: { minHeight: 72, marginTop: 4, borderRadius: 10, backgroundColor: colors.navy, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  slaLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 9, lineHeight: 11, letterSpacing: 2, fontWeight: fontWeight.bold },
  slaValue: { marginTop: 3, color: colors.gold, fontSize: 14, lineHeight: 19, letterSpacing: 1.5, fontWeight: fontWeight.bold },
  slaMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 16, letterSpacing: 0, fontWeight: fontWeight.regular },
  blockerCard: { borderRadius: 10, borderWidth: 1, borderColor: '#ffcd56', backgroundColor: colors.warnSurf, paddingHorizontal: 12, paddingVertical: 10 },
  blockerText: { color: colors.warnTxt, fontSize: 12, lineHeight: 18 },
  blockerStrong: { fontWeight: fontWeight.bold },
  summaryBody: { flex: 1, backgroundColor: '#f7f7f7' },
  summaryContent: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, gap: 12 },
  summaryCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  summaryCardHeader: { minHeight: 29, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#f7f7f7', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  summaryCardTitle: { color: colors.muted, fontSize: 10, lineHeight: 12, letterSpacing: 0.5, fontWeight: fontWeight.bold },
  summaryRow: { minHeight: 43, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 9 },
  summaryRowLabel: { color: colors.muted, fontSize: 12, lineHeight: 15 },
  summaryRowValue: { flexShrink: 1, color: colors.primary, fontSize: 12, lineHeight: 15, textAlign: 'right', fontWeight: fontWeight.bold },
  responsibleRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  responsibleAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  responsibleAvatarText: { color: colors.navy, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  responsibleCopy: { flex: 1 },
  responsibleName: { color: colors.primary, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.bold },
  responsibleRole: { marginTop: 1, color: colors.muted, fontSize: 11, lineHeight: 14 },
  youPill: { minHeight: 16, borderRadius: 5, backgroundColor: '#c5fff6', justifyContent: 'center', paddingHorizontal: 7 },
  youPillText: { color: colors.teal, fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  correctionBody: { gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  correctionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  respondedPill: { minHeight: 20, borderRadius: 99, backgroundColor: colors.successSurf, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 4 },
  respondedPillText: { color: colors.successTxt, fontSize: 10, lineHeight: 12, letterSpacing: 1, fontWeight: fontWeight.bold },
  correctionDescription: { color: colors.primary, fontSize: 12, lineHeight: 17 },
  correctionBulletRow: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
  correctionBullet: { color: colors.primary, fontSize: 15, lineHeight: 17 },
  correctionBulletText: { flex: 1, color: colors.primary, fontSize: 12, lineHeight: 17 },
  infoCard: { borderRadius: 10, backgroundColor: colors.blueSurf, paddingHorizontal: 11, paddingVertical: 9 },
  infoCardText: { color: '#0d3862', fontSize: 12, lineHeight: 18 },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, paddingTop: 10, paddingBottom: 8 },
  footerButtons: { flexDirection: 'row', gap: 10, paddingHorizontal: 14 },
  secondaryButton: { minWidth: 105, height: 50, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  secondaryButtonText: { color: colors.gold, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
  submitButton: { flex: 1, minWidth: 0, height: 50, borderRadius: 14, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  submitButtonDisabled: { backgroundColor: colors.borderMid },
  submitButtonText: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold, textAlign: 'center' },
  submitButtonTextDisabled: { color: colors.placeholder },
  sendButton: { flex: 1, minWidth: 0, height: 50, borderRadius: 14, backgroundColor: '#3a9b3a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  sendButtonText: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold, textAlign: 'center' },
  homeIndicator: { alignSelf: 'center', width: 120, height: 4, marginTop: 12, marginBottom: 4, borderRadius: 2, backgroundColor: colors.borderMid },
  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24, paddingBottom: 70 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#3a9b3a', alignItems: 'center', justifyContent: 'center' },
  successTitle: { maxWidth: 284, color: '#3a9b3a', fontSize: 18, lineHeight: 22, textAlign: 'center', fontWeight: fontWeight.bold },
  successAlert: { width: '100%', borderRadius: 10, borderWidth: 1, borderColor: '#6cc24a', backgroundColor: colors.successSurf, paddingHorizontal: 12, paddingVertical: 10 },
  successAlertText: { color: colors.successTxt, fontSize: 12, lineHeight: 18 },
  nextStepCard: { width: '100%', borderRadius: 12, backgroundColor: '#f7f7f7', padding: 14 },
  nextStepTitle: { color: colors.primary, fontSize: 13, lineHeight: 16, textAlign: 'center', fontWeight: fontWeight.bold },
  nextStepText: { marginTop: 4, color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  nextStepStrong: { color: colors.primary, fontWeight: fontWeight.bold },
  finishButton: { width: 280, height: 50, marginTop: 4, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  finishButtonText: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
});