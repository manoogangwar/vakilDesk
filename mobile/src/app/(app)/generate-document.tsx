import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { CATEGORY_LABELS } from '@/utils/defaultTemplates';
import {
  ALL_VARIABLES,
  buildAutoFillValues,
  contentToHTML,
  getVariableLabel,
  renderTemplate,
} from '@/utils/templateVariables';
import api from '@/utils/api';

type Template = {
  id: number;
  name: string;
  category: string;
  content: string;
  variables: string[];
};

type CaseOption = { id: number; case_name: string; case_number: string; court_name: string; court_type: string; judge_name: string; under_section: string; police_station: string; next_date: string | null };
type ClientOption = { id: number; first_name: string; last_name: string; email: string; phone: string; address: string };
type Profile = { first_name: string; last_name: string; email: string; phone: string; username: string };

export default function GenerateDocumentScreen() {
  const { template_id } = useLocalSearchParams<{ template_id: string }>();
  const router = useRouter();

  const [template, setTemplate] = useState<Template | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseOption | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Template>(`/templates/${template_id}/`),
      api.get<Profile>('/profile/'),
      api.get<CaseOption[]>('/cases/'),
      api.get<ClientOption[]>('/clients/'),
    ]).then(([tRes, pRes, cRes, clRes]) => {
      setTemplate(tRes.data);
      setProfile(pRes.data);
      setCases(cRes.data);
      setClients(clRes.data);
      // Initialize var values with empty strings
      const initial: Record<string, string> = {};
      tRes.data.variables.forEach(v => { initial[v] = ''; });
      setVarValues(initial);
      // Auto-fill with profile data
      const autoFilled = buildAutoFillValues(pRes.data, null, null);
      setVarValues(prev => {
        const merged = { ...prev };
        Object.entries(autoFilled).forEach(([k, v]) => { if (k in merged) merged[k] = v; });
        return merged;
      });
    }).catch(() => {
      setError('Failed to load template data.');
    }).finally(() => setLoading(false));
  }, [template_id]);

  // When case changes, auto-fill case + client variables
  useEffect(() => {
    if (!selectedCase) return;
    const autoFilled = buildAutoFillValues(
      profile,
      {
        case_name: selectedCase.case_name,
        case_number: selectedCase.case_number,
        court_name: selectedCase.court_name,
        court_type: selectedCase.court_type,
        judge_name: selectedCase.judge_name,
        under_section: selectedCase.under_section,
        police_station: selectedCase.police_station,
        next_date: selectedCase.next_date,
      },
      selectedClient ? {
        first_name: selectedClient.first_name,
        last_name: selectedClient.last_name,
        email: selectedClient.email,
        phone: selectedClient.phone,
        address: selectedClient.address,
      } : null,
    );
    setVarValues(prev => {
      const merged = { ...prev };
      if (template) {
        template.variables.forEach(v => {
          if (autoFilled[v] !== undefined) merged[v] = autoFilled[v];
        });
      }
      return merged;
    });
  }, [selectedCase, selectedClient, profile, template]);

  const handleGenerate = async () => {
    if (!template) return;
    setError('');
    // Check for unfilled required vars
    const unfilled = template.variables.filter(v => !varValues[v]?.trim());
    if (unfilled.length > 0) {
      Alert.alert(
        'Unfilled Variables',
        `The following variables are still empty:\n${unfilled.map(v => `• {{${v}}}`).join('\n')}\n\nContinue anyway?`,
        [
          { text: 'Fill Them', style: 'cancel' },
          { text: 'Continue', onPress: () => void doGenerate() },
        ]
      );
      return;
    }
    await doGenerate();
  };

  const doGenerate = async () => {
    if (!template) return;
    setGenerating(true);
    try {
      const rendered = renderTemplate(template.content, varValues);
      const categoryLabel = CATEGORY_LABELS[template.category] ?? template.category;
      const html = contentToHTML(rendered, template.name, categoryLabel);

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${template.name}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
      }
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const isAutoFilled = (key: string) => ALL_VARIABLES.find(v => v.key === key)?.autoFill === true;

  if (loading) {
    return <SafeAreaView style={styles.flex}><ActivityIndicator style={{ flex: 1 }} size="large" color={C.primary} /></SafeAreaView>;
  }
  if (!template) {
    return <SafeAreaView style={styles.flex}><AlertBox type="error" message={error || 'Template not found.'} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Generate Document</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error ? <AlertBox type="error" message={error} /> : null}

          {/* Template info */}
          <View style={styles.templateBadge}>
            <Text style={styles.templateBadgeIcon}>📄</Text>
            <View>
              <Text style={styles.templateBadgeName}>{template.name}</Text>
              <Text style={styles.templateBadgeCat}>{CATEGORY_LABELS[template.category]}</Text>
            </View>
          </View>

          {/* Case selector */}
          <View style={styles.selectorGroup}>
            <Text style={styles.selectorLabel}>Link to a Case (auto-fills variables)</Text>
            <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowCasePicker(v => !v)}>
              <Text style={selectedCase ? styles.selectorText : styles.selectorPlaceholder} numberOfLines={1}>
                {selectedCase ? `${selectedCase.case_name}${selectedCase.case_number ? ` #${selectedCase.case_number}` : ''}` : 'Select a case (optional)…'}
              </Text>
              <Text style={styles.selectorChevron}>{showCasePicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showCasePicker && (
              <View style={styles.dropDown}>
                <TouchableOpacity style={styles.dropDownOption} onPress={() => { setSelectedCase(null); setShowCasePicker(false); }}>
                  <Text style={styles.dropDownOptionText}>— None —</Text>
                </TouchableOpacity>
                {cases.map(c => (
                  <TouchableOpacity key={c.id} style={[styles.dropDownOption, selectedCase?.id === c.id && styles.dropDownOptionActive]}
                    onPress={() => { setSelectedCase(c); setShowCasePicker(false); }}>
                    <Text style={[styles.dropDownOptionText, selectedCase?.id === c.id && styles.dropDownOptionTextActive]} numberOfLines={1}>
                      {c.case_name}{c.case_number ? ` — #${c.case_number}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Client selector */}
          <View style={styles.selectorGroup}>
            <Text style={styles.selectorLabel}>Link to a Client (auto-fills client variables)</Text>
            <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowClientPicker(v => !v)}>
              <Text style={selectedClient ? styles.selectorText : styles.selectorPlaceholder} numberOfLines={1}>
                {selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}`.trim() || selectedClient.email : 'Select a client (optional)…'}
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
              </View>
            )}
          </View>

          {/* Variable fields */}
          {template.variables.length > 0 && (
            <View style={styles.varsSection}>
              <Text style={styles.varsSectionTitle}>
                Fill Variables ({template.variables.filter(v => varValues[v]?.trim()).length}/{template.variables.length} filled)
              </Text>
              <Text style={styles.varsSectionHint}>● auto-filled from case/profile · blank will show [variable_name] in PDF</Text>
              {template.variables.map(v => (
                <View key={v} style={styles.varField}>
                  <View style={styles.varFieldHeader}>
                    <Text style={styles.varFieldLabel}>{getVariableLabel(v)}</Text>
                    <Text style={styles.varFieldKey}>{`{{${v}}}`}</Text>
                    {isAutoFilled(v) && varValues[v] && <Text style={styles.autoFillBadge}>● auto</Text>}
                  </View>
                  <TextInput
                    style={[styles.varInput, varValues[v]?.trim() ? styles.varInputFilled : null]}
                    value={varValues[v] ?? ''}
                    onChangeText={text => setVarValues(prev => ({ ...prev, [v]: text }))}
                    placeholder={`Enter ${getVariableLabel(v).toLowerCase()}…`}
                    placeholderTextColor={C.textMuted}
                    multiline={v === 'client_address' || v === 'property_description' || v === 'reason'}
                    numberOfLines={v === 'client_address' || v === 'property_description' ? 2 : 1}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Generate button */}
          <TouchableOpacity
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating
              ? <ActivityIndicator color={C.white} />
              : <Text style={styles.generateBtnText}>📄 Generate PDF & Share</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.white, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },

  templateBadge: { backgroundColor: C.primary, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  templateBadgeIcon: { fontSize: 28 },
  templateBadgeName: { fontSize: 15, fontWeight: '700', color: C.white },
  templateBadgeCat: { fontSize: 12, color: C.accent, marginTop: 2 },

  selectorGroup: { gap: 6 },
  selectorLabel: { fontSize: 12, fontWeight: '600', color: C.text },
  selectorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 11 },
  selectorText: { flex: 1, fontSize: 14, color: C.text },
  selectorPlaceholder: { flex: 1, fontSize: 14, color: '#c0c7d3' },
  selectorChevron: { fontSize: 11, color: C.textMuted },
  dropDown: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, borderRadius: 8, maxHeight: 180, overflow: 'hidden' },
  dropDownOption: { paddingHorizontal: 13, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  dropDownOptionActive: { backgroundColor: `${C.primary}12` },
  dropDownOptionText: { fontSize: 13.5, color: C.text },
  dropDownOptionTextActive: { color: C.primary, fontWeight: '600' },

  varsSection: { gap: 10 },
  varsSectionTitle: { fontSize: 13.5, fontWeight: '700', color: C.text },
  varsSectionHint: { fontSize: 11.5, color: C.textMuted },
  varField: { backgroundColor: C.white, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border },
  varFieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  varFieldLabel: { fontSize: 12.5, fontWeight: '600', color: C.text },
  varFieldKey: { fontSize: 11, color: C.textMuted, fontFamily: 'monospace' },
  autoFillBadge: { fontSize: 10.5, color: C.success, fontWeight: '600' },
  varInput: { backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border, borderRadius: 7, paddingHorizontal: 11, paddingVertical: 9, fontSize: 14, color: C.text },
  varInputFilled: { borderColor: C.success, backgroundColor: `${C.success}06` },

  generateBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: C.white },
});
