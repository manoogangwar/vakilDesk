import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { Badge } from '@/components/ui/Badge';
import { FormInput } from '@/components/ui/FormInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { C } from '@/constants/colors';
import api from '@/utils/api';
import { useFocusEffect } from 'expo-router';

type CaseDetail = {
  id: number;
  case_name: string;
  case_number: string;
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

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
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
      const { data } = await api.get<CaseDetail>(`/cases/${id}/`);
      setCaseData(data);
      setPayForm({
        fee_amount: data.fee_amount,
        paid_amount: data.paid_amount,
        payment_status: data.payment_status as PayStatus,
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
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Case title card */}
        <View style={styles.titleCard}>
          <Text style={styles.caseName}>{caseData.case_name}</Text>
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
      </ScrollView>

      {/* ── Payment Status Modal ── */}
      <Modal
        visible={payModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { Keyboard.dismiss(); setPayModalVisible(false); }}
      >
        {/* KeyboardAvoidingView shifts the sheet up when keyboard appears */}
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Tap the dark backdrop to dismiss keyboard / close */}
          <TouchableWithoutFeedback
            onPress={() => { Keyboard.dismiss(); setPayModalVisible(false); }}
          >
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          {/* Scrollable sheet — buttons stay reachable above the keyboard */}
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

            {/* Payment status picker */}
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
  body: { padding: 16, paddingBottom: 40, gap: 14 },

  // Title card
  titleCard: {
    backgroundColor: C.primary,
    borderRadius: 14,
    padding: 18,
  },
  caseName: { fontSize: 20, fontWeight: '700', color: C.white, marginBottom: 4 },
  caseNumber: { fontSize: 13, color: C.accent, marginBottom: 4 },
  lawyerName: { fontSize: 12.5, color: 'rgba(255,255,255,0.6)' },

  // Info card
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

  // Payment card
  payCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
  },
  payCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  payCardTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  payAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  payAmountItem: { flex: 1, alignItems: 'center' },
  payAmountLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  payAmountValue: { fontSize: 16, fontWeight: '700', color: C.text },
  payAmountDivider: { width: 1, height: 36, backgroundColor: C.border },
  payTapHint: { fontSize: 12, textAlign: 'right', fontWeight: '500' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  // Transparent flex-fill so tapping above the sheet closes it
  modalBackdrop: { flex: 1 },
  // The white scrollable sheet
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '85%',   // never taller than 85 % of the screen
  },
  // Padding lives here so ScrollView can scroll the full inner content
  modalContent: {
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 18,
    textAlign: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statusPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
  },
  statusPillText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 14, color: C.textMuted },
});
