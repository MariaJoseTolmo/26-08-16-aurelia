import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius } from '../../theme/tokens';

interface Props {
  text: string;
  time?: string;
}

function canonicalUserText(text: string): string {
  const normalized = text.trim();

  if (/^\d{2}-\d{2}-\d{4}$/.test(normalized)) return normalized.replace(/-/g, '/');
  if (normalized.startsWith('Personal:')) return `✓ ${normalized}`;
  if (!normalized.startsWith('✓ ') && normalized.endsWith(' confirmada')) return `✓ ${normalized}`;

  return text;
}

export function UserBubble({ text, time }: Props) {
  const now = new Date();
  const timeStr = time ?? `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  const displayText = canonicalUserText(text);

  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{displayText}</Text>
        <Text style={styles.time}>{timeStr}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    backgroundColor: colors.navyDark,
    borderRadius: radius.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  text: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
  },
  time: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.55)',
    fontSize: fontSize.xs + 1,
    lineHeight: 11,
  },
});