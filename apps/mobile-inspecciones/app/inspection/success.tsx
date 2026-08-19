import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSize, fontWeight } from '../../src/shared/theme/tokens';
import { ChatHeader } from '../../src/shared/components/layout/ChatHeader';

function textParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function SuccessScreen() {
  const params = useLocalSearchParams<{
    inspectionId: string;
    findingsCount: string;
    evidencesCount: string;
    areaName: string;
    sectorName: string;
    companyName: string;
    personnelNames: string;
    criticalCount: string;
  }>();
  const insets = useSafeAreaInsets();
  const findings = Number(params.findingsCount ?? 0);
  const critical = Number(params.criticalCount ?? 0);
  const areaName = textParam(params.areaName);
  const sectorName = textParam(params.sectorName);
  const companyName = textParam(params.companyName) || 'SOMACOR';
  const personnelNames = textParam(params.personnelNames) || 'responsables asignados';
  const location = [areaName, sectorName].filter(Boolean).join(' · ') || 'el área seleccionada';

  return (
    <SafeAreaProvider>
      <View style={styles.screen}>
        <ChatHeader currentStep={6} />
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 118 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.iconBox}><Text style={styles.checkIcon}>✓</Text></View>
          <Text style={styles.title}>¡Inspección guardada!</Text>
          <Text style={styles.subtitle}>Registrada con <Text style={styles.strong}>{findings} {findings === 1 ? 'observación' : 'observaciones'}</Text> en <Text style={styles.strong}>{location}</Text>.</Text>

          <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <View style={styles.noticeIcon}><Text style={styles.noticeIconText}>♟</Text></View>
              <Text style={styles.noticeTitle}>EECC notificada</Text>
            </View>
            <Text style={styles.noticeText}><Text style={styles.noticeStrong}>{companyName}</Text> ha sido notificada. <Text style={styles.noticeStrong}>{personnelNames}</Text> recibirán los hallazgos para gestionar su resolución dentro de los plazos definidos.</Text>
          </View>

          <View style={styles.statsRow}>
            <StatCard value={String(findings)} label="Observaciones" />
            <StatCard value={String(critical)} label="Críticas" />
            <StatCard value={companyName.slice(0, 7).toUpperCase()} label="EECC" compact />
          </View>

          <Text style={styles.footer}>AurelIA · Gold Fields Salares Norte · {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</Text>
        </ScrollView>

        <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={() => router.replace('/inspection/chat')}>
            <Text style={styles.secondaryText}>↻ Misma área</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => router.replace('/inspection/start')}>
            <Text style={styles.primaryText}>＋ Nueva insp.</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

function StatCard({ value, label, compact = false }: { value: string; label: string; compact?: boolean }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, compact && styles.statCompany]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1 },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 72,
    gap: spacing.lg,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.ok,
    borderRadius: radius.full,
    height: 72,
    justifyContent: 'center',
    shadowColor: colors.ok,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    width: 72,
  },
  checkIcon: { color: colors.white, fontSize: 43, fontWeight: fontWeight.regular },
  title: { color: colors.ok, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: fontSize.base, lineHeight: 20, textAlign: 'center' },
  strong: { color: colors.primary, fontWeight: fontWeight.bold },
  noticeCard: {
    backgroundColor: colors.tealSurf,
    borderColor: colors.teal,
    borderRadius: radius.md + 2,
    borderWidth: 1,
    padding: spacing.lg,
    width: '100%',
  },
  noticeHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  noticeIcon: { alignItems: 'center', backgroundColor: colors.teal, borderRadius: radius.sm, height: 32, justifyContent: 'center', width: 32 },
  noticeIconText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  noticeTitle: { color: colors.tealTxt, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  noticeText: { color: colors.tealTxt, fontSize: fontSize.md, lineHeight: 18 },
  noticeStrong: { fontWeight: fontWeight.bold },
  statsRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.borderMid,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    flex: 1,
    height: 58,
    justifyContent: 'center',
  },
  statValue: { color: colors.navy, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, maxWidth: '90%' },
  statCompany: { color: colors.ok, fontSize: fontSize.lg },
  statLabel: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  footer: { color: colors.placeholder, fontSize: fontSize.sm, textAlign: 'center' },
  actions: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    left: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.gold,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  secondaryText: { color: colors.goldDark, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  primaryText: { color: colors.navy, fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
