import { useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBox } from '@/components/ui/AlertBox';
import { Badge } from '@/components/ui/Badge';
import { C } from '@/constants/colors';
import api from '@/utils/api';

type Invoice = {
  id: number;
  invoice_number: string;
  case: number;
  case_name: string;
  amount: string;
  paid_amount: string;
  balance: string;
  status: string;
  issue_date: string;
  due_date: string | null;
};

type StatusFilter = 'all' | 'draft' | 'sent' | 'partial' | 'paid' | 'overdue';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InvoicesScreen() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { data } = await api.get<Invoice[]>(`/invoices/${params}`);
      setInvoices(data);
    } catch {
      setFetchError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { fetchInvoices(); }, [fetchInvoices]));

  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + parseFloat(inv.balance), 0);

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoices</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(app)/new-invoice' as Href)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Outstanding summary */}
      {totalOutstanding > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryLabel}>Total Outstanding</Text>
          <Text style={styles.summaryAmount}>₹{totalOutstanding.toLocaleString('en-IN')}</Text>
        </View>
      )}

      {/* Status filters */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={f => f.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterPill, filter === item.value && styles.filterPillActive]}
              onPress={() => setFilter(item.value)}
            >
              <Text style={[styles.filterPillText, filter === item.value && styles.filterPillTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {fetchError ? <AlertBox type="error" message={fetchError} /> : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={C.primary} />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={inv => String(inv.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/(app)/invoice-detail', params: { id: item.id } })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.invNumber}>{item.invoice_number}</Text>
                <Badge value={item.status} />
              </View>
              <Text style={styles.caseName} numberOfLines={1}>{item.case_name}</Text>
              <View style={styles.cardAmounts}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Total</Text>
                  <Text style={styles.amountValue}>₹{parseFloat(item.amount).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Paid</Text>
                  <Text style={[styles.amountValue, { color: C.success }]}>₹{parseFloat(item.paid_amount).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Balance</Text>
                  <Text style={[styles.amountValue, { color: parseFloat(item.balance) > 0 ? C.error : C.success }]}>
                    ₹{parseFloat(item.balance).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
              <View style={styles.cardDates}>
                <Text style={styles.dateText}>Issued: {fmt(item.issue_date)}</Text>
                {item.due_date ? <Text style={styles.dateText}>Due: {fmt(item.due_date)}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyText}>
                {filter === 'all' ? 'No invoices yet. Tap + New to create one.' : `No ${filter} invoices.`}
              </Text>
            </View>
          }
          ListFooterComponent={
            invoices.length > 0 ? <Text style={styles.count}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</Text> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.white },
  addBtn: { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: C.primaryDark, fontSize: 13, fontWeight: '700' },

  summaryBar: {
    backgroundColor: `${C.error}12`, borderBottomWidth: 1, borderBottomColor: `${C.error}30`,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: C.error },
  summaryAmount: { fontSize: 16, fontWeight: '700', color: C.error },

  filterWrap: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.inputBg },
  filterPillActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterPillText: { fontSize: 12.5, fontWeight: '500', color: C.textMuted },
  filterPillTextActive: { color: C.white },

  loader: { marginTop: 40 },
  list: { padding: 14, gap: 10, paddingBottom: 32 },

  card: { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  invNumber: { fontSize: 13, fontWeight: '700', color: C.primary },
  caseName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 10 },
  cardAmounts: { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 8, padding: 10, marginBottom: 8 },
  amountItem: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 10.5, color: C.textMuted, marginBottom: 2 },
  amountValue: { fontSize: 13.5, fontWeight: '700', color: C.text },
  cardDates: { flexDirection: 'row', gap: 16 },
  dateText: { fontSize: 12, color: C.textMuted },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
  count: { textAlign: 'center', fontSize: 12, color: C.textMuted, paddingVertical: 12 },
});
