import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontWeight } from '../../theme/tokens';

interface ChatLocationWidgetProps {
  captured: boolean;
  label: string;
  accuracy: string;
  capturing?: boolean;
  resolved?: boolean;
  onCapture: () => void;
}

export function ChatLocationWidget({
  captured,
  label,
  accuracy,
  capturing = false,
  resolved = false,
  onCapture,
}: ChatLocationWidgetProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ubicación de la inspección</Text>
      <Text style={styles.description}>La ubicación es obligatoria para continuar.</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={capturing || resolved}
        onPress={onCapture}
        style={[styles.button, captured ? styles.buttonCaptured : styles.buttonPending]}
      >
        <Text style={styles.buttonText}>
          {capturing ? 'Capturando ubicación...' : captured ? 'Ubicación capturada' : 'Capturar ubicación'}
        </Text>
      </TouchableOpacity>
      <View style={styles.locationBox}>
        <Text style={styles.locationLabel}>{label}</Text>
        <Text style={styles.accuracy}>{accuracy}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    marginLeft: 33,
    marginRight: 12,
    padding: 12,
    backgroundColor: colors.white,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    color: '#131313',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  description: {
    marginTop: 8,
    color: '#646464',
    fontSize: 11,
    lineHeight: 17,
  },
  button: {
    height: 44,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  buttonPending: {
    backgroundColor: '#C8A064',
  },
  buttonCaptured: {
    backgroundColor: '#3A9B3A',
  },
  buttonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  locationBox: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F4F6F9',
    borderColor: '#E3E3E3',
    borderRadius: 8,
    borderWidth: 1,
  },
  locationLabel: {
    color: '#131313',
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  accuracy: {
    marginTop: 2,
    color: '#646464',
    fontSize: 10,
  },
});
