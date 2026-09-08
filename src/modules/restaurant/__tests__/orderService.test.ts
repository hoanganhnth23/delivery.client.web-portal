import { describe, expect, it, vi } from 'vitest';
import apiClient from '@/services/api/apiClient';
import { getMyOrders, getCustomerOrders, getOrderById } from '../services/orderService';

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

describe('orderService contract parsing', () => {
  const baseRawOrder = {
    id: 101,
    userId: 202,
    restaurantId: 303,
    restaurantName: 'Quán Ăn Ngon',
    restaurantAddress: '123 Nguyễn Huệ, Q1, TP.HCM',
    restaurantLat: 10.7769,
    restaurantLng: 106.7009,
    subtotalPrice: 100000,
    discountAmount: 0,
    shippingFee: 15000,
    totalPrice: 115000,
    status: 'PENDING',
    paymentMethod: 'COD',
    deliveryAddress: '456 Lê Lợi, Q1, TP.HCM',
    deliveryLat: 10.778,
    deliveryLng: 106.702,
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    createdAt: '2026-09-05T08:00:00Z',
    updatedAt: '2026-09-05T08:00:00Z',
    items: [
      {
        id: 1,
        menuItemId: 10,
        menuItemName: 'Phở bò đặc biệt',
        quantity: 1,
        price: 100000,
      },
    ],
  };

  it('successfully parses getMyOrders when restaurantPhone is null', async () => {
    const rawBackendResponse = {
      data: {
        status: 1,
        message: 'Thành công',
        data: {
          items: [
            {
              ...baseRawOrder,
              restaurantPhone: null,
            },
          ],
          page: 0,
          size: 10,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(rawBackendResponse as never);

    const result = await getMyOrders(0, 10);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(101);
    expect(result.items[0].restaurantName).toBe('Quán Ăn Ngon');
    expect(result.items[0].restaurantPhone).toBeUndefined();
  });

  it('successfully parses getCustomerOrders when restaurantPhone is missing/undefined', async () => {
    const rawBackendResponse = {
      data: {
        status: 1,
        message: 'Thành công',
        data: {
          items: [
            {
              ...baseRawOrder,
              // restaurantPhone omitted
            },
          ],
          page: 0,
          size: 10,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(rawBackendResponse as never);

    const result = await getCustomerOrders(0, 10);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].restaurantPhone).toBeUndefined();
  });

  it('successfully parses orders when restaurantPhone is an empty string or whitespace', async () => {
    const rawBackendResponse = {
      data: {
        status: 1,
        message: 'Thành công',
        data: {
          items: [
            {
              ...baseRawOrder,
              restaurantPhone: '   ',
            },
          ],
          page: 0,
          size: 10,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(rawBackendResponse as never);

    const result = await getMyOrders(0, 10);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].restaurantPhone).toBeUndefined();
  });

  it('retains restaurantPhone when a valid phone string is provided', async () => {
    const rawBackendResponse = {
      data: {
        status: 1,
        message: 'Thành công',
        data: {
          ...baseRawOrder,
          restaurantPhone: '02838222333',
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(rawBackendResponse as never);

    const order = await getOrderById(101);

    expect(order.restaurantPhone).toBe('02838222333');
  });

  it('converts numeric restaurantPhone to string gracefully if backend returns a number', async () => {
    const rawBackendResponse = {
      data: {
        status: 1,
        message: 'Thành công',
        data: {
          ...baseRawOrder,
          restaurantPhone: 2838222333,
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(rawBackendResponse as never);

    const order = await getOrderById(101);

    expect(order.restaurantPhone).toBe('2838222333');
  });
});
