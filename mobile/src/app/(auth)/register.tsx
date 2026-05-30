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
import api from '@/utils/api';

type Role = 'lawyer' | 'client' | 'admin';
const ROLES: { value: Role; label: string }[] = [
  { value: 'lawyer', label: 'Lawyer' },
  { value: 'client', label: 'Client' },
  { value: 'admin', label: 'Admin' },
];

function getStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_COLOR = ['', C.error, '#f59e0b', '#f59e0b', C.success];
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Fair', 'Strong'];

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone: '',
    role: 'lawyer' as Role,
    password: '',
    confirm_password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set =
    (field: keyof typeof form) =>
    (v: string) => {
      setForm((f) => ({ ...f, [field]: v }));
      setFieldErrors((fe) => ({ ...fe, [field]: '' }));
    };

  const handleRegister = async () => {
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      await api.post('/register/', form);
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: Record<string, unknown>; status?: number };
        message?: string;
      };
      const data = axiosErr.response?.data;
      if (data && typeof data === 'object') {
        const nonField =
          (data.non_field_errors as string[] | undefined)?.[0] ??
          (data.detail as string | undefined);
        if (nonField) {
          setError(nonField);
        } else {
          const mapped: Record<string, string> = {};
          Object.keys(data).forEach((k) => {
            const v = data[k];
            mapped[k] = Array.isArray(v) ? (v[0] as string) : String(v);
          });
          setFieldErrors(mapped);
          setError('Please fix the errors below.');
        }
      } else {
        setError(axiosErr.message ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(form.password);

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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Join VakilDesk — it takes less than a minute.
            </Text>

            {error ? <AlertBox type="error" message={error} /> : null}

            {/* Name row */}
            <View style={styles.row}>
              <View style={styles.half}>
                <FormInput
                  label="First Name"
                  value={form.first_name}
                  onChangeText={set('first_name')}
                  placeholder="First name"
                  error={fieldErrors.first_name}
                />
              </View>
              <View style={styles.half}>
                <FormInput
                  label="Last Name"
                  value={form.last_name}
                  onChangeText={set('last_name')}
                  placeholder="Last name"
                  error={fieldErrors.last_name}
                />
              </View>
            </View>

            <FormInput
              label="Email Address"
              value={form.email}
              onChangeText={set('email')}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              error={fieldErrors.email}
            />

            {/* Username + Phone row */}
            <View style={styles.row}>
              <View style={styles.half}>
                <FormInput
                  label="Username"
                  value={form.username}
                  onChangeText={set('username')}
                  placeholder="username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  error={fieldErrors.username}
                />
              </View>
              <View style={styles.half}>
                <FormInput
                  label="Phone (optional)"
                  value={form.phone}
                  onChangeText={set('phone')}
                  placeholder="+91 00000 00000"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Role picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleRow}>
                {ROLES.map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.rolePill,
                      form.role === value && styles.rolePillActive,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, role: value }))}
                  >
                    <Text
                      style={[
                        styles.rolePillText,
                        form.role === value && styles.rolePillTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <PasswordInput
              label="Password"
              value={form.password}
              onChangeText={set('password')}
              placeholder="Minimum 8 characters"
              show={showPw}
              onToggle={() => setShowPw((v) => !v)}
              autoComplete="new-password"
              error={fieldErrors.password}
            />

            {/* Password strength bars */}
            {form.password ? (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((n) => (
                    <View
                      key={n}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            strength >= n
                              ? STRENGTH_COLOR[strength]
                              : C.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    { color: STRENGTH_COLOR[strength] },
                  ]}
                >
                  {STRENGTH_LABEL[strength]} password
                </Text>
              </View>
            ) : null}

            <PasswordInput
              label="Confirm Password"
              value={form.confirm_password}
              onChangeText={set('confirm_password')}
              placeholder="Repeat your password"
              show={showCpw}
              onToggle={() => setShowCpw((v) => !v)}
              autoComplete="new-password"
              error={fieldErrors.confirm_password}
            />

            <PrimaryButton
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, padding: 24 },
  brandHeader: { alignItems: 'center', marginVertical: 20 },
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
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  formGroup: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  roleRow: { flexDirection: 'row', gap: 8 },
  rolePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  rolePillActive: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  rolePillText: { fontSize: 13, fontWeight: '500', color: C.textMuted },
  rolePillTextActive: { color: C.white },
  strengthWrap: { marginTop: -8, marginBottom: 14 },
  strengthBars: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { fontSize: 13.5, color: C.textMuted },
  footerLink: { fontSize: 13.5, color: C.primary, fontWeight: '600' },
});
