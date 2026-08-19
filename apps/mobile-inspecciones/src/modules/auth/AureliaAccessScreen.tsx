import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, fontWeight } from '../../shared/theme/tokens';
import { login } from '../../shared/services/api/auth.api';
import { consumePendingMobileNotificationRoute } from '../../shared/services/mobileNotificationDeepLink';
import { useMobileSession } from './mobileSession.store';
import LogoMobile from '../../../assets/icons/logo_mobile_white.svg';

export function AureliaAccessScreen() {
  const setMobileSession = useMobileSession((state) => state.setMobileSession);
  const [email, setEmail] = useState('karen.opazo@goldfields.com');
  const [credential, setCredential] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = email.trim().length > 0 && credential.length > 0 && !loading;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const response = await login(email, credential);
      setMobileSession(response.token, response.user);
      const pendingRoute = await consumePendingMobileNotificationRoute();
      router.replace((pendingRoute ?? '/inspection/dashboard') as never);
    } catch {
      setError('No se pudo iniciar sesión. Revisa los datos o la conexión con la API.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <View style={styles.body}>
            <View style={styles.logoWrapWhite}>
              <LogoMobile width={137} height={45} />
            </View>
            <Text style={styles.title}>Le damos la bienvenida a <Text style={styles.titleBlue}>AurelIA</Text></Text>
            <Text style={styles.subtitle}>Sistema de gestión ambiental</Text>
            <View style={styles.form}>
              <Text style={styles.label}>Nombre de usuario</Text>
              <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="usuario@goldfields.com" placeholderTextColor="#8b9aaa" style={styles.input} />
              <Text style={styles.labelTwo}>Contraseña</Text>
              <View style={styles.inputWithIcon}>
                <TextInput value={credential} onChangeText={setCredential} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} placeholder="Contraseña" placeholderTextColor="#8b9aaa" style={styles.passwordInput} />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setVisible((value) => !value)}>
                  <FontAwesome5 name={visible ? 'eye-slash' : 'eye'} size={18} color={colors.teal} />
                </TouchableOpacity>
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={styles.restore}><Text style={styles.restoreText}>Recuperar contraseña</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.loginButton, !canSubmit ? styles.disabledButton : null]} onPress={submit} activeOpacity={0.75} disabled={!canSubmit}>
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.loginText}>Iniciar sesión</Text>}
              </TouchableOpacity>
              <View style={styles.lang}><View style={styles.en}><Text style={styles.enText}>EN</Text></View><View style={styles.es}><Text style={styles.esText}>ES</Text></View></View>
            </View>
          </View>
          <View style={styles.footer}><Text style={styles.footerText}>Diseñado y desarrollado por</Text><Text style={styles.footerBrand}>KABELI</Text></View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  screen: { flex: 1, backgroundColor: '#fff' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 69, alignItems: 'center' },
  logoWrap: { width: 154, height: 56, borderRadius: 14, backgroundColor: colors.navyDark, alignItems: 'center', justifyContent: 'center' },
  logoWrapWhite: { width: 154, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 37, fontSize: 22, lineHeight: 28, color: colors.primary, fontWeight: fontWeight.bold, textAlign: 'center' },
  titleBlue: { color: colors.blueLink },
  subtitle: { marginTop: 13, fontSize: 16, color: colors.primary, textAlign: 'center' },
  form: { marginTop: 76, width: '100%' },
  label: { fontSize: 18, color: colors.primary, fontWeight: fontWeight.bold, marginBottom: 10 },
  labelTwo: { fontSize: 18, color: colors.primary, fontWeight: fontWeight.bold, marginTop: 28, marginBottom: 10 },
  input: { height: 52, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#f3f8ff', paddingHorizontal: 14, color: colors.primary, fontSize: 15 },
  inputWithIcon: { height: 52, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderMid, backgroundColor: '#f3f8ff', flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, height: 52, paddingLeft: 14, color: colors.primary, fontSize: 15 },
  eyeButton: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
  errorText: { marginTop: 10, color: '#bd3b5b', fontSize: 12, lineHeight: 16 },
  restore: { alignSelf: 'flex-end', marginTop: 28 },
  restoreText: { color: colors.gold, fontSize: 15, fontWeight: fontWeight.bold, textDecorationLine: 'underline' },
  loginButton: { marginTop: 27, height: 52, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  disabledButton: { backgroundColor: '#d3d3d3' },
  loginText: { color: colors.white, fontSize: 16, fontWeight: fontWeight.bold },
  lang: { marginTop: 22, alignSelf: 'center', height: 32, flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#d1d1d1' },
  en: { width: 45, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  es: { width: 43, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  enText: { color: colors.primary, fontSize: 18, fontWeight: fontWeight.bold },
  esText: { color: colors.white, fontSize: 18, fontWeight: fontWeight.bold },
  footer: { position: 'absolute', bottom: 31, left: 0, right: 0, alignItems: 'center' },
  footerText: { color: colors.muted, fontSize: 15 },
  footerBrand: { color: colors.muted, fontSize: 14, fontWeight: fontWeight.bold, marginTop: 6, letterSpacing: 0.8 },
});
