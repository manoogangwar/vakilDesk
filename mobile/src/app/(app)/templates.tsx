import { useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBox } from '@/components/ui/AlertBox';
import { C } from '@/constants/colors';
import { CATEGORIES, CATEGORY_LABELS, DEFAULT_TEMPLATES } from '@/utils/defaultTemplates';
import api from '@/utils/api';

type Template = {
  id: number;
  name: string;
  category: string;
  category_display: string;
  variables: string[];
  updated_at: string;
};

const CATEGORY_ICONS: Record<string, string> = {
  affidavit: '📜', income_certificate: '💰', domicile_certificate: '🏠',
  caste_certificate: '📋', legal_notice: '⚖️', rent_agreement: '🔑',
  noc: '✅', rti: '🔍', power_of_attorney: '✍️', other: '📄',
};

export default function TemplatesScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showDefaults, setShowDefaults] = useState(false);
  const [savingDefault, setSavingDefault] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data } = await api.get<Template[]>('/templates/');
      setTemplates(data);
    } catch {
      setFetchError('Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchTemplates(); }, [fetchTemplates]));

  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory);

  const handleDelete = (t: Template) => {
    Alert.alert('Delete Template', `Delete "${t.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/templates/${t.id}/`);
            setTemplates(prev => prev.filter(x => x.id !== t.id));
          } catch { Alert.alert('Error', 'Failed to delete template.'); }
        },
      },
    ]);
  };

  const handleDuplicate = async (t: Template) => {
    try {
      const { data } = await api.post<Template>(`/templates/${t.id}/duplicate/`);
      setTemplates(prev => [data, ...prev]);
      Alert.alert('Duplicated', `"${data.name}" created.`);
    } catch { Alert.alert('Error', 'Failed to duplicate template.'); }
  };

  const handleSaveDefault = async (def: typeof DEFAULT_TEMPLATES[0]) => {
    setSavingDefault(def.name);
    try {
      const { data } = await api.post<Template>('/templates/', {
        name: def.name,
        category: def.category,
        content: def.content,
      });
      setTemplates(prev => [data, ...prev]);
      Alert.alert('Saved!', `"${def.name}" added to your templates.`);
    } catch { Alert.alert('Error', 'Failed to save template.'); }
    finally { setSavingDefault(null); }
  };

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Templates</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.defaultsBtn} onPress={() => setShowDefaults(true)}>
            <Text style={styles.defaultsBtnText}>Starter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(app)/template-editor' as Href)}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category filter */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity style={[styles.filterPill, activeCategory === 'all' && styles.filterPillActive]} onPress={() => setActiveCategory('all')}>
            <Text style={[styles.filterPillText, activeCategory === 'all' && styles.filterPillTextActive]}>All ({templates.length})</Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => {
            const count = templates.filter(t => t.category === cat.value).length;
            if (count === 0) return null;
            return (
              <TouchableOpacity key={cat.value} style={[styles.filterPill, activeCategory === cat.value && styles.filterPillActive]} onPress={() => setActiveCategory(cat.value)}>
                <Text style={[styles.filterPillText, activeCategory === cat.value && styles.filterPillTextActive]}>
                  {CATEGORY_ICONS[cat.value]} {cat.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {fetchError ? <AlertBox type="error" message={fetchError} /> : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={C.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => String(t.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardMain}
                onPress={() => router.push({ pathname: '/(app)/template-detail', params: { id: item.id } })}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>{CATEGORY_ICONS[item.category] ?? '📄'}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardCategory}>{item.category_display}</Text>
                  {item.variables.length > 0 && (
                    <Text style={styles.cardVars} numberOfLines={1}>
                      {item.variables.slice(0, 4).map(v => `{{${v}}}`).join(', ')}
                      {item.variables.length > 4 ? ` +${item.variables.length - 4} more` : ''}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.cardActionBtn} onPress={() => router.push({ pathname: '/(app)/template-editor', params: { id: item.id } } as Href)}>
                  <Text style={styles.cardActionEdit}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleDuplicate(item)}>
                  <Text style={styles.cardActionDup}>⎘</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleDelete(item)}>
                  <Text style={styles.cardActionDel}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No templates yet</Text>
              <Text style={styles.emptyText}>Tap "+ New" to create your own, or "Starter" to load pre-built Indian legal templates.</Text>
              <TouchableOpacity style={styles.starterBtn} onPress={() => setShowDefaults(true)}>
                <Text style={styles.starterBtnText}>Browse Starter Templates →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Starter templates modal */}
      <Modal visible={showDefaults} animationType="slide" onRequestClose={() => setShowDefaults(false)}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Starter Templates</Text>
            <TouchableOpacity onPress={() => setShowDefaults(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={DEFAULT_TEMPLATES}
            keyExtractor={d => d.name}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const alreadySaved = templates.some(t => t.name === item.name);
              return (
                <View style={styles.defaultCard}>
                  <View style={styles.defaultCardLeft}>
                    <Text style={styles.defaultIcon}>{CATEGORY_ICONS[item.category] ?? '📄'}</Text>
                    <View style={styles.defaultInfo}>
                      <Text style={styles.defaultName}>{item.name}</Text>
                      <Text style={styles.defaultCategory}>{CATEGORY_LABELS[item.category]}</Text>
                    </View>
                  </View>
                  {alreadySaved ? (
                    <Text style={styles.savedText}>Saved ✓</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={() => handleSaveDefault(item)}
                      disabled={savingDefault === item.name}
                    >
                      {savingDefault === item.name
                        ? <ActivityIndicator size="small" color={C.white} />
                        : <Text style={styles.saveBtnText}>Save</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.white },
  headerActions: { flexDirection: 'row', gap: 8 },
  defaultsBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  defaultsBtnText: { color: C.white, fontSize: 12, fontWeight: '600' },
  addBtn: { backgroundColor: C.accent, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  addBtnText: { color: C.primaryDark, fontSize: 12, fontWeight: '700' },

  filterWrap: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.inputBg },
  filterPillActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterPillText: { fontSize: 12, fontWeight: '500', color: C.textMuted },
  filterPillTextActive: { color: C.white },

  loader: { marginTop: 40 },
  list: { padding: 14, gap: 10, paddingBottom: 32 },

  card: { backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: `${C.primary}10`, alignItems: 'center', justifyContent: 'center' },
  cardIconText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  cardCategory: { fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 3 },
  cardVars: { fontSize: 11, color: C.textMuted, fontFamily: 'monospace' },
  cardActions: { flexDirection: 'column', borderLeftWidth: 1, borderLeftColor: C.border },
  cardActionBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  cardActionEdit: { fontSize: 14 },
  cardActionDup: { fontSize: 16, color: C.primary, fontWeight: '700' },
  cardActionDel: { fontSize: 13, color: C.error },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 13.5, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  starterBtn: { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  starterBtnText: { color: C.white, fontSize: 13, fontWeight: '600' },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.white },
  modalTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  modalClose: { fontSize: 18, color: C.textMuted },
  defaultCard: { backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', padding: 14, justifyContent: 'space-between', gap: 10 },
  defaultCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  defaultIcon: { fontSize: 24 },
  defaultInfo: { flex: 1 },
  defaultName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  defaultCategory: { fontSize: 12, color: C.textMuted },
  savedText: { fontSize: 13, color: C.success, fontWeight: '600' },
  saveBtn: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, minWidth: 60, alignItems: 'center' },
  saveBtnText: { color: C.white, fontSize: 13, fontWeight: '700' },
});
