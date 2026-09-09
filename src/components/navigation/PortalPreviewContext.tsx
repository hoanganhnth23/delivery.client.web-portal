import { useCallback, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate, type NavigateOptions } from 'react-router-dom';
import {
  canonicalToPreviewPath,
  pathWithoutSearch,
  PortalPreviewContext,
  type PortalPreviewContextValue,
  type PortalPreviewKind,
} from './portalPreviewContextValue';

interface PortalPreviewProviderProps {
  kind: PortalPreviewKind;
  canonicalPath: string;
  children: ReactNode;
}

export const PortalPreviewProvider = ({
  kind,
  canonicalPath,
  children,
}: PortalPreviewProviderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const toPreviewPath = useCallback((path: string) => {
    const target = canonicalToPreviewPath(path, kind);
    const targetPath = pathWithoutSearch(target);
    const hasQuery = target.includes('?');
    const currentView = new URLSearchParams(location.search).get('view');

    if (!hasQuery && currentView) {
      return `${targetPath}?view=${encodeURIComponent(currentView)}`;
    }

    return target;
  }, [kind, location.search]);

  const navigateWithinPreview = useCallback((path: string, options?: NavigateOptions) => {
    navigate(toPreviewPath(path), options);
  }, [navigate, toPreviewPath]);

  const value = useMemo<PortalPreviewContextValue>(() => ({
    kind,
    canonicalPath,
    toPreviewPath,
    navigate: navigateWithinPreview,
  }), [canonicalPath, kind, navigateWithinPreview, toPreviewPath]);

  return (
    <PortalPreviewContext.Provider value={value}>
      {children}
    </PortalPreviewContext.Provider>
  );
};
