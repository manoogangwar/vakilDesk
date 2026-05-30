import { useRouter } from 'expo-router';
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
import { FormInput } from '@/components/ui/FormInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { C } from '@/constants/colors';
import api from '@/utils/api';

type ResetResult = { message: string; uid: string; token: string };

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResetResult | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<ResetResult>('/password-reset/request/', { email });
      setResult(data);
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, unknown> } })
        ?.response?.data;
      if (d?.email) {
        setError(Array.isArray(d.email) ? (d.email[0] as string) : String(d.email));
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const goToReset = () => {
    if (!result) return;
    router.push({
      pathname: '/(auth)/reset-password',
      params: { uid: result.uid, token: result.token },
    });
  };

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
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter your registered email and we&apos;ll generate a reset link.
            </Text>

            {error ? <AlertBox type="error" message={error} /> : null}

            {result ? (
              <>
                <AlertBox
                  type="success"
                  message="Reset link generated successfully. In production this would be emailed."
                />
                {/* Dev-only token display */}
                <View style={styles.tokenBox}>
                  <Text style={styles.tokenKey}>UID</Text>
                  <Text style={styles.tokenVal} selectable>{result.uid}</Text>
                  <Text style={[styles.tokenKey, { marginTop: 10 }]}>TOKEN</Text>
                  <Text style={styles.tokenVal} selectable>{result.token}</Text>
                </View>
                <PrimaryButton title="Proceed to Reset Password →" onPress={goToReset} />
              </>
            ) : (
              <>
                <FormInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
                <PrimaryButton
                  title="Send Reset Link"
                  onPress={handleSubmit}
                  loading={loading}
                />
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered it? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Back to sign in</Text>
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
  tokenBox: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
  },
  tokenKey: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  tokenVal: {
    fontSize: 12,
    color: C.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { fontSize: 13.5, color: C.textMuted },
  footerLink: { fontSize: 13.5, color: C.primary, fontWeight: '600' },
});
