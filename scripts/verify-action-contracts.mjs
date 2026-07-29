import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
};

const failures = [];

const assertContains = (relativePath, snippets, label) => {
  const source = read(relativePath);
  for (const snippet of snippets) {
    if (!source.includes(snippet)) {
      failures.push(`${label}: ${relativePath} is missing ${JSON.stringify(snippet)}`);
    }
  }
};

const assertNotContains = (relativePath, snippets, label) => {
  const source = read(relativePath);
  for (const snippet of snippets) {
    if (source.includes(snippet)) {
      failures.push(`${label}: ${relativePath} must not contain ${JSON.stringify(snippet)}`);
    }
  }
};

const assertPattern = (relativePath, patterns, label) => {
  const source = read(relativePath);
  for (const pattern of patterns) {
    if (!pattern.test(source)) {
      failures.push(`${label}: ${relativePath} does not match ${pattern}`);
    }
  }
};

const assertRemoved = (relativePath, label) => {
  if (fs.existsSync(path.join(root, relativePath))) {
    failures.push(`${label}: ${relativePath} should stay removed for MVP`);
  }
};

const assertNoFiles = (relativeDir, label) => {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return;
  const stack = [absoluteDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      failures.push(`${label}: ${path.relative(root, absolute)} should stay removed for MVP`);
    }
  }
};

const assertTreeClean = (relativeDir, forbiddenPatterns, label) => {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return;

  const stack = [absoluteDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
        stack.push(absolute);
        continue;
      }
      if (!/\.(ts|tsx|js|jsx|css|html)$/.test(entry.name)) continue;
      const relativePath = path.relative(root, absolute);
      const source = fs.readFileSync(absolute, 'utf8');
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(source)) {
          failures.push(`${label}: ${relativePath} contains forbidden ${pattern}`);
        }
      }
    }
  }
};

// Auth/login/logout actions.
assertContains('src/services/api/endpoints.ts', [
  "LOGIN: '/api/auth/login'",
  "REFRESH_TOKEN: '/api/auth/refresh-token'",
  "LOGOUT: '/api/auth/logout'",
  "GET_PROFILE: '/api/users'",
], 'auth endpoints');

assertContains('src/modules/auth/pages/LoginPageV2.tsx', [
  'role: USER_ROLES.RESTAURANT_OWNER',
  'navigate(ROUTES.RESTAURANT_DASHBOARD)',
  'type="submit"',
], 'restaurant-owner login action');

assertContains('src/modules/auth/pages/AdminLoginPage.tsx', [
  'role: USER_ROLES.ADMIN',
  'navigate(ROUTES.ADMIN_DASHBOARD, { replace: true })',
  'type="submit"',
], 'admin login action');

assertContains('src/components/layouts/AdminLayout.tsx', [
  'await logout();',
  'navigate(ROUTES.ADMIN_LOGIN, { replace: true })',
  'onClick={() => void handleLogout()}',
], 'admin logout action');

assertContains('src/components/layout/RestaurantHeader.tsx', [
  'await logout();',
  'navigate(ROUTES.LOGIN, { replace: true })',
  'onClick={() => void handleLogout()}',
], 'restaurant logout action');

// Restaurant order decision actions.
assertContains('src/services/api/endpoints.ts', [
  'CONFIRM_ORDER: (orderId: number) => `/api/restaurants/orders/${orderId}/confirm`',
  'REJECT_ORDER: (orderId: number) => `/api/restaurants/orders/${orderId}/reject`',
  "GET_MY_ORDERS: '/api/orders/my-restaurant-orders'",
], 'restaurant order endpoints');

assertContains('src/modules/restaurant/services/orderService.ts', [
  'API_ENDPOINTS.RESTAURANT.CONFIRM_ORDER(orderId)',
  '{ restaurantId, estimatedPrepTime }',
  "['CONFIRMED'] as const",
  'API_ENDPOINTS.RESTAURANT.REJECT_ORDER(orderId)',
  '{ restaurantId, reason }',
  "['REJECTED'] as const",
  "requireEnum(order.paymentMethod, ['COD'] as const",
], 'restaurant order service contract');

assertContains('src/modules/restaurant/pages/RestaurantOrders.tsx', [
  "order.status === 'PENDING'",
  'onClick={() => handleConfirm(order.id, order.restaurantId)}',
  'onClick={() => handleReject(order.id, order.restaurantId)}',
  'refreshAfterDecision(orderId)',
  "window.prompt('Lý do từ chối đơn hàng?')?.trim()",
  "value: 'PENDING'",
  "value: 'FINDING_SHIPPER'",
  "value: 'WAIT_SHIPPER_CONFIRM'",
  "value: 'SHIPPER_NOT_FOUND'",
], 'restaurant order page actions');

// Restaurant profile/menu ownership actions.
assertContains('src/services/api/endpoints.ts', [
  "CREATE: '/api/restaurants'",
  'UPDATE: (id: number) => `/api/restaurants/${id}`',
  "GET_MY_RESTAURANTS: '/api/restaurants/my-restaurants'",
  "CREATE: '/api/menu-items'",
  'UPDATE: (id: number) => `/api/menu-items/${id}`',
  'DELETE: (id: number) => `/api/menu-items/${id}`',
  "GET_MY_MENU_ITEMS: '/api/menu-items/my-menu-items'",
], 'restaurant/menu endpoints');

assertContains('src/modules/restaurant/components/RestaurantForm.tsx', [
  'await updateRestaurant(restaurant.id, request, { skipRedirect: true })',
  'await createRestaurant(request, { skipRedirect: true })',
  'type="submit"',
], 'restaurant profile create/update action');

assertContains('src/modules/restaurant/components/MenuItemForm.tsx', [
  'await updateMenuItem(menuItem.id, submitData, { skipRedirect: true })',
  'await createMenuItem(submitData, { skipRedirect: true })',
  'type="submit"',
], 'menu create/update action');

assertContains('src/modules/restaurant/pages/MenuManagement.tsx', [
  'onClick={handleCreate}',
  'onClick={() => handleEdit(item)}',
  'onClick={() => void handleDelete(item.id)}',
], 'menu management buttons');

assertContains('src/modules/restaurant/services/menuService.ts', [
  'apiClient.post(API_ENDPOINTS.MENU.CREATE, data)',
  'apiClient.put(API_ENDPOINTS.MENU.UPDATE(id), data)',
  'apiClient.delete(API_ENDPOINTS.MENU.DELETE(id))',
  "['AVAILABLE', 'SOLD_OUT', 'DISCONTINUED'] as const",
], 'menu service contract');

// Admin read/moderation actions.
assertContains('src/services/api/endpoints.ts', [
  "GET_ALL_ADMIN: '/api/orders/all'",
  "GET_ALL: '/api/shippers'",
  "GET_ONLINE: '/api/shippers/online'",
  "ADMIN_GET_ALL_RATINGS: '/api/restaurants/admin/ratings'",
  'ADMIN_UPDATE_RATING_STATUS: (id: number) => `/api/restaurants/admin/ratings/${id}/status`',
  "CREATE_PLATFORM: '/api/promotions/platform'",
  "ADMIN_GET_ALL: '/api/promotions/admin'",
  'DELETE: (id: number) => `/api/promotions/${id}`',
  "CREATE_CAMPAIGN: '/api/flashsales/admin/campaigns'",
  "GET_ALL_CAMPAIGNS: '/api/flashsales/admin/campaigns'",
  'UPDATE_CAMPAIGN_STATUS: (id: number) => `/api/flashsales/admin/campaigns/${id}/status`',
  'APPROVE_ITEM: (id: number) => `/api/flashsales/admin/items/${id}/approve`',
], 'admin endpoints');

assertContains('src/modules/admin/pages/AdminRatingsPage.tsx', [
  "handleUpdateStatus(rating.id, 'APPROVED')",
  "handleUpdateStatus(rating.id, 'REJECTED')",
  'adminService.updateRatingStatus(ratingId, status)',
], 'admin rating moderation actions');

assertContains('src/modules/admin/pages/AdminCouponsPage.tsx', [
  'await adminService.createCoupon(newCoupon)',
  'await adminService.deleteCoupon(id)',
  "confirm('Bạn có chắc muốn xóa coupon này?')",
  'type="submit"',
], 'admin coupon actions');

assertContains('src/modules/admin/pages/AdminFlashSalePage.tsx', [
  'await flashSaleAdminService.createCampaign(payload)',
  "handleUpdateStatus(campaign.id, 'ACTIVE')",
  "handleUpdateStatus(campaign.id, 'ENDED')",
  'handleApproveItem(item.id)',
  'type="submit"',
], 'admin flash-sale actions');

assertContains('src/services/api/adminService.ts', [
  'apiClient.put(API_ENDPOINTS.RESTAURANT.ADMIN_UPDATE_RATING_STATUS(ratingId), null',
  'params: { status }',
  'apiClient.post(API_ENDPOINTS.PROMOTION.CREATE_PLATFORM, data)',
  'apiClient.delete(API_ENDPOINTS.PROMOTION.DELETE(id))',
], 'admin service action contract');

assertContains('src/services/api/flashSaleService.ts', [
  'apiClient.post(API_ENDPOINTS.FLASHSALE.ADMIN.CREATE_CAMPAIGN, data)',
  'apiClient.put(API_ENDPOINTS.FLASHSALE.ADMIN.UPDATE_CAMPAIGN_STATUS(id), null',
  'apiClient.put(API_ENDPOINTS.FLASHSALE.ADMIN.APPROVE_ITEM(id))',
], 'flash-sale service action contract');

// Shipper admin page is intentionally read/filter only for MVP.
assertContains('src/modules/admin/pages/AdminShippersPage.tsx', [
  'adminService.fetchAllShippers',
  'adminService.fetchOnlineShippers',
  'onClick={() => setFilter(tab.key)}',
], 'admin shipper read/filter action');

assertNotContains('src/modules/admin/pages/AdminShippersPage.tsx', [
  'blockShipper',
  'unblockShipper',
  '/block',
  '/unblock',
  'deleteShipper',
], 'admin shipper unsupported mutations');

// Hidden/unsupported MVP graphs must stay unreachable from web.
for (const removedPath of [
  'src/config/firebase.ts',
  'src/types/chat.types.ts',
  'src/modules/restaurant/pages/SettlementPage.tsx',
  'src/modules/restaurant/services/settlementService.ts',
  'src/modules/admin/pages/AdminWithdrawalsPage.tsx',
  'src/modules/admin/pages/tracking/AdminShipperTrackingPage.tsx',
  'src/services/tracking/shipperLocationSocket.ts',
]) {
  assertRemoved(removedPath, 'hidden MVP graph');
}
assertNoFiles('src/modules/chat', 'hidden MVP graph');
assertNoFiles('src/modules/livestream', 'hidden MVP graph');

assertNotContains('src/App.tsx', [
  '/admin/chat',
  '/restaurant/chat',
  '/livestream',
  '/settlement',
  '/tracking',
  'ChatWidget',
  'ChatProvider',
], 'visible route cleanup');

assertTreeClean('src', [
  /firebase/i,
  /sockjs/i,
  /stomp/i,
  /['"`]\/api\/api/,
  /localhost:(?!8079)\d{4}/,
  /127\.0\.0\.1:(?!8079)\d{4}/,
], 'web transport and hidden graph scan');

if (failures.length > 0) {
  console.error(`Web action contract verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Web action contract verification passed.');
