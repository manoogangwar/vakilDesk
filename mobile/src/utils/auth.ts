import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAccessToken = () => AsyncStorage.getItem('access');
export const getRefreshToken = () => AsyncStorage.getItem('refresh');

export const setTokens = (access: string, refresh: string) =>
  AsyncStorage.multiSet([['access', access], ['refresh', refresh]]);

export const clearTokens = () => AsyncStorage.multiRemove(['access', 'refresh']);

export const isAuthenticated = async () => !!(await getAccessToken());

// atob is available globally in React Native 0.70+; handles base64url format
export const parseJwt = (token: string): Record<string, unknown> | null => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getUser = async () => {
  const token = await getAccessToken();
  return token ? parseJwt(token) : null;
};
