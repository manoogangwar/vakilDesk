import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import * as Sharing from 'expo-sharing';
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
import { getAccessToken } from '@/utils/auth';
import { DOC_FORM_MAP } from '@/utils/documentForms';

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

type ClientDoc = {
  id: number;
  title: string;
  doc_category: string;
  source: string;
  file_url: string | null;
  file_name: string;
  uploaded_at: string;
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
  const [docs, setDocs] = useState<ClientDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [clientRes, casesRes, docsRes] = await Promise.all([
        api.get<Client>(`/clients/${id}/`),
        api.get<LinkedCase[]>(`/clients/${id}/cases/`),
        api.get<ClientDoc[]>(`/clients/${id}/documents/`),
      ]);
      setClient(clientRes.data);
      setCases(casesRes.data);
      setDocs(docsRes.data);
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const handleOpenDoc = async (doc: ClientDoc) => {
    if (!doc.file_url) { Alert.alert('Error', 'File not available.'); return; }
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) { Alert.alert('Not supported', 'File sharing is not available on this device.'); return; }
    setDownloadingId(doc.id);
    try {
      const token = await getAccessToken();
      const localUri = (cacheDirectory ?? '') + (doc.file_name || `doc_${doc.id}.pdf`);
      const { uri } = await downloadAsync(doc.file_url, localUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: doc.title });
    } catch {
      Alert.alert('Error', 'Could not open the document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteDoc = (doc: ClientDoc) => {
    Alert.alert('Delete Document', `Remove "${doc.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/clients/${id}/documents/${doc.id}/`);
            setDocs(prev => prev.filter(d => d.id !== doc.id));
          } catch {
            Alert.alert('Error', 'Failed to delete the document.');
          }
        },
      },
    ]);
  };

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

        {/* Documents */}
        <View style={styles.card}>
          <View style={styles.docHeader}>
            <Text style={styles.cardTitle}>Documents ({docs.length})</Text>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={() => router.push('/(app)/documents' as Href)}
            >
              <Text style={styles.generateBtnText}>+ Generate</Text>
            </TouchableOpacity>
          </View>
          {docs.length === 0 ? (
            <Text style={styles.noCases}>No saved documents yet.</Text>
          ) : (
            docs.map(doc => (
              <View key={doc.id} style={styles.docRow}>
                <Text style={styles.docIcon}>{DOC_FORM_MAP[doc.doc_category]?.icon ?? '📄'}</Text>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
                  <Text style={styles.docMeta}>
                    {doc.source === 'generated' ? 'Generated' : 'Uploaded'} · {fmt(doc.uploaded_at)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleOpenDoc(doc)} style={styles.docActionBtn} disabled={downloadingId === doc.id}>
                  {downloadingId === doc.id
                    ? <ActivityIndicator size="small" color={C.primary} />
                    : <Text style={styles.docOpenText}>Open</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteDoc(doc)} style={styles.docActionBtn}>
                  <Text style={styles.docDeleteText}>✕</Text>
                </TouchableOpacity>
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

  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  generateBtn: { backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  generateBtnText: { color: C.white, fontSize: 12, fontWeight: '700' },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  docIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 13.5, fontWeight: '600', color: C.text },
  docMeta: { fontSize: 11.5, color: C.textMuted, marginTop: 2 },
  docActionBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  docOpenText: { fontSize: 12.5, color: C.primary, fontWeight: '600' },
  docDeleteText: { fontSize: 13, color: C.error },
});
