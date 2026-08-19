import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { moveLatLngFromViewportPoint } from '../../utils/geo.utils';
import { colors, fontSize, fontWeight } from '../../theme/tokens';

interface HeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export function ManualHeader({ title, subtitle, badge }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      {badge ? <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{badge}</Text></View> : null}
    </View>
  );
}

interface OfflineBannerProps {
  online?: boolean;
  hasSession?: boolean;
}

export function OfflineBanner({ online = false, hasSession = false }: OfflineBannerProps) {
  const connected = online && hasSession;
  const text = connected ? 'Con red · sesión activa' : !hasSession ? 'Sin sesión · guardando localmente' : 'Sin red · guardando localmente';
  const icon = connected ? 'cloud-upload-alt' : !hasSession ? 'user-lock' : 'wifi';

  return (
    <View style={[styles.offlineBanner, connected && styles.onlineBanner]}>
      <FontAwesome5 name={icon} size={11} color={connected ? colors.teal : colors.gold} />
      <Text style={[styles.offlineText, connected && styles.onlineText]}>{text}</Text>
    </View>
  );
}

interface StepperProps {
  activeStep: number;
  steps: string[];
}

export function FormStepper({ activeStep, steps }: StepperProps) {
  return (
    <View style={styles.stepperWrap}>
      <View style={styles.stepperRow}>
        {steps.map((step, index) => {
          const active = index + 1 === activeStep;
          return (
            <View key={step} style={styles.stepItem}>
              {index < steps.length - 1 ? <View style={styles.stepLine} /> : null}
              <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{step}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.progressRail}><View style={styles.progressFill} /></View>
    </View>
  );
}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function FormCard({ icon, title, subtitle, children }: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {icon}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

interface FieldBoxProps {
  value: string;
  variant?: 'readonly' | 'input';
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export function FieldBox({ value, variant = 'readonly', right, onPress, disabled = false }: FieldBoxProps) {
  const content = (
    <>
      <Text style={[styles.fieldValue, disabled && styles.disabledText]} numberOfLines={1}>{value}</Text>
      {right}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.fieldBox, variant === 'input' && styles.inputBox, disabled && styles.disabledBox]}
        activeOpacity={0.75}
        onPress={onPress}
        disabled={disabled}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.fieldBox, variant === 'input' && styles.inputBox, disabled && styles.disabledBox]}>{content}</View>;
}

interface SelectBoxProps {
  value: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SelectBox({ value, onPress, loading = false, disabled = false }: SelectBoxProps) {
  return (
    <FieldBox
      value={loading ? 'Cargando...' : value}
      variant="input"
      onPress={onPress}
      disabled={disabled || loading}
      right={<FontAwesome5 name="caret-down" size={14} color={disabled ? colors.placeholder : colors.primary} />}
    />
  );
}

interface FooterProps {
  onCancel: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}

export function ManualFooter({ onCancel, onNext, nextDisabled = false }: FooterProps) {
  return (
    <View style={styles.footer}>
      <View style={styles.footerButtons}>
        <TouchableOpacity style={styles.cancelButton} activeOpacity={0.75} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextButton, nextDisabled && styles.nextButtonDisabled]} activeOpacity={0.82} onPress={onNext} disabled={nextDisabled}>
          <Text style={[styles.nextText, nextDisabled && styles.nextTextDisabled]}>Continuar</Text>
          <FontAwesome5 name="arrow-right" size={14} color={nextDisabled ? colors.placeholder : colors.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.homeIndicator} />
    </View>
  );
}

interface LocationMapPreviewProps {
  latitude: number | null;
  longitude: number | null;
  accuracyLabel: string;
  onCoordinateChange?: (coords: { latitude: number; longitude: number }) => void;
}

function hasValidLocation(latitude: number | null, longitude: number | null) {
  return typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function mapTileUrl(latitude: number, longitude: number, zoom = 14): string {
  const scale = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * scale);
  const latRad = latitude * Math.PI / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale);
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

function getLocalPoint(event: GestureResponderEvent) {
  const locationX = Number.isFinite(event.nativeEvent.locationX) ? event.nativeEvent.locationX : undefined;
  const locationY = Number.isFinite(event.nativeEvent.locationY) ? event.nativeEvent.locationY : undefined;

  if (locationX !== undefined && locationY !== undefined) return { x: locationX, y: locationY };

  const nativeEvent = event.nativeEvent as unknown as { offsetX?: number; offsetY?: number };
  const offsetX = typeof nativeEvent.offsetX === 'number' && Number.isFinite(nativeEvent.offsetX) ? nativeEvent.offsetX : undefined;
  const offsetY = typeof nativeEvent.offsetY === 'number' && Number.isFinite(nativeEvent.offsetY) ? nativeEvent.offsetY : undefined;

  if (offsetX !== undefined && offsetY !== undefined) return { x: offsetX, y: offsetY };

  return null;
}

function MapGradient() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="manualMapGradient" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#1e4a2e" />
          <Stop offset="40%" stopColor="#2a5a3a" />
          <Stop offset="70%" stopColor="#1a3828" />
          <Stop offset="100%" stopColor="#243e30" />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#manualMapGradient)" opacity={0.9} />
    </Svg>
  );
}

export function LocationMapPreview({ latitude, longitude, accuracyLabel, onCoordinateChange }: LocationMapPreviewProps) {
  const [layout, setLayout] = React.useState({ width: 0, height: 0 });
  const hasLocation = hasValidLocation(latitude, longitude);
  const mapLabel = hasLocation ? `${latitude?.toFixed(5)}, ${longitude?.toFixed(5)}` : 'Ubicación pendiente';

  function handleLayout(event: LayoutChangeEvent) {
    setLayout({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height });
  }

  function handleMapPress(event: GestureResponderEvent) {
    if (!hasLocation || !onCoordinateChange || layout.width === 0 || layout.height === 0) return;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

    const point = getLocalPoint(event);
    if (!point) return;

    const next = moveLatLngFromViewportPoint({
      latitude,
      longitude,
      mapWidth: layout.width,
      mapHeight: layout.height,
      locationX: point.x,
      locationY: point.y,
    });

    if (!next) return;

    onCoordinateChange(next);
  }

  return (
    <Pressable style={styles.mapBox} onLayout={handleLayout} onPress={handleMapPress} disabled={!hasLocation || !onCoordinateChange}>
      {hasLocation && typeof latitude === 'number' && typeof longitude === 'number' ? <Image source={{ uri: mapTileUrl(latitude, longitude) }} style={styles.mapImage} /> : <MapGradient />}
      {hasLocation ? <View style={styles.mapOverlay} /> : null}
      {!hasLocation ? <View style={styles.mapPlaceholder}><Text style={styles.mapPlaceholderText}>Captura la ubicación para ver el mapa real</Text></View> : null}
      <View style={styles.mapLineOne} />
      <View style={styles.mapLineTwo} />
      <View style={styles.mapPin}>
        <FontAwesome5 name="map-marker-alt" size={24} color="#CC315F" />
      </View>
      <View style={styles.mapLabel}><Text style={styles.mapLabelText}>{mapLabel}</Text></View>
      <View style={styles.mapAccuracy}><Text style={styles.mapAccuracyText}>{accuracyLabel}</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, backgroundColor: colors.navyDark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, zIndex: 2 },
  headerText: { flex: 1, paddingHorizontal: 4 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.white },
  headerSubtitle: { marginTop: 1, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.55)' },
  headerBadge: { height: 20, borderRadius: 16, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, marginRight: 4 },
  headerBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.navy },
  offlineBanner: { height: 23, backgroundColor: '#2A1A04', borderBottomWidth: 1, borderBottomColor: colors.gold, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16 },
  onlineBanner: { backgroundColor: '#082D28', borderBottomColor: colors.teal },
  offlineText: { fontSize: 11, fontWeight: fontWeight.semibold, color: colors.gold },
  onlineText: { color: colors.teal },
  stepperWrap: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 9 },
  stepperRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { width: 83, alignItems: 'center', position: 'relative' },
  stepLine: { position: 'absolute', top: 11, left: 44, width: 73, height: 2, backgroundColor: colors.borderMid },
  stepCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderWidth: 2, borderColor: colors.gold },
  stepNumber: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.placeholder },
  stepNumberActive: { color: colors.gold },
  stepLabel: { marginTop: 3, fontSize: 8, color: colors.placeholder },
  stepLabelActive: { fontWeight: fontWeight.semibold, color: colors.goldDark },
  progressRail: { marginTop: 6, height: 2, borderRadius: 2, backgroundColor: colors.border },
  progressFill: { width: 10, height: 2, borderRadius: 2, backgroundColor: colors.goldDark },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 1.5, shadowOffset: { width: 0, height: 1 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingBottom: 2 },
  cardTitle: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.muted, letterSpacing: 0.66, textTransform: 'uppercase' },
  cardSubtitle: { marginTop: 4, fontSize: 12, lineHeight: 16.8, color: colors.muted },
  cardBody: { marginTop: 10, gap: 10 },
  fieldLabel: { fontSize: 13, fontWeight: fontWeight.bold, color: colors.primary },
  fieldBox: { height: 50, borderRadius: 10, backgroundColor: '#EEEEEE', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inputBox: { backgroundColor: '#F6FAFF', borderWidth: 1.5, borderColor: colors.borderMid },
  disabledBox: { opacity: 0.65 },
  fieldValue: { flex: 1, fontSize: 14, fontWeight: fontWeight.medium, color: colors.primary },
  disabledText: { color: colors.placeholder },
  footer: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, paddingHorizontal: 14, alignItems: 'center' },
  footerButtons: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelButton: { height: 50, borderRadius: 14, borderWidth: 2, borderColor: colors.gold, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.gold },
  nextButton: { flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: colors.gold, shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  nextButtonDisabled: { backgroundColor: '#E3E3E3', shadowOpacity: 0 },
  nextText: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.white },
  nextTextDisabled: { color: colors.placeholder },
  homeIndicator: { width: 120, height: 4, borderRadius: 2, backgroundColor: colors.borderMid, marginTop: 14, marginBottom: 8 },
  mapBox: { height: 120, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#1E3A2E', overflow: 'hidden', position: 'relative' },
  mapImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  mapPlaceholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  mapPlaceholderText: { fontSize: 11, lineHeight: 15, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6, 46, 33, 0.25)' },
  mapLineOne: { position: 'absolute', top: 35, left: 59, width: 178, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,200,100,0.4)' },
  mapLineTwo: { position: 'absolute', top: 70, left: 30, width: 118, height: 2, borderRadius: 2, backgroundColor: 'rgba(255,200,100,0.3)' },
  mapPin: { position: 'absolute', top: 31, left: 134, width: 28, height: 27, alignItems: 'center' },
  mapLabel: { position: 'absolute', left: 8, bottom: 11, height: 18, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 8, maxWidth: 160 },
  mapLabelText: { fontSize: 10, fontWeight: fontWeight.semibold, color: colors.white },
  mapAccuracy: { position: 'absolute', right: 8, bottom: 11, height: 18, borderRadius: 4, backgroundColor: 'rgba(0,179,152,0.8)', justifyContent: 'center', paddingHorizontal: 8 },
  mapAccuracyText: { fontSize: 10, fontWeight: fontWeight.semibold, color: colors.white },
});
