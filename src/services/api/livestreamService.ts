import apiClient, { handleResponse } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import {
  optionalString,
  optionalTimestamp,
  requireArray,
  requireBoolean,
  requireEnum,
  requireInteger,
  requireNumber,
  requireRecord,
  requireString,
  requireTimestamp,
} from './contract';

export const LIVESTREAM_STATUSES = ['CREATED', 'LIVE', 'ENDED'] as const;
export type LivestreamStatus = typeof LIVESTREAM_STATUSES[number];
export const LIVESTREAM_PROVIDERS = ['AGORA'] as const;
export type LivestreamProvider = typeof LIVESTREAM_PROVIDERS[number];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LivestreamProduct {
  id: number;
  livestreamId: string;
  productId: number;
  productName: string | null;
  productImage: string | null;
  restaurantId: number;
  restaurantName: string | null;
  priceAtLive: number;
  isPinned: boolean;
  createdAt: string;
  pinnedAt: string | null;
}

export interface LivestreamResponse {
  id: string;
  sellerId: number;
  restaurantId: number;
  title: string;
  description: string | null;
  status: LivestreamStatus;
  streamProvider: LivestreamProvider;
  roomId: string;
  channelName: string;
  startedAt: string | null;
  endedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  pinnedProducts: LivestreamProduct[];
}

/** Backwards-compatible name used by the host surfaces. */
export type Livestream = LivestreamResponse;

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
  sellerId: number;
  startedAt: string;
  currentViewers: number | null;
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

const parseUuid = (value: unknown, label: string): string => {
  const id = requireString(value, label);
  if (!uuid.test(id)) throw new Error(`${label} must be a UUID`);
  return id;
};

const requirePositiveNumber = (value: unknown, label: string): number => {
  const number = requireNumber(value, label, 0);
  if (number <= 0) throw new Error(`${label} must be greater than 0`);
  return number;
};

export const parseLivestreamProduct = (value: unknown, label = 'livestream product'): LivestreamProduct => {
  const row = requireRecord(value, label);
  return {
    id: requireInteger(row.id, `${label}.id`, 1),
    livestreamId: parseUuid(row.livestreamId, `${label}.livestreamId`),
    productId: requireInteger(row.productId, `${label}.productId`, 1),
    productName: optionalString(row.productName, `${label}.productName`),
    productImage: optionalString(row.productImage, `${label}.productImage`),
    restaurantId: requireInteger(row.restaurantId, `${label}.restaurantId`, 1),
    restaurantName: optionalString(row.restaurantName, `${label}.restaurantName`),
    priceAtLive: requirePositiveNumber(row.priceAtLive, `${label}.priceAtLive`),
    isPinned: requireBoolean(row.isPinned, `${label}.isPinned`),
    createdAt: requireTimestamp(row.createdAt, `${label}.createdAt`),
    pinnedAt: optionalTimestamp(row.pinnedAt, `${label}.pinnedAt`),
  };
};

export const parseLivestreamResponse = (value: unknown, label = 'livestream'): LivestreamResponse => {
  const row = requireRecord(value, label);
  return {
    id: parseUuid(row.id, `${label}.id`),
    sellerId: requireInteger(row.sellerId, `${label}.sellerId`, 1),
    restaurantId: requireInteger(row.restaurantId, `${label}.restaurantId`, 1),
    title: requireString(row.title, `${label}.title`),
    description: row.description === null || row.description === undefined
      ? null
      : requireString(row.description, `${label}.description`),
    status: requireEnum(row.status, LIVESTREAM_STATUSES, `${label}.status`),
    streamProvider: requireEnum(row.streamProvider, LIVESTREAM_PROVIDERS, `${label}.streamProvider`),
    roomId: requireString(row.roomId, `${label}.roomId`),
    channelName: requireString(row.channelName, `${label}.channelName`),
    startedAt: optionalTimestamp(row.startedAt, `${label}.startedAt`),
    endedAt: optionalTimestamp(row.endedAt, `${label}.endedAt`),
    viewCount: requireInteger(row.viewCount, `${label}.viewCount`),
    createdAt: requireTimestamp(row.createdAt, `${label}.createdAt`),
    updatedAt: requireTimestamp(row.updatedAt, `${label}.updatedAt`),
    pinnedProducts: requireArray(row.pinnedProducts, `${label}.pinnedProducts`, parseLivestreamProduct),
  };
};

const parseTokenFields = (value: unknown, label: string) => {
  const row = requireRecord(value, label);
  return {
    row,
    livestreamId: parseUuid(row.livestreamId, `${label}.livestreamId`),
    channelName: requireString(row.channelName, `${label}.channelName`),
    token: requireString(row.token, `${label}.token`),
    uid: requireInteger(row.uid, `${label}.uid`, 0),
    tokenExpiresAt: requireTimestamp(row.tokenExpiresAt, `${label}.tokenExpiresAt`),
    title: requireString(row.title, `${label}.title`),
    restaurantId: requireInteger(row.restaurantId, `${label}.restaurantId`, 1),
    startedAt: requireTimestamp(row.startedAt, `${label}.startedAt`),
  };
};

export const parseStartLivestreamResponse = (value: unknown, label = 'start livestream'): StartLivestreamResponse => {
  const fields = parseTokenFields(value, label);
  return {
    livestreamId: fields.livestreamId,
    channelName: fields.channelName,
    status: requireEnum(fields.row.status, ['LIVE'] as const, `${label}.status`),
    token: fields.token,
    uid: fields.uid,
    role: requireEnum(fields.row.role, ['HOST'] as const, `${label}.role`),
    tokenExpiresAt: fields.tokenExpiresAt,
    title: fields.title,
    restaurantId: fields.restaurantId,
    startedAt: fields.startedAt,
  };
};

export const parseJoinLivestreamResponse = (value: unknown, label = 'join livestream'): JoinLivestreamResponse => {
  const fields = parseTokenFields(value, label);
  return {
    livestreamId: fields.livestreamId,
    channelName: fields.channelName,
    title: fields.title,
    restaurantId: fields.restaurantId,
    token: fields.token,
    uid: fields.uid,
    tokenExpiresAt: fields.tokenExpiresAt,
    sellerId: requireInteger(fields.row.sellerId, `${label}.sellerId`, 1),
    startedAt: fields.startedAt,
    currentViewers: fields.row.currentViewers === undefined || fields.row.currentViewers === null
      ? null
      : requireInteger(fields.row.currentViewers, `${label}.currentViewers`),
  };
};

export const livestreamHostService = {
  inspect: async (restaurantId: number): Promise<LivestreamResponse[]> => requireArray(handleResponse(await apiClient.get(API_ENDPOINTS.LIVESTREAM.INSPECT_RESTAURANT(restaurantId))), 'livestreams', parseLivestreamResponse),
  getActive: async (): Promise<LivestreamResponse[]> => requireArray(handleResponse(await apiClient.get(API_ENDPOINTS.LIVESTREAM.ACTIVE)), 'active livestreams', parseLivestreamResponse),
  getById: async (id: string): Promise<LivestreamResponse> => parseLivestreamResponse(handleResponse(await apiClient.get(API_ENDPOINTS.LIVESTREAM.GET_BY_ID(id))), 'livestream'),
  create: async (request: CreateLivestreamRequest): Promise<LivestreamResponse> => parseLivestreamResponse(handleResponse(await apiClient.post(API_ENDPOINTS.LIVESTREAM.CREATE, request)), 'livestream'),
  start: async (id: string): Promise<StartLivestreamResponse> => parseStartLivestreamResponse(handleResponse(await apiClient.post(API_ENDPOINTS.LIVESTREAM.START(id))), 'start livestream'),
  join: async (id: string): Promise<JoinLivestreamResponse> => parseJoinLivestreamResponse(handleResponse(await apiClient.post(API_ENDPOINTS.LIVESTREAM.JOIN(id))), 'join livestream'),
  end: async (id: string): Promise<LivestreamResponse> => parseLivestreamResponse(handleResponse(await apiClient.post(API_ENDPOINTS.LIVESTREAM.END(id))), 'ended livestream'),
  pinProduct: async (id: string, request: PinLivestreamProductRequest): Promise<LivestreamProduct> => parseLivestreamProduct(handleResponse(await apiClient.post(API_ENDPOINTS.LIVESTREAM.PIN_PRODUCT(id), request)), 'livestream product'),
  unpinProduct: async (id: string, productId: number): Promise<void> => { handleResponse<void>(await apiClient.delete(API_ENDPOINTS.LIVESTREAM.UNPIN_PRODUCT(id, productId))); },
  listProducts: async (id: string): Promise<LivestreamProduct[]> => requireArray(handleResponse(await apiClient.get(API_ENDPOINTS.LIVESTREAM.PRODUCTS(id))), 'livestream products', parseLivestreamProduct),
  listPinnedProducts: async (id: string): Promise<LivestreamProduct[]> => requireArray(handleResponse(await apiClient.get(API_ENDPOINTS.LIVESTREAM.PINNED_PRODUCTS(id))), 'pinned livestream products', parseLivestreamProduct),
};
