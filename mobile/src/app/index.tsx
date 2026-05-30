import { Redirect } from 'expo-router';

// Root redirect — the _layout.tsx auth guard will override this
// with /(app)/dashboard if the user is already logged in.
export default function Index() {
  // cast needed until (auth)/login.tsx exists and Expo Router regenerates types
  return <Redirect href={'/(auth)/login' as never} />;
}
