import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { C } from '@/constants/colors';
import api from '@/utils/api';
import {
  AutoFillSource,
  DOC_FORM_MAP,
  DocField,
} from '@/utils/documentForms';
import {
  buildDocumentHTML,
  getSignatureUri as loadSignatureUri,
  getStampUri as loadStampUri,
  imageToDataUri,
  renderDocument,
  setSignatureUri as saveSignatureUri,
  setStampUri as saveStampUri,
} from '@/utils/documentPdf';
import { buildAutoFillValues } from '@/utils/templateVariables';

type CaseOption = {
  id: number; case_name: string; case_number: string;
};
type ClientOption = {
  id: number; first_name: string; last_name: string; email: string; phone: string; address: string;
};
type Profile = { first_name: string; last_name: string; email: string; phone: string; username: string };

const SERIF = Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'serif' });

export default function DocumentFormScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const def = type ? DOC_FORM_MAP[type] : undefined;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [stampUri, setStampUri] = useState<string | null>(null);
  const [includeSignature, setIncludeSignature] = useState(false);
  const [includeStamp, setIncludeStamp] = useState(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'save' | 'share' | 'preview' | null>(null);
  const [error, setError] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);

  // ── Initial load ──
  useEffect(() => {
    if (!def) { setLoading(false); return; }
    // Seed defaults
    const seed: Record<string, string> = {};
    def.fields.forEach(f => { seed[f.key] = f.default ?? ''; });
    setFieldValues(seed);

    Promise.all([
      api.get<Profile>('/profile/'),
      api.get<ClientOption[]>('/clients/'),
    ]).then(([pRes, clRes]) => {
      setProfile(pRes.data);
      setClients(clRes.data);
    }).catch(() => {
      setError('Failed to load data. Check your connection.');
    }).finally(() => setLoading(false));

    void loadSignatureUri().then(uri => { if (uri) { setSignatureUri(uri); setIncludeSignature(true); } });
    void loadStampUri().then(uri => { if (uri) { setStampUri(uri); setIncludeStamp(true); } });
  }, [def]);

  const resolveAutoFill = (src: AutoFillSource): string => {
    switch (src) {
      case 'client_name': return selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}`.trim() : '';
      case 'client_address': return selectedClient?.address ?? '';
      case 'client_phone': return selectedClient?.phone ?? '';
      case 'client_email': return selectedClient?.email ?? '';
      case 'lawyer_name': return profile ? (`${profile.first_name} ${profile.last_name}`.trim() || profile.username) : '';
      case 'lawyer_phone': return profile?.phone ?? '';
      case 'lawyer_email': return profile?.email ?? '';
      default: return '';
    }
  };

  // When the client (or profile) changes, refresh auto-filled fields.
  useEffect(() => {
    if (!def) return;
    setFieldValues(prev => {
      const next = { ...prev };
      def.fields.forEach(f => {
        if (!f.autoFill) return;
        const val = resolveAutoFill(f.autoFill);
        if (val) next[f.key] = val;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient, profile]);

  // ── Rendered document body (live) ──
  const renderedBody = useMemo(() => {
    if (!def) return '';
    const injected = buildAutoFillValues(profile, null, null); // dates + lawyer details
    const merged = { ...injected, ...fieldValues };
    return renderDocument(def.content, merged);
  }, [def, profile, fieldValues]);

  const clientName = selectedClient
    ? (`${selectedClient.first_name} ${selectedClient.last_name}`.trim() || selectedClient.email)
    : '';

  const setField = (key: string, val: string) =>
    setFieldValues(prev => ({ ...prev, [key]: val }));

  // ── Signature / stamp ──
  const pickImage = async (kind: 'signature' | 'stamp') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add a signature or stamp.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      const uri = res.assets[0].uri;
      if (kind === 'signature') { setSignatureUri(uri); setIncludeSignature(true); await saveSignatureUri(uri); }
      else { setStampUri(uri); setIncludeStamp(true); await saveStampUri(uri); }
    }
  };

  const removeImage = async (kind: 'signature' | 'stamp') => {
    if (kind === 'signature') { setSignatureUri(null); setIncludeSignature(false); await saveSignatureUri(null); }
    else { setStampUri(null); setIncludeStamp(false); await saveStampUri(null); }
  };

  // ── PDF building ──
  const buildHtml = async (): Promise<string> => {
    const sig = includeSignature && signatureUri ? await imageToDataUri(signatureUri) : null;
    const stamp = includeStamp && stampUri ? await imageToDataUri(stampUri) : null;
    return buildDocumentHTML({
      title: def!.title,
      category: '',
      body: renderedBody,
      signatureDataUri: sig,
      stampDataUri: stamp,
    });
  };

  const makePdfFile = async (): Promise<string> => {
    const html = await buildHtml();
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    return uri;
  };

  // Validate required fields, then run `action`. Missing fields prompt to continue.
  const withValidation = (action: () => void | Promise<void>) => {
    if (!def) return;
    const missing = def.fields.filter(f => f.required && !fieldValues[f.key]?.trim());
    if (missing.length > 0) {
      Alert.alert(
        'Some fields are empty',
        `The following are still blank:\n${missing.map(f => `• ${f.label}`).join('\n')}\n\nGenerate anyway?`,
        [
          { text: 'Fill them', style: 'cancel' },
          { text: 'Generate', onPress: () => void action() },
        ],
      );
      return;
    }
    void action();
  };

  const handlePreviewPdf = () => withValidation(async () => {
    setError(''); setBusy('preview');
    try {
      const html = await buildHtml();
      await Print.printAsync({ html });
    } catch {
      setError('Could not open the PDF preview.');
    } finally { setBusy(null); }
  });

  const handleShare = () => withValidation(async () => {
    setError(''); setBusy('share');
    try {
      const uri = await makePdfFile();
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) { Alert.alert('Sharing unavailable', 'Sharing is not supported on this device.'); return; }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${def!.label} — choose WhatsApp`,
        UTI: 'com.adobe.pdf',
      });
    } catch {
      setError('Failed to generate the document for sharing.');
    } finally { setBusy(null); }
  });

  const handleSaveToClient = () => {
    if (!selectedClient) {
      Alert.alert('Select a client', 'Choose a client above to save this document to their records.');
      return;
    }
    withValidation(async () => {
      setError(''); setBusy('save');
      try {
        const uri = await makePdfFile();
        const form = new FormData();
        form.append('title', `${def!.label} — ${clientName}`);
        form.append('doc_type', 'other');
        form.append('doc_category', def!.key);
        form.append('source', 'generated');
        form.append('file', {
          uri,
          name: `${def!.key}_${Date.now()}.pdf`,
          type: 'application/pdf',
        } as unknown as Blob);
        await api.post(`/clients/${selectedClient.id}/documents/`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Saved', `Document saved to ${clientName}'s records.`, [
          { text: 'Done' },
          { text: 'View client', onPress: () => router.push({ pathname: '/(app)/client-detail', params: { id: selectedClient.id } }) },
        ]);
      } catch {
        setError('Failed to save the document to the client.');
      } finally { setBusy(null); }
    });
  };

  if (!def) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Document</Text>
          <View style={{ width: 50 }} />
        </View>
        <AlertBox type="error" message="Unknown document type." />
      </SafeAreaView>
    );
  }

  if (loading) {
    return <SafeAreaView style={styles.flex}><ActivityIndicator style={{ flex: 1 }} size="large" color={C.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{def.label}</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error ? <AlertBox type="error" message={error} /> : null}

          {/* Doc badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>{def.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.badgeName}>{def.title}</Text>
              <Text style={styles.badgeDesc}>{def.description}</Text>
            </View>
          </View>

          {/* Client selector */}
          <View style={styles.selectorGroup}>
            <Text style={styles.selectorLabel}>Client (auto-fills the form)</Text>
            <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowClientPicker(v => !v)}>
              <Text style={selectedClient ? styles.selectorText : styles.selectorPlaceholder} numberOfLines={1}>
                {selectedClient ? clientName : 'Select a client (optional)…'}
              </Text>
              <Text style={styles.selectorChevron}>{showClientPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showClientPicker && (
              <View style={styles.dropDown}>
                <TouchableOpacity style={styles.dropDownOption} onPress={() => { setSelectedClient(null); setShowClientPicker(false); }}>
                  <Text style={styles.dropDownOptionText}>— None —</Text>
                </TouchableOpacity>
                {clients.map(c => (
                  <TouchableOpacity key={c.id} style={[styles.dropDownOption, selectedClient?.id === c.id && styles.dropDownOptionActive]}
                    onPress={() => { setSelectedClient(c); setShowClientPicker(false); }}>
                    <Text style={[styles.dropDownOptionText, selectedClient?.id === c.id && styles.dropDownOptionTextActive]} numberOfLines={1}>
                      {`${c.first_name} ${c.last_name}`.trim() || c.email}
                    </Text>
                  </TouchableOpacity>
                ))}
                {clients.length === 0 && <Text style={styles.dropDownEmpty}>No clients yet. Add one from the dashboard.</Text>}
              </View>
            )}
          </View>

          {/* Form fields */}
          <View style={styles.fieldsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            {def.fields.map(f => (
              <FieldInput
                key={f.key}
                field={f}
                value={fieldValues[f.key] ?? ''}
                autoFilled={!!f.autoFill && !!fieldValues[f.key]?.trim() && !!selectedClient}
                onChange={t => setField(f.key, t)}
              />
            ))}
          </View>

          {/* Signature & stamp */}
          <View style={styles.fieldsSection}>
            <Text style={styles.sectionTitle}>Signature & Stamp</Text>
            <Text style={styles.sectionHint}>Picked images are saved and reused on every document. Toggle to include them.</Text>
            <View style={styles.signRow}>
              <ImageTile
                label="Signature"
                uri={signatureUri}
                included={includeSignature}
                onPick={() => pickImage('signature')}
                onToggle={() => { if (signatureUri) setIncludeSignature(v => !v); }}
                onRemove={() => removeImage('signature')}
              />
              <ImageTile
                label="Stamp / Seal"
                uri={stampUri}
                included={includeStamp}
                onPick={() => pickImage('stamp')}
                onToggle={() => { if (stampUri) setIncludeStamp(v => !v); }}
                onRemove={() => removeImage('stamp')}
              />
            </View>
          </View>

          {/* A4 Preview */}
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.pageWrap}>
            <View style={styles.page}>
              <Text style={styles.pageTitle}>{def.title.toUpperCase()}</Text>
              <View style={styles.pageDivider} />
              <Text style={styles.pageBody}>{renderedBody}</Text>
              {(includeSignature && signatureUri) || (includeStamp && stampUri) ? (
                <View style={styles.pageSignRow}>
                  {includeStamp && stampUri ? (
                    <View style={styles.pageSignCell}>
                      <Image source={{ uri: stampUri }} style={styles.pageStampImg} resizeMode="contain" />
                      <Text style={styles.pageSignCaption}>Seal / Stamp</Text>
                    </View>
                  ) : null}
                  {includeSignature && signatureUri ? (
                    <View style={styles.pageSignCell}>
                      <Image source={{ uri: signatureUri }} style={styles.pageSignImg} resizeMode="contain" />
                      <Text style={styles.pageSignCaption}>Signature</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionSecondary]} onPress={handlePreviewPdf} disabled={busy !== null}>
              {busy === 'preview' ? <ActivityIndicator color={C.primary} /> : <Text style={styles.actionSecondaryText}>🖨  Preview PDF (A4)</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={handleSaveToClient} disabled={busy !== null}>
              {busy === 'save' ? <ActivityIndicator color={C.white} /> : <Text style={styles.actionPrimaryText}>💾  Save to Client Documents</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.actionWhatsapp]} onPress={handleShare} disabled={busy !== null}>
              {busy === 'share' ? <ActivityIndicator color={C.white} /> : <Text style={styles.actionPrimaryText}>📲  Share / WhatsApp</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Field input ──
function FieldInput({ field, value, autoFilled, onChange }: {
  field: DocField; value: string; autoFilled: boolean; onChange: (t: string) => void;
}) {
  const multiline = field.type === 'textarea';
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>
          {field.label}{field.required ? <Text style={styles.req}> *</Text> : null}
        </Text>
        {autoFilled ? <Text style={styles.autoBadge}>● auto</Text> : null}
      </View>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, value.trim() ? styles.inputFilled : null]}
        value={value}
        onChangeText={onChange}
        placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`}
        placeholderTextColor="#c0c7d3"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={field.type === 'number' ? 'numeric' : 'default'}
      />
      {field.hint ? <Text style={styles.fieldHint}>{field.hint}</Text> : null}
    </View>
  );
}

// ── Signature / stamp tile ──
function ImageTile({ label, uri, included, onPick, onToggle, onRemove }: {
  label: string; uri: string | null; included: boolean;
  onPick: () => void; onToggle: () => void; onRemove: () => void;
}) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <TouchableOpacity style={styles.tileImageWrap} onPress={onPick} activeOpacity={0.7}>
        {uri ? (
          <Image source={{ uri }} style={styles.tileImage} resizeMode="contain" />
        ) : (
          <Text style={styles.tilePlaceholder}>＋ Add image</Text>
        )}
      </TouchableOpacity>
      {uri ? (
        <View style={styles.tileActions}>
          <TouchableOpacity onPress={onToggle} style={styles.tileToggle}>
            <Text style={[styles.tileToggleBox, included && styles.tileToggleBoxOn]}>{included ? '✓' : ''}</Text>
            <Text style={styles.tileToggleText}>Include</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove}><Text style={styles.tileRemove}>Remove</Text></TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.white, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 48, gap: 16 },

  badge: { backgroundColor: C.primary, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  badgeIcon: { fontSize: 30 },
  badgeName: { fontSize: 15, fontWeight: '700', color: C.white },
  badgeDesc: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  selectorGroup: { gap: 6 },
  selectorLabel: { fontSize: 12, fontWeight: '600', color: C.text },
  selectorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 11 },
  selectorText: { flex: 1, fontSize: 14, color: C.text },
  selectorPlaceholder: { flex: 1, fontSize: 14, color: '#c0c7d3' },
  selectorChevron: { fontSize: 11, color: C.textMuted },
  dropDown: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, borderRadius: 8, maxHeight: 200, overflow: 'hidden' },
  dropDownOption: { paddingHorizontal: 13, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  dropDownOptionActive: { backgroundColor: `${C.primary}12` },
  dropDownOptionText: { fontSize: 13.5, color: C.text },
  dropDownOptionTextActive: { color: C.primary, fontWeight: '600' },
  dropDownEmpty: { padding: 13, fontSize: 12.5, color: C.textMuted },

  fieldsSection: { gap: 10 },
  sectionTitle: { fontSize: 13.5, fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHint: { fontSize: 11.5, color: C.textMuted, marginTop: -4 },

  field: { gap: 6 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: C.text },
  req: { color: C.error },
  autoBadge: { fontSize: 10.5, color: C.success, fontWeight: '600' },
  input: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },
  inputMultiline: { minHeight: 84, textAlignVertical: 'top' },
  inputFilled: { borderColor: C.success, backgroundColor: `${C.success}06` },
  fieldHint: { fontSize: 11, color: C.textMuted },

  // Signature tiles
  signRow: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, gap: 8 },
  tileLabel: { fontSize: 12, fontWeight: '600', color: C.text },
  tileImageWrap: { height: 70, borderRadius: 8, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: C.inputBg },
  tileImage: { width: '100%', height: '100%' },
  tilePlaceholder: { fontSize: 12.5, color: C.textMuted },
  tileActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileToggleBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: C.border, textAlign: 'center', lineHeight: 16, color: C.white, fontSize: 12, overflow: 'hidden' },
  tileToggleBoxOn: { backgroundColor: C.success, borderColor: C.success },
  tileToggleText: { fontSize: 12, color: C.text },
  tileRemove: { fontSize: 12, color: C.error, fontWeight: '600' },

  // A4 preview
  pageWrap: { backgroundColor: '#dcdcdc', borderRadius: 8, padding: 12, alignItems: 'center' },
  page: { width: '100%', backgroundColor: C.white, paddingHorizontal: 22, paddingVertical: 26, borderRadius: 2, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  pageTitle: { fontFamily: SERIF, fontSize: 15, fontWeight: '700', textAlign: 'center', letterSpacing: 1.5, color: '#000' },
  pageDivider: { borderBottomWidth: 1.5, borderBottomColor: '#000', marginTop: 8, marginBottom: 14 },
  pageBody: { fontFamily: SERIF, fontSize: 12, lineHeight: 20, color: '#000', textAlign: 'justify' },
  pageSignRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 28, marginTop: 28, alignItems: 'flex-end' },
  pageSignCell: { alignItems: 'center' },
  pageSignImg: { width: 110, height: 50 },
  pageStampImg: { width: 80, height: 64 },
  pageSignCaption: { fontFamily: SERIF, fontSize: 10, color: '#000', borderTopWidth: 1, borderTopColor: '#000', paddingTop: 3, marginTop: 3, minWidth: 90, textAlign: 'center' },

  // Actions
  actions: { gap: 10, marginTop: 4 },
  actionBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  actionPrimary: { backgroundColor: C.primary },
  actionPrimaryText: { fontSize: 15, fontWeight: '700', color: C.white },
  actionSecondary: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.primary },
  actionSecondaryText: { fontSize: 15, fontWeight: '700', color: C.primary },
  actionWhatsapp: { backgroundColor: '#25D366' },
});
