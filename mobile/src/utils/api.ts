import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getAccessToken } from './auth';

function getBaseUrl(): string {
  // During development with Expo CLI, Constants.expoConfig.hostUri is the
  // dev machine's LAN address, e.g. "10.123.226.138:8081".
  // We extract the IP and point to Django on port 8000.
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    Constants.expoGoConfig?.hostUri ??
    (Constants.platform as { hostUri?: string } | undefined)?.hostUri;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000/api`;
  }

  // Fallback for Android emulator / iOS simulator
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api'
    : 'http://localhost:8000/api';
}

export const BASE_URL = getBaseUrl();

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
