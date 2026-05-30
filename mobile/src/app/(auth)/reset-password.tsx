import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBox } from '@/components/ui/AlertBox';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { C } from '@/constants/colors';
import api from '@/utils/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { uid, token } = useLocalSearchParams<{ uid: string; token: string }>();

  const [form, setForm] = useState({
    uid: uid ?? '',
    token: token ?? '',
    new_password: '',
    confirm_password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set =
    (field: keyof typeof form) =>
    (v: string) =>
      setForm((f) => ({ ...f, [field]: v }));

  const handleSubmit = async () => {
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.new_password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/password-reset/confirm/', form);
      setSuccess(true);
      setTimeout(() => router.replace('/(auth)/login'), 2500);
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, unknown> } })
        ?.response?.data;
      if (d?.error) {
        setError(String(d.error));
      } else if (d?.new_password) {
        setError(
          Array.isArray(d.new_password)
            ? (d.new_password[0] as string)
            : String(d.new_password),
        );
      } else {
        setError('Reset failed. The link may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.title}>Invalid Link</Text>
            <Text style={styles.subtitle}>
              This reset link is missing required information.
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.footerLink}>Request a new reset link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandHeader}>
            <Text style={styles.logo}>
              Vakil<Text style={styles.logoAccent}>Desk</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Set new password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password for your account.
            </Text>

            {error ? <AlertBox type="error" message={error} /> : null}

            {success ? (
              <AlertBox
                type="success"
                message="Password reset successful! Redirecting to sign in…"
              />
            ) : (
              <>
                <PasswordInput
                  label="New Password"
                  value={form.new_password}
                  onChangeText={set('new_password')}
                  placeholder="Minimum 8 characters"
                  show={showPw}
                  onToggle={() => setShowPw((v) => !v)}
                  autoComplete="new-password"
                />

                <PasswordInput
                  label="Confirm New Password"
                  value={form.confirm_password}
                  onChangeText={set('confirm_password')}
                  placeholder="Repeat your new password"
                  show={showCpw}
                  onToggle={() => setShowCpw((v) => !v)}
                  autoComplete="new-password"
                />

                <PrimaryButton
                  title="Reset Password"
                  onPress={handleSubmit}
                  loading={loading}
                />
              </>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>← Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brandHeader: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 28, fontWeight: '700', color: C.primary },
  logoAccent: { color: C.accent },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  subtitle: { fontSize: 13.5, color: C.textMuted, marginBottom: 20 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerLink: { fontSize: 13.5, color: C.primary, fontWeight: '600' },
});
