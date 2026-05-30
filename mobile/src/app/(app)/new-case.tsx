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
import { DateInput } from '@/components/ui/DateInput';
import { FormInput } from '@/components/ui/FormInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { C } from '@/constants/colors';
import api from '@/utils/api';

export default function NewCaseScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    case_name: '',
    case_number: '',
    next_date: '',
    under_section: '',
    police_station: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof typeof form) => (v: string) =>
    setForm(f => ({ ...f, [field]: v }));

  const handleCreate = async () => {
    if (!form.case_name.trim()) {
      setError('Case name is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, string> = { case_name: form.case_name.trim() };
      if (form.case_number.trim()) payload.case_number = form.case_number.trim();
      if (form.next_date.trim()) payload.next_date = form.next_date.trim();
      if (form.under_section.trim()) payload.under_section = form.under_section.trim();
      if (form.police_station.trim()) payload.police_station = form.police_station.trim();
      if (form.notes.trim()) payload.notes = form.notes.trim();

      await api.post('/cases/', payload);
      router.back();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (d?.case_name) {
        setError(Array.isArray(d.case_name) ? (d.case_name[0] as string) : String(d.case_name));
      } else {
        setError('Failed to create case. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Case</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {error ? <AlertBox type="error" message={error} /> : null}

          <FormInput
            label="Case Name *"
            value={form.case_name}
            onChangeText={set('case_name')}
            placeholder="e.g. State vs. Sharma"
            autoCapitalize="words"
          />

          <FormInput
            label="Case Number"
            value={form.case_number}
            onChangeText={set('case_number')}
            placeholder="e.g. 1234/2024"
            autoCapitalize="none"
          />

          <DateInput
            label="Next Date"
            value={form.next_date}
            onChange={v => setForm(f => ({ ...f, next_date: v }))}
          />

          <FormInput
            label="U/S  (Under Section)"
            value={form.under_section}
            onChangeText={set('under_section')}
            placeholder="e.g. 302 IPC"
          />

          <FormInput
            label="P/S  (Police Station)"
            value={form.police_station}
            onChangeText={set('police_station')}
            placeholder="e.g. Kotwali"
            autoCapitalize="words"
          />

          <FormInput
            label="Notes"
            value={form.notes}
            onChangeText={set('notes')}
            placeholder="Any additional notes…"
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          <PrimaryButton
            title="Create Case"
            onPress={handleCreate}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  scroll: { padding: 16, paddingBottom: 40 },
});
