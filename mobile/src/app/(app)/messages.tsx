import { useFocusEffect, useRouter } from 'expo-router';
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
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { C } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

type Conversation = {
  user_id: number;
  user_name: string;
  user_role: string;
  last_message: string;
  last_sent_at: string;
  unread_count: number;
};

type Contact = {
  user_id: number;
  user_name: string;
  user_role: string;
};

function getInitials(name: string) {
  const parts = name.split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '').toUpperCase();
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function MessagesScreen() {
  const { role } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showContacts, setShowContacts] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [convsRes, contactsRes] = await Promise.all([
        api.get<Conversation[]>('/messages/conversations/'),
        api.get<Contact[]>('/messages/contacts/'),
      ]);
      setConversations(convsRes.data);
      setContacts(contactsRes.data);
    } catch {
      setFetchError('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const openConversation = (userId: number) => {
    router.push({ pathname: '/(app)/conversation', params: { user_id: userId } });
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  // Contacts that don't yet have a conversation
  const newContacts = contacts.filter(c => !conversations.find(conv => conv.user_id === c.user_id));

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnread > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{totalUnread}</Text></View>}
        </View>
        {newContacts.length > 0 && (
          <TouchableOpacity onPress={() => setShowContacts(v => !v)}>
            <Text style={styles.composeBtn}>✏️</Text>
          </TouchableOpacity>
        )}
        {newContacts.length === 0 && <View style={{ width: 32 }} />}
      </View>

      {fetchError ? <AlertBox type="error" message={fetchError} /> : null}

      {/* New contacts to start a conversation with */}
      {showContacts && newContacts.length > 0 && (
        <View style={styles.contactsDropdown}>
          <Text style={styles.contactsLabel}>Start a new conversation</Text>
          {newContacts.map(c => (
            <TouchableOpacity key={c.user_id} style={styles.contactRow} onPress={() => { setShowContacts(false); openConversation(c.user_id); }}>
              <Avatar initials={getInitials(c.user_name)} size={36} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{c.user_name}</Text>
                <Badge value={c.user_role} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={C.primary} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={c => String(c.user_id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.convRow} onPress={() => openConversation(item.user_id)}>
              <View style={styles.avatarWrap}>
                <Avatar initials={getInitials(item.user_name)} size={46} />
                {item.unread_count > 0 && (
                  <View style={styles.unreadDot}>
                    <Text style={styles.unreadDotText}>{item.unread_count > 9 ? '9+' : item.unread_count}</Text>
                  </View>
                )}
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convInfoTop}>
                  <Text style={[styles.convName, item.unread_count > 0 && styles.convNameUnread]}>{item.user_name}</Text>
                  <Text style={styles.convTime}>{fmtTime(item.last_sent_at)}</Text>
                </View>
                <View style={styles.convInfoBottom}>
                  <Text style={[styles.convPreview, item.unread_count > 0 && styles.convPreviewUnread]} numberOfLines={1}>
                    {item.last_message}
                  </Text>
                  <Badge value={item.user_role} />
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No conversations yet.</Text>
              {contacts.length > 0 && (
                <TouchableOpacity style={styles.startBtn} onPress={() => setShowContacts(true)}>
                  <Text style={styles.startBtnText}>Start a conversation ✏️</Text>
                </TouchableOpacity>
              )}
              {contacts.length === 0 && (
                <Text style={styles.emptyHint}>
                  {role === 'client' ? 'Your lawyer will appear here once you are linked to a case.' : 'Add clients first to start messaging.'}
                </Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  unreadBadge: { backgroundColor: C.error, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  unreadBadgeText: { fontSize: 11, fontWeight: '700', color: C.white },
  composeBtn: { fontSize: 20 },

  contactsDropdown: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, padding: 12 },
  contactsLabel: { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  contactInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactName: { fontSize: 14, fontWeight: '600', color: C.text },

  loader: { marginTop: 40 },
  list: { paddingVertical: 8 },

  convRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12, backgroundColor: C.white },
  avatarWrap: { position: 'relative' },
  unreadDot: { position: 'absolute', top: -2, right: -2, backgroundColor: C.error, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  unreadDotText: { fontSize: 10, fontWeight: '700', color: C.white },
  convInfo: { flex: 1 },
  convInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  convName: { fontSize: 14.5, fontWeight: '500', color: C.text },
  convNameUnread: { fontWeight: '700' },
  convTime: { fontSize: 11.5, color: C.textMuted },
  convInfoBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  convPreview: { flex: 1, fontSize: 13, color: C.textMuted },
  convPreviewUnread: { color: C.text, fontWeight: '500' },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 8 },
  emptyHint: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  startBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  startBtnText: { color: C.white, fontSize: 13, fontWeight: '600' },
});
