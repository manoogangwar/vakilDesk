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
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { C } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [field]: v }));

  const handleLogin = async () => {
    if (!form.username.trim() || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/login/', {
        username: form.username,
        password: form.password,
      });
      await login(data.access, data.refresh);
      router.replace('/(app)/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail ?? e.message ?? 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
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
          {/* Brand header */}
          <View style={styles.brandHeader}>
            <Text style={styles.logo}>
              Vakil<Text style={styles.logoAccent}>Desk</Text>
            </Text>
            <Text style={styles.tagline}>Legal practice management</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to your VakilDesk account to continue.
            </Text>

            {error ? <AlertBox type="error" message={error} /> : null}

            <FormInput
              label="Username"
              value={form.username}
              onChangeText={set('username')}
              placeholder="Enter your username"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
            />

            <PasswordInput
              label="Password"
              value={form.password}
              onChangeText={set('password')}
              placeholder="Enter your password"
              show={showPw}
              onToggle={() => setShowPw((v) => !v)}
              autoComplete="current-password"
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Create one</Text>
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
  brandHeader: { alignItems: 'center', marginBottom: 28 },
  logo: { fontSize: 32, fontWeight: '700', color: C.primary, letterSpacing: -0.5 },
  logoAccent: { color: C.accent },
  tagline: { fontSize: 13, color: C.textMuted, marginTop: 4 },
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  subtitle: { fontSize: 13.5, color: C.textMuted, marginBottom: 22 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 18 },
  forgotText: { fontSize: 12, color: C.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { fontSize: 13.5, color: C.textMuted },
  footerLink: { fontSize: 13.5, color: C.primary, fontWeight: '600' },
});
