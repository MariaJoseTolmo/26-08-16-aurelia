import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, fontWeight } from '../../theme/tokens';
import { PhotoSourceSheet } from '../form/PhotoSourceSheet';

interface Props {
  onSkip: () => void;
  onCapture: (uri: string) => void;
  resolved?: boolean;
  resolvedTitle?: string;
  resolvedSub?: string;
}

async function launchCamera(onCapture: (uri: string) => void) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso requerido', 'Necesita permiso de cámara para tomar fotos.');
    return;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });
  if (!result.canceled && result.assets[0]?.uri) onCapture(result.assets[0].uri);
}

async function launchGallery(onCapture: (uri: string) => void) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso requerido', 'Necesita permiso de galería para adjuntar fotos.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
    selectionLimit: 1,
  });
  if (!result.canceled && result.assets[0]?.uri) onCapture(result.assets[0].uri);
}

export function PhotoStepWidget({
  onSkip,
  onCapture,
  resolved = false,
  resolvedTitle = 'Foto adjunta ✓',
  resolvedSub = 'IMG.jpg · GPS ✓ · --:--',
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (resolved) {
    return (
      <View style={styles.container}>
        <View style={styles.resolvedCard}>
          <View style={styles.resolvedIcon}>
            <FontAwesome5 name="camera" size={16} color={colors.white} />
          </View>
          <View style={styles.resolvedCopy}>
            <Text numberOfLines={1} style={styles.resolvedTitle}>{resolvedTitle}</Text>
            <Text numberOfLines={1} style={styles.resolvedSub}>{resolvedSub}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.78}
          onPress={() => setPickerOpen(true)}
          style={styles.uploadArea}
        >
          <View style={styles.iconBox}>
            <FontAwesome5 name="camera" size={16} color="#646464" />
          </View>
          <View style={styles.uploadCopy}>
            <Text style={styles.title}>Tomar foto o galería</Text>
            <Text style={styles.subtitle}>Fecha, hora y GPS automáticos</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>
      <PhotoSourceSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCamera={async () => {
          setPickerOpen(false);
          await launchCamera(onCapture);
        }}
        onGallery={async () => {
          setPickerOpen(false);
          await launchGallery(onCapture);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    marginLeft: 33,
    marginRight: 12,
    padding: 12,
    backgroundColor: colors.white,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    borderWidth: 1,
  },
  uploadArea: {
    minHeight: 84,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FAFF',
    borderColor: '#D1D1D1',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  iconBox: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
  },
  uploadCopy: {
    minWidth: 0,
    marginLeft: 10,
    flex: 1,
  },
  title: {
    color: '#646464',
    fontSize: 13,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    marginTop: 2,
    color: '#B7B7B7',
    fontSize: 11,
  },
  skipButton: {
    height: 34,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#E3E3E3',
    borderRadius: 10,
    borderWidth: 1,
  },
  skipText: {
    color: '#646464',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  resolvedCard: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#35A137',
    borderRadius: 10,
  },
  resolvedIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: 8,
  },
  resolvedCopy: {
    minWidth: 0,
    flex: 1,
  },
  resolvedTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },
  resolvedSub: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
  },
});