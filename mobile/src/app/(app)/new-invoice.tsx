import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

type Case = { id: number; case_name: string; case_number: string };

export default function NewInvoiceScreen() {
  const { case_id } = useLocalSearchParams<{ case_id?: string }>();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [form, setForm] = useState({
    description: '', amount: '', due_date: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Case[]>('/cases/').then(({ data }) => {
      setCases(data);
      if (case_id) {
        const found = data.find(c => String(c.id) === case_id);
        if (found) setSelectedCase(found);
      }
    });
  }, [case_id]);

  const set = (field: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [field]: v }));

  const handleCreate = async () => {
    if (!selectedCase) { setError('Please select a case.'); return; }
    if (!form.amount.trim() || isNaN(parseFloat(form.amount))) { setError('Please enter a valid amount.'); return; }
    setError(''); setLoading(true);
    try {
      const payload: Record<string, string | number> = {
        case: selectedCase.id,
        amount: form.amount.trim(),
        description: form.description.trim(),
        notes: form.notes.trim(),
      };
      if (form.due_date) payload.due_date = form.due_date;
      const { data } = await api.post<{ id: number }>('/invoices/', payload);
      router.replace({ pathname: '/(app)/invoice-detail', params: { id: data.id } });
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg = d ? Object.values(d).flat()[0] : null;
      setError(msg ? String(msg) : 'Failed to create invoice. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Cancel</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>New Invoice</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error ? <AlertBox type="error" message={error} /> : null}

          {/* Case selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Case *</Text>
            <TouchableOpacity
              style={styles.caseSelector}
              onPress={() => setShowCasePicker(v => !v)}
            >
              <Text style={selectedCase ? styles.caseSelectorText : styles.caseSelectorPlaceholder} numberOfLines={1}>
                {selectedCase ? `${selectedCase.case_name}${selectedCase.case_number ? ` #${selectedCase.case_number}` : ''}` : 'Select a case…'}
              </Text>
              <Text style={styles.caseSelectorChevron}>{showCasePicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showCasePicker && (
              <View style={styles.caseDropdown}>
                {cases.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.caseOption, selectedCase?.id === c.id && styles.caseOptionActive]}
                    onPress={() => { setSelectedCase(c); setShowCasePicker(false); }}
                  >
                    <Text style={[styles.caseOptionText, selectedCase?.id === c.id && styles.caseOptionTextActive]} numberOfLines={1}>
                      {c.case_name}{c.case_number ? ` — #${c.case_number}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <FormInput
            label="Amount (₹) *"
            value={form.amount}
            onChangeText={set('amount')}
            placeholder="e.g. 25000"
            keyboardType="numeric"
          />

          <FormInput
            label="Description"
            value={form.description}
            onChangeText={set('description')}
            placeholder="e.g. Legal consultation fees for Q1 2026"
            multiline
            numberOfLines={2}
            style={{ height: 64, textAlignVertical: 'top' }}
          />

          <DateInput
            label="Due Date"
            value={form.due_date}
            onChange={v => setForm(f => ({ ...f, due_date: v }))}
          />

          <FormInput
            label="Notes"
            value={form.notes}
            onChangeText={set('notes')}
            placeholder="Any additional notes…"
            multiline
            numberOfLines={2}
            style={{ height: 64, textAlignVertical: 'top' }}
          />

          <PrimaryButton title="Create Invoice" onPress={handleCreate} loading={loading} style={{ marginTop: 8 }} />
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

  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 6, letterSpacing: 0.2 },
  caseSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 8, paddingHorizontal: 13, paddingVertical: 11,
  },
  caseSelectorText: { flex: 1, fontSize: 14, color: C.text },
  caseSelectorPlaceholder: { flex: 1, fontSize: 14, color: '#c0c7d3' },
  caseSelectorChevron: { fontSize: 11, color: C.textMuted },
  caseDropdown: {
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 8, marginTop: 4, maxHeight: 200, overflow: 'hidden',
  },
  caseOption: { paddingHorizontal: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  caseOptionActive: { backgroundColor: `${C.primary}12` },
  caseOptionText: { fontSize: 13.5, color: C.text },
  caseOptionTextActive: { color: C.primary, fontWeight: '600' },
});
