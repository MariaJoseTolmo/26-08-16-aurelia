import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme/tokens';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorBubble({ message = 'Error al cargar los datos.', onRetry }: Props) {
  return (
    <View style={[styles.row, styles.marginLeft]}>
      <View style={styles.bubble}>
        <Text style={styles.icon}>⚠</Text>
        <Text style={styles.text}>{message}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn} activeOpacity={0.7}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  marginLeft: { marginLeft: 33 },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSurf,
    borderWidth: 1,
    borderColor: '#E090A8',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
    flexWrap: 'wrap',
  },
  icon: { fontSize: fontSize.lg },
  text: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.dangerTxt,
    fontWeight: fontWeight.medium,
  },
  retryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
  },
  retryText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.white },
});
