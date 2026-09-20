import { describe, expect, it, vi } from 'vitest';
import apiClient from '@/services/api/apiClient';
import { getMyMenuItems, getMenuItemsByRestaurant } from '../services/menuService';

vi.mock('@/services/api/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  handleResponse: vi.fn((res: { data: { data: unknown } }) => res.data.data),
  handleError: vi.fn((err: unknown) => err),
}));

describe('menuService', () => {
  it('uses the ownership-checked management route for a selected restaurant', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: [] } } as never);
    await getMyMenuItems(35);
    expect(apiClient.get).toHaveBeenLastCalledWith('/api/menu-items/my-menu-items?restaurantId=35');
  });

  it('uses AVAILABLE catalogue for customer reads', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: [] } } as never);
    await getMenuItemsByRestaurant(35);
    expect(apiClient.get).toHaveBeenLastCalledWith('/api/menu-items/restaurant/35/available');
  });

  it('propagates forbidden management reads without falling back to public data', async () => {
    vi.mocked(apiClient.get).mockClear();
    const forbidden = { response: { status: 403 } };
    vi.mocked(apiClient.get).mockRejectedValueOnce(forbidden);
    await expect(getMyMenuItems(35)).rejects.toBe(forbidden);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('successfully parses my-menu-items with Jackson array timestamps from backend', async () => {
    const rawBackendResponse = {
      data: {
        status: 1,
        message: 'Thành công',
        data: [
          {
            id: 35,
            restaurantId: 35,
            name: 'Cơm gà',
            description: 'Món seed',
            price: 45000,
            status: 'AVAILABLE',
            createdAt: [2026, 9, 3, 9, 51, 24, 607206000],
            updatedAt: [2026, 9, 3, 9, 51, 24, 607206000],
            image: null,
          },
        ],
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(rawBackendResponse as never);

    const items = await getMyMenuItems();

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: 35,
      restaurantId: 35,
      name: 'Cơm gà',
      description: 'Món seed',
      price: 45000,
      status: 'AVAILABLE',
      image: '',
      createdAt: '2026-09-03T09:51:24.607Z',
      updatedAt: '2026-09-03T09:51:24.607Z',
    });
  });

  it('handles null description, 0 price, and lowercase status safely', async () => {
    const rawBackendResponse = {
      data: {
        status: 1,
        message: 'Thành công',
        data: [
          {
            id: 101,
            restaurantId: 35,
            name: 'Nước đá miễn phí',
            description: null,
            price: 0,
            status: 'available',
            createdAt: '2026-09-03T10:00:00.000Z',
            updatedAt: null,
            image: null,
          },
        ],
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(rawBackendResponse as never);

    const items = await getMyMenuItems();

    expect(items).toHaveLength(1);
    expect(items[0].price).toBe(0);
    expect(items[0].description).toBe('');
    expect(items[0].status).toBe('AVAILABLE');
    expect(items[0].createdAt).toBe('2026-09-03T10:00:00.000Z');
    expect(items[0].updatedAt).toBeUndefined();
  });

  it('rejects a menu item without required ownership or lifecycle fields', async () => {
    const rawBackendResponse = {
      data: {
        status: 1,
        message: 'Thành công',
        data: [
          {
            id: 10,
            name: 'Trà sữa',
            description: '',
            price: 30000,
            image: '',
            createdAt: '2026-09-03T10:00:00.000Z',
            updatedAt: '2026-09-03T10:00:00.000Z',
          },
        ],
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(rawBackendResponse as never);

    await expect(getMyMenuItems()).rejects.toThrow('restaurantId');
  });

  it('rejects a menu item with a missing status instead of assuming AVAILABLE', async () => {
    const rawBackendResponse = {
      data: {
        status: 1,
        message: 'Thành công',
        data: [
          {
            id: 10,
            restaurantId: 2,
            name: 'Trà sữa',
            description: '',
            price: 30000,
            image: '',
            createdAt: '2026-09-03T10:00:00.000Z',
            updatedAt: '2026-09-03T10:00:00.000Z',
          },
        ],
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(rawBackendResponse as never);

    await expect(getMyMenuItems()).rejects.toThrow('status');
  });

  it('rejects a non-list menu payload instead of silently returning an empty list', async () => {
    const rawBackendResponse = {
      data: {
        status: 1,
        message: 'Thành công',
        data: {
          items: [
            {
              id: 10,
              restaurantId: 2,
              name: 'Trà sữa',
              description: '',
              price: 30000,
              status: 'AVAILABLE',
              createdAt: '2026-09-03T10:00:00.000Z',
              updatedAt: '2026-09-03T10:00:00.000Z',
              image: '',
            },
          ],
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(rawBackendResponse as never);

    await expect(getMenuItemsByRestaurant(2)).rejects.toThrow('menu items must be an array');
  });
});
