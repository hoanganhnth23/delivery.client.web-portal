import { expect, type Page, type Route } from '@playwright/test';

export type PortalRole = 'USER' | 'SHOP_OWNER' | 'ADMIN';

export type MockOptions = {
  role?: PortalRole;
  voucherEnabled?: boolean;
  strict?: boolean;
  orderStatus?: string;
};

export type MockResponse = {
  status?: number;
  message?: string | null;
  code?: string;
  details?: unknown;
  data?: unknown;
  delayMs?: number;
  abort?: boolean;
  raw?: unknown;
};

const userFor = (role: PortalRole) => ({
  id: role === 'USER' ? 501 : role === 'ADMIN' ? 1 : 101,
  email: role === 'USER' ? 'customer@e2e.test' : role === 'ADMIN' ? 'admin@e2e.test' : 'owner@e2e.test',
  name: role === 'USER' ? 'Customer E2E' : role === 'ADMIN' ? 'Admin E2E' : 'Owner E2E',
  role,
});

const restaurant = {
  id: 201,
  name: 'Bếp E2E',
  address: '1 Đường Test, TP.HCM',
  phone: '0900000001',
  openingHour: '08:00:00',
  closingHour: '22:00:00',
  image: '',
  latitude: 10.7769,
  longitude: 106.7009,
  description: 'Restaurant fixture',
  open: true,
  rating: 4.5,
  ratingCount: 10,
};

const menuItem = {
  id: 301,
  restaurantId: 201,
  name: 'Cơm E2E',
  description: 'Menu fixture',
  price: 50_000,
  image: '',
  status: 'AVAILABLE',
  createdAt: '2026-08-23T08:00:00Z',
  updatedAt: '2026-08-23T08:00:00Z',
};

const address = {
  id: 1001,
  userId: 501,
  label: 'Nhà',
  recipientName: 'Customer E2E',
  phoneNumber: '0900000002',
  addressLine: '2 Đường Khách',
  ward: 'Bến Nghé',
  district: 'Quận 1',
  city: 'TP.HCM',
  latitude: 10.78,
  longitude: 106.71,
  isDefault: true,
};

const order = {
  id: 401,
  userId: 501,
  restaurantId: 201,
  restaurantName: restaurant.name,
  restaurantAddress: restaurant.address,
  restaurantPhone: restaurant.phone,
  restaurantLat: 10.7769,
  restaurantLng: 106.7009,
  subtotalPrice: 50_000,
  discountAmount: 0,
  shippingFee: 15_000,
  totalPrice: 65_000,
  status: 'PENDING',
  paymentMethod: 'COD',
  deliveryAddress: '2 Đường Khách, TP.HCM',
  deliveryLat: address.latitude,
  deliveryLng: address.longitude,
  pickupLat: 10.7769,
  pickupLng: 106.7009,
  customerName: address.recipientName,
  customerPhone: address.phoneNumber,
  createdAt: '2026-08-23T08:00:00Z',
  updatedAt: '2026-08-23T08:00:00Z',
  items: [{ id: 601, menuItemId: menuItem.id, menuItemName: menuItem.name, quantity: 1, price: menuItem.price }],
};

const pendingShopVoucher = {
  id: 902,
  code: 'SHOPWAIT',
  name: 'Shop pending',
  description: 'Pending shop voucher fixture',
  creatorType: 'SHOP',
  rewardType: 'FIXED',
  discountValue: 5000,
  maxDiscountValue: null,
  totalQuantity: 10,
  usedQuantity: 0,
  startTime: '2026-08-23T08:00:00Z',
  endTime: '2026-08-30T08:00:00Z',
  minOrderValue: 0,
  scopeType: 'SHOP',
  scopeRefId: 201,
  active: false,
  approvalStatus: 'PENDING',
};

const page = <T>(items: T[], size = 20) => ({
  items, page: 0, size, totalItems: items.length, totalPages: items.length ? 1 : 0, hasNext: false,
});

const ok = (data: unknown) => ({ status: 1, message: null, data });

export class MockGateway {
  role: PortalRole;
  readonly voucherEnabled: boolean;
  readonly strict: boolean;
  readonly requests: Array<{ method: string; path: string; body: string; headers: Record<string, string> }> = [];
  readonly unexpectedRequests: Array<{ method: string; path: string }> = [];
  private failures = new Map<string, MockResponse>();
  private responseQueues = new Map<string, MockResponse[]>();
  private currentOrder = { ...order };

  constructor(options: MockOptions = {}) {
    this.role = options.role ?? 'USER';
    this.voucherEnabled = options.voucherEnabled ?? false;
    this.strict = options.strict ?? false;
    this.currentOrder = { ...order, status: options.orderStatus ?? order.status };
  }

  failNext(path: string, failure: MockResponse = { status: 500, message: 'E2E forced failure' }) {
    this.failures.set(path, failure);
  }

  queue(path: string, ...responses: MockResponse[]) {
    this.responseQueues.set(path, [...responses]);
  }

  delayNext(path: string, delayMs: number) {
    this.queue(path, { delayMs });
  }

  abortNext(path: string) {
    this.queue(path, { abort: true });
  }

  malformedNext(path: string, raw: unknown = { invalid: true }) {
    this.queue(path, { raw });
  }

  requestsFor(path: string) {
    return this.requests.filter((request) => request.path === path);
  }

  lastRequest(path: string) {
    return this.requestsFor(path).at(-1);
  }

  assertNoUnexpectedRequests() {
    expect(this.unexpectedRequests, `Unexpected API requests: ${JSON.stringify(this.unexpectedRequests)}`).toHaveLength(0);
  }

  private async applyResponse(route: Route, response: MockResponse) {
    if (response.delayMs) await new Promise((resolve) => setTimeout(resolve, response.delayMs));
    if (response.abort) return route.abort();
    if (Object.prototype.hasOwnProperty.call(response, 'raw')) {
      return route.fulfill({ status: response.status ?? 200, json: response.raw });
    }
    const status = response.status ?? 200;
    if (status >= 400) {
      return route.fulfill({
        status,
        json: {
          status: 0,
          message: response.message ?? 'E2E forced failure',
          data: response.data ?? null,
          error: response.code || response.details !== undefined
            ? { code: response.code, details: response.details }
            : null,
        },
      });
    }
    return route.fulfill({ json: ok(response.data ?? null) });
  }

  async install(page: Page) {
    page.on('pageerror', (error) => console.error(`[e2e pageerror] ${error.stack ?? error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') console.error(`[e2e console] ${message.text()}`);
    });
    await page.route('**/*', (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname.startsWith('/api/')) return this.handle(route);
      return route.continue();
    });
    await page.addInitScript(({ role }) => {
      localStorage.setItem('accessToken', 'e2e-access-token');
      localStorage.setItem('refreshToken', 'e2e-refresh-token');
      localStorage.setItem('userInfo', JSON.stringify({
        id: role === 'USER' ? 501 : role === 'ADMIN' ? 1 : 101,
        email: role === 'USER' ? 'customer@e2e.test' : role === 'ADMIN' ? 'admin@e2e.test' : 'owner@e2e.test',
        name: role === 'USER' ? 'Customer E2E' : role === 'ADMIN' ? 'Admin E2E' : 'Owner E2E',
        role,
      }));
      if (role === 'SHOP_OWNER') localStorage.setItem('currentRestaurantId', '201');
    }, { role: this.role });
  }

  async handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const body = request.postData() ?? '';
    this.requests.push({ method: request.method(), path, body, headers: request.headers() });

    const queued = this.responseQueues.get(path);
    if (queued?.length) {
      const response = queued.shift()!;
      if (!queued.length) this.responseQueues.delete(path);
      return this.applyResponse(route, response);
    }

    const failure = this.failures.get(path);
    if (failure) {
      this.failures.delete(path);
      return this.applyResponse(route, failure);
    }

    if (path === '/api/auth/login' && request.method() === 'POST') {
      const payload = JSON.parse(body || '{}') as { role?: PortalRole };
      this.role = payload.role ?? 'USER';
      return route.fulfill({ json: ok({ accessToken: 'e2e-access-token', refreshToken: 'e2e-refresh-token', authId: userFor(this.role).id, email: userFor(this.role).email, role: this.role }) });
    }

    let data: unknown = null;
    if (path === '/api/users' && request.method() === 'GET') data = userFor(this.role);
    else if (path === '/api/auth/refresh-token') data = { accessToken: 'e2e-access-rotated', refreshToken: 'e2e-refresh-rotated' };
    else if (path === '/api/restaurants' && request.method() === 'GET') data = [restaurant];
    else if (path === '/api/restaurants/search' && request.method() === 'GET') data = [restaurant];
    else if (/^\/api\/restaurants\/\d+$/.test(path) && request.method() === 'GET') data = restaurant;
    else if (path === '/api/restaurants/my-restaurants' && request.method() === 'GET') data = [restaurant];
    else if (/^\/api\/menu-items\/restaurant\/\d+\/available$/.test(path)) data = [menuItem];
    else if (path === '/api/menu-items/my-menu-items' && request.method() === 'GET') data = [menuItem];
    else if (path === '/api/menu-items' && request.method() === 'POST') data = { ...menuItem, id: 302 };
    else if (/^\/api\/menu-items\/\d+$/.test(path) && request.method() === 'PUT') data = menuItem;
    else if (path === '/api/addresses/users/501/addresses' && request.method() === 'GET') data = [address];
    else if (path === '/api/addresses/users/501/addresses' && request.method() === 'POST') data = address;
    else if (/^\/api\/addresses\/\d+$/.test(path) && request.method() === 'PUT') data = address;
    else if (/^\/api\/addresses\/\d+\/default$/.test(path)) data = address;
    else if (path === '/api/orders/checkout-preview' && request.method() === 'POST') data = { quoteId: '00000000-0000-4000-8000-000000000001', expiresAt: '2026-08-24T08:00:00Z', restaurantId: 201, restaurantName: restaurant.name, items: [{ menuItemId: 301, menuItemName: menuItem.name, unitPrice: menuItem.price, quantity: 1, lineTotal: menuItem.price }], subtotal: menuItem.price, shippingFee: 15_000, discountAmount: 0, totalPrice: 65_000, priceChanges: [], unavailableItemIds: [] };
    else if (path === '/api/orders' && request.method() === 'POST') data = this.currentOrder;
    else if (path === '/api/orders/my-orders' && request.method() === 'GET') data = page([this.currentOrder], 10);
    else if (path === '/api/orders/my-restaurant-orders' && request.method() === 'GET') data = page([this.currentOrder], 10);
    else if (/^\/api\/orders\/\d+$/.test(path) && request.method() === 'GET') data = this.currentOrder;
    else if (/^\/api\/orders\/\d+\/cancel$/.test(path)) { this.currentOrder = { ...this.currentOrder, status: 'CANCELLED' }; data = this.currentOrder; }
    else if (path === '/api/orders/all' || /^\/api\/orders\/status\//.test(path)) data = page([{ id: 401, userId: 501, restaurantId: 201, totalPrice: 65_000, status: this.currentOrder.status, createdAt: order.createdAt, updatedAt: order.updatedAt, paymentMethod: 'COD', deliveryAddress: order.deliveryAddress, shipperId: null }]);
    else if (path === '/api/shippers' && request.method() === 'GET') data = page([{ id: 701, userId: 702, fullName: 'Shipper E2E', phone: '0900000003', vehicleType: 'MOTORBIKE', licensePlate: '59-E2E', isOnline: true, rating: 4.8, completedDeliveries: 20, createdAt: order.createdAt }], 100);
    else if (path === '/api/shippers/online') data = [{ id: 701, userId: 702, fullName: 'Shipper E2E', phone: '0900000003', vehicleType: 'MOTORBIKE', licensePlate: '59-E2E', isOnline: true, rating: 4.8, completedDeliveries: 20, createdAt: order.createdAt }];
    else if (/^\/api\/restaurants\/\d+\/ratings$/.test(path)) data = [{ id: 801, restaurantId: 201, customerId: 501, orderId: 401, rating: 5, comment: 'Rất ngon', status: 'APPROVED', createdAt: order.createdAt }];
    else if (path === '/api/restaurants/admin/ratings') data = [{ id: 801, restaurantId: 201, customerId: 501, orderId: 401, rating: 5, comment: 'Rất ngon', status: 'PENDING', createdAt: order.createdAt }];
    else if (/\/api\/restaurants\/admin\/ratings\/\d+\/status/.test(path)) data = { id: 801, restaurantId: 201, customerId: 501, orderId: 401, rating: 5, comment: 'Rất ngon', status: 'APPROVED', createdAt: order.createdAt };
    else if (path === '/api/promotions/admin') data = [];
    else if (path === '/api/promotions/admin/pending-shop') data = [pendingShopVoucher];
    else if (path === '/api/promotions/platform' && request.method() === 'POST') data = { id: 901, code: 'E2E50', name: 'E2E coupon', description: 'Platform coupon fixture', creatorType: 'PLATFORM', rewardType: 'FIXED', discountValue: 5000, maxDiscountValue: null, totalQuantity: 10, usedQuantity: 0, startTime: '2026-08-23T08:00:00Z', endTime: '2026-08-30T08:00:00Z', minOrderValue: 0, scopeType: 'ALL', scopeRefId: null, active: true };
    else if (/\/approve$/.test(path) || /\/reject$/.test(path)) data = { ...pendingShopVoucher, active: path.endsWith('/approve'), approvalStatus: path.endsWith('/approve') ? 'APPROVED' : 'REJECTED' };
    else if (/^\/api\/promotions\/\d+$/.test(path)) data = null;
    else if (path === '/api/promotions/capability') data = { enabled: this.voucherEnabled, maxVouchers: 3, layers: ['SHOP_DISCOUNT', 'PLATFORM_DISCOUNT', 'FREESHIP'], selectionModes: ['AUTO', 'MANUAL'], conflictsWithFlashSale: true };
    else if (path === '/api/promotions/my-vouchers') data = [];
    else if (/^\/api\/promotions\/shop$/.test(path) && request.method() === 'GET') data = [];
    else if (/^\/api\/promotions\/shop$/.test(path) && request.method() === 'POST') data = { id: 902, code: 'SHOP50', name: 'Shop voucher', description: 'Shop voucher fixture', creatorType: 'SHOP', rewardType: 'FIXED', discountValue: 5000, maxDiscountValue: null, totalQuantity: 10, usedQuantity: 0, startTime: '2026-08-23T08:00:00Z', endTime: '2026-08-30T08:00:00Z', minOrderValue: 0, scopeType: 'SHOP', scopeRefId: 201, active: false, approvalStatus: 'PENDING' };
    else if (path === '/api/analytics/dashboard/admin') data = { overview: { totalOrders: 1, totalRevenue: 65_000, deliveredOrders: 0, cancelledOrders: 0, pendingOrders: 1, processingOrders: 0, avgOrderValue: 65_000, deliveryRate: 0 }, revenueTimeSeries: [{ label: 'Hôm nay', orderCount: 1, revenue: 65_000 }], orderTimeSeries: [{ label: 'Hôm nay', orderCount: 1, revenue: 65_000 }], statusBreakdown: [{ status: 'PENDING', count: 1 }], topRestaurants: [{ restaurantId: 201, restaurantName: restaurant.name, orderCount: 1, revenue: 65_000 }] };
    else if (path === '/api/flashsales/admin/campaigns' && request.method() === 'GET') data = [];
    else if (path === '/api/flashsales/admin/campaigns' && request.method() === 'POST') data = { id: 1001, name: 'E2E Flash Sale', isRecurring: false, startTime: '10:00:00', endTime: '12:00:00', status: 'UPCOMING' };
    else if (/^\/api\/flashsales\/admin\/campaigns\/\d+\/items$/.test(path)) data = [];
    else if (/^\/api\/flashsales/.test(path)) data = null;
    else if (/^\/api\/restaurants\/?$/.test(path) && request.method() === 'POST') data = restaurant;
    else if (/^\/api\/restaurants\/\d+$/.test(path) && request.method() === 'PUT') data = restaurant;
    else if (path === '/api/auth/register' || path === '/api/users/registrations') data = { principalId: 501, authId: 501, email: 'new@e2e.test', role: 'USER', provisioningToken: 'one-time', profileCreated: true };
    else if (path === '/api/auth/email-verification/confirm') data = null;
    else if (path === '/api/auth/logout') data = null;
    else {
      this.unexpectedRequests.push({ method: request.method(), path });
      if (this.strict) {
        return route.fulfill({ status: 599, json: { status: 0, message: `Unexpected E2E API route: ${request.method()} ${path}`, data: null } });
      }
      data = null;
    }

    return route.fulfill({ json: ok(data) });
  }
}

export async function gotoRole(page: Page, role: PortalRole, path: string, options: MockOptions = {}) {
  const backend = new MockGateway({ ...options, role });
  await backend.install(page);
  await page.goto(path);
  await expect(page.locator('body')).toBeVisible();
  return backend;
}
