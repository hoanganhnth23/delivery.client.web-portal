import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '@/utils/constants';
import {
  buildAdminCoupon,
  buildAdminOrder,
  buildAdminRating,
  buildAdminShipper,
  buildFlashSaleCampaign,
  buildFlashSaleItem,
  buildUser,
} from '@/test/builders';
import {
  createAdminFake,
  createAuthFake,
  createFlashSaleAdminFake,
  createNotificationFake,
  createTestDependencies,
} from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';

afterEach(() => {
  vi.restoreAllMocks();
});

function adminDependencies({
  admin = createAdminFake(),
  flashSaleAdmin = createFlashSaleAdminFake(),
  notifications = createNotificationFake(),
}: {
  admin?: ReturnType<typeof createAdminFake>;
  flashSaleAdmin?: ReturnType<typeof createFlashSaleAdminFake>;
  notifications?: ReturnType<typeof createNotificationFake>;
} = {}) {
  const user = buildUser({ role: USER_ROLES.ADMIN, name: 'Admin Test' });
  return createTestDependencies({
    auth: createAuthFake({
      isAuthenticated: vi.fn(() => true),
      getCurrentUser: vi.fn(() => user),
      getProfile: vi.fn(async () => user),
    }),
    admin,
    flashSaleAdmin,
    notifications,
  });
}

describe('admin read and moderation actions', () => {
  it('shows a retryable error instead of an empty shipper list after a failed read', async () => {
    const user = userEvent.setup();
    const notifications = createNotificationFake();
    const shipper = buildAdminShipper();
    const fetchAllShippers = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({
        items: [shipper],
        page: 0,
        size: 100,
        totalItems: 1,
        totalPages: 1,
        hasNext: false,
      });

    renderApp({
      route: '/admin/shippers',
      dependencies: adminDependencies({
        admin: createAdminFake({ fetchAllShippers }),
        notifications,
      }),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải danh sách shipper');
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Shipper Test')).toBeInTheDocument();
    expect(fetchAllShippers).toHaveBeenCalledTimes(2);
  });

  it('loads, filters, searches and paginates orders through injected services', async () => {
    const user = userEvent.setup();
    const pending = buildAdminOrder();
    const delivered = buildAdminOrder({ id: 402, status: 'DELIVERED' });
    const fetchAllOrders = vi.fn(async (page: number) => ({
      items: page === 0 ? [pending, delivered] : [buildAdminOrder({ id: 403 })],
      page,
      size: 20,
      totalItems: 40,
      totalPages: 2,
      hasNext: page === 0,
    }));
    const fetchOrdersByStatus = vi.fn(async (status: string, page: number) => ({
      items: [buildAdminOrder({ id: 404, status })],
      page,
      size: 20,
      totalItems: 21,
      totalPages: 2,
      hasNext: page === 0,
    }));

    renderApp({
      route: '/admin/orders',
      dependencies: adminDependencies({
        admin: createAdminFake({ fetchAllOrders, fetchOrdersByStatus }),
      }),
    });

    expect(await screen.findByText('#401')).toBeInTheDocument();
    expect(screen.getByText('#402')).toBeInTheDocument();
    const search = screen.getByPlaceholderText('Tìm kiếm ID...');
    await user.type(search, '402');
    expect(screen.queryByText('#401')).not.toBeInTheDocument();
    expect(screen.getByText('#402')).toBeInTheDocument();
    await user.clear(search);

    await user.click(screen.getByRole('button', { name: 'DELIVERED' }));
    await waitFor(() => {
      expect(fetchOrdersByStatus).toHaveBeenCalledWith('DELIVERED', 0, 20);
    });
    expect(await screen.findByText('#404')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sau' }));
    await waitFor(() => {
      expect(fetchOrdersByStatus).toHaveBeenLastCalledWith('DELIVERED', 1, 20);
    });
  });

  it('loads shipper filters from the correct backend query', async () => {
    const user = userEvent.setup();
    const online = buildAdminShipper();
    const offline = buildAdminShipper({ id: 702, fullName: 'Offline Test', isOnline: false });
    const fetchAllShippers = vi.fn(async () => ({
      items: [online, offline],
      page: 0,
      size: 100,
      totalItems: 2,
      totalPages: 1,
      hasNext: false,
    }));
    const fetchOnlineShippers = vi.fn(async () => [online]);

    renderApp({
      route: '/admin/shippers',
      dependencies: adminDependencies({
        admin: createAdminFake({ fetchAllShippers, fetchOnlineShippers }),
      }),
    });

    expect(await screen.findByText('Shipper Test')).toBeInTheDocument();
    expect(screen.getByText('Offline Test')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đang online' }));
    await waitFor(() => expect(fetchOnlineShippers).toHaveBeenCalled());
    expect(screen.queryByText('Offline Test')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Offline' }));
    await waitFor(() => expect(fetchAllShippers).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Offline Test')).toBeInTheDocument();
    expect(screen.queryByText('Shipper Test')).not.toBeInTheDocument();
  });

  it('keeps rating moderation retryable after a backend failure', async () => {
    const user = userEvent.setup();
    const notifications = createNotificationFake();
    const rating = buildAdminRating();
    const updateRatingStatus = vi
      .fn()
      .mockRejectedValueOnce(new Error('conflict'))
      .mockResolvedValueOnce({ ...rating, status: 'APPROVED' });

    renderApp({
      route: '/admin/ratings',
      dependencies: adminDependencies({
        admin: createAdminFake({
          fetchAllRatings: vi.fn(async () => [rating]),
          updateRatingStatus,
        }),
        notifications,
      }),
    });

    expect(await screen.findByText('Đồ ăn ngon')).toBeInTheDocument();
    await user.click(screen.getByTitle('Duyệt'));
    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith('Cập nhật trạng thái thất bại');
    });
    expect(screen.getByTitle('Duyệt')).toBeInTheDocument();

    await user.click(screen.getByTitle('Duyệt'));
    await waitFor(() => expect(updateRatingStatus).toHaveBeenCalledTimes(2));
    expect(await screen.findAllByText('APPROVED')).not.toHaveLength(0);
    expect(screen.queryByTitle('Duyệt')).not.toBeInTheDocument();
  });

  it('supports the distinct rating rejection action', async () => {
    const user = userEvent.setup();
    const rating = buildAdminRating();
    const updateRatingStatus = vi.fn(async () => ({
      ...rating,
      status: 'REJECTED' as const,
    }));

    renderApp({
      route: '/admin/ratings',
      dependencies: adminDependencies({
        admin: createAdminFake({
          fetchAllRatings: vi.fn(async () => [rating]),
          updateRatingStatus,
        }),
      }),
    });

    await user.click(await screen.findByTitle('Từ chối'));
    await waitFor(() => {
      expect(updateRatingStatus).toHaveBeenCalledWith(801, 'REJECTED');
    });
    expect(await screen.findAllByText('REJECTED')).not.toHaveLength(0);
    expect(screen.queryByTitle('Từ chối')).not.toBeInTheDocument();
  });
});

describe('admin growth actions', () => {
  it('keeps legacy voucher rows readable for recovery and audit', async () => {
    const legacy = buildAdminCoupon({
      code: 'LEGACY50',
      creatorType: 'MERCHANT',
      scopeType: 'CATEGORY',
      scopeRefId: 12,
    });
    renderApp({
      route: '/admin/coupons',
      dependencies: adminDependencies({
        admin: createAdminFake({
          fetchAllCoupons: vi.fn(async () => [legacy]),
        }),
      }),
    });

    expect(await screen.findByText('LEGACY50')).toBeInTheDocument();
  });

  it('creates and deletes coupons with a deterministic injected clock', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const created = buildAdminCoupon({ code: 'WELCOME' });
    const fetchAllCoupons = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([created])
      .mockResolvedValue([]);
    const createCoupon = vi.fn(async () => created);
    const deleteCoupon = vi.fn(async () => undefined);

    renderApp({
      route: '/admin/coupons',
      dependencies: adminDependencies({
        admin: createAdminFake({ fetchAllCoupons, createCoupon, deleteCoupon }),
      }),
    });

    await screen.findByText('Chưa có mã giảm giá nào');
    await user.click(screen.getByRole('button', { name: /Tạo Coupon Mới/ }));
    const dialog = screen.getByRole('dialog', { name: 'Tạo Coupon Mới' });
    await user.type(within(dialog).getByPlaceholderText('E.g. HELLO2024'), 'welcome');
    await user.type(within(dialog).getByPlaceholderText('Giảm giá chào mừng'), 'Welcome');
    await user.selectOptions(within(dialog).getByLabelText('Phạm vi'), 'SHOP');
    await user.type(within(dialog).getByLabelText('Restaurant ID'), '77');
    await user.click(within(dialog).getByRole('button', { name: 'Tạo Coupon' }));

    await waitFor(() => expect(createCoupon).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'WELCOME',
        name: 'Welcome',
        startTime: '2026-07-29T08:00',
        endTime: '2026-08-05T08:00',
        scopeType: 'SHOP',
        scopeRefId: 77,
      }),
    ));
    expect(await screen.findByText('WELCOME')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xóa coupon WELCOME' }));
    await waitFor(() => expect(deleteCoupon).toHaveBeenCalledWith(901));
    await waitFor(() => expect(screen.queryByText('WELCOME')).not.toBeInTheDocument());
  });

  it('keeps coupon create and delete failures observable and retryable', async () => {
    const user = userEvent.setup();
    const notifications = createNotificationFake();
    const coupon = buildAdminCoupon({ code: 'RETRY' });
    const fetchAllCoupons = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([coupon])
      .mockResolvedValue([]);
    const createCoupon = vi
      .fn()
      .mockRejectedValueOnce(new Error('create failed'))
      .mockResolvedValueOnce(coupon);
    const deleteCoupon = vi
      .fn()
      .mockRejectedValueOnce(new Error('delete failed'))
      .mockResolvedValueOnce(undefined);
    vi.spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValue(true);

    renderApp({
      route: '/admin/coupons',
      dependencies: adminDependencies({
        admin: createAdminFake({ fetchAllCoupons, createCoupon, deleteCoupon }),
        notifications,
      }),
    });

    await screen.findByText('Chưa có mã giảm giá nào');
    await user.click(screen.getByRole('button', { name: /Tạo Coupon Mới/ }));
    const dialog = screen.getByRole('dialog', { name: 'Tạo Coupon Mới' });
    await user.type(within(dialog).getByPlaceholderText('E.g. HELLO2024'), 'retry');
    await user.type(within(dialog).getByPlaceholderText('Giảm giá chào mừng'), 'Retry');
    await user.click(within(dialog).getByRole('button', { name: 'Tạo Coupon' }));
    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith('Lỗi khi tạo coupon');
    });
    expect(screen.getByRole('dialog', { name: 'Tạo Coupon Mới' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Tạo Coupon' }));
    expect(await screen.findByText('RETRY')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xóa coupon RETRY' }));
    expect(deleteCoupon).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Xóa coupon RETRY' }));
    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith('Lỗi khi xóa coupon');
    });
    expect(screen.getByText('RETRY')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xóa coupon RETRY' }));
    await waitFor(() => expect(deleteCoupon).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('RETRY')).not.toBeInTheDocument());
  });

  it('creates, activates and approves a flash-sale item', async () => {
    const user = userEvent.setup();
    const campaign = buildFlashSaleCampaign();
    const item = buildFlashSaleItem();
    const getAllCampaigns = vi
      .fn()
      .mockResolvedValueOnce([campaign])
      .mockResolvedValue([campaign]);
    const createCampaign = vi.fn(async () => campaign);
    const updateCampaignStatus = vi.fn(async () => undefined);
    const getCampaignItems = vi.fn(async () => [item]);
    const approveItem = vi.fn(async () => undefined);

    renderApp({
      route: '/admin/flash-sales',
      dependencies: adminDependencies({
        flashSaleAdmin: createFlashSaleAdminFake({
          getAllCampaigns,
          createCampaign,
          updateCampaignStatus,
          getCampaignItems,
          approveItem,
        }),
      }),
    });

    expect(await screen.findByText('Flash test')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Tạo Chiến dịch/ }));
    await user.type(screen.getByPlaceholderText('Flash Sale Khung Giờ Vàng'), 'Buổi trưa');
    await user.click(screen.getByRole('button', { name: 'Tạo' }));
    await waitFor(() => expect(createCampaign).toHaveBeenCalledWith({
      name: 'Buổi trưa',
      isRecurring: false,
      startTime: '00:00:00',
      endTime: '23:59:00',
    }));

    await user.click(screen.getByTitle('Kích hoạt'));
    await waitFor(() => {
      expect(updateCampaignStatus).toHaveBeenCalledWith(1001, 'ACTIVE');
    });

    await user.click(screen.getByTitle('Xem món ăn'));
    expect(await screen.findByText('Món #301')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Duyệt' }));
    await waitFor(() => expect(approveItem).toHaveBeenCalledWith(1101));
  });

  it('ends active campaigns and retries status/item mutations after failures', async () => {
    const user = userEvent.setup();
    const notifications = createNotificationFake();
    const campaign = buildFlashSaleCampaign({ status: 'ACTIVE' });
    const item = buildFlashSaleItem();
    const updateCampaignStatus = vi
      .fn()
      .mockRejectedValueOnce(new Error('status failed'))
      .mockResolvedValueOnce(undefined);
    const approveItem = vi
      .fn()
      .mockRejectedValueOnce(new Error('approve failed'))
      .mockResolvedValueOnce(undefined);

    renderApp({
      route: '/admin/flash-sales',
      dependencies: adminDependencies({
        flashSaleAdmin: createFlashSaleAdminFake({
          getAllCampaigns: vi.fn(async () => [campaign]),
          updateCampaignStatus,
          getCampaignItems: vi.fn(async () => [item]),
          approveItem,
        }),
        notifications,
      }),
    });

    await user.click(await screen.findByTitle('Kết thúc'));
    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith('Lỗi khi đổi trạng thái');
    });
    await user.click(screen.getByTitle('Kết thúc'));
    await waitFor(() => {
      expect(updateCampaignStatus).toHaveBeenLastCalledWith(1001, 'ENDED');
    });

    await user.click(screen.getByTitle('Xem món ăn'));
    await user.click(await screen.findByRole('button', { name: 'Duyệt' }));
    await waitFor(() => {
      expect(notifications.error).toHaveBeenCalledWith('Lỗi duyệt món ăn');
    });
    await user.click(screen.getByRole('button', { name: 'Duyệt' }));
    await waitFor(() => expect(approveItem).toHaveBeenCalledTimes(2));
  });
});
