import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { useMobileSession } from '../auth/mobileSession.store';

function Metric({ value, label, color }: { value: string; label: string; color: string }) {
  return <View style={styles.metric}><Text style={[styles.metricNumber, { color }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function SmallRow({ label, tag, tone }: { label: string; tag?: string; tone: 'red' | 'gold' | 'green' | 'gray' }) {
  const bg = tone === 'red' ? '#ffd0db' : tone === 'green' ? '#dfffce' : tone === 'gray' ? '#f1f1f1' : '#ffeab8';
  const fg = tone === 'red' ? '#570b1d' : tone === 'green' ? '#2a5c16' : tone === 'gray' ? '#646464' : '#463100';
  return <View style={[styles.row, { backgroundColor: bg }]}><Text style={[styles.rowText, { color: fg }]}>{label}</Text>{tag ? <Text style={[styles.rowTag, { color: fg }]}>{tag}</Text> : null}</View>;
}

function Card({ id, title, meta, top, rows }: { id: string; title: string; meta: string; top: string; rows: Array<[string, string, 'red' | 'gold' | 'green' | 'gray']> }) {
  return (
    <View style={styles.card}>
      <View style={[styles.top, { backgroundColor: top }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHead}><Text style={styles.cardId}>{id}</Text><View style={styles.cardTags}><Text style={styles.typePill}>⌕ Hallazgo</Text><Text style={styles.statePill}>● Abierta · Crítico</Text></View></View>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.metaRow}><Text style={styles.pin}>●</Text><Text style={styles.meta}>{meta}</Text></View>
        <View style={styles.rows}>{rows.map(([label, tag, tone]) => <SmallRow key={label} label={label} tag={tag} tone={tone} />)}</View>
      </View>
    </View>
  );
}

function DraftBox() {
  return (
    <View style={styles.draftBox}>
      <View style={styles.draftHeader}><View><Text style={styles.draftTitle}>Formularios inconclusos</Text><Text style={styles.draftSub}>Continúa donde lo dejaste · guardados localmente</Text></View><View style={styles.redDot} /></View>
      <TouchableOpacity style={styles.draftItem} onPress={() => router.push('/inspection/manual/identification')} activeOpacity={0.8}>
        <View style={styles.draftIcon}><FontAwesome5 name="file-signature" size={18} color="#463100" /></View>
        <View style={styles.draftCopy}><Text style={styles.draftItemTitle}>Hallazgo · Planta Procesos</Text><Text style={styles.draftDetail}>Planta Procesos · Módulo C · STRACON · Ayer 16:54</Text><View style={styles.progressLine}><View style={styles.progressBar} /><Text style={styles.progressText}>40%</Text></View></View>
        <Text style={styles.chev}>›</Text><View style={styles.step}><Text style={styles.stepText}>Paso 2/5</Text></View>
      </TouchableOpacity>
    </View>
  );
}

export function InspectionsHomeScreen() {
  const user = useMobileSession((state) => state.user);
  const name = user?.fullName ?? 'Karen Opazo S.';
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <View style={styles.status}><Text style={styles.time}>9:41</Text><FontAwesome5 name="signal" size={15} color={colors.white} /></View>
            <View style={styles.logoRow}><View style={styles.logoCircle}><Text style={styles.logoMark}>GF</Text></View><View><Text style={styles.logoGold}>Gold Fields</Text><Text style={styles.logoAurelia}>A U R E L I A</Text></View><TouchableOpacity style={styles.bell}><FontAwesome5 name="bell" size={17} color={colors.white} /></TouchableOpacity></View>
            <Text style={styles.hello}>Hola,</Text><Text style={styles.name}>{name}</Text><View style={styles.role}><Text style={styles.roleText}>◒  Inspector · Admin GF HSE</Text></View>
          </View>
          <View style={styles.metrics}><Metric value="XX" label="Total 2026" color={colors.primary} /><View style={styles.divider} /><Metric value="XX" label="Abiertas" color="#463100" /><View style={styles.divider} /><Metric value="X" label="SLA vencidos" color="#bd3b5b" /><View style={styles.divider} /><Metric value="XX%" label="Obs. cerradas" color="#2a5c16" /></View>
          <View style={styles.actions}><TouchableOpacity style={styles.filter}><Text style={styles.filterText}>≡  Filtrar</Text></TouchableOpacity><TouchableOpacity style={styles.newButton} onPress={() => router.push('/inspection/start')}><Text style={styles.newText}>＋  Nueva inspección</Text></TouchableOpacity></View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
            <DraftBox />
            <Card id="#369" title="Servicios Generales · GARDE CORPS" meta="Campamento Antiguo · 23 días" top="#c4365a" rows={[["1 Ejecutada", "Crítico", "red"], ["2 Abiertas", "Alto   Medio", "gold"], ["1 Cerrada", "Alto", "green"], ["1 Rechazada", "Crítico", "gray"]]} />
            <Card id="#389" title="Servicios Generales · RESITER" meta="PTAS · 9 días" top="#e8a820" rows={[["1 Ejecutada", "Alto", "gold"], ["2 Abiertas", "Medio   Medio", "gold"]]} />
            <Card id="#357" title="Planta Procesos · SOMACOR" meta="Módulo C · 18 días" top="#c4365a" rows={[["1 Abierta", "Crítico", "red"], ["2 Cerradas", "", "green"]]} />
            <Card id="#395" title="Planta Procesos · AGGREKO" meta="Módulo C · 4 días" top={colors.gold} rows={[["3 Abiertas", "Medio   Medio   Bajo", "gold"], ["2 Cerradas", "", "green"]]} />
          </ScrollView>
          <View style={styles.tabs}><View style={styles.activeTab}><View style={styles.tabCount}><Text style={styles.tabCountText}>7</Text></View><Text style={styles.tabActive}>Gestión de inspecciones</Text><View style={styles.tabLine} /></View><View style={styles.inactiveTab}><Text style={styles.dot}>•</Text><Text style={styles.tabMuted}>Historial</Text></View></View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navyDark }, screen: { flex: 1, backgroundColor: '#f7f7f7' },
  header: { backgroundColor: colors.navyDark, paddingHorizontal: 20, paddingBottom: 22 }, status: { height: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, time: { color: colors.white, fontSize: 12, fontWeight: fontWeight.semibold }, logoRow: { height: 54, flexDirection: 'row', alignItems: 'center', marginTop: 6 }, logoCircle: { width: 43, height: 43, borderRadius: 22, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' }, logoMark: { color: colors.white, fontSize: 10, fontWeight: fontWeight.bold }, logoGold: { marginLeft: 8, color: colors.white, backgroundColor: colors.white, fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 2, textTransform: 'uppercase' }, logoAurelia: { marginLeft: 8, marginTop: 4, color: 'rgba(255,255,255,0.62)', fontSize: 14, letterSpacing: 5 }, bell: { marginLeft: 'auto', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }, hello: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 12 }, name: { color: colors.white, fontSize: 22, fontWeight: fontWeight.bold, marginTop: 2 }, role: { alignSelf: 'flex-start', marginTop: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(200,160,100,0.4)', backgroundColor: 'rgba(200,160,100,0.2)', paddingHorizontal: 11, paddingVertical: 4 }, roleText: { color: colors.gold, fontSize: 11, fontWeight: fontWeight.semibold },
  metrics: { height: 70, backgroundColor: colors.white, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }, metric: { flex: 1, alignItems: 'center', justifyContent: 'center' }, metricNumber: { fontSize: 18, fontWeight: fontWeight.bold }, metricLabel: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 2 }, divider: { width: 1, marginVertical: 14, backgroundColor: colors.border },
  actions: { backgroundColor: colors.white, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border }, filter: { height: 36, borderWidth: 1.5, borderColor: colors.borderMid, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, filterText: { color: colors.body, fontSize: 12, fontWeight: fontWeight.semibold }, newButton: { height: 52, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', shadowColor: colors.gold, shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } }, newText: { color: colors.white, fontSize: 15, fontWeight: fontWeight.bold },
  scroll: { flex: 1 }, scrollInner: { padding: 14, gap: 10 }, draftBox: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, draftHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between' }, draftTitle: { color: colors.primary, fontSize: 15, fontWeight: fontWeight.bold }, draftSub: { color: colors.muted, fontSize: 12, marginTop: 2 }, redDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#c4365a' }, draftItem: { borderTopWidth: 1.5, borderTopColor: colors.border, paddingHorizontal: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, draftIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#ffeab8', alignItems: 'center', justifyContent: 'center' }, draftCopy: { flex: 1 }, draftItemTitle: { color: colors.primary, fontSize: 13, fontWeight: fontWeight.bold }, draftDetail: { color: colors.muted, fontSize: 11, marginTop: 3 }, progressLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 }, progressBar: { width: 80, height: 4, borderRadius: 2, backgroundColor: colors.gold }, progressText: { color: colors.goldDark, fontSize: 10, fontWeight: fontWeight.bold }, chev: { color: colors.muted, fontSize: 30 }, step: { position: 'absolute', top: 15, right: 20, backgroundColor: '#ffeab8', borderWidth: 1, borderColor: '#e8c86a', borderRadius: 6, paddingHorizontal: 7, height: 18, justifyContent: 'center' }, stepText: { color: '#463100', fontSize: 10, fontWeight: fontWeight.bold },
  card: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }, top: { height: 3 }, cardBody: { padding: 14 }, cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardId: { color: colors.blueLink, fontSize: 12, fontWeight: fontWeight.bold }, cardTags: { flexDirection: 'row', gap: 8 }, typePill: { backgroundColor: '#e6f3ff', color: '#0d3862', fontSize: 10, fontWeight: fontWeight.bold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }, statePill: { backgroundColor: '#ffd0db', color: '#570b1d', fontSize: 10, fontWeight: fontWeight.bold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }, cardTitle: { color: colors.primary, fontSize: 13, fontWeight: fontWeight.bold, marginTop: 8 }, metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 }, pin: { color: '#aaa', fontSize: 10 }, meta: { color: colors.muted, fontSize: 11 }, rows: { marginTop: 10, gap: 5 }, row: { minHeight: 27, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, rowText: { fontSize: 11, fontWeight: fontWeight.semibold }, rowTag: { fontSize: 9, fontWeight: fontWeight.bold },
  tabs: { height: 84, backgroundColor: colors.navyDark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 }, activeTab: { flex: 1, alignItems: 'center', gap: 6, borderRadius: 6, backgroundColor: 'rgba(0,179,152,0.09)', paddingTop: 5 }, inactiveTab: { flex: 1, alignItems: 'center', gap: 6 }, tabCount: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#c4365a', alignItems: 'center', justifyContent: 'center' }, tabCountText: { color: colors.white, fontSize: 9, fontWeight: fontWeight.bold }, tabActive: { color: colors.teal, fontSize: 13, fontWeight: fontWeight.semibold }, tabMuted: { color: 'rgba(255,255,255,0.44)', fontSize: 13 }, dot: { color: 'rgba(255,255,255,0.2)', fontSize: 20 }, tabLine: { width: '90%', height: 1.5, borderRadius: 2, backgroundColor: colors.teal },
});
