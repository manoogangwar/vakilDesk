import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
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

type UpcomingCase = {
  id: number;
  case_name: string;
  case_number: string;
  status: string;
  court_name: string;
  next_date: string;
  payment_status: string;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtDateHeader(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(today.getDate() + 1);
  const tomorrowISO = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  const dayName = DAY_NAMES[d.getDay()];
  const dateStr = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

  if (iso === todayISO) return { label: `Today — ${dateStr}`, isToday: true };
  if (iso === tomorrowISO) return { label: `Tomorrow — ${dateStr}`, isToday: false };
  return { label: `${dayName}, ${dateStr}`, isToday: false };
}

export default function CalendarScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<UpcomingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [monthOffset, setMonthOffset] = useState(0); // 0 = all upcoming

  const fetchUpcoming = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data } = await api.get<UpcomingCase[]>('/cases/upcoming/');
      setCases(data);
    } catch {
      setFetchError('Failed to load upcoming hearings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchUpcoming(); }, [fetchUpcoming]));

  // Group cases by next_date, filtered to selected month
  const sections = useMemo(() => {
    const today = new Date();
    const targetMonth = today.getMonth() + monthOffset;
    const targetYear = today.getFullYear() + Math.floor((today.getMonth() + monthOffset) / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;

    const filtered = monthOffset === 0
      ? cases
      : cases.filter(c => {
          const d = new Date(c.next_date + 'T00:00:00');
          return d.getMonth() === normalizedMonth && d.getFullYear() === targetYear;
        });

    const grouped: Record<string, UpcomingCase[]> = {};
    filtered.forEach(c => {
      if (!grouped[c.next_date]) grouped[c.next_date] = [];
      grouped[c.next_date].push(c);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, data }));
  }, [cases, monthOffset]);

  const today = new Date();
  const displayMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthLabel = `${MONTH_NAMES[displayMonth.getMonth()]} ${displayMonth.getFullYear()}`;

  return (
    <SafeAreaView style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hearings Calendar</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Month navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          style={styles.monthBtn}
          onPress={() => setMonthOffset(o => o - 1)}
          disabled={monthOffset === 0}
        >
          <Text style={[styles.monthBtnText, monthOffset === 0 && styles.monthBtnDisabled]}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMonthOffset(0)}>
          <Text style={styles.monthLabel}>
            {monthOffset === 0 ? 'All Upcoming' : monthLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.monthBtn} onPress={() => setMonthOffset(o => o + 1)}>
          <Text style={styles.monthBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {fetchError ? <AlertBox type="error" message={fetchError} /> : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={C.primary} />
      ) : sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>
            {monthOffset === 0
              ? 'No upcoming hearings scheduled.'
              : `No hearings in ${monthLabel}.`}
          </Text>
          {monthOffset !== 0 && (
            <TouchableOpacity onPress={() => setMonthOffset(0)} style={styles.allBtn}>
              <Text style={styles.allBtnText}>Show All Upcoming</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section: { date } }) => {
            const { label, isToday } = fmtDateHeader(date);
            return (
              <View style={[styles.sectionHeader, isToday && styles.sectionHeaderToday]}>
                <Text style={[styles.sectionHeaderText, isToday && styles.sectionHeaderTextToday]}>
                  {label}
                </Text>
                {isToday && <View style={styles.todayPill}><Text style={styles.todayPillText}>TODAY</Text></View>}
              </View>
            );
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.caseCard}
              onPress={() => router.push({ pathname: '/(app)/case-detail', params: { id: item.id } })}
            >
              <View style={styles.caseCardLeft}>
                <Text style={styles.caseName} numberOfLines={1}>{item.case_name}</Text>
                {item.case_number ? <Text style={styles.caseSub}>#{item.case_number}</Text> : null}
                {item.court_name ? <Text style={styles.caseSub}>🏛 {item.court_name}</Text> : null}
              </View>
              <View style={styles.caseCardRight}>
                <Badge value={item.status} />
                <Badge value={item.payment_status} />
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <Text style={styles.totalCount}>
              {cases.length} upcoming hearing{cases.length !== 1 ? 's' : ''} total
            </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.white },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  monthBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthBtnText: { fontSize: 24, color: C.primary, fontWeight: '700' },
  monthBtnDisabled: { color: C.border },
  monthLabel: { fontSize: 15, fontWeight: '700', color: C.text },

  loader: { marginTop: 40 },
  list: { paddingBottom: 32 },

  sectionHeader: {
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sectionHeaderToday: { backgroundColor: `${C.primary}10` },
  sectionHeaderText: { fontSize: 13, fontWeight: '700', color: C.textMuted },
  sectionHeaderTextToday: { color: C.primary },
  todayPill: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  todayPillText: { fontSize: 10, fontWeight: '700', color: C.white },

  caseCard: {
    backgroundColor: C.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 10,
  },
  caseCardLeft: { flex: 1 },
  caseName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 3 },
  caseSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  caseCardRight: { gap: 4, alignItems: 'flex-end' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center', marginBottom: 16 },
  allBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  allBtnText: { color: C.white, fontSize: 13, fontWeight: '600' },

  totalCount: { textAlign: 'center', fontSize: 12, color: C.textMuted, paddingVertical: 16 },
});
