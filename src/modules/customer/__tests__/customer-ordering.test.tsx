import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { USER_ROLES, ROUTES } from '@/utils/constants';
import { buildUser } from '@/test/builders';
import { createAuthFake, createTestDependencies } from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';
import type { CustomerVoucher } from '@/services/api/promotionService';
import { writeCustomerCart } from '../cart/cart';

const customer = buildUser({ id: 101, email: 'customer@test.dev', name: 'Customer Test', role: USER_ROLES.USER });

const customerDependencies = () => createTestDependencies({
  auth: createAuthFake({
    isAuthenticated: vi.fn(() => true),
    hasStoredSession: vi.fn(() => true),
    getCurrentUser: vi.fn(() => customer),
    getProfile: vi.fn(async () => customer),
    restoreSession: vi.fn(async () => customer),
  }),
});

const platformVouchers: CustomerVoucher[] = [
  {
    id: 701,
    code: 'PLATFORM10',
    name: 'Platform 10%',
    description: '',
    creatorType: 'PLATFORM',
    rewardType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscountValue: 20_000,
    minOrderValue: 0,
    scopeType: 'ALL',
    scopeRefId: null,
    active: true,
    layer: 'PLATFORM_DISCOUNT',
    fundingSource: 'PLATFORM',
  },
  {
    id: 702,
    code: 'PLATFORM20',
    name: 'Platform 20%',
    description: '',
    creatorType: 'PLATFORM',
    rewardType: 'PERCENTAGE',
    discountValue: 20,
    maxDiscountValue: 30_000,
    minOrderValue: 0,
    scopeType: 'ALL',
    scopeRefId: null,
    active: true,
    layer: 'PLATFORM_DISCOUNT',
    fundingSource: 'PLATFORM',
  },
];

const otherRestaurantVoucher: CustomerVoucher = {
  id: 703,
  code: 'OTHER10',
  name: 'Other shop discount',
  description: '',
  creatorType: 'SHOP',
  rewardType: 'PERCENTAGE',
  discountValue: 10,
  maxDiscountValue: 20_000,
  minOrderValue: 0,
  scopeType: 'SHOP',
  scopeRefId: 999,
  active: true,
  layer: 'SHOP_DISCOUNT',
  fundingSource: 'SHOP',
};

const voucherDependencies = (vouchers: CustomerVoucher[] = platformVouchers) => {
  const dependencies = customerDependencies();
  return createTestDependencies({
    ...dependencies,
    promotion: {
      ...dependencies.promotion,
      getVoucherCapability: vi.fn(async () => ({
        enabled: true,
        maxVouchers: 3,
        layers: ['SHOP_DISCOUNT', 'PLATFORM_DISCOUNT', 'FREESHIP'],
        selectionModes: ['AUTO', 'MANUAL'],
        conflictsWithFlashSale: true,
      })),
      getMyVouchers: vi.fn(async () => vouchers),
    },
  });
};

const writeCheckoutCart = () => writeCustomerCart({
  restaurantId: 201,
  restaurantName: 'Bếp test',
  items: [{
    menuItemId: 301,
    restaurantId: 201,
    restaurantName: 'Bếp test',
    menuItemName: 'Cơm test',
    price: 50_000,
    quantity: 1,
  }],
});

describe('customer ordering journey', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('redirects an anonymous customer checkout attempt to customer login', async () => {
    renderApp({ route: ROUTES.CUSTOMER_CHECKOUT });
    expect(await screen.findByRole('heading', { name: 'Đăng nhập để đặt món' })).toBeInTheDocument();
  });

  it('renders public catalog without a customer session', async () => {
    renderApp({ route: ROUTES.HOME });
    expect(await screen.findByRole('heading', { name: 'Nhà hàng gần bạn' })).toBeInTheDocument();
    expect(await screen.findByText('Bếp test')).toBeInTheDocument();
  });

  it('previews and creates a COD order with one idempotency key', async () => {
    const user = userEvent.setup();
    const dependencies = customerDependencies();
    writeCustomerCart({
      restaurantId: 201,
      restaurantName: 'Bếp test',
      items: [{ menuItemId: 301, restaurantId: 201, restaurantName: 'Bếp test', menuItemName: 'Cơm test', price: 50_000, quantity: 1 }],
    });
    renderApp({ route: ROUTES.CUSTOMER_CHECKOUT, dependencies });

    expect(await screen.findByRole('heading', { name: 'Xác nhận đơn hàng' })).toBeInTheDocument();
    expect(await screen.findByText('Tổng COD')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đặt đơn COD' }));

    await waitFor(() => expect(dependencies.order.createCustomerOrder).toHaveBeenCalledOnce());
    expect(dependencies.order.checkoutPreview).toHaveBeenCalledOnce();
    expect(dependencies.order.createCustomerOrder).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: 'COD', quoteId: expect.any(String) }),
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    );
    expect(await screen.findByRole('heading', { name: 'Chi tiết đơn hàng' })).toBeInTheDocument();
  });

  it('reuses the same idempotency key when the backend reports an in-progress request', async () => {
    const user = userEvent.setup();
    const inProgress = Object.assign(new Error('Đang xử lý'), { code: 'IDEMPOTENCY_IN_PROGRESS' });
    const createCustomerOrder = vi.fn().mockRejectedValue(inProgress);
    const dependencies = createTestDependencies({
      ...customerDependencies(),
      order: {
        ...customerDependencies().order,
        createCustomerOrder,
      },
    });
    writeCustomerCart({
      restaurantId: 201,
      restaurantName: 'Bếp test',
      items: [{ menuItemId: 301, restaurantId: 201, restaurantName: 'Bếp test', menuItemName: 'Cơm test', price: 50_000, quantity: 1 }],
    });
    renderApp({ route: ROUTES.CUSTOMER_CHECKOUT, dependencies });
    await screen.findByRole('heading', { name: 'Xác nhận đơn hàng' });
    const button = await screen.findByRole('button', { name: 'Đặt đơn COD' });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() => expect(createCustomerOrder).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Đặt đơn COD' }));
    await waitFor(() => expect(createCustomerOrder).toHaveBeenCalledTimes(2));
    expect(createCustomerOrder.mock.calls[0][1]).toBe(createCustomerOrder.mock.calls[1][1]);
  });

  it('creates an AUTO voucher order with an explicit empty voucherIds list', async () => {
    const user = userEvent.setup();
    const dependencies = voucherDependencies();
    writeCheckoutCart();
    renderApp({ route: ROUTES.CUSTOMER_CHECKOUT, dependencies });

    await screen.findByRole('heading', { name: 'Voucher' });
    const placeOrder = screen.getByRole('button', { name: 'Đặt đơn COD' });
    await waitFor(() => expect(placeOrder).toBeEnabled());
    await user.click(placeOrder);

    await waitFor(() => expect(dependencies.order.createCustomerOrder).toHaveBeenCalledOnce());
    expect(dependencies.order.createCustomerOrder).toHaveBeenCalledWith(
      expect.objectContaining({ voucherIds: [], selectionMode: 'AUTO' }),
      expect.any(String),
    );
  });

  it('disables a second MANUAL voucher from the same layer', async () => {
    const user = userEvent.setup();
    const dependencies = voucherDependencies();
    writeCheckoutCart();
    renderApp({ route: ROUTES.CUSTOMER_CHECKOUT, dependencies });

    await screen.findByRole('heading', { name: 'Voucher' });
    await user.click(screen.getByRole('button', { name: 'Tự chọn' }));
    const first = await screen.findByRole('checkbox', { name: /PLATFORM10/ });
    const duplicateLayer = screen.getByRole('checkbox', { name: /PLATFORM20/ });
    await user.click(first);

    expect(first).toBeChecked();
    await waitFor(() => expect(duplicateLayer).toBeDisabled());
  });

  it('does not offer a shop voucher belonging to another restaurant', async () => {
    const dependencies = voucherDependencies([...platformVouchers, otherRestaurantVoucher]);
    writeCheckoutCart();
    renderApp({ route: ROUTES.CUSTOMER_CHECKOUT, dependencies });

    await screen.findByRole('heading', { name: 'Voucher' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tự chọn' }));

    expect(screen.queryByRole('checkbox', { name: /OTHER10/ })).not.toBeInTheDocument();
  });

  it('refreshes the checkout preview after collecting a voucher', async () => {
    const user = userEvent.setup();
    const dependencies = voucherDependencies([]);
    writeCheckoutCart();
    renderApp({ route: ROUTES.CUSTOMER_CHECKOUT, dependencies });

    await screen.findByRole('heading', { name: 'Voucher' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled());
    const checkoutPreview = vi.mocked(dependencies.order.checkoutPreview);
    const initialPreviewCalls = checkoutPreview.mock.calls.length;

    await user.type(screen.getByPlaceholderText('Nhập mã để lưu vào ví'), 'save10');
    await user.click(screen.getByRole('button', { name: 'Lưu mã' }));

    await waitFor(() => expect(dependencies.promotion.collectVoucher).toHaveBeenCalledWith('save10'));
    await waitFor(() => expect(checkoutPreview.mock.calls.length).toBeGreaterThan(initialPreviewCalls));
    expect(dependencies.promotion.getMyVouchers).toHaveBeenCalledTimes(2);
  });
});
