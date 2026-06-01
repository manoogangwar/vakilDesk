import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C } from '@/constants/colors';
import { DOC_FORMS } from '@/utils/documentForms';

export default function DocumentsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Document</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Pick a document. You'll fill a simple form — fields are auto-filled from the
          client's details and remain editable. No template variables to manage.
        </Text>

        <Text style={styles.sectionTitle}>Standard Documents</Text>
        <View style={styles.grid}>
          {DOC_FORMS.map(d => (
            <TouchableOpacity
              key={d.key}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/(app)/document-form', params: { type: d.key } })}
            >
              <Text style={styles.cardIcon}>{d.icon}</Text>
              <Text style={styles.cardName}>{d.label}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{d.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Advanced</Text>
        <TouchableOpacity
          style={styles.customRow}
          activeOpacity={0.8}
          onPress={() => router.push('/(app)/templates' as Href)}
        >
          <Text style={styles.customIcon}>📝</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.customTitle}>Custom Templates</Text>
            <Text style={styles.customDesc}>Create or edit free-form templates with your own variables.</Text>
          </View>
          <Text style={styles.customArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.white, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },

  intro: { fontSize: 13, color: C.textMuted, lineHeight: 19, marginBottom: 18 },
  sectionTitle: { fontSize: 13.5, fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  card: {
    width: '47.7%', backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 14, gap: 4,
  },
  cardIcon: { fontSize: 26, marginBottom: 4 },
  cardName: { fontSize: 14, fontWeight: '700', color: C.text },
  cardDesc: { fontSize: 11, color: C.textMuted, lineHeight: 15 },

  customRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16 },
  customIcon: { fontSize: 24 },
  customTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  customDesc: { fontSize: 11.5, color: C.textMuted, marginTop: 2 },
  customArrow: { fontSize: 18, color: C.primary },
});
