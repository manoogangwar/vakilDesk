import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { C } from '@/constants/colors';

function RootNavigator() {
  const { isAuthed } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAuthed === null) return; // AsyncStorage not yet resolved

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthed && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthed && inAuthGroup) {
      router.replace('/(app)/dashboard');
    }
  }, [isAuthed, segments]);

  if (isAuthed === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
