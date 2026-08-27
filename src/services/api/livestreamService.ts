import apiClient, { handleResponse } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import { requireArray, requireEnum, requireInteger, requireRecord, requireString } from './contract';

const statuses = ['CREATED', 'LIVE', 'ENDED'] as const;
const providers = ['AGORA'] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface Livestream { id: string; restaurantId: number; title: string; status: typeof statuses[number]; streamProvider: 'AGORA'; }
export interface CreateLivestreamRequest { title: string; description?: string; restaurantId: number; streamProvider: 'AGORA'; }

const parse = (value: unknown, label: string): Livestream => {
  const row = requireRecord(value, label);
  const id = requireString(row.id, `${label}.id`);
  if (!uuid.test(id)) throw new Error(`${label}.id must be a UUID`);
  return { id, restaurantId: requireInteger(row.restaurantId, `${label}.restaurantId`, 1), title: requireString(row.title, `${label}.title`), status: requireEnum(row.status, statuses, `${label}.status`), streamProvider: requireEnum(row.streamProvider, providers, `${label}.streamProvider`) };
};

export const livestreamHostService = {
  inspect: async (restaurantId: number): Promise<Livestream[]> => requireArray(handleResponse(await apiClient.get(API_ENDPOINTS.LIVESTREAM.INSPECT_RESTAURANT(restaurantId))), 'livestreams', parse),
  create: async (request: CreateLivestreamRequest): Promise<Livestream> => parse(handleResponse(await apiClient.post(API_ENDPOINTS.LIVESTREAM.CREATE, request)), 'livestream'),
  start: async (id: string): Promise<void> => { await apiClient.post(API_ENDPOINTS.LIVESTREAM.START(id)); },
  end: async (id: string): Promise<void> => { await apiClient.post(API_ENDPOINTS.LIVESTREAM.END(id)); },
};
