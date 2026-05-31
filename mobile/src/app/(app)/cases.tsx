import { useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBox } from '@/components/ui/AlertBox';
import { Badge } from '@/components/ui/Badge';
import { C } from '@/constants/colors';
import api from '@/utils/api';

type Case = {
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
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CasesScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data } = await api.get<Case[]>('/cases/');
      setCases(data);
    } catch {
      setFetchError('Failed to load cases. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchCases(); }, [fetchCases]));

  const filtered = cases.filter(c =>
    c.case_name.toLowerCase().includes(search.toLowerCase()) ||
    c.case_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cases</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(app)/new-case' as Href)}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by case name or number…"
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {fetchError ? <AlertBox type="error" message={fetchError} /> : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={C.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => String(c.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({ pathname: '/(app)/case-detail', params: { id: item.id } })
              }
            >
              <View style={styles.cardTop}>
                <Text style={styles.caseName} numberOfLines={1}>{item.case_name}</Text>
                <Badge value={item.payment_status} />
              </View>

              {item.case_number ? (
                <Text style={styles.caseNumber}>#{item.case_number}</Text>
              ) : null}

              <View style={styles.cardMeta}>
                <Text style={styles.metaItem}>📅 Next: {fmt(item.next_date)}</Text>
                {item.under_section ? (
                  <Text style={styles.metaItem}>U/S: {item.under_section}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⚖️</Text>
              <Text style={styles.emptyText}>
                {search ? `No cases matching "${search}".` : 'No cases yet. Tap + New to create one.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            filtered.length > 0 ? (
              <Text style={styles.count}>
                {filtered.length} of {cases.length} cases
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { marginRight: 12 },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.white },
  addBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { color: C.primaryDark, fontSize: 13, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 3 },
  loader: { marginTop: 40 },
  list: { padding: 14, gap: 10, paddingBottom: 32 },
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  caseName: { flex: 1, fontSize: 14.5, fontWeight: '700', color: C.text, marginRight: 10 },
  caseNumber: { fontSize: 12, color: C.textMuted, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginTop: 6 },
  metaItem: { fontSize: 12.5, color: C.textMuted },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
  count: { textAlign: 'center', fontSize: 12, color: C.textMuted, paddingVertical: 12 },
});
