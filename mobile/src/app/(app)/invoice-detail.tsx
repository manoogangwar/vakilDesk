import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBox } from '@/components/ui/AlertBox';
import { Badge } from '@/components/ui/Badge';
import { DateInput } from '@/components/ui/DateInput';
import { FormInput } from '@/components/ui/FormInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { C } from '@/constants/colors';
import api from '@/utils/api';

type Payment = {
  id: number;
  amount: string;
  payment_date: string;
  method: string;
  reference: string;
  notes: string;
};

type Invoice = {
  id: number;
  invoice_number: string;
  case: number;
  case_name: string;
  case_number: string;
  description: string;
  amount: string;
  paid_amount: string;
  balance: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  notes: string;
  payments: Payment[];
};

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', partial: 'Partial', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled',
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={rowS.row}>
      <Text style={rowS.label}>{label}</Text>
      <Text style={rowS.value}>{value}</Text>
    </View>
  );
}
const rowS = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  label: { width: 110, fontSize: 13, color: C.textMuted, fontWeight: '600' },
  value: { flex: 1, fontSize: 13.5, color: C.text },
});

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', payment_date: '', method: 'cash', reference: '', notes: '' });
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get<Invoice>(`/invoices/${id}/`);
      setInvoice(data);
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(useCallback(() => { void fetchInvoice(); }, [fetchInvoice]));

  const handleMarkSent = async () => {
    try {
      const { data } = await api.patch<Invoice>(`/invoices/${id}/`, { status: 'sent' });
      setInvoice(data);
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Invoice', 'Delete this invoice? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/invoices/${id}/`);
            router.back();
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            Alert.alert('Error', msg ?? 'Failed to delete invoice.');
          }
        },
      },
    ]);
  };

  const handleRecordPayment = async () => {
    setPayError('');
    const amt = parseFloat(payForm.amount);
    if (!payForm.amount || isNaN(amt) || amt <= 0) { setPayError('Enter a valid amount.'); return; }
    if (!invoice) return;
    const bal = parseFloat(invoice.balance);
    if (amt > bal) { setPayError(`Amount cannot exceed balance (₹${bal.toLocaleString('en-IN')}).`); return; }
    setPayLoading(true);
    try {
      await api.post(`/invoices/${id}/payments/`, {
        amount: payForm.amount,
        payment_date: payForm.payment_date || new Date().toISOString().split('T')[0],
        method: payForm.method,
        reference: payForm.reference,
        notes: payForm.notes,
      });
      setPayModal(false);
      setPayForm({ amount: '', payment_date: '', method: 'cash', reference: '', notes: '' });
      void fetchInvoice();
    } catch {
      setPayError('Failed to record payment.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleDeletePayment = (paymentId: number) => {
    Alert.alert('Delete Payment', 'Remove this payment record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/invoices/${id}/payments/${paymentId}/`);
            void fetchInvoice();
          } catch { Alert.alert('Error', 'Failed to delete payment.'); }
        },
      },
    ]);
  };

  if (loading) {
    return <SafeAreaView style={styles.flex}><ActivityIndicator style={{ flex: 1 }} size="large" color={C.primary} /></SafeAreaView>;
  }
  if (!invoice) return null;

  const amount = parseFloat(invoice.amount);
  const paid = parseFloat(invoice.paid_amount);
  const balance = parseFloat(invoice.balance);
  const paidPct = amount > 0 ? Math.min((paid / amount) * 100, 100) : 0;

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{invoice.invoice_number}</Text>
        <TouchableOpacity onPress={handleDelete}><Text style={styles.deleteBtn}>Delete</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Invoice header card */}
        <View style={styles.invCard}>
          <View style={styles.invCardTop}>
            <View>
              <Text style={styles.invNumber}>{invoice.invoice_number}</Text>
              <Text style={styles.invCase} numberOfLines={1}>{invoice.case_name}</Text>
            </View>
            <Badge value={invoice.status} />
          </View>

          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${paidPct}%` as `${number}%` }]} />
          </View>

          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Invoice Total</Text>
              <Text style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={[styles.amountValue, { color: C.success }]}>₹{paid.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Balance</Text>
              <Text style={[styles.amountValue, { color: balance > 0 ? C.error : C.success }]}>
                ₹{balance.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {invoice.status === 'draft' && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleMarkSent}>
              <Text style={styles.actionBtnText}>📤 Mark as Sent</Text>
            </TouchableOpacity>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => setPayModal(true)}>
              <Text style={[styles.actionBtnText, { color: C.white }]}>💳 Record Payment</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invoice Details</Text>
          <InfoRow label="Issue Date" value={fmt(invoice.issue_date)} />
          <InfoRow label="Due Date" value={fmt(invoice.due_date)} />
          <InfoRow label="Description" value={invoice.description} />
          <InfoRow label="Notes" value={invoice.notes} />
        </View>

        {/* Payments */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payments ({invoice.payments.length})</Text>
          {invoice.payments.length === 0 ? (
            <Text style={styles.empty}>No payments recorded yet.</Text>
          ) : (
            invoice.payments.map(p => (
              <View key={p.id} style={styles.payRow}>
                <View style={styles.payLeft}>
                  <Text style={styles.payAmount}>₹{parseFloat(p.amount).toLocaleString('en-IN')}</Text>
                  <Text style={styles.payMeta}>
                    {fmt(p.payment_date)} · {p.method.replace('_', ' ')}
                    {p.reference ? ` · ${p.reference}` : ''}
                  </Text>
                  {p.notes ? <Text style={styles.payNotes}>{p.notes}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => handleDeletePayment(p.id)} style={styles.payDelete}>
                  <Text style={styles.payDeleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal visible={payModal} transparent animationType="slide" onRequestClose={() => { Keyboard.dismiss(); setPayModal(false); }}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setPayModal(false); }}>
            <View style={styles.modalBg} />
          </TouchableWithoutFeedback>
          <ScrollView style={styles.modalSheet} contentContainerStyle={styles.modalContent} bounces={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Record Payment</Text>
            {payError ? <AlertBox type="error" message={payError} /> : null}

            <FormInput label="Amount (₹) *" value={payForm.amount} onChangeText={v => setPayForm(f => ({ ...f, amount: v }))} placeholder={`Balance: ₹${balance.toLocaleString('en-IN')}`} keyboardType="numeric" />

            <DateInput label="Payment Date" value={payForm.payment_date} onChange={v => setPayForm(f => ({ ...f, payment_date: v }))} />

            {/* Method pills */}
            <Text style={styles.methodLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              {METHOD_OPTIONS.map(o => (
                <TouchableOpacity
                  key={o.value}
                  style={[styles.methodPill, payForm.method === o.value && styles.methodPillActive]}
                  onPress={() => setPayForm(f => ({ ...f, method: o.value }))}
                >
                  <Text style={[styles.methodPillText, payForm.method === o.value && styles.methodPillTextActive]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <FormInput label="Reference / Transaction ID" value={payForm.reference} onChangeText={v => setPayForm(f => ({ ...f, reference: v }))} placeholder="Cheque no., UPI ID, etc." autoCapitalize="none" />
            <FormInput label="Notes" value={payForm.notes} onChangeText={v => setPayForm(f => ({ ...f, notes: v }))} placeholder="Optional notes" />

            <PrimaryButton title="Save Payment" onPress={handleRecordPayment} loading={payLoading} />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { Keyboard.dismiss(); setPayModal(false); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  deleteBtn: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40, gap: 14 },

  invCard: { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  invCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  invNumber: { fontSize: 15, fontWeight: '700', color: C.primary },
  invCase: { fontSize: 13, color: C.textMuted, marginTop: 2, maxWidth: 220 },
  progressBg: { height: 6, backgroundColor: C.border, borderRadius: 3, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: C.success, borderRadius: 3 },
  amountRow: { flexDirection: 'row' },
  amountItem: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 10.5, color: C.textMuted, marginBottom: 2 },
  amountValue: { fontSize: 14, fontWeight: '700', color: C.text },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  actionBtnPrimary: { backgroundColor: C.primary, borderColor: C.primary },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: C.text },

  card: { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: C.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 8 },

  payRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 8 },
  payLeft: { flex: 1 },
  payAmount: { fontSize: 14, fontWeight: '700', color: C.success },
  payMeta: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  payNotes: { fontSize: 12, color: C.textMuted, marginTop: 2, fontStyle: 'italic' },
  payDelete: { paddingHorizontal: 6, paddingVertical: 2 },
  payDeleteText: { fontSize: 13, color: C.error },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBg: { flex: 1 },
  modalSheet: { backgroundColor: C.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '90%' },
  modalContent: { padding: 24, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 16 },
  methodLabel: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 8 },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  methodPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.inputBg },
  methodPillActive: { backgroundColor: C.primary, borderColor: C.primary },
  methodPillText: { fontSize: 12.5, fontWeight: '500', color: C.textMuted },
  methodPillTextActive: { color: C.white },
  cancelBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 14, color: C.textMuted },
});
