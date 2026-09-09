import { useCallback, useContext } from 'react';
import { useLocation, useNavigate, type NavigateOptions } from 'react-router-dom';
import {
  canonicalToPreviewPath,
  pathWithoutSearch,
  PortalPreviewContext,
  type PortalPreviewContextValue,
} from './portalPreviewContextValue';

export const useOptionalPortalPreview = (): PortalPreviewContextValue | null =>
  useContext(PortalPreviewContext);

export const usePortalPreviewNavigate = () => {
  const context = useOptionalPortalPreview();
  const navigate = useNavigate();

  return useCallback((path: string, options?: NavigateOptions) => {
    if (context) {
      context.navigate(path, options);
      return;
    }
    navigate(path, options);
  }, [context, navigate]);
};

export const usePortalPreviewPath = (path: string): string => {
  const context = useOptionalPortalPreview();
  const location = useLocation();

  if (!context) return path;

  const target = canonicalToPreviewPath(path, context.kind);
  const targetPath = pathWithoutSearch(target);
  const hasQuery = target.includes('?');
  const currentView = new URLSearchParams(location.search).get('view');

  if (!hasQuery && currentView) {
    return `${targetPath}?view=${encodeURIComponent(currentView)}`;
  }

  return target;
};
