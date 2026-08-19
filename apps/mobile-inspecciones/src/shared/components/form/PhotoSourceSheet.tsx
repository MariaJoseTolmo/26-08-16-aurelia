import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight } from '../../theme/tokens';

interface PhotoSourceSheetProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}

export function PhotoSourceSheet({ visible, onClose, onCamera, onGallery }: PhotoSourceSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.panel, { paddingBottom: Math.max(18, insets.bottom + 8) }]}> 
          <View style={styles.handle} />
          <Text style={styles.title}>Seleccione el método</Text>
          <Text style={styles.description}>Seleccione entre subir una foto desde la galería o tomar una foto</Text>

          <TouchableOpacity style={styles.optionCard} activeOpacity={0.78} onPress={onGallery}>
            <View style={styles.iconBox}>
              <FontAwesome5 name="image" size={22} color="#666666" solid />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Subir una imagen</Text>
              <Text style={styles.optionSubtitle}>Seleccione la imagen desde su galería</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} activeOpacity={0.78} onPress={onCamera}>
            <View style={styles.iconBox}>
              <FontAwesome5 name="camera" size={22} color="#666666" solid />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Tomar una foto</Text>
              <Text style={styles.optionSubtitle}>Sacar una foto directamente con la cámara</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.78} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  panel: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D1D1',
    marginBottom: 28,
  },
  title: {
    color: colors.primary,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: fontWeight.bold,
  },
  description: {
    color: colors.muted,
    fontSize: fontSize.xl,
    lineHeight: 31 / 2,
    marginTop: 14,
    marginBottom: 24,
  },
  optionCard: {
    minHeight: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E3E3E3',
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 14,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    color: colors.primary,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: fontWeight.bold,
  },
  optionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  cancelButton: {
    height: 54,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  cancelText: {
    color: colors.gold,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
});