import {
  getHandbookOperations,
  HANDBOOK_MANIFEST,
  type HandbookApiOperation,
  type HandbookSourceRef,
} from './handbookData';

export type FlowMode = 'happy' | 'failure';
export type FlowInteractionKind = 'http' | 'websocket' | 'event' | 'storage' | 'control';
export type FlowStepStatus = 'main' | 'decision' | 'terminal' | 'recovery';

export interface FlowEventSummary {
  id: string;
  topic: string;
  producer: string;
  consumers: string[];
  delivery: string;
  rule: string;
  source: HandbookSourceRef;
}

export interface FlowInteraction {
  id: string;
  kind: FlowInteractionKind;
  sourceStepId: string;
  targetStepId?: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
  apiOperationIds?: string[];
  eventIds?: string[];
  detail: string;
}

export interface FlowStep {
  id: string;
  sequence: number;
  phase: string;
  title: string;
  explanation: string;
  actor: string;
  serviceIds: string[];
  interactionIds: string[];
  apiOperationIds: string[];
  eventIds: string[];
  stateBefore?: string;
  stateAfter?: string;
  status: FlowStepStatus;
}

export interface FlowBranch {
  id: string;
  label: string;
  trigger: string;
  fromStepId: string;
  recovery: string;
  terminalOutcome: string;
  stepIds: string[];
  severity: 'warning' | 'error' | 'terminal';
}

export interface FlowExplorerDefinition {
  id: string;
  label: string;
  group: string;
  summary: string;
  audience: string[];
  status: 'active' | 'hidden' | 'experimental';
  successOutcome: string;
  steps: FlowStep[];
  interactions: FlowInteraction[];
  branches: FlowBranch[];
  source: HandbookSourceRef;
}

const source = (label: string, file: string, section: string): HandbookSourceRef => ({ label, file, section });

const operationIds = {
  authRegister: 'auth-service:AuthController.register:POST:/api/auth/register',
  authLogin: 'auth-service:AuthController.login:POST:/api/auth/login',
  authRefresh: 'auth-service:AuthController.refreshToken:POST:/api/auth/refresh-token',
  userRegister: 'user-service:UserController.registerUser:POST:/api/users/registrations',
  restaurants: 'restaurant-service:RestaurantController.getAll:GET:/api/restaurants',
  restaurantSearch: 'restaurant-service:RestaurantController.search:GET:/api/restaurants/search',
  searchRestaurants: 'search-service:SearchController.searchRestaurants:GET:/api/search/restaurants',
  restaurantCreate: 'restaurant-service:RestaurantController.create:POST:/api/restaurants',
  menuCreate: 'restaurant-service:MenuItemController.create:POST:/api/menu-items',
  validateOrder: 'restaurant-service:OrderValidationController.validateOrder:POST:/api/restaurants/validate/order',
  checkoutPreview: 'order-service:OrderController.checkoutPreview:POST:/api/orders/checkout-preview',
  createOrder: 'order-service:OrderController.createOrder:POST:/api/orders',
  confirmOrder: 'restaurant-service:RestaurantOrderController.confirmOrder:POST:/api/restaurants/orders/{orderId}/confirm',
  rejectOrder: 'restaurant-service:RestaurantOrderController.rejectOrder:POST:/api/restaurants/orders/{orderId}/reject',
  currentOffer: 'delivery-service:DeliveryController.getCurrentOffer:GET:/api/deliveries/offers/current',
  acceptDelivery: 'delivery-service:DeliveryController.acceptDelivery:POST:/api/deliveries/accept',
  updateDelivery: 'delivery-service:DeliveryController.updateStatus:PUT:/api/deliveries/{id}/status',
  cancelOrder: 'order-service:OrderController.cancelOrder:PUT:/api/orders/{id}/cancel',
  updateLocation: 'tracking-service:ShipperLocationController.updateLocation:POST:/api/tracking/shipper-locations/update',
  ratingEligibility: 'order-service:InternalOrderController.isRatingEligible:GET:/api/orders/internal/{orderId}/rating-eligibility',
  submitRating: 'restaurant-service:RestaurantRatingController.submitRating:POST:/api/restaurants/{restaurantId}/ratings',
} as const;

const event = (id: string, topic: string, producer: string, consumers: string[], delivery: string, rule: string): FlowEventSummary => ({
  id,
  topic,
  producer,
  consumers,
  delivery,
  rule,
  source: source('Events and data', 'docs/system/events-and-data.md', 'Active topic map'),
});

export const HANDBOOK_EVENTS: FlowEventSummary[] = [
  event('order.created', 'order.created', 'order-service', ['saga-service', 'notification-service'], 'Kafka at-least-once', 'Immutable order snapshot launches the workflow; consumers deduplicate by stable identity.'),
  event('restaurant.order-confirmed', 'restaurant.order-confirmed', 'restaurant-service', ['order-service', 'saga-service'], 'Kafka at-least-once', 'Decision fingerprint prevents contradictory replay.'),
  event('restaurant.order-rejected', 'restaurant.order-rejected', 'restaurant-service', ['order-service', 'saga-service'], 'Kafka at-least-once', 'Rejected order enters the canonical cancellation/compensation boundary.'),
  event('saga.command.create-delivery', 'saga.command.create-delivery', 'saga-service', ['delivery-service'], 'Kafka command', 'Stable command identity converges delivery creation exactly once.'),
  event('saga.command.find-shipper', 'saga.command.find-shipper', 'saga-service', ['match-service'], 'Kafka command', 'Matching keeps the original deadline across rematches.'),
  event('shipper.found', 'shipper.found', 'match-service', ['saga-service', 'delivery-service'], 'Kafka at-least-once', 'One candidate result reserves one shipper or returns an explicit no-match result.'),
  event('shipper.not-found', 'shipper.not-found', 'match-service', ['saga-service', 'delivery-service'], 'Kafka at-least-once', 'No shipper is a distinct terminal reason, not a generic cancellation.'),
  event('delivery.shipper-offered', 'delivery.shipper-offered', 'delivery-service', ['notification-service'], 'Kafka at-least-once', 'Offer is persisted before inbox/FCM wake-up.'),
  event('delivery.shipper-accepted', 'delivery.shipper-accepted', 'delivery-service', ['saga-service'], 'Kafka at-least-once', 'Accepted offer advances only through the delivery state machine.'),
  event('delivery.status-updated', 'delivery.status-updated', 'delivery-service', ['saga-service', 'notification-service'], 'Kafka at-least-once', 'Lifecycle status is the source for downstream notification and compensation.'),
  event('delivery.completed', 'delivery.completed', 'delivery-service', ['settlement-service'], 'Kafka at-least-once', 'Settlement acknowledges only after receipt and ledger commit.'),
  event('shipper.location-updated', 'shipper.location-updated', 'tracking-service', ['match-service', 'tracking history'], 'Kafka + Redis GEO', 'Live GEO is volatile; sampled history is support data only.'),
  event('entity-sync', 'entity-sync', 'restaurant-service', ['search-service'], 'Kafka projection', 'Search is rebuildable and never becomes business truth.'),
];

const interactions: FlowInteraction[] = [
  { id: 'cod-preview', kind: 'http', sourceStepId: 'cod-preview', targetStepId: 'cod-create', sourceNodeId: 'customer-app', targetNodeId: 'order-service', label: 'POST /api/orders/checkout-preview', apiOperationIds: [operationIds.checkoutPreview], detail: 'Gateway forwards a canonical quote request; the server owns totals and quote TTL.' },
  { id: 'cod-create', kind: 'http', sourceStepId: 'cod-create', targetStepId: 'cod-validate', sourceNodeId: 'customer-app', targetNodeId: 'order-service', label: 'POST /api/orders + Idempotency-Key', apiOperationIds: [operationIds.createOrder], eventIds: ['order.created'], detail: 'Order persists immutable money/location snapshot and an outbox record.' },
  { id: 'cod-validate', kind: 'http', sourceStepId: 'cod-validate', targetStepId: 'cod-decision', sourceNodeId: 'order-service', targetNodeId: 'restaurant-service', label: 'POST /api/restaurants/validate/order', apiOperationIds: [operationIds.validateOrder], detail: 'Order asks Restaurant to validate canonical menu and restaurant facts.' },
  { id: 'cod-decision', kind: 'http', sourceStepId: 'cod-decision', targetStepId: 'cod-saga', sourceNodeId: 'delivery-web', targetNodeId: 'restaurant-service', label: 'Confirm or reject order', apiOperationIds: [operationIds.confirmOrder, operationIds.rejectOrder], eventIds: ['restaurant.order-confirmed', 'restaurant.order-rejected'], detail: 'Owner decision and outbox commit atomically; the branch determines compensation.' },
  { id: 'cod-saga', kind: 'event', sourceStepId: 'cod-saga', targetStepId: 'cod-match', sourceNodeId: 'saga-service', targetNodeId: 'delivery-service', label: 'saga.command.create-delivery', eventIds: ['order.created', 'saga.command.create-delivery'], detail: 'Saga coordinates delivery creation instead of Order calling a shipper directly.' },
  { id: 'cod-match', kind: 'event', sourceStepId: 'cod-match', targetStepId: 'cod-offer', sourceNodeId: 'saga-service', targetNodeId: 'match-service', label: 'saga.command.find-shipper', eventIds: ['saga.command.find-shipper', 'shipper.found', 'shipper.not-found'], detail: 'Match selects one eligible candidate from Redis GEO and returns a deterministic result.' },
  { id: 'cod-offer', kind: 'http', sourceStepId: 'cod-offer', targetStepId: 'cod-accept', sourceNodeId: 'shipper-app', targetNodeId: 'delivery-service', label: 'GET /api/deliveries/offers/current', apiOperationIds: [operationIds.currentOffer], eventIds: ['delivery.shipper-offered'], detail: 'The current-offer endpoint is the shipper recovery point before accept.' },
  { id: 'cod-accept', kind: 'http', sourceStepId: 'cod-accept', targetStepId: 'cod-deliver', sourceNodeId: 'shipper-app', targetNodeId: 'delivery-service', label: 'POST /api/deliveries/accept', apiOperationIds: [operationIds.acceptDelivery], eventIds: ['delivery.shipper-accepted'], detail: 'Delivery persists acceptance before downstream state progression.' },
  { id: 'cod-deliver', kind: 'http', sourceStepId: 'cod-deliver', targetStepId: 'cod-settle', sourceNodeId: 'shipper-app', targetNodeId: 'delivery-service', label: 'PUT /api/deliveries/{id}/status', apiOperationIds: [operationIds.updateDelivery], eventIds: ['delivery.status-updated', 'delivery.completed'], detail: 'The delivery state machine converges through PICKED_UP, DELIVERING and DELIVERED.' },
  { id: 'cod-settle', kind: 'event', sourceStepId: 'cod-settle', sourceNodeId: 'delivery-service', targetNodeId: 'settlement-service', label: 'delivery.completed', eventIds: ['delivery.completed'], detail: 'Settlement writes receipt, immutable ledger and balance projection in one transaction.' },
];

const codSteps: FlowStep[] = [
  { id: 'cod-preview', sequence: 1, phase: 'Quote', title: 'Tính báo giá chuẩn', explanation: 'Customer gửi giỏ hàng và địa chỉ; Order Service tính subtotal, phí giao và quote TTL.', actor: 'Customer', serviceIds: ['order-service'], interactionIds: ['cod-preview'], apiOperationIds: [operationIds.checkoutPreview], eventIds: [], stateAfter: 'quote có TTL 5 phút', status: 'main' },
  { id: 'cod-create', sequence: 2, phase: 'Order', title: 'Tạo order immutable', explanation: 'Server kiểm tra quote, idempotency key và ghi snapshot tiền/vị trí cùng outbox.', actor: 'Customer', serviceIds: ['order-service'], interactionIds: ['cod-create'], apiOperationIds: [operationIds.createOrder], eventIds: ['order.created'], stateBefore: 'quote hợp lệ', stateAfter: 'Order = PENDING', status: 'main' },
  { id: 'cod-validate', sequence: 3, phase: 'Validation', title: 'Validate nhà hàng và menu', explanation: 'Order Service gọi Restaurant Service để xác nhận món, nhà hàng và điều kiện order.', actor: 'Platform', serviceIds: ['order-service', 'restaurant-service'], interactionIds: ['cod-validate'], apiOperationIds: [operationIds.validateOrder], eventIds: [], status: 'main' },
  { id: 'cod-decision', sequence: 4, phase: 'Decision', title: 'Nhà hàng confirm hoặc reject', explanation: 'Chủ nhà hàng quyết định nhận đơn. Quyết định được fingerprint để chống replay mâu thuẫn.', actor: 'Restaurant owner', serviceIds: ['restaurant-service', 'order-service'], interactionIds: ['cod-decision'], apiOperationIds: [operationIds.confirmOrder, operationIds.rejectOrder], eventIds: ['restaurant.order-confirmed', 'restaurant.order-rejected'], stateBefore: 'Order = PENDING', stateAfter: 'Order = CONFIRMED hoặc CANCELLED', status: 'decision' },
  { id: 'cod-saga', sequence: 5, phase: 'Orchestration', title: 'Saga tạo delivery', explanation: 'Saga nhận confirmation và phát command tạo Delivery; các aggregate không gọi trực tiếp lẫn nhau.', actor: 'Platform', serviceIds: ['saga-service', 'delivery-service'], interactionIds: ['cod-saga'], apiOperationIds: [], eventIds: ['saga.command.create-delivery'], stateAfter: 'Delivery = PENDING', status: 'main' },
  { id: 'cod-match', sequence: 6, phase: 'Matching', title: 'Tìm shipper phù hợp', explanation: 'Match Service lọc online/fresh/busy/offer từ Redis GEO và reserve một candidate.', actor: 'Platform', serviceIds: ['saga-service', 'match-service', 'redis'], interactionIds: ['cod-match'], apiOperationIds: [], eventIds: ['saga.command.find-shipper', 'shipper.found', 'shipper.not-found'], stateBefore: 'Delivery = FINDING_SHIPPER', stateAfter: 'Offer hoặc SHIPPER_NOT_FOUND', status: 'decision' },
  { id: 'cod-offer', sequence: 7, phase: 'Offer', title: 'Persist offer và đánh thức shipper', explanation: 'Delivery lưu offer/expiry trước khi Notification gửi inbox hoặc FCM wake-up.', actor: 'Platform', serviceIds: ['delivery-service', 'notification-service'], interactionIds: ['cod-offer'], apiOperationIds: [operationIds.currentOffer], eventIds: ['delivery.shipper-offered'], stateAfter: 'Delivery = WAIT_SHIPPER_CONFIRM', status: 'main' },
  { id: 'cod-accept', sequence: 8, phase: 'Assignment', title: 'Shipper accept offer', explanation: 'Shipper đọc offer hiện tại rồi accept. Delivery Service là authority của assignment.', actor: 'Shipper', serviceIds: ['delivery-service', 'shipper-service'], interactionIds: ['cod-accept'], apiOperationIds: [operationIds.acceptDelivery], eventIds: ['delivery.shipper-accepted'], stateBefore: 'WAIT_SHIPPER_CONFIRM', stateAfter: 'ASSIGNED', status: 'main' },
  { id: 'cod-deliver', sequence: 9, phase: 'Delivery', title: 'Cập nhật lifecycle giao hàng', explanation: 'Shipper cập nhật picked up, delivering và delivered theo state machine.', actor: 'Shipper', serviceIds: ['delivery-service'], interactionIds: ['cod-deliver'], apiOperationIds: [operationIds.updateDelivery], eventIds: ['delivery.status-updated', 'delivery.completed'], stateBefore: 'ASSIGNED', stateAfter: 'DELIVERED', status: 'terminal' },
  { id: 'cod-settle', sequence: 10, phase: 'Settlement', title: 'Đối soát COD', explanation: 'Settlement chỉ nhận delivery.completed sau DELIVERED và commit receipt/ledger/balance atomically.', actor: 'Platform', serviceIds: ['settlement-service'], interactionIds: ['cod-settle'], apiOperationIds: [], eventIds: ['delivery.completed'], stateAfter: 'COD ledger committed', status: 'terminal' },
];

const codBranches: FlowBranch[] = [
  { id: 'cod-quote-expired', label: 'Quote hết hạn hoặc đổi giá', trigger: 'PRICE_CHANGED / QUOTE_EXPIRED ở bước quote hoặc create order', fromStepId: 'cod-preview', recovery: 'Tính lại quote và yêu cầu Customer xác nhận lại trước khi retry.', terminalOutcome: 'Không tạo order với total cũ.', stepIds: ['cod-preview'], severity: 'warning' },
  { id: 'cod-restaurant-reject', label: 'Nhà hàng từ chối', trigger: 'Restaurant decision = rejected hoặc customer cancel trước fulfillment', fromStepId: 'cod-decision', recovery: 'Phát cancellation/compensation idempotent và lưu reason.', terminalOutcome: 'Order = CANCELLED.', stepIds: ['cod-decision'], severity: 'error' },
  { id: 'cod-no-shipper', label: 'Không tìm thấy shipper', trigger: 'Candidates/retries exhausted hoặc deadline matching hết hạn.', fromStepId: 'cod-match', recovery: 'Giữ terminal reason SHIPPER_NOT_FOUND và phát refund-eligible snapshot.', terminalOutcome: 'Không rewrite thành CANCELLED.', stepIds: ['cod-match'], severity: 'terminal' },
  { id: 'cod-replay', label: 'Duplicate hoặc replay mâu thuẫn', trigger: 'Event/business key lặp lại hoặc payload fingerprint khác.', fromStepId: 'cod-create', recovery: 'Exact duplicate là no-op; payload mâu thuẫn fail closed.', terminalOutcome: 'Không tạo side effect thứ hai.', stepIds: ['cod-create', 'cod-decision'], severity: 'error' },
];

export const FLOW_EXPLORER_FLOWS: FlowExplorerDefinition[] = [
  {
    id: 'cod-order', label: 'COD order → delivery', group: 'Core business', summary: 'Từ quote đến order, nhà hàng confirm, matching, offer, giao hàng và COD settlement.', audience: ['Customer', 'Restaurant owner', 'Shipper', 'Platform'], status: 'active', successOutcome: 'Order DELIVERED và COD ledger đã commit.', steps: codSteps, interactions, branches: codBranches, source: source('COD lifecycle', 'docs/system/workflows.md', 'COD order-to-delivery lifecycle'),
  },
  {
    id: 'registration', label: 'Registration & profile', group: 'Identity', summary: 'Tạo credential identity, profile và identity link qua các request retry-safe.', audience: ['Customer', 'Restaurant owner'], status: 'active', successOutcome: 'Account ACTIVE với profile được liên kết.', steps: [
      { id: 'registration-auth', sequence: 1, phase: 'Identity', title: 'Tạo credential identity', explanation: 'Auth Service tạo hoặc resume identity và trả registration handle/provisioning result.', actor: 'Customer', serviceIds: ['auth-service'], interactionIds: [], apiOperationIds: [operationIds.authRegister], eventIds: [], stateAfter: 'Identity = PENDING', status: 'main' },
      { id: 'registration-profile', sequence: 2, phase: 'Profile', title: 'Tạo profile người dùng', explanation: 'Client gửi profile handoff tới User Service; profile được tạo/resume theo principal identity.', actor: 'Customer', serviceIds: ['user-service'], interactionIds: [], apiOperationIds: [operationIds.userRegister], eventIds: [], stateAfter: 'Profile linked', status: 'main' },
      { id: 'registration-verify', sequence: 3, phase: 'Activation', title: 'Verify email và activate', explanation: 'Email verification hoàn tất lifecycle; login chỉ mở khi identity/profile requirements hợp lệ.', actor: 'Customer', serviceIds: ['auth-service', 'user-service'], interactionIds: [], apiOperationIds: [], eventIds: [], stateAfter: 'Account = ACTIVE', status: 'terminal' },
    ], interactions: [], branches: [
      { id: 'registration-partial', label: 'Crash giữa Auth và User', trigger: 'Request thứ hai chưa hoàn thành.', fromStepId: 'registration-profile', recovery: 'Retry theo principal identity; không tạo profile thứ hai.', terminalOutcome: 'Profile được resume idempotently.', stepIds: ['registration-profile'], severity: 'warning' },
      { id: 'registration-unverified', label: 'Email chưa verify', trigger: 'Login trước khi lifecycle ACTIVE.', fromStepId: 'registration-verify', recovery: 'Yêu cầu verify lại hoặc bắt đầu recovery flow.', terminalOutcome: 'Login bị chặn fail-closed.', stepIds: ['registration-verify'], severity: 'error' },
    ], source: source('Auth workflow', 'docs/system/workflows.md', 'Password registration'),
  },
  {
    id: 'authenticated-request', label: 'Authenticated request & refresh', group: 'Security', summary: 'Client qua Gateway, resource service tự verify JWT/JWKS, role và ownership.', audience: ['All clients', 'Platform'], status: 'active', successOutcome: 'Request được authorize và trả response qua Gateway.', steps: [
      { id: 'auth-gateway', sequence: 1, phase: 'Edge', title: 'Forward protected request', explanation: 'Gateway rate-limit, CORS và forward Authorization tới resource service.', actor: 'Client', serviceIds: ['gateway'], interactionIds: [], apiOperationIds: [operationIds.authLogin], eventIds: [], status: 'main' },
      { id: 'auth-resource', sequence: 2, phase: 'Authorization', title: 'Verify token và ownership', explanation: 'Resource service validate issuer, audience, token type, role và resource ownership.', actor: 'Platform', serviceIds: ['auth-service', 'gateway'], interactionIds: [], apiOperationIds: [], eventIds: [], stateAfter: 'Authorized request', status: 'main' },
      { id: 'auth-response', sequence: 3, phase: 'Response', title: 'Trả response qua Gateway', explanation: 'Response quay lại client; access token không bị Gateway tự thay đổi.', actor: 'Resource service', serviceIds: ['gateway'], interactionIds: [], apiOperationIds: [], eventIds: [], status: 'terminal' },
    ], interactions: [], branches: [
      { id: 'auth-refresh', label: '401 và refresh một lần', trigger: 'Access token hết hạn hoặc không hợp lệ.', fromStepId: 'auth-resource', recovery: 'Client gọi refresh-token một lần, lưu token mới rồi retry request một lần.', terminalOutcome: 'Nếu refresh fail, kết thúc session.', stepIds: ['auth-resource'], severity: 'warning' },
      { id: 'auth-forbidden', label: 'Sai role hoặc ownership', trigger: 'Token hợp lệ nhưng không có quyền resource.', fromStepId: 'auth-resource', recovery: 'Không retry nghiệp vụ; trả 403.', terminalOutcome: 'Không lộ dữ liệu resource.', stepIds: ['auth-resource'], severity: 'error' },
    ], source: source('Security workflow', 'docs/system/workflows.md', 'Authenticated request and refresh'),
  },
  {
    id: 'catalog-search', label: 'Catalog & search', group: 'Commerce', summary: 'Khám phá nhà hàng/menu và truy vấn search projection qua Gateway.', audience: ['Anonymous', 'Customer'], status: 'active', successOutcome: 'Danh sách catalog hoặc search result được trả về.', steps: [
      { id: 'catalog-browse', sequence: 1, phase: 'Browse', title: 'Đọc catalog nhà hàng', explanation: 'Client gọi public catalog endpoint để lấy nhà hàng/menu được phép hiển thị.', actor: 'Anonymous', serviceIds: ['restaurant-service'], interactionIds: [], apiOperationIds: [operationIds.restaurants], eventIds: [], status: 'main' },
      { id: 'catalog-search', sequence: 2, phase: 'Search', title: 'Tìm kiếm projection', explanation: 'Search Service truy vấn projection; projection được cập nhật từ entity-sync.', actor: 'Customer', serviceIds: ['search-service', 'restaurant-service'], interactionIds: [], apiOperationIds: [operationIds.searchRestaurants, operationIds.restaurantSearch], eventIds: ['entity-sync'], status: 'terminal' },
    ], interactions: [], branches: [
      { id: 'catalog-stale', label: 'Projection stale hoặc rỗng', trigger: 'Search projection chưa nhận entity-sync.', fromStepId: 'catalog-search', recovery: 'Fallback catalog bounded hoặc báo kết quả chưa sẵn sàng.', terminalOutcome: 'Search không trở thành business truth.', stepIds: ['catalog-search'], severity: 'warning' },
    ], source: source('Catalog and search', 'docs/system/service-catalog.md', 'Ownership map'),
  },
  {
    id: 'restaurant-management', label: 'Restaurant & menu management', group: 'Commerce', summary: 'Owner/admin cập nhật hồ sơ, menu và quyết định order trong boundary nhà hàng.', audience: ['Restaurant owner', 'Admin'], status: 'active', successOutcome: 'Restaurant/menu state được ghi bởi restaurant-service.', steps: [
      { id: 'restaurant-profile', sequence: 1, phase: 'Ownership', title: 'Cập nhật restaurant profile', explanation: 'Owner gửi mutation qua Gateway; Restaurant Service kiểm tra ownership trước khi ghi.', actor: 'Restaurant owner', serviceIds: ['delivery-web', 'restaurant-service'], interactionIds: [], apiOperationIds: [operationIds.restaurantCreate], eventIds: [], status: 'main' },
      { id: 'restaurant-menu', sequence: 2, phase: 'Catalog', title: 'Quản lý menu', explanation: 'Menu item được tạo/cập nhật trong cùng service sở hữu restaurant catalog.', actor: 'Restaurant owner', serviceIds: ['restaurant-service'], interactionIds: [], apiOperationIds: [operationIds.menuCreate], eventIds: ['entity-sync'], status: 'terminal' },
    ], interactions: [], branches: [
      { id: 'restaurant-forbidden', label: 'Sai ownership', trigger: 'Actor không sở hữu restaurant.', fromStepId: 'restaurant-profile', recovery: 'Resource service trả 403, không ghi dữ liệu.', terminalOutcome: 'Catalog giữ nguyên.', stepIds: ['restaurant-profile'], severity: 'error' },
    ], source: source('Restaurant portal', 'delivery_web/APP_FEATURES.md', 'Restaurant portal'),
  },
  {
    id: 'tracking', label: 'Realtime tracking', group: 'Realtime', summary: 'Shipper publish location; viewer được authorize theo delivery room.', audience: ['Shipper', 'Customer'], status: 'active', successOutcome: 'Viewer nhận location hiện tại theo room được authorize.', steps: [
      { id: 'tracking-connect', sequence: 1, phase: 'Connect', title: 'Mở WebSocket', explanation: 'Shipper handshake qua Gateway; Tracking validate bearer và publisher generation.', actor: 'Shipper', serviceIds: ['shipper-app', 'gateway', 'tracking-service'], interactionIds: [], apiOperationIds: [], eventIds: [], status: 'main' },
      { id: 'tracking-publish', sequence: 2, phase: 'Publish', title: 'Cập nhật location', explanation: 'Tracking ghi GEO/lease trong Redis và phát location update cho Match/history.', actor: 'Shipper', serviceIds: ['tracking-service', 'redis', 'match-service'], interactionIds: [], apiOperationIds: [operationIds.updateLocation], eventIds: ['shipper.location-updated'], status: 'main' },
      { id: 'tracking-view', sequence: 3, phase: 'View', title: 'Fan-out location tới viewer', explanation: 'Delivery kiểm tra participant access trước khi viewer join room và nhận latest location.', actor: 'Customer', serviceIds: ['tracking-service', 'delivery-service'], interactionIds: [], apiOperationIds: [], eventIds: [], status: 'terminal' },
    ], interactions: [], branches: [
      { id: 'tracking-stale', label: 'Stale publisher generation', trigger: 'Socket cũ gửi location sau khi socket mới đã active.', fromStepId: 'tracking-publish', recovery: 'Reject update theo lease/generation fence.', terminalOutcome: 'Location mới không bị ghi đè.', stepIds: ['tracking-publish'], severity: 'error' },
      { id: 'tracking-reconnect', label: 'Socket reconnect', trigger: 'Network disconnect hoặc Redis state mất.', fromStepId: 'tracking-connect', recovery: 'Client reconnect và publish generation mới; không restore stale GEO.', terminalOutcome: 'Viewer nhận latest fresh state.', stepIds: ['tracking-connect', 'tracking-publish'], severity: 'warning' },
    ], source: source('Tracking workflow', 'docs/system/workflows.md', 'Tracking and realtime delivery visibility'),
  },
  {
    id: 'rating', label: 'Rating & moderation', group: 'Supporting', summary: 'Customer submit rating theo eligibility; owner/admin đọc và moderation trong restaurant boundary.', audience: ['Customer', 'Restaurant owner', 'Admin'], status: 'active', successOutcome: 'Rating được ghi và hiển thị theo status policy.', steps: [
      { id: 'rating-eligibility', sequence: 1, phase: 'Eligibility', title: 'Kiểm tra đủ điều kiện', explanation: 'Order Service xác nhận customer/order có đủ điều kiện rating.', actor: 'Customer', serviceIds: ['order-service'], interactionIds: [], apiOperationIds: [operationIds.ratingEligibility], eventIds: [], status: 'main' },
      { id: 'rating-submit', sequence: 2, phase: 'Write', title: 'Submit rating', explanation: 'Restaurant Service sở hữu rating state và ghi rating theo order/restaurant boundary.', actor: 'Customer', serviceIds: ['restaurant-service'], interactionIds: [], apiOperationIds: [operationIds.submitRating], eventIds: [], status: 'terminal' },
    ], interactions: [], branches: [
      { id: 'rating-ineligible', label: 'Không đủ điều kiện', trigger: 'Order/customer không match policy.', fromStepId: 'rating-eligibility', recovery: 'Từ chối mutation, không tạo rating.', terminalOutcome: 'Không có side effect.', stepIds: ['rating-eligibility'], severity: 'error' },
    ], source: source('Rating boundary', 'delivery_web/APP_FEATURES.md', 'Admin portal / Restaurant portal'),
  },
  {
    id: 'settlement', label: 'COD settlement', group: 'Finance', summary: 'Settlement xử lý delivery.completed thành receipt, immutable ledger và balances.', audience: ['Platform', 'Admin'], status: 'active', successOutcome: 'Receipt và ledger commit sau delivery.completed.', steps: [
      { id: 'settlement-event', sequence: 1, phase: 'Consume', title: 'Nhận delivery.completed', explanation: 'Settlement validate COD, identity và money conservation trước khi side effect.', actor: 'Platform', serviceIds: ['delivery-service', 'settlement-service'], interactionIds: [], apiOperationIds: [], eventIds: ['delivery.completed'], status: 'main' },
      { id: 'settlement-commit', sequence: 2, phase: 'Commit', title: 'Commit receipt và ledger', explanation: 'Receipt, ledger entries và balance projection commit cùng transaction.', actor: 'Platform', serviceIds: ['settlement-service', 'postgresql'], interactionIds: [], apiOperationIds: [], eventIds: [], stateAfter: 'Settlement committed', status: 'terminal' },
    ], interactions: [], branches: [
      { id: 'settlement-duplicate', label: 'Duplicate event', trigger: 'Cùng event hoặc business key được replay.', fromStepId: 'settlement-event', recovery: 'Dedup receipt biến exact duplicate thành no-op.', terminalOutcome: 'Không nhân đôi ledger.', stepIds: ['settlement-event'], severity: 'warning' },
      { id: 'settlement-conflict', label: 'Payload mismatch', trigger: 'Cùng identity nhưng payload khác hoặc amount mismatch.', fromStepId: 'settlement-event', recovery: 'Rollback/retry/DLT và operator reconciliation.', terminalOutcome: 'Fail closed, không ACK thành công.', stepIds: ['settlement-event'], severity: 'error' },
    ], source: source('Settlement workflow', 'docs/system/workflows.md', 'COD settlement'),
  },
  {
    id: 'gated-boundaries', label: 'Gated & experimental boundaries', group: 'Boundary', summary: 'Các capability có source/schema nhưng chưa được coi là public MVP contract.', audience: ['Platform', 'Admin'], status: 'hidden', successOutcome: 'Capability vẫn được phân loại, không bị suy diễn thành active.', steps: [
      { id: 'gated-source', sequence: 1, phase: 'Source', title: 'Capability tồn tại trong source', explanation: 'Controller/schema/provider boundary có thể được catalog nhưng chưa đủ evidence public.', actor: 'Platform', serviceIds: ['promotion-service', 'flashsale-service', 'analytics-service', 'livestream-service'], interactionIds: [], apiOperationIds: [], eventIds: [], status: 'main' },
      { id: 'gated-closed', sequence: 2, phase: 'Policy', title: 'Gateway surface đóng', explanation: 'Checkout relay hoặc public route giữ off cho tới khi có owner policy và rollout proof.', actor: 'Platform', serviceIds: ['gateway'], interactionIds: [], apiOperationIds: [], eventIds: [], status: 'terminal' },
    ], interactions: [], branches: [], source: source('Capability safety', 'docs/system/service-catalog.md', 'Hidden capability safety rule'),
  },
];

const byId = new Map(FLOW_EXPLORER_FLOWS.map((flow) => [flow.id, flow]));
const eventById = new Map(HANDBOOK_EVENTS.map((item) => [item.id, item]));

export const getFlow = (id: string | null | undefined): FlowExplorerDefinition => byId.get(id ?? '') ?? FLOW_EXPLORER_FLOWS[0];
export const getFlowEvent = (id: string): FlowEventSummary | undefined => eventById.get(id);
export const getFlowOperation = (id: string): HandbookApiOperation | undefined => getHandbookOperations().find((item) => item.id === id);
export const getFlowStep = (flow: FlowExplorerDefinition, id: string | null | undefined): FlowStep => flow.steps.find((step) => step.id === id) ?? flow.steps[0];
export const getFlowInteraction = (flow: FlowExplorerDefinition, id: string): FlowInteraction | undefined => flow.interactions.find((item) => item.id === id);
export const getFlowForService = (serviceId: string): FlowExplorerDefinition[] => FLOW_EXPLORER_FLOWS.filter((flow) => flow.steps.some((step) => step.serviceIds.includes(serviceId)));
export const getFlowOperationCount = (flow: FlowExplorerDefinition): number => new Set(flow.steps.flatMap((step) => step.apiOperationIds)).size;

export const flowDataIntegrity = (): string[] => {
  const errors: string[] = [];
  for (const flow of FLOW_EXPLORER_FLOWS) {
    const stepIds = new Set(flow.steps.map((step) => step.id));
    for (const step of flow.steps) {
      for (const operationId of step.apiOperationIds) if (!getFlowOperation(operationId)) errors.push(`${flow.id}/${step.id} missing operation ${operationId}`);
      for (const eventId of step.eventIds) if (!getFlowEvent(eventId)) errors.push(`${flow.id}/${step.id} missing event ${eventId}`);
      for (const interactionId of step.interactionIds) if (!getFlowInteraction(flow, interactionId)) errors.push(`${flow.id}/${step.id} missing interaction ${interactionId}`);
    }
    for (const branch of flow.branches) {
      if (!stepIds.has(branch.fromStepId)) errors.push(`${flow.id}/${branch.id} missing fromStep ${branch.fromStepId}`);
      for (const stepId of branch.stepIds) if (!stepIds.has(stepId)) errors.push(`${flow.id}/${branch.id} missing step ${stepId}`);
    }
  }
  return errors;
};

export const handbookContractHints: Record<string, { request: string; response: string; auth: string; errors: string[] }> = {
  [operationIds.checkoutPreview]: { request: 'CheckoutPreviewRequest · restaurantId, delivery coordinates, items', response: 'CheckoutPreviewResponse · quoteId, expiresAt, totals, priceChanges', auth: 'Bearer customer', errors: ['PRICE_CHANGED', 'QUOTE_EXPIRED'] },
  [operationIds.createOrder]: { request: 'CreateOrderRequest · quoteId, delivery snapshot, COD items', response: 'OrderResponse · immutable order snapshot', auth: 'Bearer customer + Idempotency-Key', errors: ['QUOTE_MISMATCH', 'IDEMPOTENCY_IN_PROGRESS'] },
  [operationIds.confirmOrder]: { request: 'orderId + decision context', response: 'Decision/outbox result', auth: 'Bearer restaurant owner', errors: ['403 ownership', 'contradictory replay'] },
  [operationIds.rejectOrder]: { request: 'orderId + rejection reason', response: 'Decision/outbox result', auth: 'Bearer restaurant owner', errors: ['403 ownership', 'already decided'] },
  [operationIds.currentOffer]: { request: 'No body · current authenticated shipper', response: 'DeliveryOfferResponse · offer/expiry/order', auth: 'Bearer shipper', errors: ['404 no current offer'] },
  [operationIds.acceptDelivery]: { request: 'AcceptDeliveryRequest · deliveryId/offer identity', response: 'DeliveryResponse · ASSIGNED', auth: 'Bearer shipper', errors: ['expired offer', 'stale offer identity'] },
  [operationIds.updateDelivery]: { request: 'Status transition + location context', response: 'DeliveryResponse · next state', auth: 'Bearer shipper', errors: ['invalid transition', 'stale version'] },
};

export const explorerOperationCount = new Set(FLOW_EXPLORER_FLOWS.flatMap((flow) => flow.steps.flatMap((step) => step.apiOperationIds))).size;
export const explorerEventCount = new Set(FLOW_EXPLORER_FLOWS.flatMap((flow) => flow.steps.flatMap((step) => step.eventIds))).size;
export const explorerSource = HANDBOOK_MANIFEST.sourceRefs;
