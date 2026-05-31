import * as DocumentPicker from 'expo-document-picker';
import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AlertBox } from './AlertBox';
import { FormInput } from './FormInput';
import { PrimaryButton } from './PrimaryButton';
import { C } from '@/constants/colors';
import api from '@/utils/api';
import { getAccessToken } from '@/utils/auth';

export type Doc = {
  id: number;
  title: string;
  doc_type: string;
  file_url: string | null;
  file_name: string;
  file_size: number;
  uploaded_by_name: string;
  uploaded_at: string;
};

const DOC_TYPE_OPTIONS = [
  { value: 'fir', label: 'FIR' },
  { value: 'chargesheet', label: 'Charge Sheet' },
  { value: 'bail', label: 'Bail Papers' },
  { value: 'vakalatnama', label: 'Vakalatnama' },
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'judgment', label: 'Judgment' },
  { value: 'order', label: 'Court Order' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'other', label: 'Other' },
];

const DOC_ICONS: Record<string, string> = {
  fir: '🚨', chargesheet: '📋', bail: '🔓', vakalatnama: '✍️',
  affidavit: '📜', judgment: '⚖️', order: '🏛', evidence: '🔍', other: '📄',
};

function formatSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

type Props = {
  caseId: string;
  docs: Doc[];
  onDocsChange: (docs: Doc[]) => void;
};

export function DocumentsSection({ caseId, docs, onDocsChange }: Props) {
  const [uploadVisible, setUploadVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('other');
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handlePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedFile(result.assets[0]);
      if (!title) setTitle(result.assets[0].name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!pickedFile) { setUploadError('Please select a file first.'); return; }
    if (!title.trim()) { setUploadError('Please enter a document title.'); return; }
    setUploadError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('doc_type', docType);
      form.append('file', {
        uri: pickedFile.uri,
        name: pickedFile.name,
        type: pickedFile.mimeType ?? 'application/octet-stream',
      } as unknown as Blob);

      const { data } = await api.post<Doc>(`/cases/${caseId}/documents/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onDocsChange([data, ...docs]);
      setUploadVisible(false);
      setTitle(''); setDocType('other'); setPickedFile(null);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = async (doc: Doc) => {
    if (!doc.file_url) { Alert.alert('Error', 'File URL not available.'); return; }
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) { Alert.alert('Not supported', 'File sharing is not available on this device.'); return; }
    setDownloadingId(doc.id);
    try {
      const token = await getAccessToken();
      const localUri = (cacheDirectory ?? '') + doc.file_name;
      const { uri } = await downloadAsync(doc.file_url, localUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: doc.title });
    } catch {
      Alert.alert('Error', 'Could not open file. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (doc: Doc) => {
    Alert.alert('Delete Document', `Remove "${doc.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/cases/${caseId}/documents/${doc.id}/`);
            onDocsChange(docs.filter(d => d.id !== doc.id));
          } catch {
            Alert.alert('Error', 'Failed to delete document.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Documents ({docs.length})</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => setUploadVisible(true)}>
          <Text style={styles.uploadBtnText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {docs.length === 0 ? (
        <Text style={styles.empty}>No documents uploaded yet.</Text>
      ) : (
        docs.map(doc => (
          <View key={doc.id} style={styles.docRow}>
            <Text style={styles.docIcon}>{DOC_ICONS[doc.doc_type] ?? '📄'}</Text>
            <View style={styles.docInfo}>
              <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
              <Text style={styles.docMeta}>
                {doc.doc_type.charAt(0).toUpperCase() + doc.doc_type.slice(1)}
                {doc.file_size ? ` · ${formatSize(doc.file_size)}` : ''}
                {` · ${formatDate(doc.uploaded_at)}`}
              </Text>
            </View>
            <View style={styles.docActions}>
              <TouchableOpacity onPress={() => handleOpen(doc)} style={styles.docActionBtn} disabled={downloadingId === doc.id}>
                {downloadingId === doc.id
                  ? <ActivityIndicator size="small" color={C.primary} />
                  : <Text style={styles.docOpenText}>Open</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(doc)} style={styles.docActionBtn}>
                <Text style={styles.docDeleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Upload Modal */}
      <Modal visible={uploadVisible} animationType="slide" transparent onRequestClose={() => setUploadVisible(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setUploadVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Upload Document</Text>

            {uploadError ? <AlertBox type="error" message={uploadError} /> : null}

            {/* File picker */}
            <TouchableOpacity style={styles.filePicker} onPress={handlePick}>
              {pickedFile ? (
                <>
                  <Text style={styles.filePickerIcon}>📎</Text>
                  <Text style={styles.filePickerName} numberOfLines={1}>{pickedFile.name}</Text>
                  <Text style={styles.filePickerChange}>Change</Text>
                </>
              ) : (
                <>
                  <Text style={styles.filePickerIcon}>📂</Text>
                  <Text style={styles.filePickerPlaceholder}>Tap to select a file (PDF, image, Word)</Text>
                </>
              )}
            </TouchableOpacity>

            <FormInput
              label="Document Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Bail Application"
            />

            {/* Doc type pills */}
            <Text style={styles.typeLabel}>Document Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              <View style={styles.typeRow}>
                {DOC_TYPE_OPTIONS.map(o => (
                  <TouchableOpacity
                    key={o.value}
                    style={[styles.typePill, docType === o.value && styles.typePillActive]}
                    onPress={() => setDocType(o.value)}
                  >
                    <Text style={[styles.typePillText, docType === o.value && styles.typePillTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <PrimaryButton title="Upload" onPress={handleUpload} loading={uploading} style={{ marginTop: 12 }} />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setUploadVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  uploadBtn: { backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  uploadBtnText: { color: C.white, fontSize: 12, fontWeight: '700' },
  empty: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 8 },

  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  docIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 13.5, fontWeight: '600', color: C.text },
  docMeta: { fontSize: 11.5, color: C.textMuted, marginTop: 2 },
  docActions: { flexDirection: 'row', gap: 6 },
  docActionBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  docOpenText: { fontSize: 12.5, color: C.primary, fontWeight: '600' },
  docDeleteText: { fontSize: 13, color: C.error },

  // Upload modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  overlayBg: { flex: 1 },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 16, textAlign: 'center' },

  filePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 10, padding: 14, marginBottom: 14,
  },
  filePickerIcon: { fontSize: 22 },
  filePickerPlaceholder: { flex: 1, fontSize: 13.5, color: C.textMuted },
  filePickerName: { flex: 1, fontSize: 13.5, color: C.text, fontWeight: '500' },
  filePickerChange: { fontSize: 12, color: C.primary, fontWeight: '600' },

  typeLabel: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 8 },
  typeScroll: { marginBottom: 4 },
  typeRow: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  typePill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.inputBg },
  typePillActive: { backgroundColor: C.primary, borderColor: C.primary },
  typePillText: { fontSize: 12.5, fontWeight: '500', color: C.textMuted },
  typePillTextActive: { color: C.white },

  cancelBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 14, color: C.textMuted },
});
