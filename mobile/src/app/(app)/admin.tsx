import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { C } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
};

type RoleFilter = 'all' | 'admin' | 'lawyer' | 'client';

function getInitials(u: User) {
  return (
    ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase() ||
    (u.username?.[0] ?? '?').toUpperCase()
  );
}

function getDisplayName(u: User) {
  return u.first_name ? `${u.first_name} ${u.last_name}`.trim() : u.username;
}

function UserCard({
  user,
  onToggle,
}: {
  user: User;
  onToggle: (id: number) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    setBusy(true);
    await onToggle(user.id);
    setBusy(false);
  };

  return (
    <View style={styles.userCard}>
      <View style={styles.userCardLeft}>
        <Avatar initials={getInitials(user)} size={40} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{getDisplayName(user)}</Text>
          <Text style={styles.userMeta}>@{user.username} · {user.email}</Text>
          <View style={styles.badgeRow}>
            <Badge value={user.role} />
            <Badge value={user.is_active ? 'active' : 'inactive'} />
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.toggleBtn,
          user.is_active ? styles.toggleBtnDanger : styles.toggleBtnSuccess,
        ]}
        onPress={handleToggle}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator size="small" color={user.is_active ? C.error : C.success} />
        ) : (
          <Text
            style={[
              styles.toggleBtnText,
              { color: user.is_active ? C.error : C.success },
            ]}
          >
            {user.is_active ? 'Deactivate' : 'Activate'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'lawyer', label: 'Lawyer' },
  { value: 'client', label: 'Client' },
];

export default function AdminScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, usersRes] = await Promise.all([
        api.get<{ role: string; is_staff: boolean }>('/profile/'),
        api.get<User[]>('/users/'),
      ]);
      if (profileRes.data.role !== 'admin' && !profileRes.data.is_staff) {
        router.replace('/(app)/dashboard');
        return;
      }
      setUsers(usersRes.data);
    } catch {
      await logout();
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (id: number) => {
    try {
      await api.post(`/users/${id}/toggle-active/`);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u)),
      );
    } catch {
      // silently fail
    }
  };

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const counts = {
    total: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    lawyer: users.filter((u) => u.role === 'lawyer').length,
    client: users.filter((u) => u.role === 'client').length,
    active: users.filter((u) => u.is_active).length,
  };

  return (
    <SafeAreaView style={styles.flex}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Admin Panel</Text>
        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: counts.total },
          { label: 'Active', value: counts.active },
          { label: 'Lawyers', value: counts.lawyer },
          { label: 'Clients', value: counts.client },
        ].map(({ label, value }) => (
          <View key={label} style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{value}</Text>
            <Text style={styles.miniStatLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or username…"
          placeholderTextColor={C.border}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Role filter pills */}
      <View style={styles.filterRow}>
        {ROLE_FILTERS.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.filterPill,
              roleFilter === value && styles.filterPillActive,
            ]}
            onPress={() => setRoleFilter(value)}
          >
            <Text
              style={[
                styles.filterPillText,
                roleFilter === value && styles.filterPillTextActive,
              ]}
            >
              {label}{' '}
              ({value === 'all' ? counts.total : counts[value as keyof typeof counts]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User list */}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={C.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <UserCard user={item} onToggle={handleToggle} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                {search ? `No users matching "${search}".` : 'No users found.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            filtered.length > 0 ? (
              <Text style={styles.footerCount}>
                Showing {filtered.length} of {users.length} users
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
  topbar: {
    backgroundColor: C.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {},
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  topbarTitle: { fontSize: 15, fontWeight: '700', color: C.white },
  signOutText: { color: '#fca5a5', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  miniStatValue: { fontSize: 20, fontWeight: '700', color: C.primary },
  miniStatLabel: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  searchWrap: { padding: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  searchInput: {
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: C.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  filterPillActive: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  filterPillText: { fontSize: 12, fontWeight: '500', color: C.textMuted },
  filterPillTextActive: { color: C.white },
  loader: { marginTop: 40 },
  list: { padding: 12, gap: 10, paddingBottom: 32 },
  userCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  userCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 13.5, fontWeight: '600', color: C.text, marginBottom: 2 },
  userMeta: { fontSize: 11.5, color: C.textMuted, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    minWidth: 82,
    alignItems: 'center',
  },
  toggleBtnDanger: {
    borderColor: 'rgba(220,38,38,0.28)',
    backgroundColor: 'rgba(220,38,38,0.05)',
  },
  toggleBtnSuccess: {
    borderColor: 'rgba(5,150,105,0.28)',
    backgroundColor: 'rgba(5,150,105,0.05)',
  },
  toggleBtnText: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyText: { fontSize: 14, color: C.textMuted },
  footerCount: {
    textAlign: 'center',
    fontSize: 12,
    color: C.textMuted,
    paddingVertical: 12,
  },
});
