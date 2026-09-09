import { createContext } from 'react';
import type { NavigateOptions } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

export type PortalPreviewKind = 'admin' | 'restaurant';

export interface PortalPreviewContextValue {
  kind: PortalPreviewKind;
  canonicalPath: string;
  toPreviewPath: (path: string) => string;
  navigate: (path: string, options?: NavigateOptions) => void;
}

export const PortalPreviewContext = createContext<PortalPreviewContextValue | null>(null);

const PREVIEW_PREFIX = '/preview';

export const canonicalToPreviewPath = (path: string, kind: PortalPreviewKind): string => {
  if (path.startsWith(`${PREVIEW_PREFIX}/`)) return path;

  if (path === ROUTES.ADMIN_LOGIN) return `${PREVIEW_PREFIX}/admin/dashboard`;
  if (path === ROUTES.LOGIN) return `${PREVIEW_PREFIX}/${kind}/dashboard`;

  if (path.startsWith('/admin/')) {
    return `${PREVIEW_PREFIX}/admin/${path.slice('/admin/'.length)}`;
  }

  if (path.startsWith('/restaurant/')) {
    return `${PREVIEW_PREFIX}/restaurant/${path.slice('/restaurant/'.length)}`;
  }

  return path;
};

export const pathWithoutSearch = (path: string): string => path.split(/[?#]/, 1)[0] ?? path;
