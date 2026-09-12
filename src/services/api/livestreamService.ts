import apiClient, { handleResponse } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import { requireArray, requireEnum, requireInteger, requireRecord, requireString } from './contract';

export const LIVESTREAM_STATUSES = ['CREATED', 'LIVE', 'ENDED'] as const;
export type LivestreamStatus = typeof LIVESTREAM_STATUSES[number];
export const LIVESTREAM_PROVIDERS = ['AGORA'] as const;
export type LivestreamProvider = typeof LIVESTREAM_PROVIDERS[number];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LivestreamProduct {
  id: number;
  livestreamId: string;
  productId: number;
  productName: string;
  productImage?: string | null;
  restaurantId: number;
  restaurantName: string;
  priceAtLive: number;
  isPinned: boolean;
  createdAt?: string;
  pinnedAt?: string | null;
}

export interface Livestream {
  id: string;
  sellerId?: number;
  restaurantId: number;
  title: string;
  description?: string | null;
  status: LivestreamStatus;
  streamProvider: LivestreamProvider;
  roomId?: string;
  channelName?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  pinnedProducts?: LivestreamProduct[];
}

export interface CreateLivestreamRequest {
  title: string;
  description?: string;
  restaurantId: number;
  streamProvider: 'AGORA';
}

export interface PinLivestreamProductRequest {
  productId: number;
  priceAtLive: number;
  /** Legacy client copies; backend validates and supplies canonical values. */
  productName?: string;
  productImage?: string;
  restaurantId?: number;
  restaurantName?: string;
}

export interface JoinLivestreamResponse {
  livestreamId: string;
  channelName: string;
  title: string;
  restaurantId: number;
  token: string;
  uid: number;
  tokenExpiresAt: string;
  sellerId?: number;
  startedAt?: string;
  currentViewers?: number;
}

export interface StartLivestreamResponse {
  livestreamId: string;
  channelName: string;
  status: 'LIVE';
  token: string;
  uid: number;
  role: 'HOST';
  tokenExpiresAt: string;
  title: string;
  restaurantId: number;
  startedAt: string;
}

const parse = (value: unknown, label: string): Livestream => {
  const row = requireRecord(value, label);
  const id = requireString(row.id, `${label}.id`);
  if (!uuid.test(id)) throw new Error(`${label}.id must be a UUID`);
  return { id, restaurantId: requireInteger(row.restaurantId, `${label}.restaurantId`, 1), title: requireString(row.title, `${label}.title`), status: requireEnum(row.status, LIVESTREAM_STATUSES, `${label}.status`), streamProvider: requireEnum(row.streamProvider, LIVESTREAM_PROVIDERS, `${label}.streamProvider`) };
};

export const livestreamHostService = {
  inspect: async (restaurantId: number): Promise<Livestream[]> => requireArray(handleResponse(await apiClient.get(API_ENDPOINTS.LIVESTREAM.INSPECT_RESTAURANT(restaurantId))), 'livestreams', parse),
  create: async (request: CreateLivestreamRequest): Promise<Livestream> => parse(handleResponse(await apiClient.post(API_ENDPOINTS.LIVESTREAM.CREATE, request)), 'livestream'),
  start: async (id: string): Promise<void> => { await apiClient.post(API_ENDPOINTS.LIVESTREAM.START(id)); },
  end: async (id: string): Promise<void> => { await apiClient.post(API_ENDPOINTS.LIVESTREAM.END(id)); },
};
