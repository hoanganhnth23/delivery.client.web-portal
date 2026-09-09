import type {
  AdminPreviewPage,
  PortalKind,
  PortalPreviewPage,
  PortalPreviewRoute,
  RestaurantPreviewPage,
} from './portalPreviewData';

export type PreviewTheme = 'light' | 'dark';

const ADMIN_PAGES: readonly AdminPreviewPage[] = [
  'dashboard',
  'orders',
  'chat',
  'restaurants',
  'shippers',
  'ratings',
  'coupons',
  'flash-sales',
  'catalog-import',
  'livestream',
  'livestreams',
];

const RESTAURANT_PAGES: readonly RestaurantPreviewPage[] = [
  'dashboard',
  'orders',
  'menu',
  'profile',
  'reviews',
  'vouchers',
  'catalog-import',
  'livestream',
];

export function parsePortalPreviewLocation(pathname: string, _search = ''): PortalPreviewRoute {
  const parts = pathname.split('/').filter(Boolean);
  const kind: PortalKind = parts[1] === 'restaurant' ? 'restaurant' : 'admin';
  let rawPage = parts[2];
  if (kind === 'admin' && rawPage === 'livestream') rawPage = 'livestreams';
  if (kind === 'restaurant' && rawPage === 'livestreams') rawPage = 'livestream';
  const page: PortalPreviewPage = kind === 'admin'
    ? rawPage && ADMIN_PAGES.includes(rawPage as AdminPreviewPage) ? rawPage as AdminPreviewPage : 'dashboard'
    : rawPage && RESTAURANT_PAGES.includes(rawPage as RestaurantPreviewPage) ? rawPage as RestaurantPreviewPage : 'dashboard';
  return { kind, page };
}
