import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/services/api/apiClient';
import {
  createMenuItem, updateMenuItem, deleteMenuItem,
} from '../services/menuService';
import {
  createRestaurant, updateRestaurant, getMyRestaurants, getAllRestaurants,
  searchRestaurants, getRestaurantById, getRestaurantRatings,
} from '../services/restaurantService';
import {
  checkoutPreview, createCustomerOrder, cancelOrder, confirmOrder, rejectOrder, getMyOrders,
} from '../services/orderService';

vi.mock('@/services/api/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  handleResponse: vi.fn((res: { data: { data: unknown } }) => res.data.data),
  handleError: vi.fn((error: unknown) => error),
}));

const restaurant = {
  id: 7, name: 'Bếp Nhà', address: '1 A', phone: '0900', openingHour: '08:00:00',
  closingHour: '22:00:00', image: '', latitude: 10, longitude: 105, description: '',
  open: true, rating: 4.5, ratingCount: 3,
};
const menu = { id: 8, restaurantId: 7, name: 'Phở', description: '', price: 40, image: '', status: 'AVAILABLE' };
const order = {
  id: 1, userId: 2, restaurantId: 7, restaurantName: 'Bếp Nhà', restaurantAddress: '1 A',
  restaurantLat: 10, restaurantLng: 105, subtotalPrice: 40, discountAmount: 0,
  shippingFee: 5, totalPrice: 45, status: 'PENDING', paymentMethod: 'COD',
  deliveryAddress: '2 B', deliveryLat: 10, deliveryLng: 105, customerName: 'A',
  customerPhone: '1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  items: [{ id: 1, menuItemId: 8, menuItemName: 'Phở', quantity: 1, price: 40 }],
};

const response = (data: unknown) => ({ data: { status: 1, message: 'ok', data } });

describe('restaurant service request and parsing coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('covers menu mutations and restaurant management/public reads', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(response(menu) as never);
    vi.mocked(apiClient.put).mockResolvedValue(response(menu) as never);
    vi.mocked(apiClient.delete).mockResolvedValue(response(null) as never);
    await expect(createMenuItem({ restaurantId: 7, name: 'Phở', description: '', price: 40, image: '' })).resolves.toMatchObject({ id: 8 });
    await expect(updateMenuItem(8, { restaurantId: 7, name: 'Phở', description: '', price: 40, image: '' })).resolves.toMatchObject({ id: 8 });
    await expect(deleteMenuItem(8)).resolves.toBeUndefined();

    vi.mocked(apiClient.post).mockResolvedValue(response(restaurant) as never);
    vi.mocked(apiClient.put).mockResolvedValue(response(restaurant) as never);
    vi.mocked(apiClient.get).mockResolvedValue(response([restaurant]) as never);
    const input = { name: 'Bếp Nhà', address: '1 A', phone: '0900', openingHour: '08:00:00', closingHour: '22:00:00', image: '', addressLat: 10, addressLng: 105, description: '' };
    await expect(createRestaurant(input)).resolves.toMatchObject({ id: 7 });
    await expect(updateRestaurant(7, input)).resolves.toMatchObject({ id: 7 });
    await expect(getMyRestaurants()).resolves.toHaveLength(1);
    await expect(getAllRestaurants()).resolves.toHaveLength(1);
    await expect(searchRestaurants('pho')).resolves.toHaveLength(1);
    vi.mocked(apiClient.get).mockResolvedValue(response(restaurant) as never);
    await expect(getRestaurantById(7)).resolves.toMatchObject({ id: 7 });
    vi.mocked(apiClient.get).mockResolvedValue(response([{ id: 1, restaurantId: 7, customerId: 2, orderId: 3, rating: 5, comment: null, status: 'APPROVED', createdAt: '2026-01-01T00:00:00Z' }]) as never);
    await expect(getRestaurantRatings(7)).resolves.toHaveLength(1);
  });

  it('builds checkout and order mutation requests', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(response({
      quoteId: 'q-1', expiresAt: '2026-01-01T00:05:00Z', restaurantId: 7, restaurantName: 'Bếp Nhà',
      subtotal: 40, discountAmount: 0, shippingFee: 5, totalPrice: 45,
      grossShippingFee: 5, platformSubsidy: 0, shopDiscount: 0,
      items: [{ menuItemId: 8, menuItemName: 'Phở', unitPrice: 40, quantity: 1, lineTotal: 40 }],
      priceChanges: [], unavailableItemIds: [],
    }) as never);
    await expect(checkoutPreview({ restaurantId: 7, items: [{ menuItemId: 8, quantity: 1 }] } as never)).resolves.toMatchObject({ totalPrice: 45 });
    vi.mocked(apiClient.post).mockResolvedValue(response(order) as never);
    await expect(createCustomerOrder({ restaurantId: 7 } as never, 'idem-1')).resolves.toMatchObject({ idempotencyKey: 'idem-1' });
    vi.mocked(apiClient.put).mockResolvedValue(response(order) as never);
    await cancelOrder(1, '  changed mind  ');
    expect(apiClient.put).toHaveBeenCalledWith('/api/orders/1/cancel', { reason: 'changed mind' });
    vi.mocked(apiClient.post).mockResolvedValue(response('CONFIRMED') as never);
    await expect(confirmOrder(1, 7)).resolves.toBe('CONFIRMED');
    vi.mocked(apiClient.post).mockResolvedValue(response('REJECTED') as never);
    await expect(rejectOrder(1, 7, 'closed')).resolves.toBe('REJECTED');
    vi.mocked(apiClient.get).mockResolvedValue(response({ items: [], page: 0, size: 10, totalItems: 0, totalPages: 0, hasNext: false }) as never);
    await expect(getMyOrders(1, 5, 7)).resolves.toMatchObject({ page: 0 });
    expect(apiClient.get).toHaveBeenLastCalledWith('/api/orders/my-restaurant-orders', { params: { page: 1, size: 5, restaurantId: 7 } });
  });
});
