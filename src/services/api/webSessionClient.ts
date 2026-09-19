import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL } from '@/utils/constants';

export interface WebSessionView {
  authenticated: boolean;
  principalId: number | null;
  email: string | null;
  role: string | null;
  sessionVersion: number;
  csrfToken: string | null;
}

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie.split(';').map(value => value.trim())
    .find(value => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
};

export const csrfToken = (): string | null => readCookie('XSRF-TOKEN');

export const createWebSessionClient = (baseURL = API_BASE_URL): AxiosInstance =>
  axios.create({ baseURL, withCredentials: true, timeout: 30_000 });

export const webSessionClient = createWebSessionClient();

export const loginWebSession = async (email: string, password: string, role: string): Promise<WebSessionView> =>
  (await webSessionClient.post<WebSessionView>('/bff/session/login', {
    email, password, role, deviceName: 'Delivery Web',
  })).data;

export const readWebSession = async (): Promise<WebSessionView> =>
  (await webSessionClient.get<WebSessionView>('/bff/session')).data;

export const refreshWebSession = async (): Promise<WebSessionView> =>
  (await webSessionClient.post<WebSessionView>('/bff/session/refresh', null, {
    headers: { 'X-CSRF-Token': csrfToken() ?? '' },
  })).data;

export const logoutWebSession = async (): Promise<void> => {
  await webSessionClient.post('/bff/session/logout', null, {
    headers: { 'X-CSRF-Token': csrfToken() ?? '' },
  });
};
