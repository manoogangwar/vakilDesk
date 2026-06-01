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

import { C } from '@/constants/colors';
import { CATEGORY_LABELS } from '@/utils/defaultTemplates';
import { getVariableLabel } from '@/utils/templateVariables';
import api from '@/utils/api';

type Template = {
  id: number;
  name: string;
  category: string;
  category_display: string;
  content: string;
  variables: string[];
  updated_at: string;
};

const CATEGORY_ICONS: Record<string, string> = {
  affidavit: '📜', income_certificate: '💰', domicile_certificate: '🏠',
  caste_certificate: '📋', legal_notice: '⚖️', rent_agreement: '🔑',
  noc: '✅', rti: '🔍', power_of_attorney: '✍️', other: '📄',
};

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    setLoading(true);
    api.get<Template>(`/templates/${id}/`)
      .then(({ data }) => setTemplate(data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id, router]));

  const handleDelete = () => {
    Alert.alert('Delete Template', `Delete "${template?.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/templates/${id}/`);
            router.back();
          } catch { Alert.alert('Error', 'Failed to delete template.'); }
        },
      },
    ]);
  };

  const handleDuplicate = async () => {
    try {
      const { data } = await api.post<Template>(`/templates/${id}/duplicate/`);
      Alert.alert('Duplicated!', `"${data.name}" created.`, [
        { text: 'Edit Copy', onPress: () => router.replace({ pathname: '/(app)/template-editor', params: { id: data.id } } as Href) },
        { text: 'OK' },
      ]);
    } catch { Alert.alert('Error', 'Failed to duplicate.'); }
  };

  if (loading) {
    return <SafeAreaView style={styles.flex}><ActivityIndicator style={{ flex: 1 }} size="large" color={C.primary} /></SafeAreaView>;
  }
  if (!template) return null;

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Template Detail</Text>
        <TouchableOpacity onPress={handleDelete}><Text style={styles.deleteBtn}>Delete</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Title card */}
        <View style={styles.titleCard}>
          <Text style={styles.titleIcon}>{CATEGORY_ICONS[template.category] ?? '📄'}</Text>
          <View style={styles.titleInfo}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateCategory}>{template.category_display}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => router.push({ pathname: '/(app)/generate-document', params: { template_id: id } } as Href)}
          >
            <Text style={[styles.actionBtnText, { color: C.white }]}>📄 Use Template → Generate PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secBtn} onPress={() => router.push({ pathname: '/(app)/template-editor', params: { id } } as Href)}>
            <Text style={styles.secBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secBtn} onPress={handleDuplicate}>
            <Text style={styles.secBtnText}>⎘ Duplicate</Text>
          </TouchableOpacity>
        </View>

        {/* Variables */}
        {template.variables.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Variables Used ({template.variables.length})</Text>
            <View style={styles.varGrid}>
              {template.variables.map(v => (
                <View key={v} style={styles.varTag}>
                  <Text style={styles.varTagKey}>{`{{${v}}}`}</Text>
                  <Text style={styles.varTagLabel}>{getVariableLabel(v)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Content preview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Content Preview</Text>
          <Text style={styles.contentPreview}>{template.content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.white, textAlign: 'center' },
  deleteBtn: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40, gap: 14 },

  titleCard: { backgroundColor: C.primary, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  titleIcon: { fontSize: 40 },
  titleInfo: { flex: 1 },
  templateName: { fontSize: 18, fontWeight: '700', color: C.white, marginBottom: 4 },
  templateCategory: { fontSize: 13, color: C.accent, fontWeight: '600' },

  actionRow: { gap: 10 },
  actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  actionBtnPrimary: { backgroundColor: C.primary, borderColor: C.primary },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: C.text },

  secondaryActions: { flexDirection: 'row', gap: 10 },
  secBtn: { flex: 1, backgroundColor: C.white, borderRadius: 10, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  secBtnText: { fontSize: 13.5, fontWeight: '600', color: C.text },

  card: { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  varGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  varTag: { backgroundColor: `${C.primary}10`, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: `${C.primary}25` },
  varTagKey: { fontSize: 11.5, color: C.primary, fontWeight: '700', fontFamily: 'monospace' },
  varTagLabel: { fontSize: 10.5, color: C.textMuted, marginTop: 2 },

  contentPreview: { fontSize: 13, color: C.text, lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
});

import { Platform } from 'react-native';
