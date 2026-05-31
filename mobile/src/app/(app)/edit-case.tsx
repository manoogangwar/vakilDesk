import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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

type CaseForm = {
  case_name: string;
  case_number: string;
  status: string;
  court_name: string;
  court_type: string;
  judge_name: string;
  under_section: string;
  police_station: string;
  next_date: string;
  notes: string;
};

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'adjourned', label: 'Adjourned' },
  { value: 'disposed', label: 'Disposed' },
  { value: 'on_hold', label: 'On Hold' },
];

const COURT_TYPE_OPTIONS = [
  { value: 'district', label: 'District Court' },
  { value: 'high_court', label: 'High Court' },
  { value: 'supreme_court', label: 'Supreme Court' },
  { value: 'tribunal', label: 'Tribunal' },
  { value: 'other', label: 'Other' },
];

function PillSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={pillStyles.group}>
      <Text style={pillStyles.label}>{label}</Text>
      <View style={pillStyles.row}>
        {options.map(o => (
          <TouchableOpacity
            key={o.value}
            style={[pillStyles.pill, value === o.value && pillStyles.pillActive]}
            onPress={() => onChange(o.value)}
          >
            <Text style={[pillStyles.pillText, value === o.value && pillStyles.pillTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  group: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 8, letterSpacing: 0.2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  pillActive: { backgroundColor: C.primary, borderColor: C.primary },
  pillText: { fontSize: 12.5, fontWeight: '500', color: C.textMuted },
  pillTextActive: { color: C.white },
});

export default function EditCaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<CaseForm>({
    case_name: '', case_number: '', status: 'open',
    court_name: '', court_type: '', judge_name: '',
    under_section: '', police_station: '', next_date: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    if (!id) return;
    setFetching(true);
    api.get(`/cases/${id}/`).then(({ data }) => {
      setForm({
        case_name: data.case_name ?? '',
        case_number: data.case_number ?? '',
        status: data.status ?? 'open',
        court_name: data.court_name ?? '',
        court_type: data.court_type ?? '',
        judge_name: data.judge_name ?? '',
        under_section: data.under_section ?? '',
        police_station: data.police_station ?? '',
        next_date: data.next_date ?? '',
        notes: data.notes ?? '',
      });
    }).finally(() => setFetching(false));
  }, [id]));

  const set = (field: keyof CaseForm) => (v: string) =>
    setForm(f => ({ ...f, [field]: v }));

  const handleSave = async () => {
    if (!form.case_name.trim()) {
      setError('Case name is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, string> = { case_name: form.case_name.trim(), status: form.status };
      if (form.case_number.trim()) payload.case_number = form.case_number.trim();
      if (form.court_name.trim()) payload.court_name = form.court_name.trim();
      if (form.court_type) payload.court_type = form.court_type;
      if (form.judge_name.trim()) payload.judge_name = form.judge_name.trim();
      if (form.next_date.trim()) payload.next_date = form.next_date.trim();
      if (form.under_section.trim()) payload.under_section = form.under_section.trim();
      if (form.police_station.trim()) payload.police_station = form.police_station.trim();
      if (form.notes.trim()) payload.notes = form.notes.trim();

      await api.patch(`/cases/${id}/`, payload);
      router.back();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg = d ? Object.values(d).flat()[0] : null;
      setError(msg ? String(msg) : 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Case</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Case</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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

          <PillSelector
            label="Case Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={set('status')}
          />

          <DateInput
            label="Next Date"
            value={form.next_date}
            onChange={v => setForm(f => ({ ...f, next_date: v }))}
          />

          <FormInput
            label="Court Name"
            value={form.court_name}
            onChangeText={set('court_name')}
            placeholder="e.g. District Court, Lucknow"
            autoCapitalize="words"
          />

          <PillSelector
            label="Court Type"
            options={COURT_TYPE_OPTIONS}
            value={form.court_type}
            onChange={set('court_type')}
          />

          <FormInput
            label="Judge Name"
            value={form.judge_name}
            onChangeText={set('judge_name')}
            placeholder="e.g. Hon. Justice R.K. Sharma"
            autoCapitalize="words"
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
            title="Save Changes"
            onPress={handleSave}
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
