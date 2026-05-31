import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { type Doc, DocumentsSection } from '@/components/ui/DocumentsSection';
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

type HearingRecord = {
  id: number;
  date: string;
  outcome: string;
  adjourned_to: string | null;
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
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
  row: { flexDirection: 'row', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  label: { width: 120, fontSize: 13, color: C.textMuted, fontWeight: '600' },
  value: { flex: 1, fontSize: 13.5, color: C.text },
});

export default function ClientCaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [hearings, setHearings] = useState<HearingRecord[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [caseRes, hearingsRes, docsRes] = await Promise.all([
        api.get<CaseDetail>(`/cases/my-cases/${id}/`),
        api.get<HearingRecord[]>(`/cases/my-cases/${id}/hearings/`),
        api.get<Doc[]>(`/cases/my-cases/${id}/documents/`),
      ]);
      setCaseData(caseRes.data);
      setHearings(hearingsRes.data);
      setDocs(docsRes.data);
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));

  if (loading) {
    return (
      <SafeAreaView style={styles.flex}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={C.primary} />
      </SafeAreaView>
    );
  }
  if (!caseData) return null;

  const balance = (parseFloat(caseData.fee_amount) || 0) - (parseFloat(caseData.paid_amount) || 0);
  const payColor = caseData.payment_status === 'paid' ? C.success : caseData.payment_status === 'partial' ? '#d97706' : C.error;
  const payBg = caseData.payment_status === 'paid' ? C.successBg : caseData.payment_status === 'partial' ? '#fffbeb' : C.errorBg;

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Case Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Title card */}
        <View style={styles.titleCard}>
          <View style={styles.titleRow}>
            <Text style={styles.caseName} numberOfLines={2}>{caseData.case_name}</Text>
            <Badge value={caseData.status} />
          </View>
          {caseData.case_number ? <Text style={styles.caseNum}>Case No: #{caseData.case_number}</Text> : null}
          <Text style={styles.lawyerName}>Lawyer: {caseData.lawyer_name}</Text>
        </View>

        {/* Case info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Case Information</Text>
          <InfoRow label="Next Date" value={fmt(caseData.next_date)} />
          <InfoRow label="Previous Date" value={fmt(caseData.previous_date)} />
          <InfoRow label="U/S (Section)" value={caseData.under_section} />
          <InfoRow label="P/S (Station)" value={caseData.police_station} />
          {caseData.notes ? <InfoRow label="Notes" value={caseData.notes} /> : null}
        </View>

        {/* Court info */}
        {(caseData.court_name || caseData.judge_name) ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Court Information</Text>
            {caseData.court_name ? <InfoRow label="Court" value={caseData.court_name} /> : null}
            {caseData.court_type ? <InfoRow label="Court Type" value={caseData.court_type.replace('_', ' ')} /> : null}
            {caseData.judge_name ? <InfoRow label="Judge" value={caseData.judge_name} /> : null}
          </View>
        ) : null}

        {/* Payment info (read-only for client) */}
        <View style={[styles.payCard, { backgroundColor: payBg, borderColor: payColor }]}>
          <View style={styles.payCardTop}>
            <Text style={styles.payCardTitle}>💰 Payment Status</Text>
            <Badge value={caseData.payment_status} />
          </View>
          <View style={styles.payAmounts}>
            <View style={styles.payItem}>
              <Text style={styles.payItemLabel}>Total Fee</Text>
              <Text style={styles.payItemValue}>₹{parseFloat(caseData.fee_amount).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payItem}>
              <Text style={styles.payItemLabel}>Paid</Text>
              <Text style={[styles.payItemValue, { color: C.success }]}>
                ₹{parseFloat(caseData.paid_amount).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payItem}>
              <Text style={styles.payItemLabel}>Balance Due</Text>
              <Text style={[styles.payItemValue, { color: balance > 0 ? C.error : C.success }]}>
                ₹{balance.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Documents (view-only — upload disabled for clients) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Documents ({docs.length})</Text>
          {docs.length === 0 ? (
            <Text style={styles.empty}>No documents uploaded yet.</Text>
          ) : (
            docs.map(doc => (
              <View key={doc.id} style={styles.docRow}>
                <Text style={styles.docIcon}>📄</Text>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
                  <Text style={styles.docMeta}>{doc.doc_type} · {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Hearing history */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hearing History ({hearings.length})</Text>
          {hearings.length === 0 ? (
            <Text style={styles.empty}>No hearing records yet.</Text>
          ) : (
            hearings.map((h, i) => (
              <View key={h.id} style={styles.hearingRow}>
                <View style={styles.timelineCol}>
                  <View style={[styles.timelineDot, i === 0 && styles.timelineDotFirst]} />
                  {i < hearings.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.hearingContent}>
                  <Text style={styles.hearingDate}>{fmt(h.date)}</Text>
                  {h.adjourned_to ? <Text style={styles.hearingAdj}>Adjourned to: {fmt(h.adjourned_to)}</Text> : null}
                  {h.outcome ? <Text style={styles.hearingOutcome}>{h.outcome}</Text> : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
  },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.white, textAlign: 'center' },
  body: { padding: 16, paddingBottom: 40, gap: 14 },

  titleCard: { backgroundColor: C.primary, borderRadius: 14, padding: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 10 },
  caseName: { flex: 1, fontSize: 20, fontWeight: '700', color: C.white },
  caseNum: { fontSize: 13, color: C.accent, marginBottom: 4 },
  lawyerName: { fontSize: 12.5, color: 'rgba(255,255,255,0.6)' },

  card: { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: C.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 8 },

  payCard: { borderRadius: 14, padding: 16, borderWidth: 1.5 },
  payCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  payCardTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  payAmounts: { flexDirection: 'row', alignItems: 'center' },
  payItem: { flex: 1, alignItems: 'center' },
  payItemLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  payItemValue: { fontSize: 16, fontWeight: '700', color: C.text },
  payDivider: { width: 1, height: 36, backgroundColor: C.border },

  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  docIcon: { fontSize: 20 },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 13.5, fontWeight: '600', color: C.text },
  docMeta: { fontSize: 11.5, color: C.textMuted, marginTop: 2 },

  hearingRow: { flexDirection: 'row', gap: 12, paddingTop: 12 },
  timelineCol: { alignItems: 'center', width: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.border, marginTop: 3 },
  timelineDotFirst: { backgroundColor: C.primary },
  timelineLine: { flex: 1, width: 2, backgroundColor: C.border, marginTop: 4, minHeight: 24 },
  hearingContent: { flex: 1, paddingBottom: 12 },
  hearingDate: { fontSize: 13.5, fontWeight: '700', color: C.text, marginBottom: 2 },
  hearingAdj: { fontSize: 12.5, color: C.primary, marginBottom: 2 },
  hearingOutcome: { fontSize: 12.5, color: C.textMuted, lineHeight: 18 },
});
