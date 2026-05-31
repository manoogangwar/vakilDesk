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
import { Avatar } from '@/components/ui/Avatar';
import { C } from '@/constants/colors';
import api from '@/utils/api';

type Client = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
};

function getInitials(c: Client) {
  return ((c.first_name?.[0] ?? '') + (c.last_name?.[0] ?? '')).toUpperCase() ||
    (c.email?.[0] ?? '?').toUpperCase();
}

function getName(c: Client) {
  return c.first_name ? `${c.first_name} ${c.last_name}`.trim() : c.email;
}

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data } = await api.get<Client[]>('/clients/');
      setClients(data);
    } catch {
      setFetchError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchClients(); }, [fetchClients]));

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || getName(c).toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Clients</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(app)/new-client' as Href)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone…"
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
              onPress={() => router.push({ pathname: '/(app)/client-detail', params: { id: item.id } })}
            >
              <Avatar initials={getInitials(item)} size={44} />
              <View style={styles.info}>
                <Text style={styles.name}>{getName(item)}</Text>
                <Text style={styles.sub}>{item.phone || item.email}</Text>
                {item.phone ? <Text style={styles.email}>{item.email}</Text> : null}
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyText}>
                {search ? `No clients matching "${search}".` : 'No clients yet. Tap + New to add one.'}
              </Text>
            </View>
          }
          ListFooterComponent={filtered.length > 0
            ? <Text style={styles.count}>{filtered.length} of {clients.length} clients</Text>
            : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { marginRight: 12 },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.white },
  addBtn: { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: C.primaryDark, fontSize: 13, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 3 },
  loader: { marginTop: 40 },
  list: { padding: 14, gap: 10, paddingBottom: 32 },
  card: { backgroundColor: C.white, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 14.5, fontWeight: '700', color: C.text, marginBottom: 2 },
  sub: { fontSize: 12.5, color: C.textMuted },
  email: { fontSize: 11.5, color: C.textMuted, marginTop: 1 },
  arrow: { fontSize: 22, color: C.border },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
  count: { textAlign: 'center', fontSize: 12, color: C.textMuted, paddingVertical: 12 },
});
