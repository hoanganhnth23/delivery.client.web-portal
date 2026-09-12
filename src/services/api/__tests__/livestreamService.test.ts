import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient, { handleResponse } from '../apiClient';
import { livestreamHostService } from '../livestreamService';

vi.mock('../apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  handleResponse: vi.fn((response: { data: unknown }) =>
    (response.data as { data: unknown }).data),
}));

const client = vi.mocked(apiClient);
const response = (data: unknown) => ({ data: { status: 1, message: null, data } });
const stream = {
  id: '00000000-0000-4000-8000-000000000001',
  sellerId: 7,
  restaurantId: 42,
  title: 'Friday kitchen',
  description: null,
  status: 'CREATED',
  streamProvider: 'AGORA',
  roomId: '00000000-0000-4000-8000-000000000002',
  channelName: 'livestream-42-1726120000',
  startedAt: null,
  endedAt: null,
  viewCount: 0,
  createdAt: '2026-09-12T10:00:00Z',
  updatedAt: '2026-09-12T10:00:00Z',
  pinnedProducts: [],
};
const started = {
  livestreamId: stream.id,
  channelName: stream.channelName,
  status: 'LIVE' as const,
  token: 'host-token',
  uid: 7,
  role: 'HOST' as const,
  tokenExpiresAt: '2026-09-12T12:00:00Z',
  title: stream.title,
  restaurantId: stream.restaurantId,
  startedAt: '2026-09-12T11:00:00Z',
};
const ended = { ...stream, status: 'ENDED' as const, endedAt: '2026-09-12T12:30:00Z' };
const product = {
  id: 9,
  livestreamId: stream.id,
  productId: 9001,
  productName: 'Phở bò',
  productImage: null,
  restaurantId: 42,
  restaurantName: 'Friday kitchen',
  priceAtLive: 99000,
  isPinned: true,
  createdAt: '2026-09-12T10:05:00Z',
  pinnedAt: '2026-09-12T10:06:00Z',
};

describe('livestream host Gateway adapter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses exact inspect/create/start/end Gateway routes', async () => {
    client.get.mockResolvedValue(response([stream]) as never);
    client.post
      .mockResolvedValueOnce(response(stream) as never)
      .mockResolvedValueOnce(response(started) as never)
      .mockResolvedValueOnce(response(ended) as never);

    await expect(livestreamHostService.inspect(42)).resolves.toEqual([stream]);
    await expect(livestreamHostService.create({
      restaurantId: 42,
      title: 'Friday kitchen',
      streamProvider: 'AGORA',
    })).resolves.toEqual(stream);
    await expect(livestreamHostService.start(stream.id)).resolves.toEqual(started);
    await expect(livestreamHostService.end(stream.id)).resolves.toEqual(ended);

    expect(client.get).toHaveBeenCalledWith('/api/livestreams/restaurant/42');
    expect(client.post).toHaveBeenNthCalledWith(1, '/api/livestreams', {
      restaurantId: 42,
      title: 'Friday kitchen',
      streamProvider: 'AGORA',
    });
    expect(client.post).toHaveBeenNthCalledWith(2, `/api/livestreams/${stream.id}/start`);
    expect(client.post).toHaveBeenNthCalledWith(3, `/api/livestreams/${stream.id}/end`);
  });

  it('rejects malformed UUID/status/provider responses', async () => {
    client.get.mockResolvedValue(response([{
      ...stream,
      id: 'not-a-uuid',
    }]) as never);

    await expect(livestreamHostService.inspect(42)).rejects.toThrow('UUID');
    expect(handleResponse).toHaveBeenCalled();
  });

  it('rejects incomplete full livestream responses', async () => {
    client.get.mockResolvedValue(response([{ ...stream, channelName: undefined }]) as never);

    await expect(livestreamHostService.inspect(42)).rejects.toThrow('channelName');
  });

  it('reads the active livestream collection through the viewer route', async () => {
    client.get.mockResolvedValue(response([stream]) as never);

    await expect(livestreamHostService.getActive()).resolves.toEqual([stream]);
    expect(client.get).toHaveBeenCalledWith('/api/livestreams/active');
  });

  it('preserves host/viewer tokens and pinned product fields', async () => {
    client.post
      .mockResolvedValueOnce(response(started) as never)
      .mockResolvedValueOnce(response({
        livestreamId: stream.id,
        channelName: stream.channelName,
        title: stream.title,
        restaurantId: stream.restaurantId,
        token: 'viewer-token',
        uid: 123,
        tokenExpiresAt: '2026-09-12T12:00:00Z',
        sellerId: stream.sellerId,
        startedAt: '2026-09-12T11:00:00Z',
        currentViewers: 4,
      }) as never)
      .mockResolvedValueOnce(response(product) as never);
    client.get
      .mockResolvedValueOnce(response({ ...stream, pinnedProducts: [product] }) as never)
      .mockResolvedValueOnce(response([product]) as never)
      .mockResolvedValueOnce(response([product]) as never);
    client.delete.mockResolvedValue(response(null) as never);

    await expect(livestreamHostService.start(stream.id)).resolves.toMatchObject({ token: 'host-token', uid: 7 });
    await expect(livestreamHostService.join(stream.id)).resolves.toMatchObject({ token: 'viewer-token', uid: 123 });
    await expect(livestreamHostService.pinProduct(stream.id, { productId: 9001, priceAtLive: 99000 })).resolves.toEqual(product);
    await expect(livestreamHostService.getById(stream.id)).resolves.toMatchObject({ pinnedProducts: [product] });
    await expect(livestreamHostService.listProducts(stream.id)).resolves.toEqual([product]);
    await expect(livestreamHostService.listPinnedProducts(stream.id)).resolves.toEqual([product]);
    await expect(livestreamHostService.unpinProduct(stream.id, 9001)).resolves.toBeUndefined();

    expect(client.post).toHaveBeenNthCalledWith(3, '/api/livestreams/00000000-0000-4000-8000-000000000001/products/pin', {
      productId: 9001,
      priceAtLive: 99000,
    });
    expect(client.delete).toHaveBeenCalledWith('/api/livestreams/00000000-0000-4000-8000-000000000001/products/9001/pin');
  });
});
