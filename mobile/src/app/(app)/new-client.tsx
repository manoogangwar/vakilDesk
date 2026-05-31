import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Clipboard,
  KeyboardAvoidingView,
  Modal,
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

type CreatedClient = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

export default function NewClientScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', address: '', notes: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CreatedClient | null>(null);

  const set = (field: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [field]: v }));

  const handleCreate = async () => {
    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (!form.first_name.trim()) { setError('First name is required.'); return; }
    if (form.password && form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      };
      if (form.password) payload.password = form.password;
      const { data } = await api.post<CreatedClient>('/clients/', payload);
      setCreated({ ...data, email: form.email.trim() });
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg = d ? Object.values(d).flat()[0] : null;
      setError(msg ? String(msg) : 'Failed to create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Copied to clipboard.');
  };

  const name = `${form.first_name} ${form.last_name}`.trim();

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Client</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error ? <AlertBox type="error" message={error} /> : null}

          <FormInput label="First Name *" value={form.first_name} onChangeText={set('first_name')} placeholder="Client's first name" autoCapitalize="words" />
          <FormInput label="Last Name" value={form.last_name} onChangeText={set('last_name')} placeholder="Client's last name" autoCapitalize="words" />
          <FormInput label="Email *" value={form.email} onChangeText={set('email')} placeholder="client@example.com" keyboardType="email-address" autoCapitalize="none" />
          <FormInput label="Phone" value={form.phone} onChangeText={set('phone')} placeholder="+91 00000 00000" keyboardType="phone-pad" />

          <PasswordInput
            label="Password (optional)"
            value={form.password}
            onChangeText={set('password')}
            placeholder="Set login password for client"
            show={showPw}
            onToggle={() => setShowPw(v => !v)}
          />
          <Text style={styles.passwordHint}>If left blank, a secure password is auto-generated. You can share it with the client after creation.</Text>

          <FormInput label="Address" value={form.address} onChangeText={set('address')} placeholder="Client's address" multiline numberOfLines={2} style={{ height: 64, textAlignVertical: 'top' }} />
          <FormInput label="Notes" value={form.notes} onChangeText={set('notes')} placeholder="Any notes about this client…" multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />

          <PrimaryButton title="Add Client" onPress={handleCreate} loading={loading} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Credentials modal — shown once after client is created */}
      <Modal visible={!!created} transparent animationType="fade" onRequestClose={() => { setCreated(null); router.back(); }}>
        <View style={styles.credOverlay}>
          <View style={styles.credSheet}>
            <Text style={styles.credTitle}>✅ Client Added!</Text>
            <Text style={styles.credSubtitle}>
              Share these login credentials with {created?.first_name || 'the client'} so they can access VakilDesk.
            </Text>

            <View style={styles.credField}>
              <Text style={styles.credLabel}>Username</Text>
              <View style={styles.credRow}>
                <Text style={styles.credValue} selectable>{created?.username ?? ''}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(created?.username ?? '')}>
                  <Text style={styles.copyBtn}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.credField}>
              <Text style={styles.credLabel}>Password</Text>
              <View style={styles.credRow}>
                <Text style={styles.credValue} selectable>
                  {form.password || '(auto-generated — unknown after this screen)'}
                </Text>
                {form.password ? (
                  <TouchableOpacity onPress={() => copyToClipboard(form.password)}>
                    <Text style={styles.copyBtn}>Copy</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {!form.password && (
                <Text style={styles.credWarning}>⚠️ Password was auto-generated. Use "Forgot Password" to send a reset link.</Text>
              )}
            </View>

            <View style={styles.credField}>
              <Text style={styles.credLabel}>Email</Text>
              <Text style={styles.credValue} selectable>{created?.email ?? ''}</Text>
            </View>

            <PrimaryButton
              title="Done"
              onPress={() => { setCreated(null); router.back(); }}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  scroll: { padding: 16, paddingBottom: 40 },
  passwordHint: { fontSize: 11.5, color: C.textMuted, marginTop: -8, marginBottom: 14, lineHeight: 16 },

  credOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  credSheet: { backgroundColor: C.white, borderRadius: 20, padding: 24 },
  credTitle: { fontSize: 22, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 8 },
  credSubtitle: { fontSize: 13.5, color: C.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  credField: { backgroundColor: C.inputBg, borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  credLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  credRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  credValue: { flex: 1, fontSize: 14, color: C.text, fontWeight: '600' },
  copyBtn: { fontSize: 13, color: C.primary, fontWeight: '700' },
  credWarning: { fontSize: 12, color: '#d97706', marginTop: 6, lineHeight: 16 },
});
