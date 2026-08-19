import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, fontSize, fontWeight } from '../../theme/tokens';

interface ManualFlowHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  onBack?: () => void;
}

export function ManualFlowHeader({ title, subtitle, badge, onBack }: ManualFlowHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable style={styles.headerBackButton} onPress={onBack} hitSlop={8}>
          <FontAwesome5 name="arrow-left" size={18} color={colors.white} />
        </Pressable>
      ) : null}
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      {badge ? <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{badge}</Text></View> : null}
    </View>
  );
}

interface ManualFlowFooterProps {
  secondaryLabel: string;
  onSecondary: () => void;
  primaryLabel?: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryIcon?: 'arrow-left';
  primaryIcon?: 'arrow-right' | 'check';
  primaryVariant?: 'gold' | 'success';
}

export function ManualFlowFooter({ secondaryLabel, onSecondary, primaryLabel = 'Continuar', onPrimary, primaryDisabled = false, secondaryIcon, primaryIcon = 'arrow-right', primaryVariant = 'gold' }: ManualFlowFooterProps) {
  const success = primaryVariant === 'success';
  const primaryHandledRef = React.useRef(false);

  function handlePrimary() {
    if (primaryDisabled || primaryHandledRef.current) return;
    primaryHandledRef.current = true;
    onPrimary();
    setTimeout(() => {
      primaryHandledRef.current = false;
    }, 350);
  }

  return (
    <View style={styles.footer} pointerEvents="box-none">
      <View style={styles.footerButtons} pointerEvents="box-none">
        <Pressable style={styles.secondaryButton} onPress={onSecondary} hitSlop={6}>
          {secondaryIcon ? <FontAwesome5 name={secondaryIcon} size={14} color={colors.gold} /> : null}
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </Pressable>
        <Pressable style={[styles.primaryButton, success && styles.primaryButtonSuccess, primaryDisabled && styles.primaryButtonDisabled]} onPress={handlePrimary} disabled={primaryDisabled} hitSlop={6}>
          {primaryIcon === 'check' ? <FontAwesome5 name="check" size={14} color={primaryDisabled ? colors.placeholder : colors.white} /> : null}
          <Text style={[styles.primaryText, primaryDisabled && styles.primaryTextDisabled]}>{primaryLabel}</Text>
          {primaryIcon === 'arrow-right' ? <FontAwesome5 name="arrow-right" size={14} color={primaryDisabled ? colors.placeholder : colors.white} /> : null}
        </Pressable>
      </View>
      <View style={styles.homeIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, backgroundColor: colors.navyDark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, zIndex: 2 },
  headerBackButton: { width: 42, height: 48, alignItems: 'center', justifyContent: 'center', marginLeft: -4 },
  headerText: { flex: 1, paddingHorizontal: 4 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.white },
  headerSubtitle: { marginTop: 1, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.55)' },
  headerBadge: { height: 20, borderRadius: 16, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, marginRight: 4 },
  headerBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.navy },
  footer: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, paddingHorizontal: 14, alignItems: 'center' },
  footerButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  secondaryButton: { height: 50, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  secondaryText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.gold },
  primaryButton: { flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: colors.gold, shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  primaryButtonSuccess: { backgroundColor: '#3A9B3A', shadowColor: '#3A9B3A' },
  primaryButtonDisabled: { backgroundColor: '#E3E3E3', shadowOpacity: 0 },
  primaryText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.white },
  primaryTextDisabled: { color: colors.placeholder },
  homeIndicator: { width: 120, height: 4, borderRadius: 2, backgroundColor: colors.borderMid, marginTop: 14, marginBottom: 8 },
});
