import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { registerPushToken, scheduleHearingReminders } from '@/utils/notifications';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Profile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  is_staff: boolean;
};

type Case = {
  id: number;
  case_name: string;
  case_number: string;
  next_date: string | null;
  payment_status: string;
};

function getDisplayName(p: Profile) {
  return p.first_name ? `${p.first_name} ${p.last_name}`.trim() : p.username;
}

function getInitials(p: Profile) {
  return (
    ((p.first_name?.[0] ?? '') + (p.last_name?.[0] ?? '')).toUpperCase() ||
    (p.username?.[0] ?? '?').toUpperCase()
  );
}


type DrawerItemProps = {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function DrawerItem({ icon, label, onPress, danger }: DrawerItemProps) {
  return (
    <TouchableOpacity style={drawerStyles.item} onPress={onPress} activeOpacity={0.7}>
      <Text style={drawerStyles.itemIcon}>{icon}</Text>
      <Text style={[drawerStyles.itemLabel, danger && { color: C.error }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const drawerStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  itemIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  itemLabel: { fontSize: 15, fontWeight: '500', color: C.text },
});

export default function DashboardScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, casesRes] = await Promise.all([
        api.get<Profile>('/profile/'),
        api.get<Case[]>('/cases/'),
      ]);
      setProfile(profileRes.data);
      setCases(casesRes.data);
      // Schedule local hearing reminders and register push token (fire-and-forget)
      void scheduleHearingReminders(
        casesRes.data.filter(c => !!c.next_date).map(c => ({ id: c.id, case_name: c.case_name, next_date: c.next_date! }))
      );
      void registerPushToken();
    } catch (err: unknown) {
      // Only logout on 401 — network errors or server errors should NOT kick the user out
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        await logout();
        router.replace('/(auth)/login');
      }
    }

    // Client count is non-critical — its failure must not affect auth state
    try {
      const { data } = await api.get<{ id: number }[]>('/clients/');
      setClientCount(data.length);
    } catch {
      // Keep showing 0 — user can still use the app
    }
  }, [logout, router]);

  useEffect(() => {
    fetchData();
    AsyncStorage.getItem('profile_picture').then(uri => {
      if (uri) setProfilePic(uri);
    });
  }, [fetchData]);

  // ── Drawer animation ──
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerOpen(false);
      cb?.();
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // ── Profile picture ──
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow VakilDesk to access your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfilePic(uri);
      await AsyncStorage.setItem('profile_picture', uri);
    }
  };

  const filteredCases = cases.filter(c =>
    c.case_name.toLowerCase().includes(search.toLowerCase()) ||
    c.case_number.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = profile?.role === 'admin' || profile?.is_staff;
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Build today's date string in YYYY-MM-DD using local time (not UTC) to match backend date fields
  const todayISO = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  return (
    <SafeAreaView style={styles.flex}>
      {/* ── Top Bar ── */}
      <View style={styles.topbar}>
        <Text style={styles.logo}>
          Vakil<Text style={styles.logoAccent}>Desk</Text>
        </Text>
        <View style={styles.topbarRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(app)/messages' as Href)}>
            <Text style={styles.iconText}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dotBtn} onPress={openDrawer}>
            <View style={styles.hamburger}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search cases…"
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Good day, {profile?.first_name || profile?.username || '…'} 👋
          </Text>
          <Text style={styles.welcomeSub}>{today}</Text>
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={styles.adminBanner}
            onPress={() => router.push('/(app)/admin')}
          >
            <Text style={styles.adminBannerText}>🛡 Admin Panel</Text>
            <Text style={styles.adminBannerArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Stats — 3 cards */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="⚖️" value={cases.length} label="Active Cases" variant="navy" />
          <StatCard icon="👥" value={clientCount} label="Clients" variant="gold" />
          <StatCard
            icon="📅"
            value={cases.filter(c => c.next_date === todayISO).length}
            label="Hearing Today"
            variant="green"
          />
        </View>

        {/* Today's Cause List */}
        {cases.filter(c => c.next_date === todayISO).length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Today's Cause List</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/calendar' as Href)}>
                <Text style={styles.seeAll}>Full calendar →</Text>
              </TouchableOpacity>
            </View>
            {cases.filter(c => c.next_date === todayISO).map(c => (
              <TouchableOpacity
                key={`today-${c.id}`}
                style={styles.causeRow}
                onPress={() => router.push({ pathname: '/(app)/case-detail', params: { id: c.id } })}
              >
                <View style={styles.causeDot} />
                <Text style={styles.causeName} numberOfLines={1}>{c.case_name}</Text>
                <Badge value={c.payment_status} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(app)/new-case' as Href)}>
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionLabel}>New Case</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(app)/cases' as Href)}>
            <Text style={styles.actionIcon}>⚖️</Text>
            <Text style={styles.actionLabel}>All Cases</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(app)/new-client' as Href)}>
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>Add Client</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(app)/calendar' as Href)}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionLabel}>Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Cases */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {search ? `Results for "${search}"` : 'Recent Cases'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(app)/cases' as Href)}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {filteredCases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⚖️</Text>
            <Text style={styles.emptyText}>
              {search ? 'No cases match your search.' : 'No cases yet. Tap New Case to get started.'}
            </Text>
          </View>
        ) : (
          filteredCases.slice(0, 5).map(c => (
            <TouchableOpacity
              key={c.id}
              style={styles.caseRow}
              onPress={() => router.push({ pathname: '/(app)/case-detail', params: { id: c.id } })}
            >
              <View style={styles.caseRowLeft}>
                <Text style={styles.caseName}>{c.case_name}</Text>
                {c.next_date && (
                  <Text style={styles.caseDate}>
                    Next: {new Date(c.next_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                )}
              </View>
              <Badge value={c.payment_status} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* ── Full-Screen Animated Drawer ── */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="none"
        onRequestClose={() => closeDrawer()}
      >
        <Animated.View
          style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
        >
          <SafeAreaView style={styles.drawerInner}>
            {/* Profile Header (navy) — ✕ sits in the top-right corner */}
            <View style={styles.drawerHeader}>
              {/* ✕ close button — absolute top-right */}
              <TouchableOpacity style={styles.closeBtn} onPress={() => closeDrawer()}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.drawerProfileRow}>
                {/* Avatar on the left */}
                <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage}>
                  {profilePic ? (
                    <Image source={{ uri: profilePic }} style={styles.avatarImg} />
                  ) : (
                    <Avatar initials={profile ? getInitials(profile) : '?'} size={44} />
                  )}
                  <View style={styles.cameraBadge}>
                    <Text style={styles.cameraEmoji}>📷</Text>
                  </View>
                </TouchableOpacity>

                {/* Details on the right */}
                <View style={styles.drawerProfileInfo}>
                  <Text style={styles.drawerName} numberOfLines={1}>
                    {profile ? getDisplayName(profile) : ''}
                  </Text>
                  <Text style={styles.drawerEmail} numberOfLines={1}>{profile?.email}</Text>
                  {profile && (
                    <View style={styles.drawerNameRow}>
                      <Badge value={profile.role} />
                      <TouchableOpacity
                        onPress={() => closeDrawer(() => router.push('/(app)/edit-profile' as Href))}
                        style={styles.pencilBtn}
                      >
                        <Text style={styles.pencilText}>✏️</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.drawerMenu} bounces={false}>
              <DrawerItem icon="🏠" label="Dashboard" onPress={() => closeDrawer()} />
              <DrawerItem icon="⚖️" label="My Cases"
                onPress={() => closeDrawer(() => router.push('/(app)/cases' as Href))} />
              <DrawerItem icon="👥" label="My Clients"
                onPress={() => closeDrawer(() => router.push('/(app)/clients' as Href))} />
              <DrawerItem icon="📅" label="Calendar"
                onPress={() => closeDrawer(() => router.push('/(app)/calendar' as Href))} />
              <DrawerItem icon="🧾" label="Invoices"
                onPress={() => closeDrawer(() => router.push('/(app)/invoices' as Href))} />
              <DrawerItem icon="📄" label="Generate Document"
                onPress={() => closeDrawer(() => router.push('/(app)/documents' as Href))} />
              <DrawerItem icon="📝" label="Document Templates"
                onPress={() => closeDrawer(() => router.push('/(app)/templates' as Href))} />
              {isAdmin && (
                <DrawerItem icon="🛡" label="Admin Panel"
                  onPress={() => closeDrawer(() => router.push('/(app)/admin' as Href))} />
              )}
              <DrawerItem icon="💬" label="Messages"
                onPress={() => closeDrawer(() => router.push('/(app)/messages' as Href))} />
              <DrawerItem icon="🔔" label="Notifications" onPress={() => closeDrawer(() => Alert.alert('Hearing Reminders', 'Local notifications are scheduled automatically for your upcoming hearings — one day before and on the day of each hearing.'))} />
              <DrawerItem icon="⚙️" label="Settings" onPress={() => closeDrawer(() => Alert.alert('Coming Soon', 'Settings are coming in the next update.'))} />
              <DrawerItem icon="❓" label="Help & Support" onPress={() => closeDrawer(() => Alert.alert('Help & Support', 'For assistance, contact support@vakildesk.in'))} />
            </ScrollView>

            {/* Logout at the very bottom */}
            <View style={styles.drawerBottom}>
              <DrawerItem icon="🚪" label="Logout"
                onPress={() => closeDrawer(handleLogout)} danger />
            </View>
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },

  // Top bar
  topbar: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: { fontSize: 20, fontWeight: '700', color: C.white },
  logoAccent: { color: C.accent },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  iconText: { fontSize: 18 },
  dotBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 4,
  },
  dotText: { fontSize: 22, color: C.white, fontWeight: '700', lineHeight: 26 },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border,
    paddingHorizontal: 14, paddingVertical: 8, gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 4 },

  // Body
  body: { padding: 16, paddingBottom: 40 },
  welcomeSection: { marginBottom: 16 },
  welcomeTitle: { fontSize: 20, fontWeight: '700', color: C.primary, marginBottom: 2 },
  welcomeSub: { fontSize: 12.5, color: C.textMuted },
  adminBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(201,168,71,0.1)', borderWidth: 1,
    borderColor: 'rgba(201,168,71,0.3)', borderRadius: 10,
    padding: 12, marginBottom: 18,
  },
  adminBannerText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  adminBannerArrow: { fontSize: 15, color: C.accent },

  // Stats
  statsGrid: { gap: 10, marginBottom: 22 },

  // Quick actions
  sectionTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  actionCard: {
    flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: C.text, textAlign: 'center' },

  // Cause list
  causeRow: {
    backgroundColor: C.white, borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: C.border, marginBottom: 8,
  },
  causeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  causeName: { flex: 1, fontSize: 13.5, fontWeight: '600', color: C.text },

  // Cases
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAll: { fontSize: 12.5, color: C.primary, fontWeight: '600' },
  emptyCard: {
    backgroundColor: C.white, borderRadius: 12, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 13.5, color: C.textMuted, textAlign: 'center' },
  caseRow: {
    backgroundColor: C.white, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.border, marginBottom: 8,
  },
  caseRowLeft: { flex: 1, marginRight: 10 },
  caseName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  caseDate: { fontSize: 12, color: C.textMuted },

  // ── Drawer ──
  drawerContainer: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    width: SCREEN_WIDTH,
    height: '100%',
    backgroundColor: C.white,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    flexDirection: 'column',
  },

  // Drawer header (navy) — profile at the very top, ✕ absolute in corner
  drawerHeader: {
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    position: 'relative',
  },
  drawerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerProfileInfo: { flex: 1 },
  avatarWrap: {
    position: 'relative',
    width: 44,
    height: 44,
    flexShrink: 0,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: C.accent,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraEmoji: { fontSize: 10 },
  drawerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  drawerName: { fontSize: 15, fontWeight: '700', color: C.white, marginBottom: 2 },
  pencilBtn: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  pencilText: { fontSize: 11, lineHeight: 16 },
  drawerEmail: { fontSize: 11.5, color: 'rgba(255,255,255,0.65)' },

  // Drawer inner / close row
  drawerInner: { flex: 1 },
  drawerCloseRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: C.primary,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  closeText: { fontSize: 14, color: C.white, fontWeight: '700' },

  // Hamburger icon (3 lines)
  hamburger: { gap: 5, justifyContent: 'center', alignItems: 'center' },
  hamburgerLine: {
    width: 20, height: 2, borderRadius: 2, backgroundColor: C.white,
  },

  // Drawer menu + bottom
  drawerMenu: { flex: 1 },
  drawerBottom: {
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
});
