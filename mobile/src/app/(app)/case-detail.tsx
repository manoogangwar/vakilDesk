import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { type Doc, DocumentsSection } from '@/components/ui/DocumentsSection';
import { FormInput } from '@/components/ui/FormInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { C } from '@/constants/colors';
import api from '@/utils/api';

type CaseDetail = {
  id: number;
  case_name: string;
  case_number: string;
  status: string;
  court_name: string;
  court_type: string;
  judge_name: string;
  under_section: string;
  police_station: string;
  next_date: string | null;
  previous_date: string | null;
  payment_status: string;
  fee_amount: string;
  paid_amount: string;
  notes: string;
  lawyer_name: string;
};

type ClientItem = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

type HearingRecord = {
  id: number;
  date: string;
  outcome: string;
  adjourned_to: string | null;
};

type InvoiceSummary = {
  id: number;
  invoice_number: string;
  amount: string;
  paid_amount: string;
  balance: string;
  status: string;
  due_date: string | null;
};

type PayStatus = 'pending' | 'partial' | 'paid';

const PAY_STATUS_COLOR: Record<PayStatus, string> = {
  pending: C.error,
  partial: '#d97706',
  paid: C.success,
};

const PAY_STATUS_BG: Record<PayStatus, string> = {
  pending: C.errorBg,
  partial: '#fffbeb',
  paid: C.successBg,
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value || '—'}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: 'flex-start',
  },
  label: { width: 120, fontSize: 13, color: C.textMuted, fontWeight: '600' },
  value: { flex: 1, fontSize: 13.5, color: C.text, fontWeight: '500' },
});

function getInitials(c: ClientItem) {
  return ((c.first_name?.[0] ?? '') + (c.last_name?.[0] ?? '')).toUpperCase() ||
    (c.email?.[0] ?? '?').toUpperCase();
}

function getClientName(c: ClientItem) {
  return c.first_name ? `${c.first_name} ${c.last_name}`.trim() : c.email;
}

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [hearings, setHearings] = useState<HearingRecord[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payForm, setPayForm] = useState({ fee_amount: '', paid_amount: '', payment_status: 'pending' as PayStatus });
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  const fetchCase = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [caseRes, clientsRes, hearingsRes, docsRes, invRes] = await Promise.all([
        api.get<CaseDetail>(`/cases/${id}/`),
        api.get<ClientItem[]>(`/cases/${id}/clients/`),
        api.get<HearingRecord[]>(`/cases/${id}/hearings/`),
        api.get<Doc[]>(`/cases/${id}/documents/`),
        api.get<InvoiceSummary[]>(`/invoices/?case=${id}`),
      ]);
      setCaseData(caseRes.data);
      setClients(clientsRes.data);
      setHearings(hearingsRes.data);
      setDocs(docsRes.data);
      setInvoices(invRes.data);
      setPayForm({
        fee_amount: caseRes.data.fee_amount,
        paid_amount: caseRes.data.paid_amount,
        payment_status: caseRes.data.payment_status as PayStatus,
      });
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(useCallback(() => { void fetchCase(); }, [fetchCase]));

  const handleUpdatePayment = async () => {
    setPayError('');
    const fee = parseFloat(payForm.fee_amount);
    const paid = parseFloat(payForm.paid_amount);
    if (payForm.fee_amount && isNaN(fee)) {
      setPayError('Total fee must be a valid number.');
      return;
    }
    if (payForm.paid_amount && isNaN(paid)) {
      setPayError('Amount paid must be a valid number.');
      return;
    }
    if (!isNaN(fee) && !isNaN(paid) && paid > fee) {
      setPayError('Amount paid cannot exceed total fee.');
      return;
    }
    setPayLoading(true);
    try {
      const { data } = await api.patch<CaseDetail>(`/cases/${id}/`, payForm);
      setCaseData(data);
      setPaySuccess('Payment updated successfully.');
      setTimeout(() => {
        setPaySuccess('');
        setPayModalVisible(false);
      }, 1500);
    } catch {
      setPayError('Failed to update. Please try again.');
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.flex}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  if (!caseData) return null;

  const ps = caseData.payment_status as PayStatus;
  const balance = (parseFloat(caseData.fee_amount) || 0) - (parseFloat(caseData.paid_amount) || 0);

  return (
    <SafeAreaView style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Case Detail</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/(app)/edit-case', params: { id } } as Href)}>
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Case title card */}
        <View style={styles.titleCard}>
          <View style={styles.titleRow}>
            <Text style={styles.caseName} numberOfLines={2}>{caseData.case_name}</Text>
            <Badge value={caseData.status} />
          </View>
          {caseData.case_number ? (
            <Text style={styles.caseNumber}>Case No: #{caseData.case_number}</Text>
          ) : null}
          <Text style={styles.lawyerName}>Lawyer: {caseData.lawyer_name}</Text>
        </View>

        {/* Case details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Case Information</Text>
          <InfoRow label="Next Date" value={fmt(caseData.next_date)} />
          <InfoRow label="Previous Date" value={fmt(caseData.previous_date)} />
          <InfoRow label="U/S (Section)" value={caseData.under_section} />
          <InfoRow label="P/S (Police Stn)" value={caseData.police_station} />
          {caseData.notes ? (
            <View style={infoStyles.row}>
              <Text style={infoStyles.label}>Notes</Text>
              <Text style={[infoStyles.value, { lineHeight: 20 }]}>{caseData.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Court information */}
        {(caseData.court_name || caseData.judge_name) ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Court Information</Text>
            {caseData.court_name ? <InfoRow label="Court" value={caseData.court_name} /> : null}
            {caseData.court_type ? <InfoRow label="Court Type" value={caseData.court_type.replace('_', ' ')} /> : null}
            {caseData.judge_name ? <InfoRow label="Judge" value={caseData.judge_name} /> : null}
          </View>
        ) : null}

        {/* Payment status — tappable */}
        <TouchableOpacity
          style={[styles.payCard, { backgroundColor: PAY_STATUS_BG[ps] ?? C.white, borderColor: PAY_STATUS_COLOR[ps] ?? C.border }]}
          onPress={() => setPayModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.payCardTop}>
            <Text style={styles.payCardTitle}>💰 Payment Status</Text>
            <Badge value={caseData.payment_status} />
          </View>

          <View style={styles.payAmounts}>
            <View style={styles.payAmountItem}>
              <Text style={styles.payAmountLabel}>Total Fee</Text>
              <Text style={styles.payAmountValue}>₹{parseFloat(caseData.fee_amount).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.payAmountDivider} />
            <View style={styles.payAmountItem}>
              <Text style={styles.payAmountLabel}>Paid</Text>
              <Text style={[styles.payAmountValue, { color: C.success }]}>
                ₹{parseFloat(caseData.paid_amount).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.payAmountDivider} />
            <View style={styles.payAmountItem}>
              <Text style={styles.payAmountLabel}>Balance</Text>
              <Text style={[styles.payAmountValue, { color: balance > 0 ? C.error : C.success }]}>
                ₹{balance.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <Text style={[styles.payTapHint, { color: PAY_STATUS_COLOR[ps] }]}>
            Tap to update payment →
          </Text>
        </TouchableOpacity>

        {/* Invoices */}
        <View style={styles.card}>
          <View style={styles.clientsHeader}>
            <Text style={styles.cardTitle}>Invoices ({invoices.length})</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(app)/new-invoice', params: { case_id: id } } as Href)}>
              <Text style={styles.manageLink}>+ New →</Text>
            </TouchableOpacity>
          </View>
          {invoices.length === 0 ? (
            <Text style={styles.noClients}>No invoices yet.</Text>
          ) : (
            invoices.map(inv => (
              <TouchableOpacity
                key={inv.id}
                style={styles.invoiceRow}
                onPress={() => router.push({ pathname: '/(app)/invoice-detail', params: { id: inv.id } } as Href)}
              >
                <View style={styles.invoiceLeft}>
                  <Text style={styles.invoiceNum}>{inv.invoice_number}</Text>
                  <Text style={styles.invoiceMeta}>
                    ₹{parseFloat(inv.amount).toLocaleString('en-IN')}
                    {inv.due_date ? ` · Due ${fmt(inv.due_date)}` : ''}
                  </Text>
                </View>
                <Badge value={inv.status} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Documents */}
        <DocumentsSection caseId={id ?? ''} docs={docs} onDocsChange={setDocs} />

        {/* Linked Clients */}
        <View style={styles.card}>
          <View style={styles.clientsHeader}>
            <Text style={styles.cardTitle}>Clients ({clients.length})</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/clients' as Href)}>
              <Text style={styles.manageLink}>Manage →</Text>
            </TouchableOpacity>
          </View>
          {clients.length === 0 ? (
            <Text style={styles.noClients}>No clients linked to this case.</Text>
          ) : (
            clients.map(c => (
              <View key={c.id} style={styles.clientRow}>
                <Avatar initials={getInitials(c)} size={36} />
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{getClientName(c)}</Text>
                  {c.phone ? <Text style={styles.clientSub}>{c.phone}</Text> : <Text style={styles.clientSub}>{c.email}</Text>}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Hearing History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hearing History ({hearings.length})</Text>
          {hearings.length === 0 ? (
            <Text style={styles.noClients}>No hearing records yet. History is created automatically when you update the next date.</Text>
          ) : (
            hearings.map((h, i) => (
              <View key={h.id} style={styles.hearingRow}>
                {/* Timeline dot + line */}
                <View style={styles.timelineCol}>
                  <View style={[styles.timelineDot, i === 0 && styles.timelineDotFirst]} />
                  {i < hearings.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.hearingContent}>
                  <Text style={styles.hearingDate}>{fmt(h.date)}</Text>
                  {h.adjourned_to ? (
                    <Text style={styles.hearingAdjourned}>Adjourned to: {fmt(h.adjourned_to)}</Text>
                  ) : null}
                  {h.outcome ? (
                    <Text style={styles.hearingOutcome}>{h.outcome}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Payment Status Modal ── */}
      <Modal
        visible={payModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { Keyboard.dismiss(); setPayModalVisible(false); }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback
            onPress={() => { Keyboard.dismiss(); setPayModalVisible(false); }}
          >
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <ScrollView
            style={styles.modalSheet}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Update Payment</Text>

            {payError ? <AlertBox type="error" message={payError} /> : null}
            {paySuccess ? <AlertBox type="success" message={paySuccess} /> : null}

            <Text style={styles.pickerLabel}>Payment Status</Text>
            <View style={styles.statusRow}>
              {(['pending', 'partial', 'paid'] as PayStatus[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusPill,
                    payForm.payment_status === s && {
                      backgroundColor: PAY_STATUS_COLOR[s],
                      borderColor: PAY_STATUS_COLOR[s],
                    },
                  ]}
                  onPress={() => setPayForm(f => ({ ...f, payment_status: s }))}
                >
                  <Text style={[
                    styles.statusPillText,
                    payForm.payment_status === s && { color: C.white },
                  ]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FormInput
              label="Total Fee Amount (₹)"
              value={payForm.fee_amount}
              onChangeText={v => setPayForm(f => ({ ...f, fee_amount: v }))}
              placeholder="e.g. 50000"
              keyboardType="numeric"
            />

            <FormInput
              label="Amount Paid (₹)"
              value={payForm.paid_amount}
              onChangeText={v => setPayForm(f => ({ ...f, paid_amount: v }))}
              placeholder="e.g. 25000"
              keyboardType="numeric"
            />

            <PrimaryButton
              title="Save Payment"
              onPress={handleUpdatePayment}
              loading={payLoading}
            />

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { Keyboard.dismiss(); setPayModalVisible(false); }}
            >
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
  header: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.white, textAlign: 'center' },
  editBtn: { color: C.accent, fontSize: 14, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 40, gap: 14 },

  titleCard: { backgroundColor: C.primary, borderRadius: 14, padding: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 10 },
  caseName: { flex: 1, fontSize: 20, fontWeight: '700', color: C.white },
  caseNumber: { fontSize: 13, color: C.accent, marginBottom: 4 },
  lawyerName: { fontSize: 12.5, color: 'rgba(255,255,255,0.6)' },

  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  payCard: { borderRadius: 14, padding: 16, borderWidth: 1.5 },
  payCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  payCardTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  payAmounts: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  payAmountItem: { flex: 1, alignItems: 'center' },
  payAmountLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  payAmountValue: { fontSize: 16, fontWeight: '700', color: C.text },
  payAmountDivider: { width: 1, height: 36, backgroundColor: C.border },
  payTapHint: { fontSize: 12, textAlign: 'right', fontWeight: '500' },

  // Clients section
  clientsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  manageLink: { fontSize: 12.5, color: C.primary, fontWeight: '600' },
  noClients: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 8 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 13.5, fontWeight: '600', color: C.text },
  clientSub: { fontSize: 12, color: C.textMuted, marginTop: 1 },

  // Invoice rows
  invoiceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  invoiceLeft: { flex: 1 },
  invoiceNum: { fontSize: 13.5, fontWeight: '700', color: C.primary },
  invoiceMeta: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Hearing timeline
  hearingRow: { flexDirection: 'row', gap: 12, paddingTop: 12 },
  timelineCol: { alignItems: 'center', width: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.border, marginTop: 3 },
  timelineDotFirst: { backgroundColor: C.primary },
  timelineLine: { flex: 1, width: 2, backgroundColor: C.border, marginTop: 4, minHeight: 24 },
  hearingContent: { flex: 1, paddingBottom: 12 },
  hearingDate: { fontSize: 13.5, fontWeight: '700', color: C.text, marginBottom: 2 },
  hearingAdjourned: { fontSize: 12.5, color: C.primary, marginBottom: 2 },
  hearingOutcome: { fontSize: 12.5, color: C.textMuted, lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  modalSheet: { backgroundColor: C.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '85%' },
  modalContent: { padding: 24, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 18, textAlign: 'center' },
  pickerLabel: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statusPill: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  statusPillText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 14, color: C.textMuted },
});
