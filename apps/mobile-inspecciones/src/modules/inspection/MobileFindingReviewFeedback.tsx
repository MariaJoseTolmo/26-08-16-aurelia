import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, fontWeight } from '../../shared/theme/tokens';

export type MobileFindingReviewMode = 'approve' | 'reject' | null;

type DialogProps = {
  mode: MobileFindingReviewMode;
  pending: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
};

export function MobileFindingReviewDialog({
  mode,
  pending,
  onClose,
  onApprove,
  onReject,
}: DialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (mode) setReason('');
  }, [mode]);

  if (!mode) return null;

  const approving = mode === 'approve';
  const rejectEnabled = reason.trim().length > 0 && !pending;
  const primaryEnabled = approving ? !pending : rejectEnabled;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconRow}>
            <FontAwesome5 name="info-circle" size={32} color="#24588b" />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={pending}
              accessibilityLabel="Cerrar diálogo"
            >
              <FontAwesome5 name="times" size={22} color="#131313" />
            </TouchableOpacity>
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>
              {approving ? 'Aprobar cierre de observación' : 'Rechazar observación'}
            </Text>

            {approving ? (
              <Text style={styles.description}>
                La observación en cuestión será cerrada. Esta podrá ser revisada en la sección de observaciones cerradas.{`\n`}¿Desea aprobar el cierre?
              </Text>
            ) : (
              <>
                <Text style={styles.description}>
                  Para rechazar esta observación debe llenar el siguiente campo explicando el motivo y solicitud de corrección
                </Text>
                <Text style={styles.fieldLabel}>Motivo y solicitud</Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  editable={!pending}
                  placeholder="Describa la acción correctiva a ejecutar..."
                  placeholderTextColor="#757575"
                  style={styles.input}
                  textAlignVertical="top"
                  accessibilityLabel="Motivo y solicitud de corrección"
                />
              </>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, !primaryEnabled && styles.primaryButtonDisabled]}
              disabled={!primaryEnabled}
              onPress={() => {
                if (approving) onApprove();
                else onReject(reason.trim());
              }}
            >
              {pending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.primaryText, !primaryEnabled && styles.primaryTextDisabled]}>
                  {approving ? 'Aprobar cierre' : 'Rechazar observación'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={pending}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type SnackbarProps = {
  message: string | null;
  onClose: () => void;
};

export function MobileFindingReviewSnackbar({ message, onClose }: SnackbarProps) {
  if (!message) return null;

  return (
    <View pointerEvents="box-none" style={styles.snackbarLayer}>
      <View style={styles.snackbar}>
        <FontAwesome5 name="check-circle" size={24} color={colors.white} />
        <Text style={styles.snackbarText}>{message}</Text>
        <TouchableOpacity
          style={styles.snackbarClose}
          onPress={onClose}
          accessibilityLabel="Cerrar mensaje"
        >
          <FontAwesome5 name="times" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19,19,19,0.75)',
    paddingHorizontal: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 328,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    gap: 32,
  },
  iconRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 8,
  },
  title: {
    color: '#2a2a2a',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.36,
    fontWeight: fontWeight.bold,
  },
  description: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 22.7,
    letterSpacing: 0.28,
  },
  fieldLabel: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: fontWeight.bold,
  },
  input: {
    minHeight: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    backgroundColor: '#f6faff',
    color: colors.primary,
    fontSize: 13,
    lineHeight: 19.5,
    paddingHorizontal: 15.5,
    paddingVertical: 14.5,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.borderMid,
  },
  primaryText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 22.7,
    letterSpacing: 0.28,
    fontWeight: fontWeight.bold,
  },
  primaryTextDisabled: {
    color: colors.muted,
  },
  cancelButton: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: colors.gold,
    fontSize: 14,
    lineHeight: 22.7,
    letterSpacing: 0.28,
    fontWeight: fontWeight.bold,
  },
  snackbarLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 83,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  snackbar: {
    minHeight: 48,
    maxWidth: 310,
    borderRadius: 8,
    backgroundColor: '#54a036',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  snackbarText: {
    flexShrink: 1,
    color: colors.white,
    fontSize: 14,
    lineHeight: 22.7,
    letterSpacing: 0.28,
    fontWeight: fontWeight.bold,
  },
  snackbarClose: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
