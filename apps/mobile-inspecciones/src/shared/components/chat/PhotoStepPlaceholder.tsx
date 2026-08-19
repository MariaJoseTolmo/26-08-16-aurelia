import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme/tokens';

/**
 * Placeholder for the photo capture step.
 * Camera integration and evidence upload are deferred to Mobile D.
 */
export function PhotoStepPlaceholder() {
  return (
    <View style={[styles.container, styles.marginLeft]}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>📷</Text>
      </View>
      <Text style={styles.title}>Adjuntar fotografía del hallazgo</Text>
      <Text style={styles.sub}>
        La captura de foto y subida de evidencia estará disponible en Mobile D.
        El hallazgo continúa sin foto adjunta.
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>⚠ Mobile D · pendiente</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  marginLeft: { marginLeft: 33 },
  container: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    borderStyle: 'dashed',
    borderRadius: radius.md + 2,
    padding: 14,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.body },
  sub: {
    fontSize: fontSize.xs,
    color: colors.placeholder,
    textAlign: 'center',
    lineHeight: fontSize.xs * 1.5,
  },
  badge: {
    backgroundColor: colors.warnSurf,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.warnTxt },
});
