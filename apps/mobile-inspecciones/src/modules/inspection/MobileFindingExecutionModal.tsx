import React, { useEffect, useState } from 'react';
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
import { FontAwesome5 } from '@expo/vector-icons';
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

type Props = {
  visible: boolean;
  detail: InspectionDetailResponse;
  item: InspectionDetailFindingItemResponse;
  index: number;
  itemLabel: 'Obs.' | 'Ítem';
  pending: boolean;
  canReview: boolean;
  onClose: () => void;
  onSubmit: (description: string, evidence: MobileFindingEvidenceInput) => void;
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

function DetailTextBlock({ label, value, bordered = false }: { label: string; value: string | null; bordered?: boolean }) {
  return (
    <View style={[styles.textBlock, bordered && styles.textBlockBordered]}>
      <Text style={styles.textBlockLabel}>{label}</Text>
      <Text style={styles.textBlockValue}>{value?.trim() || '—'}</Text>
    </View>
  );
}

function Stepper() {
  const steps = ['Detalle', 'Resumen', 'Confirm.'];
  return (
    <View style={styles.stepper}>
      <View style={styles.stepperRow}>
        {steps.map((label, index) => (
          <View key={label} style={styles.stepItem}>
            {index < steps.length - 1 ? <View style={styles.stepLine} /> : null}
            <View style={[styles.stepCircle, index === 0 && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, index === 0 && styles.stepNumberActive]}>{index + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, index === 0 && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.stepperRail} />
    </View>
  );
}

function BeforePhoto({ evidence }: { evidence: InspectionDetailEvidenceResponse | undefined }) {
  const token = useMobileSession((state) => state.accessToken);
  const uri = evidenceUrl(evidence);
  return (
    <View style={styles.beforePhoto}>
      {uri ? (
        <Image
          source={{ uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined }}
          style={styles.beforePhotoImage}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.photoLabel}><Text style={styles.photoLabelText}>FOTO ANTES</Text></View>
      <View style={styles.photoDate}><Text style={styles.photoDateText}>{formatDateTime(evidence?.capturedAt)}</Text></View>
    </View>
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
  onSubmit,
}: Props) {
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<MobileFindingEvidenceInput | null>(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const severity = severityColors(item.severityLabel);
  const valid = Boolean(evidence && description.trim().length > 0 && !pending);
  const inspectionNumber = detail.header.inspectionNumber.replace(/^#/, '');
  const areaLabel = detail.general.areaName?.trim() || detail.general.sectorName?.trim() || 'Sin área';
  const roleBadge = canReview ? 'GF HSE' : 'EECC';
  const riskLabel = `Riesgo ${item.severityLabel.toLowerCase()} · SLA extendido por Admin GF`;

  useEffect(() => {
    if (!visible) return;
    setDescription('');
    setEvidence(null);
    setPhotoSheetVisible(false);
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

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose} accessibilityLabel="Volver al detalle">
            <FontAwesome5 name="arrow-left" size={20} color="rgba(255,255,255,0.92)" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Detalle del hallazgo</Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>Paso 2 de 4 · {inspectionNumber} · {areaLabel}</Text>
          </View>
          <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{roleBadge}</Text></View>
        </View>

        <View style={styles.offlineBanner}>
          <FontAwesome5 name="wifi" size={11} color={colors.gold} />
          <Text style={styles.offlineText}>Sin red · guardando localmente</Text>
        </View>

        <Stepper />

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
                <FontAwesome5 name="circle" size={7} color="#5e4c22" solid />
                <Text style={styles.statusPillText}>{item.statusGroup === 'rejected' ? 'Rechazado' : 'Abierto'}</Text>
              </View>
            </View>

            <View style={styles.findingContent}>
              <BeforePhoto evidence={item.beforeEvidence[0]} />
              <DetailTextBlock label="CONDICIÓN DETECTADA" value={item.condition} bordered />
              <DetailTextBlock label="MEDIDA CORRECTIVA PROPUESTA" value={item.proposedCorrectiveAction} />
              {item.statusGroup === 'rejected' ? (
                <DetailTextBlock label="MOTIVO DE RECHAZO" value={item.rejectionReason} bordered />
              ) : null}

              <View style={styles.answerPanel}>
                <Text style={styles.answerTitle}>TU RESPUESTA</Text>
                <Text style={styles.fieldLabel}>{item.statusGroup === 'rejected' ? 'Reemplazar fotografía "Después" *' : 'Fotografía "Después" *'}</Text>
                <TouchableOpacity
                  style={[styles.photoInput, evidence && styles.photoInputReady]}
                  onPress={() => setPhotoSheetVisible(true)}
                  activeOpacity={0.82}
                >
                  {evidence ? (
                    <>
                      <Image source={{ uri: evidence.uri }} style={styles.afterPreview} resizeMode="cover" />
                      <View style={styles.afterPreviewShade} />
                      <View style={styles.afterPreviewLabel}><Text style={styles.afterPreviewLabelText}>FOTO DESPUÉS</Text></View>
                      <View style={styles.changePhotoPill}>
                        <FontAwesome5 name="camera" size={11} color={colors.white} />
                        <Text style={styles.changePhotoText}>Cambiar fotografía</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.cameraEmoji}>📷</Text>
                      <Text style={styles.photoInputTitle}>Tomar foto o galería</Text>
                      <Text style={styles.photoInputHint}>Fecha, hora y GPS automáticos</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={[styles.fieldLabel, styles.descriptionLabel]}>{item.statusGroup === 'rejected' ? 'Describa la corrección *' : 'Descripción de la acción tomada *'}</Text>
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
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={pending}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !valid && styles.submitButtonDisabled]}
              onPress={() => {
                if (evidence) onSubmit(description.trim(), evidence);
              }}
              disabled={!valid}
            >
              {pending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Text style={[styles.submitButtonText, !valid && styles.submitButtonTextDisabled]}>Marcar como ejecutado</Text>
                  <FontAwesome5 name="arrow-right" size={14} color={valid ? colors.white : colors.placeholder} />
                </>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.homeIndicator} />
        </View>

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
  stepCircleActive: { borderWidth: 2, borderColor: colors.gold },
  stepNumber: { color: colors.placeholder, fontSize: 9, lineHeight: 11, fontWeight: fontWeight.bold },
  stepNumberActive: { color: colors.gold },
  stepLabel: { marginTop: 3, color: colors.placeholder, fontSize: 8, lineHeight: 10 },
  stepLabelActive: { color: colors.goldDark, fontWeight: fontWeight.bold },
  stepperRail: { height: 2, marginTop: 6, borderRadius: 2, backgroundColor: colors.border },
  body: { flex: 1, backgroundColor: '#f7f7f7' },
  bodyContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, gap: 12 },
  findingCard: { borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#f7f7f7', padding: 13.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 1.5, elevation: 1 },
  findingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  indexPill: { minHeight: 19, borderRadius: 6, backgroundColor: colors.blueSurf, justifyContent: 'center', paddingHorizontal: 8 },
  indexPillText: { color: colors.blueLink, fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },
  severityPill: { minHeight: 19, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  severityPillText: { fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  statusPill: { minHeight: 19, borderRadius: 6, backgroundColor: '#fbe9be', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillText: { color: '#5e4c22', fontSize: 10, lineHeight: 12, fontWeight: fontWeight.bold },
  findingContent: { marginTop: 12, gap: 4 },
  beforePhoto: { height: 80, borderRadius: 8, overflow: 'hidden', backgroundColor: '#142d50' },
  beforePhotoImage: { width: '100%', height: '100%' },
  photoLabel: { position: 'absolute', top: 6, left: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 2 },
  photoLabelText: { color: colors.white, fontSize: 9, lineHeight: 11, letterSpacing: 1.5, fontWeight: fontWeight.bold },
  photoDate: { position: 'absolute', right: 8, bottom: 6, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2 },
  photoDateText: { color: 'rgba(255,255,255,0.8)', fontSize: 9, lineHeight: 11 },
  textBlock: { borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 8 },
  textBlockBordered: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 9 },
  textBlockLabel: { color: colors.muted, fontSize: 9, lineHeight: 11, letterSpacing: 1.5, fontWeight: fontWeight.bold },
  textBlockValue: { marginTop: 3, color: colors.primary, fontSize: 12, lineHeight: 17 },
  answerPanel: { marginTop: 0, borderTopWidth: 1.5, borderTopColor: colors.gold, backgroundColor: '#fffdf7', paddingHorizontal: 12, paddingTop: 13.5, paddingBottom: 12 },
  answerTitle: { color: colors.goldDark, fontSize: 11, lineHeight: 13, letterSpacing: 0.66, fontWeight: fontWeight.bold },
  fieldLabel: { marginTop: 10, color: colors.primary, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.bold },
  photoInput: { minHeight: 118, marginTop: 6, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.borderMid, backgroundColor: '#f6faff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 24 },
  photoInputReady: { height: 132, borderStyle: 'solid', borderColor: '#9bd98a', paddingHorizontal: 0, paddingVertical: 0 },
  cameraEmoji: { color: colors.primary, fontSize: 28, lineHeight: 32 },
  photoInputTitle: { marginTop: 6, color: colors.muted, fontSize: 13, lineHeight: 16, fontWeight: fontWeight.semibold, textAlign: 'center' },
  photoInputHint: { marginTop: 3, color: colors.placeholder, fontSize: 11, lineHeight: 14, textAlign: 'center' },
  afterPreview: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  afterPreviewShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  afterPreviewLabel: { position: 'absolute', top: 8, left: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 7, paddingVertical: 3 },
  afterPreviewLabelText: { color: colors.white, fontSize: 9, lineHeight: 11, letterSpacing: 1.2, fontWeight: fontWeight.bold },
  changePhotoPill: { position: 'absolute', right: 8, bottom: 8, minHeight: 27, borderRadius: 14, backgroundColor: 'rgba(0,30,57,0.82)', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
  changePhotoText: { color: colors.white, fontSize: 10, lineHeight: 12, fontWeight: fontWeight.semibold },
  descriptionLabel: { marginTop: 12 },
  descriptionInput: { minHeight: 80, marginTop: 6, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#f6faff', color: colors.primary, fontSize: 13, lineHeight: 19.5, paddingHorizontal: 15.5, paddingVertical: 14.5 },
  slaCard: { minHeight: 72, marginTop: 4, borderRadius: 10, backgroundColor: colors.navy, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  slaLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 9, lineHeight: 11, letterSpacing: 2, fontWeight: fontWeight.bold },
  slaValue: { marginTop: 3, color: colors.gold, fontSize: 14, lineHeight: 19, letterSpacing: 1.5, fontWeight: fontWeight.bold },
  slaMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 16, letterSpacing: 0, fontWeight: fontWeight.regular },
  blockerCard: { borderRadius: 10, borderWidth: 1, borderColor: '#ffcd56', backgroundColor: colors.warnSurf, paddingHorizontal: 12, paddingVertical: 10 },
  blockerText: { color: colors.warnTxt, fontSize: 12, lineHeight: 18 },
  blockerStrong: { fontWeight: fontWeight.bold },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, paddingTop: 10, paddingBottom: 8 },
  footerButtons: { flexDirection: 'row', gap: 10, paddingHorizontal: 14 },
  cancelButton: { height: 50, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  cancelButtonText: { color: colors.gold, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold },
  submitButton: { flex: 1, minWidth: 0, height: 50, borderRadius: 14, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  submitButtonDisabled: { backgroundColor: colors.borderMid },
  submitButtonText: { color: colors.white, fontSize: 14, lineHeight: 17, fontWeight: fontWeight.bold, textAlign: 'center' },
  submitButtonTextDisabled: { color: colors.placeholder },
  homeIndicator: { alignSelf: 'center', width: 120, height: 4, marginTop: 12, marginBottom: 4, borderRadius: 2, backgroundColor: colors.borderMid },
});
