import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

type Message = {
  id: number;
  sender: number;
  sender_name: string;
  receiver: number;
  receiver_name: string;
  text: string;
  is_read: boolean;
  sent_at: string;
};

type UserInfo = {
  user_id: number;
  user_name: string;
  user_role: string;
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ConversationScreen() {
  const { user_id } = useLocalSearchParams<{ user_id: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const myIdRef = useRef<number | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user_id) return;
    try {
      const { data } = await api.get<Message[]>(`/messages/thread/${user_id}/`);
      setMessages(data);
      if (data.length > 0 && myIdRef.current === null) {
        // Determine my user_id from first message
        const me = data[0].sender_name === data[0].receiver_name
          ? data[0].sender
          : undefined;
        if (me !== undefined) myIdRef.current = me;
      }
    } catch {
      // silently retry
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  // Load contact info
  useEffect(() => {
    api.get<UserInfo[]>('/messages/contacts/').then(({ data }) => {
      const found = data.find(c => String(c.user_id) === user_id);
      if (found) { setOtherUser(found); return; }
      // Not in contacts — might be a lawyer messaging from client side
      api.get<Message[]>(`/messages/thread/${user_id}/`).then(({ data: msgs }) => {
        if (msgs.length > 0) {
          const m = msgs[0];
          const other = String(m.sender) === user_id
            ? { user_id: m.sender, user_name: m.sender_name, user_role: '' }
            : { user_id: m.receiver, user_name: m.receiver_name, user_role: '' };
          setOtherUser(other);
        }
      });
    });
  }, [user_id]);

  useFocusEffect(useCallback(() => {
    void fetchMessages();
    // Poll every 4 seconds while focused
    const interval = setInterval(() => { void fetchMessages(); }, 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]));

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user_id) return;
    setText('');
    setSending(true);
    try {
      const { data } = await api.post<Message>(`/messages/thread/${user_id}/`, { text: trimmed });
      setMessages(prev => [...prev, data]);
    } catch {
      setText(trimmed); // restore on failure
    } finally {
      setSending(false);
    }
  };

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const dateStr = fmtDate(m.sent_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateStr) last.msgs.push(m);
    else grouped.push({ date: dateStr, msgs: [m] });
  });

  // Determine "my" user id from messages
  const myId = messages.length > 0
    ? (messages.find(m => String(m.receiver) === user_id)?.sender ?? null)
    : null;

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser?.user_name ?? '…'}</Text>
          {otherUser?.user_role ? <Text style={styles.headerRole}>{otherUser.user_role}</Text> : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color={C.primary} />
        ) : (
          <FlatList
            ref={listRef}
            data={grouped}
            keyExtractor={g => g.date}
            contentContainerStyle={styles.list}
            renderItem={({ item: group }) => (
              <View>
                <View style={styles.dateDivider}>
                  <Text style={styles.dateDividerText}>{group.date}</Text>
                </View>
                {group.msgs.map((m: Message) => {
                  const isMine = myId ? m.sender === myId : String(m.receiver) === user_id;
                  return (
                    <View key={m.id} style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{m.text}</Text>
                      <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{fmtTime(m.sent_at)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor={C.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color={C.white} />
              : <Text style={styles.sendBtnText}>➤</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerInfo: { alignItems: 'center' },
  headerName: { fontSize: 15, fontWeight: '700', color: C.white },
  headerRole: { fontSize: 11.5, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' },

  loader: { flex: 1 },
  list: { padding: 12, paddingBottom: 8 },

  dateDivider: { alignItems: 'center', marginVertical: 12 },
  dateDividerText: { fontSize: 12, color: C.textMuted, backgroundColor: C.bg, paddingHorizontal: 12 },

  bubble: {
    maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9,
    marginBottom: 4,
  },
  bubbleMine: { backgroundColor: C.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: C.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
  bubbleText: { fontSize: 14.5, color: C.text, lineHeight: 20 },
  bubbleTextMine: { color: C.white },
  bubbleTime: { fontSize: 10.5, color: C.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.6)' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: C.textMuted },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border,
  },
  input: {
    flex: 1, backgroundColor: C.inputBg, borderRadius: 22, borderWidth: 1.5,
    borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14.5, color: C.text, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.border },
  sendBtnText: { color: C.white, fontSize: 16 },
});
