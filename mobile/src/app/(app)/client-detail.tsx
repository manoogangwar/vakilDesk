import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { C } from '@/constants/colors';
import api from '@/utils/api';

type Client = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  is_active: boolean;
  created_at: string;
};

type LinkedCase = {
  id: number;
  case_name: string;
  case_number: string;
  status: string;
  next_date: string | null;
  payment_status: string;
};

function getName(c: Client) {
  return c.first_name ? `${c.first_name} ${c.last_name}`.trim() : c.email;
}

function getInitials(c: Client) {
  return ((c.first_name?.[0] ?? '') + (c.last_name?.[0] ?? '')).toUpperCase() ||
    (c.email?.[0] ?? '?').toUpperCase();
}

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={infoS.row}>
      <Text style={infoS.label}>{label}</Text>
      <Text style={infoS.value}>{value}</Text>
    </View>
  );
}
const infoS = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  label: { width: 100, fontSize: 13, color: C.textMuted, fontWeight: '600' },
  value: { flex: 1, fontSize: 13.5, color: C.text },
});

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<LinkedCase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [clientRes, casesRes] = await Promise.all([
        api.get<Client>(`/clients/${id}/`),
        api.get<LinkedCase[]>(`/clients/${id}/cases/`),
      ]);
      setClient(clientRes.data);
      setCases(casesRes.data);
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));

  const handleDelete = () => {
    Alert.alert('Remove Client', 'Are you sure you want to remove this client? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/clients/${id}/`);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to remove client. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.flex}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={C.primary} />
      </SafeAreaView>
    );
  }
  if (!client) return null;

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Detail</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteBtn}>Remove</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar initials={getInitials(client)} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{getName(client)}</Text>
            <Text style={styles.profileEmail}>{client.email}</Text>
            <Badge value={client.is_active ? 'active' : 'inactive'} />
          </View>
        </View>

        {/* Contact info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <InfoRow label="Phone" value={client.phone} />
          <InfoRow label="Address" value={client.address} />
          <InfoRow label="Notes" value={client.notes} />
          <InfoRow label="Added" value={fmt(client.created_at)} />
        </View>

        {/* Linked Cases */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Linked Cases ({cases.length})</Text>
          {cases.length === 0 ? (
            <Text style={styles.noCases}>No cases linked to this client yet.</Text>
          ) : (
            cases.map(c => (
              <TouchableOpacity
                key={c.id}
                style={styles.caseRow}
                onPress={() => router.push({ pathname: '/(app)/case-detail', params: { id: c.id } } as Href)}
              >
                <View style={styles.caseInfo}>
                  <Text style={styles.caseName}>{c.case_name}</Text>
                  {c.case_number ? <Text style={styles.caseSub}>#{c.case_number}</Text> : null}
                  {c.next_date ? <Text style={styles.caseSub}>Next: {fmt(c.next_date)}</Text> : null}
                </View>
                <View style={styles.caseBadges}>
                  <Badge value={c.status} />
                  <Badge value={c.payment_status} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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

  profileCard: { backgroundColor: C.primary, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 18, fontWeight: '700', color: C.white },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },

  card: { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: C.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  noCases: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 8 },

  caseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  caseInfo: { flex: 1 },
  caseName: { fontSize: 13.5, fontWeight: '600', color: C.text },
  caseSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  caseBadges: { gap: 4, alignItems: 'flex-end' },
});
