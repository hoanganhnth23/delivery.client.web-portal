import { Navigate, useLocation } from 'react-router-dom';
import CustomerPreview from './modules/customer-preview/CustomerPreview';
import PortalPreview from './modules/portal-preview/PortalPreview';
import ShipperPreview from './modules/shipper-preview/ShipperPreview';

const PREVIEW_PREFIXES = [
  '/preview/shopeefood',
  '/preview/admin',
  '/preview/restaurant',
  '/preview/shipper',
] as const;

const isPreviewPath = (pathname: string) =>
  PREVIEW_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export function StaticPreviewApp() {
  const location = useLocation();

  if (!isPreviewPath(location.pathname)) {
    return <Navigate to="/preview/shopeefood/home?view=responsive" replace />;
  }

  if (location.pathname === '/preview/shopeefood' || location.pathname.startsWith('/preview/shopeefood/')) {
    return <CustomerPreview />;
  }

  if (location.pathname === '/preview/shipper' || location.pathname.startsWith('/preview/shipper/')) {
    return <ShipperPreview />;
  }

  return <PortalPreview />;
}

