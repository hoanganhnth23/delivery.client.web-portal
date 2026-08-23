import {
  getSystemConnections,
  SYSTEM_CONNECTIONS,
  SYSTEM_NODES,
  type SystemConnection,
  type SystemNode,
} from '@/modules/admin/data/systemOverviewData';
import { HANDBOOK_SOURCE_SNAPSHOT } from './generatedSourceSnapshot';

export type HandbookStatus =
  | 'active'
  | 'protected'
  | 'internal'
  | 'hidden'
  | 'disabled'
  | 'experimental'
  | 'test-only'
  | 'decision-required';

export type HandbookClassification =
  | 'public'
  | 'protected'
  | 'internal'
  | 'dev-only'
  | 'experimental'
  | 'gated';

export type HandbookSection =
  | 'overview'
  | 'capabilities'
  | 'actors'
  | 'workflows'
  | 'architecture'
  | 'services'
  | 'apis'
  | 'operations';

export interface HandbookSourceRef {
  label: string;
  file: string;
  section: string;
}

export interface HandbookActor {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  clientIds: string[];
  capabilityIds: string[];
}

export interface HandbookCapability {
  id: string;
  label: string;
  group: string;
  summary: string;
  actors: string[];
  clients: string[];
  services: string[];
  workflows: string[];
  status: HandbookStatus;
  classification: HandbookClassification;
  source: HandbookSourceRef;
}

export interface HandbookWorkflowStep {
  id: string;
  label: string;
  actor: string;
  service: string;
  transport: string;
  detail: string;
  status: 'main' | 'branch' | 'terminal';
}

export interface HandbookWorkflow {
  id: string;
  label: string;
  group: string;
  summary: string;
  status: HandbookStatus;
  steps: HandbookWorkflowStep[];
  failureBranches: string[];
  source: HandbookSourceRef;
}

export interface HandbookApiOperation {
  id: string;
  service: string;
  controller: string;
  handler: string;
  verbs: readonly string[];
  path: string | null;
  classification: string;
}

export interface HandbookManifest {
  generatedAt: string;
  sourceRefs: HandbookSourceRef[];
  actors: HandbookActor[];
  capabilities: HandbookCapability[];
  workflows: HandbookWorkflow[];
  services: SystemNode[];
  connections: SystemConnection[];
  operations: readonly HandbookApiOperation[];
}

export const HANDBOOK_SECTIONS: Array<{ id: HandbookSection; label: string; icon: string; description: string }> = [
  { id: 'overview', label: 'Tổng quan', icon: 'space_dashboard', description: 'Bức tranh toàn hệ thống' },
  { id: 'capabilities', label: 'Chức năng', icon: 'grid_view', description: 'Capability theo actor' },
  { id: 'actors', label: 'Actors', icon: 'groups', description: 'Ai dùng hệ thống' },
  { id: 'workflows', label: 'Workflows', icon: 'route', description: 'Luồng và nhánh lỗi' },
  { id: 'architecture', label: 'Architecture', icon: 'account_tree', description: 'Các khối và liên kết' },
  { id: 'services', label: 'Services', icon: 'hub', description: 'Ownership và state' },
  { id: 'apis', label: 'API catalog', icon: 'terminal', description: 'Contract có phân loại' },
  { id: 'operations', label: 'Operations', icon: 'shield', description: 'Security và recovery' },
];

export const HANDBOOK_ACTORS: HandbookActor[] = [
  {
    id: 'anonymous', label: 'Anonymous / public', shortLabel: 'Khách chưa đăng nhập', icon: 'public',
    description: 'Có thể khám phá nhà hàng, menu và tìm kiếm trong public catalog.',
    clientIds: ['delivery-web', 'customer-app'], capabilityIds: ['catalog-search'],
  },
  {
    id: 'customer', label: 'Customer', shortLabel: 'Khách hàng', icon: 'person',
    description: 'Đặt món COD, quản lý địa chỉ, xem order và theo dõi delivery.',
    clientIds: ['customer-app', 'delivery-web'], capabilityIds: ['identity', 'catalog-search', 'ordering', 'tracking', 'notifications', 'rating'],
  },
  {
    id: 'restaurant-owner', label: 'Restaurant owner', shortLabel: 'Chủ nhà hàng', icon: 'storefront',
    description: 'Quản lý cửa hàng/menu và quyết định confirm hoặc reject order.',
    clientIds: ['delivery-web'], capabilityIds: ['identity', 'restaurant-management', 'ordering', 'rating', 'campaigns'],
  },
  {
    id: 'shipper', label: 'Shipper', shortLabel: 'Người giao hàng', icon: 'two_wheeler',
    description: 'Nhận offer, cập nhật lifecycle giao hàng và gửi vị trí realtime.',
    clientIds: ['shipper-app'], capabilityIds: ['identity', 'fulfilment', 'tracking', 'notifications'],
  },
  {
    id: 'admin', label: 'Admin', shortLabel: 'Quản trị viên', icon: 'admin_panel_settings',
    description: 'Theo dõi và moderation các tài nguyên toàn hệ thống.',
    clientIds: ['delivery-web'], capabilityIds: ['identity', 'admin-operations', 'rating', 'campaigns', 'settlement'],
  },
  {
    id: 'platform', label: 'Platform / internal', shortLabel: 'Control plane', icon: 'settings_suggest',
    description: 'Các service, event consumer và operator boundary chạy trong private network.',
    clientIds: [], capabilityIds: ['architecture', 'security-operations', 'messaging-data'],
  },
];

const source = (label: string, file: string, section: string): HandbookSourceRef => ({ label, file, section });

export const HANDBOOK_CAPABILITIES: HandbookCapability[] = [
  { id: 'identity', label: 'Identity & session', group: 'Nền tảng', summary: 'Đăng ký, login, email verification, refresh rotation và session revoke.', actors: ['customer', 'restaurant-owner', 'shipper', 'admin'], clients: ['customer-app', 'delivery-web', 'shipper-app'], services: ['auth-service', 'user-service'], workflows: ['registration', 'authenticated-request'], status: 'active', classification: 'protected', source: source('Auth and users', 'backend_delivery/docs/services/auth_and_users.md', 'Identity and session') },
  { id: 'catalog-search', label: 'Catalog & search', group: 'Commerce', summary: 'Khám phá nhà hàng, menu và tìm kiếm món ăn qua projection.', actors: ['anonymous', 'customer'], clients: ['customer-app', 'delivery-web'], services: ['restaurant-service', 'search-service'], workflows: [], status: 'active', classification: 'public', source: source('Restaurant and search', 'docs/system/api/README.md', 'Restaurant and menu / Search') },
  { id: 'restaurant-management', label: 'Restaurant management', group: 'Commerce', summary: 'Hồ sơ cửa hàng, operating hours, menu, import và order decision.', actors: ['restaurant-owner', 'admin'], clients: ['delivery-web'], services: ['restaurant-service'], workflows: ['cod-order'], status: 'active', classification: 'protected', source: source('Web features', 'delivery_web/APP_FEATURES.md', 'Restaurant portal') },
  { id: 'ordering', label: 'Cart → checkout COD → order', group: 'Commerce', summary: 'Cart local, quote preview, idempotent order create, read và cancel.', actors: ['customer', 'restaurant-owner', 'admin'], clients: ['customer-app', 'delivery-web'], services: ['order-service', 'restaurant-service'], workflows: ['cod-order'], status: 'active', classification: 'protected', source: source('Order contract', 'docs/system/workflows.md', 'COD order-to-delivery lifecycle') },
  { id: 'fulfilment', label: 'Matching & delivery', group: 'Fulfilment', summary: 'Saga điều phối, Match chọn shipper, Delivery giữ offer và state machine.', actors: ['restaurant-owner', 'shipper', 'customer'], clients: ['shipper-app', 'delivery-web', 'customer-app'], services: ['saga-service', 'match-service', 'delivery-service', 'shipper-service'], workflows: ['cod-order'], status: 'active', classification: 'protected', source: source('Service ownership', 'docs/system/service-catalog.md', 'Order, Restaurant, Saga, Delivery and Match') },
  { id: 'tracking', label: 'Realtime tracking', group: 'Realtime', summary: 'Raw WebSocket, Redis GEO/rooms, lease và authorized delivery visibility.', actors: ['customer', 'shipper'], clients: ['customer-app', 'shipper-app'], services: ['tracking-service', 'delivery-service', 'match-service'], workflows: ['tracking'], status: 'active', classification: 'protected', source: source('Tracking contract', 'docs/system/workflows.md', 'Tracking and realtime delivery visibility') },
  { id: 'notifications', label: 'Notifications', group: 'Realtime', summary: 'Durable inbox và FCM wake-up best effort.', actors: ['customer', 'shipper'], clients: ['customer-app', 'shipper-app'], services: ['notification-service'], workflows: ['cod-order', 'tracking'], status: 'active', classification: 'protected', source: source('Notification service', 'backend_delivery/docs/services/notification_service.md', 'Durable inbox') },
  { id: 'rating', label: 'Ratings & moderation', group: 'Supporting', summary: 'Rating thuộc restaurant boundary, admin moderation và owner/customer views theo contract.', actors: ['customer', 'restaurant-owner', 'admin'], clients: ['delivery-web', 'customer-app'], services: ['restaurant-service', 'order-service'], workflows: [], status: 'active', classification: 'protected', source: source('Web features', 'delivery_web/APP_FEATURES.md', 'Admin portal / Restaurant portal') },
  { id: 'settlement', label: 'COD settlement', group: 'Finance', summary: 'Receipt, immutable ledger và balance projection sau delivery.completed.', actors: ['admin', 'platform'], clients: ['delivery-web'], services: ['settlement-service'], workflows: ['settlement'], status: 'active', classification: 'internal', source: source('Settlement workflow', 'docs/system/workflows.md', 'COD settlement') },
  { id: 'campaigns', label: 'Coupon & flash sale', group: 'Gated', summary: 'Campaign/read và reservation boundary tồn tại nhưng checkout relay mặc định off.', actors: ['restaurant-owner', 'admin', 'customer'], clients: ['delivery-web', 'customer-app'], services: ['promotion-service', 'flashsale-service'], workflows: ['gated-campaigns'], status: 'hidden', classification: 'gated', source: source('Capability safety', 'docs/system/service-catalog.md', 'Hidden capability safety rule') },
  { id: 'admin-operations', label: 'Admin operations', group: 'Operations', summary: 'Dashboard, orders, shippers, ratings, coupons, flash sales và catalog import.', actors: ['admin'], clients: ['delivery-web'], services: ['analytics-service', 'restaurant-service', 'order-service', 'shipper-service'], workflows: [], status: 'active', classification: 'protected', source: source('Admin portal', 'delivery_web/APP_FEATURES.md', 'Admin portal') },
  { id: 'messaging-data', label: 'Events & data ownership', group: 'Platform', summary: 'Kafka outbox/dedup, PostgreSQL ownership, Redis volatile state và search projection.', actors: ['platform'], clients: [], services: ['kafka', 'postgresql', 'redis', 'elasticsearch'], workflows: ['cod-order', 'settlement'], status: 'active', classification: 'internal', source: source('Events and data', 'docs/system/events-and-data.md', 'Data ownership / Active topic map') },
  { id: 'security-operations', label: 'Security & operations', group: 'Platform', summary: 'Gateway edge, JWKS resource-server auth, control plane, observability và recovery.', actors: ['platform', 'admin'], clients: [], services: ['gateway', 'auth-service', 'config-server', 'eureka'], workflows: ['authenticated-request'], status: 'active', classification: 'internal', source: source('Security boundaries', 'docs/system/security.md', 'Trust model') },
  { id: 'experimental', label: 'Analytics & livestream', group: 'Experimental', summary: 'Projection/dashboard và livestream provider boundary; chưa public trong MVP.', actors: ['admin', 'restaurant-owner'], clients: ['delivery-web'], services: ['analytics-service', 'livestream-service'], workflows: ['experimental'], status: 'experimental', classification: 'experimental', source: source('Experimental services', 'docs/system/service-catalog.md', 'Runtime domain services') },
];

export const HANDBOOK_WORKFLOWS: HandbookWorkflow[] = [
  {
    id: 'registration', label: 'Registration & profile handoff', group: 'Identity', status: 'active',
    summary: 'Auth identity và User profile được tạo qua hai request retry-safe.',
    steps: [
      { id: 'register-auth', label: 'Tạo hoặc resume identity', actor: 'Customer', service: 'auth-service', transport: 'HTTPS REST → Gateway', detail: 'Auth lưu lifecycle và opaque provisioning handle.', status: 'main' },
      { id: 'register-profile', label: 'Tạo hoặc resume profile', actor: 'Customer', service: 'user-service', transport: 'HTTPS REST + Internal handoff', detail: 'User verify provisioning token rồi ghi profile và identity link.', status: 'main' },
      { id: 'registration-recovery', label: 'Retry khi partial failure', actor: 'Platform', service: 'auth-service / user-service', transport: 'Idempotent retry', detail: 'authId là identity key; không tạo profile thứ hai.', status: 'branch' },
    ],
    failureBranches: ['Email chưa verified → login bị chặn.', 'Provisioning token hết hạn → yêu cầu flow mới.', 'Contradictory identity link → fail closed.'],
    source: source('Auth workflow', 'docs/system/workflows.md', 'Password registration'),
  },
  {
    id: 'authenticated-request', label: 'Authenticated request & refresh', group: 'Security', status: 'active',
    summary: 'Client đi qua Gateway; resource service tự verify JWKS, role và ownership.',
    steps: [
      { id: 'request-gateway', label: 'Forward protected request', actor: 'Client', service: 'gateway', transport: 'HTTPS + Bearer', detail: 'Rate-limit, CORS và strip legacy identity headers.', status: 'main' },
      { id: 'request-resource', label: 'Authorize tại resource owner', actor: 'Platform', service: 'resource service', transport: 'RS256/JWKS', detail: 'Validate kid, issuer, audience, token type, role và ownership.', status: 'main' },
      { id: 'request-refresh', label: 'Refresh một lần khi 401', actor: 'Client', service: 'auth-service', transport: 'HTTPS REST', detail: 'Refresh rotation rồi retry request một lần.', status: 'branch' },
    ],
    failureBranches: ['Invalid token → 401.', 'Sai role/ownership → 403.', 'Revoked refresh family → session kết thúc.'],
    source: source('Security workflow', 'docs/system/workflows.md', 'Authenticated request and refresh'),
  },
  {
    id: 'cod-order', label: 'COD order → delivery', group: 'Core business', status: 'active',
    summary: 'Từ quote đến order, restaurant decision, matching, offer và giao hàng.',
    steps: [
      { id: 'checkout-preview', label: 'Preview canonical quote', actor: 'Customer', service: 'order-service', transport: 'HTTPS REST', detail: 'Server tính quote có TTL; client không sở hữu total authority.', status: 'main' },
      { id: 'order-created', label: 'Create immutable order', actor: 'Customer', service: 'order-service', transport: 'REST + outbox', detail: 'Idempotency-Key và immutable money/location snapshot.', status: 'main' },
      { id: 'restaurant-decision', label: 'Confirm hoặc reject', actor: 'Restaurant owner', service: 'restaurant-service', transport: 'REST → Kafka', detail: 'Decision và outbox commit atomically.', status: 'main' },
      { id: 'matching', label: 'Find eligible shipper', actor: 'Platform', service: 'saga / match-service', transport: 'Kafka + Redis GEO', detail: 'Saga phát command; Match reserve một candidate.', status: 'main' },
      { id: 'offer-accept', label: 'Offer → accept → delivery', actor: 'Shipper', service: 'delivery-service', transport: 'REST + Kafka', detail: 'Delivery persist offer trước notification và state transition.', status: 'main' },
      { id: 'order-terminal', label: 'Delivered hoặc terminal reason', actor: 'Platform', service: 'settlement-service', transport: 'Kafka', detail: 'delivery.completed là trigger duy nhất cho COD ledger.', status: 'terminal' },
    ],
    failureBranches: ['PRICE_CHANGED/QUOTE_EXPIRED → quote mới và confirmation.', 'Restaurant reject/cancel → compensation idempotent.', 'SHIPPER_NOT_FOUND giữ terminal reason riêng.', 'Duplicate/contradictory replay → dedup hoặc fail closed.'],
    source: source('COD lifecycle', 'docs/system/workflows.md', 'COD order-to-delivery lifecycle'),
  },
  {
    id: 'tracking', label: 'Realtime tracking', group: 'Realtime', status: 'active',
    summary: 'Shipper publish location; viewer được authorize theo delivery room.',
    steps: [
      { id: 'tracking-publish', label: 'Shipper mở socket', actor: 'Shipper', service: 'tracking-service', transport: 'Raw WebSocket via Gateway', detail: 'Validate bearer và publisher generation/lease.', status: 'main' },
      { id: 'tracking-redis', label: 'Update GEO và Pub/Sub', actor: 'Platform', service: 'Redis', transport: 'GEO + Pub/Sub', detail: 'Current location là volatile state; history chỉ sampled support data.', status: 'main' },
      { id: 'tracking-view', label: 'Viewer nhận location', actor: 'Customer', service: 'tracking-service', transport: 'Authorized room', detail: 'Delivery kiểm tra participant access trước khi join room.', status: 'terminal' },
    ],
    failureBranches: ['Stale publisher generation → reject update.', 'Socket reconnect → lấy latest state, không khôi phục stale state.', 'Không có participant access → từ chối room.'],
    source: source('Tracking workflow', 'docs/system/workflows.md', 'Tracking and realtime delivery visibility'),
  },
  {
    id: 'settlement', label: 'COD settlement', group: 'Finance', status: 'active',
    summary: 'Settlement post receipt, immutable ledger và balances sau delivery.completed.',
    steps: [
      { id: 'settlement-event', label: 'Receive delivery.completed', actor: 'Platform', service: 'settlement-service', transport: 'Kafka consumer', detail: 'Validate COD method, identity và money conservation.', status: 'main' },
      { id: 'settlement-ledger', label: 'Commit receipt + ledger', actor: 'Platform', service: 'settlement-service', transport: 'PostgreSQL transaction', detail: 'Receipt, ledger entries và balance projection commit cùng transaction.', status: 'main' },
      { id: 'settlement-replay', label: 'Replay an toàn', actor: 'Platform', service: 'settlement-service', transport: 'Dedup receipt', detail: 'Exact duplicate là no-op; conflicting payload fail closed.', status: 'terminal' },
    ],
    failureBranches: ['Amount mismatch → rollback/retry/DLT.', 'Duplicate event → no-op.', 'Insufficient deposit → không ACK thành công.'],
    source: source('Settlement workflow', 'docs/system/workflows.md', 'COD settlement'),
  },
  {
    id: 'gated-campaigns', label: 'Promotion & flash-sale boundary', group: 'Gated', status: 'hidden',
    summary: 'Code/schema và reservation model tồn tại nhưng checkout relay mặc định off.',
    steps: [
      { id: 'campaign-read', label: 'Campaign/read surface', actor: 'Admin / owner', service: 'promotion-service / flashsale-service', transport: 'Classified API', detail: 'Read mappings có thể tồn tại trong source catalog.', status: 'main' },
      { id: 'campaign-gate', label: 'Checkout gate', actor: 'Platform', service: 'order-service', transport: 'Feature gate', detail: 'Không đưa capability vào COD quote/order mặc định.', status: 'terminal' },
    ],
    failureBranches: ['Không suy diễn active checkout từ controller/schema.', 'Mở capability cần owner policy, auth proof, migration và rollback.'],
    source: source('Capability safety', 'docs/system/service-catalog.md', 'Hidden capability safety rule'),
  },
  {
    id: 'experimental', label: 'Analytics & livestream boundary', group: 'Experimental', status: 'experimental',
    summary: 'Experimental projections/provider integration được catalog nhưng không public MVP.',
    steps: [
      { id: 'experimental-source', label: 'Source capability exists', actor: 'Platform', service: 'analytics-service / livestream-service', transport: 'Private/experimental', detail: 'Có schema/controller hoặc provider boundary.', status: 'main' },
      { id: 'experimental-gate', label: 'Gateway surface closed', actor: 'Platform', service: 'api-gateway', transport: 'Route classification', detail: 'Chờ ownership/provider proof trước khi public.', status: 'terminal' },
    ],
    failureBranches: ['Không hiển thị như supported MVP.', 'Không gọi live provider từ handbook.'],
    source: source('Experimental services', 'docs/system/service-catalog.md', 'Runtime domain services'),
  },
];

export const HANDBOOK_SOURCE_REFS: HandbookSourceRef[] = [
  source('Product overview', 'docs/product/overview.md', 'Platform overview'),
  source('Architecture', 'docs/ARCHITECTURE.md', 'System map'),
  source('Service catalog', 'docs/system/service-catalog.md', 'Runtime domain services'),
  source('Workflows', 'docs/system/workflows.md', 'Domain workflows and failure semantics'),
  source('Events and data', 'docs/system/events-and-data.md', 'Data ownership and active topic map'),
  source('Security', 'docs/system/security.md', 'Trust model and JWT/JWKS'),
  source('Clients', 'docs/system/clients.md', 'Client boundaries'),
  source('Web features', 'delivery_web/APP_FEATURES.md', 'Technical architecture surface'),
];

export const HANDBOOK_MANIFEST: HandbookManifest = {
  generatedAt: HANDBOOK_SOURCE_SNAPSHOT.generatedAt,
  sourceRefs: HANDBOOK_SOURCE_REFS,
  actors: HANDBOOK_ACTORS,
  capabilities: HANDBOOK_CAPABILITIES,
  workflows: HANDBOOK_WORKFLOWS,
  services: SYSTEM_NODES,
  connections: SYSTEM_CONNECTIONS,
  operations: HANDBOOK_SOURCE_SNAPSHOT.operations,
};

export const getHandbookService = (serviceId: string): SystemNode =>
  SYSTEM_NODES.find((service) => service.id === serviceId) ?? SYSTEM_NODES[0];

export const getHandbookConnections = (nodeId: string): SystemConnection[] =>
  getSystemConnections(nodeId);

export const getHandbookOperations = (serviceId?: string): readonly HandbookApiOperation[] =>
  serviceId ? HANDBOOK_MANIFEST.operations.filter((operation) => operation.service === serviceId) : HANDBOOK_MANIFEST.operations;

export const handbookCounts = {
  capabilities: HANDBOOK_CAPABILITIES.length,
  workflows: HANDBOOK_WORKFLOWS.length,
  services: SYSTEM_NODES.length,
  connections: SYSTEM_CONNECTIONS.length,
  operations: HANDBOOK_MANIFEST.operations.length,
};
