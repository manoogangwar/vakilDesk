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

export default function NewClientScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [field]: v }));

  const handleCreate = async () => {
    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (!form.first_name.trim()) { setError('First name is required.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/clients/', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      });
      router.back();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg = d ? Object.values(d).flat()[0] : null;
      setError(msg ? String(msg) : 'Failed to create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <FormInput label="Address" value={form.address} onChangeText={set('address')} placeholder="Client's address" multiline numberOfLines={2} style={{ height: 64, textAlignVertical: 'top' }} />
          <FormInput label="Notes" value={form.notes} onChangeText={set('notes')} placeholder="Any notes about this client…" multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />

          <PrimaryButton title="Add Client" onPress={handleCreate} loading={loading} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  scroll: { padding: 16, paddingBottom: 40 },
});
