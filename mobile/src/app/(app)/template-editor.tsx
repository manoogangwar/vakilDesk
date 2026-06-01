import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBox } from '@/components/ui/AlertBox';
import { FormInput } from '@/components/ui/FormInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { C } from '@/constants/colors';
import { CATEGORIES } from '@/utils/defaultTemplates';
import { VARIABLE_GROUPS } from '@/utils/templateVariables';
import api from '@/utils/api';

type SelectionState = { start: number; end: number };

export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [content, setContent] = useState('');
  const [selection, setSelection] = useState<SelectionState>({ start: 0, end: 0 });
  const [activeGroup, setActiveGroup] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');

  const inputRef = useRef<TextInput>(null);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    setFetching(true);
    api.get(`/templates/${id}/`).then(({ data }) => {
      setName(data.name);
      setCategory(data.category);
      setContent(data.content);
    }).finally(() => setFetching(false));
  }, [id]));

  const insertVariable = useCallback((varKey: string) => {
    const placeholder = `{{${varKey}}}`;
    const before = content.slice(0, selection.start);
    const after = content.slice(selection.end);
    const newContent = before + placeholder + after;
    setContent(newContent);
    const newPos = selection.start + placeholder.length;
    setSelection({ start: newPos, end: newPos });
    // Re-focus the input
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [content, selection]);

  const insertNewline = useCallback(() => {
    const before = content.slice(0, selection.start);
    const after = content.slice(selection.end);
    const newContent = before + '\n\n' + after;
    setContent(newContent);
    const newPos = selection.start + 2;
    setSelection({ start: newPos, end: newPos });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [content, selection]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Template name is required.'); return; }
    if (!content.trim()) { setError('Template content cannot be empty.'); return; }
    setError('');
    setLoading(true);
    try {
      const payload = { name: name.trim(), category, content: content.trim() };
      if (isEdit) {
        await api.patch(`/templates/${id}/`, payload);
      } else {
        await api.post('/templates/', payload);
      }
      router.back();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg = d ? Object.values(d).flat()[0] : null;
      setError(msg ? String(msg) : 'Failed to save template.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Cancel</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Template' : 'New Template'}</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Cancel</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Template' : 'New Template'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error ? <AlertBox type="error" message={error} /> : null}

          <FormInput
            label="Template Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. General Affidavit"
            autoCapitalize="words"
          />

          {/* Category picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.categoryPill, category === cat.value && styles.categoryPillActive]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Text style={[styles.categoryPillText, category === cat.value && styles.categoryPillTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Content editor */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Template Content *</Text>
            <Text style={styles.fieldHint}>
              Use {'{{variable_name}}'} as placeholders. Tap variable chips below to insert at cursor.
            </Text>

            {/* Formatting toolbar */}
            <View style={styles.toolbar}>
              <TouchableOpacity style={styles.toolbarBtn} onPress={insertNewline}>
                <Text style={styles.toolbarBtnText}>¶ Para</Text>
              </TouchableOpacity>
              <View style={styles.toolbarDivider} />
              <Text style={styles.toolbarHint}>Variables:</Text>
              {VARIABLE_GROUPS.map((g, idx) => (
                <TouchableOpacity
                  key={g.label}
                  style={[styles.groupTab, activeGroup === idx && { borderBottomColor: g.color, borderBottomWidth: 2 }]}
                  onPress={() => setActiveGroup(idx)}
                >
                  <Text style={[styles.groupTabText, activeGroup === idx && { color: g.color }]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Variable chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.varScroll}>
              <View style={styles.varChips}>
                {VARIABLE_GROUPS[activeGroup].vars.map(v => (
                  <TouchableOpacity
                    key={v.key}
                    style={[styles.varChip, { borderColor: VARIABLE_GROUPS[activeGroup].color }]}
                    onPress={() => insertVariable(v.key)}
                  >
                    <Text style={[styles.varChipText, { color: VARIABLE_GROUPS[activeGroup].color }]}>
                      {`{{${v.key}}}`}
                    </Text>
                    {v.autoFill && <Text style={styles.autoFillDot}>●</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Main text area */}
            <TextInput
              ref={inputRef}
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              multiline
              placeholder={`Start writing your template here…\n\nExample:\nI, {{client_name}}, resident of {{client_address}}, hereby declare that…`}
              placeholderTextColor={C.textMuted}
              textAlignVertical="top"
              autoCapitalize="sentences"
              selection={selection}
              onSelectionChange={e => setSelection(e.nativeEvent.selection)}
            />

            <Text style={styles.charCount}>{content.length} characters · {content.split(/\{\{(\w+)\}\}/).filter((_, i) => i % 2 === 1 && !!content.match(/\{\{(\w+)\}\}/)?.[i / 2 - 0.5]).length} variables detected</Text>
          </View>

          <PrimaryButton title={isEdit ? 'Save Changes' : 'Create Template'} onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  scroll: { padding: 16, paddingBottom: 40 },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 6, letterSpacing: 0.2 },
  fieldHint: { fontSize: 11.5, color: C.textMuted, marginBottom: 8, lineHeight: 16 },
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.inputBg },
  categoryPillActive: { backgroundColor: C.primary, borderColor: C.primary },
  categoryPillText: { fontSize: 12, fontWeight: '500', color: C.textMuted },
  categoryPillTextActive: { color: C.white },

  toolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.white, borderWidth: 1, borderBottomWidth: 0, borderColor: C.border,
    borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
  },
  toolbarBtn: { backgroundColor: C.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  toolbarBtnText: { fontSize: 11.5, color: C.text, fontWeight: '600' },
  toolbarDivider: { width: 1, height: 20, backgroundColor: C.border, marginHorizontal: 4 },
  toolbarHint: { fontSize: 11, color: C.textMuted },
  groupTab: { paddingHorizontal: 8, paddingVertical: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  groupTabText: { fontSize: 11.5, fontWeight: '600', color: C.textMuted },

  varScroll: { backgroundColor: C.white, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border },
  varChips: { flexDirection: 'row', gap: 6, padding: 8 },
  varChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1.5, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', gap: 4 },
  varChipText: { fontSize: 11.5, fontWeight: '600', fontFamily: 'monospace' },
  autoFillDot: { fontSize: 7, color: C.success },

  contentInput: {
    minHeight: 320,
    backgroundColor: C.white,
    borderWidth: 1, borderTopWidth: 0, borderColor: C.border,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    padding: 14,
    fontSize: 14,
    color: C.text,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  charCount: { fontSize: 11, color: C.textMuted, marginTop: 4, textAlign: 'right' },
});
