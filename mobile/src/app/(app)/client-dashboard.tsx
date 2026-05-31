import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { C } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

type Profile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
};

type ClientCase = {
  id: number;
  case_name: string;
  case_number: string;
  status: string;
  court_name: string;
  next_date: string | null;
  payment_status: string;
  fee_amount: string;
  paid_amount: string;
};

function getName(p: Profile) {
  return p.first_name ? `${p.first_name} ${p.last_name}`.trim() : p.username;
}

function getInitials(p: Profile) {
  return ((p.first_name?.[0] ?? '') + (p.last_name?.[0] ?? '')).toUpperCase() ||
    (p.username?.[0] ?? '?').toUpperCase();
}

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ClientDashboardScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, casesRes] = await Promise.all([
        api.get<Profile>('/profile/'),
        api.get<ClientCase[]>('/cases/my-cases/'),
      ]);
      setProfile(profileRes.data);
      setCases(casesRes.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        await logout();
        router.replace('/(auth)/login');
      }
    }
  }, [logout, router]);

  useFocusEffect(useCallback(() => {
    fetchData();
    AsyncStorage.getItem('profile_picture').then(uri => { if (uri) setProfilePic(uri); });
  }, [fetchData]));

  const todayISO = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const upcomingCases = cases.filter(c => c.next_date && c.next_date >= todayISO).sort((a, b) => (a.next_date ?? '').localeCompare(b.next_date ?? ''));
  const pendingCases = cases.filter(c => c.payment_status !== 'paid');
  const totalBalance = cases.reduce((sum, c) => sum + Math.max(0, parseFloat(c.fee_amount) - parseFloat(c.paid_amount)), 0);

  return (
    <SafeAreaView style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarWrap} onPress={() => router.push('/(app)/edit-profile')}>
            {profilePic
              ? <Image source={{ uri: profilePic }} style={styles.avatarImg} />
              : <Avatar initials={profile ? getInitials(profile) : '?'} size={38} />}
          </TouchableOpacity>
          <View>
            <Text style={styles.headerGreet}>Hello,</Text>
            <Text style={styles.headerName}>{profile ? getName(profile) : '…'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={async () => { await logout(); router.replace('/(auth)/login'); }}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="⚖️" value={cases.length} label="My Cases" variant="navy" />
          <StatCard icon="📅" value={upcomingCases.length} label="Upcoming" variant="gold" />
          <StatCard icon="⏳" value={pendingCases.length} label="Pending Fee" variant="green" />
        </View>

        {/* Balance due */}
        {totalBalance > 0 && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance Due</Text>
            <Text style={styles.balanceAmount}>₹{totalBalance.toLocaleString('en-IN')}</Text>
          </View>
        )}

        {/* Upcoming hearing */}
        {upcomingCases.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Next Hearing</Text>
            <TouchableOpacity
              style={styles.nextHearingCard}
              onPress={() => router.push({ pathname: '/(app)/client-case-detail', params: { id: upcomingCases[0].id } })}
            >
              <View style={styles.nextHearingDateBadge}>
                <Text style={styles.nextHearingDay}>
                  {new Date(upcomingCases[0].next_date! + 'T00:00:00').getDate()}
                </Text>
                <Text style={styles.nextHearingMonth}>
                  {new Date(upcomingCases[0].next_date! + 'T00:00:00').toLocaleString('en-IN', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.nextHearingInfo}>
                <Text style={styles.nextHearingCase} numberOfLines={1}>{upcomingCases[0].case_name}</Text>
                {upcomingCases[0].court_name ? <Text style={styles.nextHearingCourt}>🏛 {upcomingCases[0].court_name}</Text> : null}
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </>
        )}

        {/* All cases */}
        <Text style={styles.sectionTitle}>My Cases ({cases.length})</Text>
        {cases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⚖️</Text>
            <Text style={styles.emptyText}>No cases linked to your account yet.</Text>
            <Text style={styles.emptyHint}>Your lawyer will link cases to you.</Text>
          </View>
        ) : (
          cases.map(c => (
            <TouchableOpacity
              key={c.id}
              style={styles.caseCard}
              onPress={() => router.push({ pathname: '/(app)/client-case-detail', params: { id: c.id } })}
            >
              <View style={styles.caseCardTop}>
                <Text style={styles.caseName} numberOfLines={1}>{c.case_name}</Text>
                <Badge value={c.status} />
              </View>
              {c.case_number ? <Text style={styles.caseSub}>#{c.case_number}</Text> : null}
              <View style={styles.caseCardBottom}>
                {c.next_date ? <Text style={styles.caseDate}>📅 {fmtDate(c.next_date)}</Text> : null}
                <Badge value={c.payment_status} />
              </View>
            </TouchableOpacity>
          ))
        )}
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: C.accent },
  headerGreet: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  headerName: { fontSize: 14, fontWeight: '700', color: C.white },
  logoutText: { color: '#fca5a5', fontSize: 12, fontWeight: '600' },

  body: { padding: 16, paddingBottom: 40 },

  sectionTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 10, marginTop: 4 },
  statsGrid: { gap: 10, marginBottom: 18 },

  balanceCard: {
    backgroundColor: C.errorBg, borderRadius: 12, padding: 16,
    borderWidth: 1.5, borderColor: C.error, marginBottom: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: C.error },
  balanceAmount: { fontSize: 20, fontWeight: '700', color: C.error },

  nextHearingCard: {
    backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1,
    borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18,
  },
  nextHearingDateBadge: {
    backgroundColor: C.primary, borderRadius: 10, width: 50, height: 56,
    alignItems: 'center', justifyContent: 'center',
  },
  nextHearingDay: { fontSize: 22, fontWeight: '700', color: C.white, lineHeight: 26 },
  nextHearingMonth: { fontSize: 11, color: C.accent, fontWeight: '600', textTransform: 'uppercase' },
  nextHearingInfo: { flex: 1 },
  nextHearingCase: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
  nextHearingCourt: { fontSize: 12, color: C.textMuted },
  arrow: { fontSize: 22, color: C.border },

  emptyCard: {
    backgroundColor: C.white, borderRadius: 12, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.text, fontWeight: '600', textAlign: 'center' },
  emptyHint: { fontSize: 12, color: C.textMuted, marginTop: 4, textAlign: 'center' },

  caseCard: {
    backgroundColor: C.white, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  caseCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  caseName: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text, marginRight: 8 },
  caseSub: { fontSize: 12, color: C.textMuted, marginBottom: 6 },
  caseCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  caseDate: { fontSize: 12, color: C.textMuted },
});
