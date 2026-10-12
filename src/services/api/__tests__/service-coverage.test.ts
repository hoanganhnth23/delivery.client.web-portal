import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../apiClient';
import addressService from '../addressService';
import { flashSaleAdminService } from '../flashSaleService';
import { getMyVouchers, getVoucherCapability, collectVoucher, createShopVoucher, listShopVouchers } from '../promotionService';
import adminService from '../adminService';

vi.mock('../apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  handleResponse: vi.fn((res: { data: { data: unknown } }) => res.data.data),
  handleError: vi.fn((error: unknown) => { throw error; }),
}));
const response = (data: unknown) => ({ data: { status: 1, message: 'ok', data } });
const address = { id: 1, userId: 2, label: 'Home', recipientName: 'A', phoneNumber: '1', addressLine: 'A', ward: 'W', district: 'D', city: 'C', postalCode: null, latitude: 10, longitude: 105, isDefault: true };
const coupon = { id: 1, code: 'SAVE', name: 'Save', description: '', creatorType: 'PLATFORM', rewardType: 'FIXED', discountValue: 10, maxDiscountValue: null, totalQuantity: 10, usedQuantity: 0, startTime: '2026-01-01T00:00:00Z', endTime: '2026-12-31T00:00:00Z', minOrderValue: 0, scopeType: 'ALL', scopeRefId: null, active: true };
const adminOrder = { id: 1, userId: 2, restaurantId: 3, totalPrice: 10, status: 'PENDING', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', paymentMethod: 'COD', deliveryAddress: 'A', shipperId: null };
const shipper = { id: 1, userId: 2, fullName: null, phone: null, vehicleType: null, licensePlate: null, isOnline: false, rating: null, completedDeliveries: 0, createdAt: '2026-01-01T00:00:00Z' };
const page = (items: unknown[]) => ({ items, page: 0, size: 20, totalItems: items.length, totalPages: 1, hasNext: false });

describe('API service boundaries', () => {
  beforeEach(() => vi.clearAllMocks());
  it('covers address CRUD and promotion transport', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(response([address]) as never);
    await expect(addressService.getUserAddresses(2)).resolves.toHaveLength(1);
    vi.mocked(apiClient.post).mockResolvedValue(response(address) as never);
    await addressService.createAddress(2, address as never);
    vi.mocked(apiClient.put).mockResolvedValue(response(address) as never);
    await addressService.updateAddress(1, address as never);
    vi.mocked(apiClient.delete).mockResolvedValue(response(null) as never);
    await addressService.deleteAddress(1);
    vi.mocked(apiClient.patch).mockResolvedValue(response(address) as never);
    await addressService.setDefaultAddress(1);

    const voucher = { id: 1, code: 'SAVE', name: 'Save', description: '', creatorType: 'PLATFORM', rewardType: 'FIXED', discountValue: 10, maxDiscountValue: null, minOrderValue: 0, scopeType: 'ALL', scopeRefId: null, active: true };
    vi.mocked(apiClient.get).mockResolvedValueOnce(response([voucher]) as never).mockResolvedValueOnce(response({ enabled: true, maxVouchers: 2, layers: ['SHOP_DISCOUNT'], selectionModes: ['AUTO'], conflictsWithFlashSale: false }) as never).mockResolvedValueOnce(response([voucher]) as never);
    await getMyVouchers(); await getVoucherCapability();
    vi.mocked(apiClient.post).mockResolvedValue(response(voucher) as never);
    await collectVoucher(' save ');
    await createShopVoucher({ code: 'SAVE', name: 'Save', rewardType: 'FIXED', discountValue: 1, totalQuantity: 2, usageLimitPerUser: 1, startTime: '2026-01-01T00:00', endTime: '2026-01-02T00:00', minOrderValue: 0, restaurantId: 3 });
    await listShopVouchers();
  });
  it('covers flash sale and admin reads/writes', async () => {
    const campaign = { id: 1, name: 'Lunch', isRecurring: false, startTime: '2026-01-01', endTime: '2026-01-02', status: 'ACTIVE' };
    const item = { id: 1, campaignId: 1, restaurantId: 3, menuItemId: 4, originalPrice: 10, flashSalePrice: 8, stockQuantity: 4, soldQuantity: 0, status: 'PENDING' };
    vi.mocked(apiClient.get).mockResolvedValueOnce(response([campaign]) as never).mockResolvedValueOnce(response([item]) as never);
    await flashSaleAdminService.getAllCampaigns(); await flashSaleAdminService.getCampaignItems(1);
    vi.mocked(apiClient.post).mockResolvedValue(response(campaign) as never); await flashSaleAdminService.createCampaign(campaign);
    vi.mocked(apiClient.put).mockResolvedValue(response(null) as never); await flashSaleAdminService.updateCampaignStatus(1, 'ACTIVE'); await flashSaleAdminService.approveItem(1);
    const dashboard = { overview: { totalOrders: 1, totalRevenue: 10, deliveredOrders: 1, cancelledOrders: 0, pendingOrders: 0, processingOrders: 0, avgOrderValue: 10, deliveryRate: 1 }, revenueTimeSeries: [], orderTimeSeries: [], statusBreakdown: [], topRestaurants: [] };
    vi.mocked(apiClient.get).mockResolvedValue(response(dashboard) as never); await adminService.fetchAdminDashboard('year', 2026);
    vi.mocked(apiClient.get).mockResolvedValue(response(page([adminOrder])) as never); await adminService.fetchAllOrders(); await adminService.fetchOrdersByStatus('PENDING');
    vi.mocked(apiClient.get).mockResolvedValue(response(page([shipper])) as never); await adminService.fetchAllShippers();
    vi.mocked(apiClient.get).mockResolvedValue(response([shipper]) as never); await adminService.fetchOnlineShippers();
    vi.mocked(apiClient.post).mockResolvedValue(response('CONFIRMED') as never); await adminService.confirmOrder(1, 3); vi.mocked(apiClient.post).mockResolvedValue(response('REJECTED') as never); await adminService.rejectOrder(1, 3, 'x');
    const rating = { id: 1, restaurantId: 3, customerId: 2, orderId: 1, rating: 5, comment: null, status: 'APPROVED', createdAt: '2026-01-01T00:00:00Z' };
    vi.mocked(apiClient.get).mockResolvedValue(response([rating]) as never); await adminService.fetchAllRatings();
    vi.mocked(apiClient.put).mockResolvedValue(response(rating) as never); await adminService.updateRatingStatus(1, 'APPROVED');
    vi.mocked(apiClient.get).mockResolvedValue(response([coupon]) as never); await adminService.fetchAllCoupons(); await adminService.fetchPendingShopCoupons();
    vi.mocked(apiClient.post).mockResolvedValue(response(coupon) as never);
    const createData = { code: 'SAVE', name: 'Save', description: '', rewardType: 'FIXED' as const, discountValue: 10, maxDiscountValue: null, totalQuantity: 10, usageLimitPerUser: 1, startTime: '2026-01-01T00:00', endTime: '2026-12-31T00:00', minOrderValue: 0, scopeType: 'ALL' as const, scopeRefId: null };
    await adminService.createCoupon(createData); await adminService.approveShopCoupon(1); await adminService.rejectShopCoupon(1, 'bad'); await adminService.pauseCoupon(1); await adminService.resumeCoupon(1);
    vi.mocked(apiClient.delete).mockResolvedValue(response(null) as never); await adminService.deleteCoupon(1);
  });
});
