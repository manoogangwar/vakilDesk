import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBox } from '@/components/ui/AlertBox';
import { Avatar } from '@/components/ui/Avatar';
import { FormInput } from '@/components/ui/FormInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { C } from '@/constants/colors';
import api from '@/utils/api';

type Profile = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
};

function getInitials(p: Profile) {
  return (
    ((p.first_name?.[0] ?? '') + (p.last_name?.[0] ?? '')).toUpperCase() ||
    (p.username?.[0] ?? '?').toUpperCase()
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    api.get<Profile>('/profile/').then(({ data }) => {
      setProfile(data);
      setForm({ first_name: data.first_name, last_name: data.last_name, phone: data.phone });
    });
    AsyncStorage.getItem('profile_picture').then(uri => {
      if (uri) setProfilePic(uri);
    });
  }, []));

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

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.patch('/profile/', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
      });
      setSuccess('Profile updated successfully.');
      setTimeout(() => router.back(), 1400);
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg = d ? Object.values(d).flat()[0] : null;
      setError(msg ? String(msg) : 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof typeof form) => (v: string) =>
    setForm(f => ({ ...f, [field]: v }));

  return (
    <SafeAreaView style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatarImg} />
              ) : (
                <Avatar initials={profile ? getInitials(profile) : '?'} size={90} />
              )}
              {/* Camera badge */}
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraEmoji}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change profile picture</Text>
          </View>

          {/* Read-only info */}
          {profile && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>@{profile.username}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>
            </View>
          )}

          {error ? <AlertBox type="error" message={error} /> : null}
          {success ? <AlertBox type="success" message={success} /> : null}

          <FormInput
            label="First Name"
            value={form.first_name}
            onChangeText={set('first_name')}
            placeholder="First name"
            autoCapitalize="words"
          />
          <FormInput
            label="Last Name"
            value={form.last_name}
            onChangeText={set('last_name')}
            placeholder="Last name"
            autoCapitalize="words"
          />
          <FormInput
            label="Phone"
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="+91 00000 00000"
            keyboardType="phone-pad"
          />

          <PrimaryButton
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { padding: 20, paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrap: { position: 'relative', width: 90, height: 90, marginBottom: 8 },
  avatarImg: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: C.accent,
  },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.white,
  },
  cameraEmoji: { fontSize: 15 },
  avatarHint: { fontSize: 12, color: C.textMuted },

  // Read-only info
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  infoItem: {
    flex: 1, backgroundColor: C.white,
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  infoLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600', marginBottom: 3 },
  infoValue: { fontSize: 13, color: C.text, fontWeight: '500' },
});
