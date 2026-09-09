import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppDependenciesProvider } from '@/app/dependencies';
import { AuthProvider } from '@/modules/auth/hooks/useAuth';
import { RestaurantProvider } from '@/modules/restaurant/hooks/useRestaurant';
import { MenuProvider } from '@/modules/restaurant/hooks/useMenu';
import { OrderProvider } from '@/modules/restaurant/hooks/useOrder';
import AdminDashboard from '@/modules/admin/pages/AdminDashboard';
import AdminOrdersPage from '@/modules/admin/pages/AdminOrdersPage';
import AdminChatPage from '@/modules/admin/pages/AdminChatPage';
import AdminRestaurantsPage from '@/modules/admin/pages/AdminRestaurantsPage';
import AdminShippersPage from '@/modules/admin/pages/AdminShippersPage';
import AdminRatingsPage from '@/modules/admin/pages/AdminRatingsPage';
import AdminCouponsPage from '@/modules/admin/pages/AdminCouponsPage';
import AdminFlashSalePage from '@/modules/admin/pages/AdminFlashSalePage';
import AdminLivestreamPage from '@/modules/admin/pages/AdminLivestreamPage';
import RestaurantDashboard from '@/modules/restaurant/pages/RestaurantDashboard';
import RestaurantProfilePage from '@/modules/restaurant/pages/RestaurantProfilePage';
import RestaurantOrders from '@/modules/restaurant/pages/RestaurantOrders';
import MenuManagement from '@/modules/restaurant/pages/MenuManagement';
import RestaurantReviewsPage from '@/modules/restaurant/pages/RestaurantReviewsPage';
import RestaurantVouchersPage from '@/modules/restaurant/pages/RestaurantVouchersPage';
import RestaurantLivestreamPage from '@/modules/restaurant/pages/RestaurantLivestreamPage';
import CatalogImportPage from '@/modules/restaurant/pages/CatalogImportPage';
import { PortalPreviewProvider } from '@/components/navigation/PortalPreviewContext';
import PortalPreviewShell, { type PortalPreviewView } from './PortalPreviewShell';
import {
  ADMIN_PREVIEW_DATA,
  ADMIN_PREVIEW_NAVIGATION,
  RESTAURANT_PREVIEW_DATA,
  RESTAURANT_PREVIEW_NAVIGATION,
} from './portalPreviewData';
import { parsePortalPreviewLocation, type PreviewTheme } from './portalPreviewModel';
import { createPortalPreviewDependencies } from './portalPreviewDependencies';
import { resetPreviewSupportChat } from '../support-preview/previewSupportChat';
import './portalPreview.css';

export const PORTAL_PREVIEW_BASE = '/preview';

const AdminPreviewPage = ({ page }: { page: string }) => {
  switch (page) {
    case 'orders': return <AdminOrdersPage />;
    case 'chat': return <AdminChatPage />;
    case 'restaurants': return <AdminRestaurantsPage />;
    case 'shippers': return <AdminShippersPage />;
    case 'ratings': return <AdminRatingsPage />;
    case 'coupons': return <AdminCouponsPage />;
    case 'flash-sales': return <AdminFlashSalePage />;
    case 'livestream':
    case 'livestreams': return <AdminLivestreamPage />;
    case 'catalog-import': return <CatalogImportPage portal="admin" />;
    default: return <AdminDashboard />;
  }
};

const RestaurantPreviewPage = ({ page }: { page: string }) => {
  switch (page) {
    case 'orders': return <RestaurantOrders />;
    case 'menu': return <MenuManagement />;
    case 'profile': return <RestaurantProfilePage />;
    case 'reviews': return <RestaurantReviewsPage />;
    case 'vouchers': return <RestaurantVouchersPage />;
    case 'livestream':
    case 'livestreams': return <RestaurantLivestreamPage />;
    case 'catalog-import': return <CatalogImportPage portal="restaurant" />;
    default: return <RestaurantDashboard />;
  }
};

const PortalPreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const route = parsePortalPreviewLocation(location.pathname, location.search);
  const [theme, setTheme] = useState<PreviewTheme>('light');
  const [resetKey, setResetKey] = useState(0);
  const searchParams = new URLSearchParams(location.search);
  const selectedRestaurantId = Number(searchParams.get('restaurantId')) || undefined;
  const view: PortalPreviewView = searchParams.get('view') === 'phone'
    ? 'phone'
    : searchParams.get('view') === 'workbench'
      ? 'workbench'
      : 'responsive';
  const dependencies = useMemo(
    () => createPortalPreviewDependencies(route.kind, resetKey, selectedRestaurantId),
    [resetKey, route.kind, selectedRestaurantId],
  );
  const data = route.kind === 'admin' ? ADMIN_PREVIEW_DATA : RESTAURANT_PREVIEW_DATA;
  const navigation = route.kind === 'admin' ? ADMIN_PREVIEW_NAVIGATION : RESTAURANT_PREVIEW_NAVIGATION;

  const goTo = (page: (typeof route)['page']) => {
    const suffix = view === 'responsive' ? '' : `?view=${view}`;
    navigate(`${PORTAL_PREVIEW_BASE}/${route.kind}/${page}${suffix}`);
  };

  const reset = () => {
    setResetKey((current) => current + 1);
    setTheme('light');
    resetPreviewSupportChat();
  };

  return (
    <PortalPreviewProvider kind={route.kind} canonicalPath={`${route.kind === 'admin' ? '/admin' : '/restaurant'}/${route.page}`}>
      <PortalPreviewShell
        kind={route.kind}
        page={route.page}
        identity={data.identity}
        email={data.email}
        navigation={navigation}
        view={view}
        theme={theme}
        onNavigate={goTo}
        onSetTheme={setTheme}
        onReset={reset}
      >
        <div key={`${route.kind}-${resetKey}`}>
          <AppDependenciesProvider dependencies={dependencies}>
            <AuthProvider>
              <RestaurantProvider>
                <MenuProvider>
                  <OrderProvider>
                    <div className="portal-preview-production-page">
                      {route.kind === 'admin'
                        ? <AdminPreviewPage page={route.page} />
                        : <RestaurantPreviewPage page={route.page} />}
                    </div>
                  </OrderProvider>
                </MenuProvider>
              </RestaurantProvider>
            </AuthProvider>
          </AppDependenciesProvider>
        </div>
      </PortalPreviewShell>
    </PortalPreviewProvider>
  );
};

export default PortalPreview;
