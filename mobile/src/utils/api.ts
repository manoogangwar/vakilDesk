import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth';

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

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: try to silently refresh the access token, then retry the original request.
// If refresh fails, clear tokens so the root navigator redirects to login.
api.interceptors.response.use(
  (response) => response,
  async (error: { config?: { _retry?: boolean; headers?: Record<string, string> }; response?: { status?: number } }) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = await getRefreshToken();
        if (!refresh) throw new Error('no refresh token');
        const { data } = await axios.post<{ access: string; refresh?: string }>(
          `${BASE_URL}/token/refresh/`,
          { refresh },
        );
        await setTokens(data.access, data.refresh ?? refresh);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
        }
        return api(originalRequest as Parameters<typeof api>[0]);
      } catch {
        await clearTokens();
        // Tokens cleared — root navigator's useEffect will detect isAuthed=false and redirect to login
      }
    }
    return Promise.reject(error);
  },
);

export default api;
