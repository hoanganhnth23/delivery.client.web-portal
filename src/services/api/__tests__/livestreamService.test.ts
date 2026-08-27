import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient, { handleResponse } from '../apiClient';
import { livestreamHostService } from '../livestreamService';

vi.mock('../apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  handleResponse: vi.fn((response: { data: unknown }) =>
    (response.data as { data: unknown }).data),
}));

const client = vi.mocked(apiClient);
const response = (data: unknown) => ({ data: { status: 1, message: null, data } });
const stream = {
  id: '00000000-0000-4000-8000-000000000001',
  restaurantId: 42,
  title: 'Friday kitchen',
  status: 'CREATED',
  streamProvider: 'AGORA',
};

describe('livestream host Gateway adapter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses exact inspect/create/start/end Gateway routes', async () => {
    client.get.mockResolvedValue(response([stream]) as never);
    client.post
      .mockResolvedValueOnce(response(stream) as never)
      .mockResolvedValue({ data: { status: 1, message: null, data: null } } as never);

    await expect(livestreamHostService.inspect(42)).resolves.toEqual([stream]);
    await expect(livestreamHostService.create({
      restaurantId: 42,
      title: 'Friday kitchen',
      streamProvider: 'AGORA',
    })).resolves.toEqual(stream);
    await livestreamHostService.start(stream.id);
    await livestreamHostService.end(stream.id);

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
});
