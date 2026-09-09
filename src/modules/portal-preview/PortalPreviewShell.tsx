import type { ReactNode } from 'react';
import type { PortalPreviewNavItem, PortalPreviewPage, PortalKind } from './portalPreviewData';
import type { PreviewTheme } from './portalPreviewModel';

export type PortalPreviewView = 'responsive' | 'phone' | 'workbench';

interface PortalPreviewShellProps {
  kind: PortalKind;
  page: PortalPreviewPage;
  identity: string;
  email: string;
  navigation: PortalPreviewNavItem[];
  view: PortalPreviewView;
  theme: PreviewTheme;
  onNavigate: (page: PortalPreviewPage) => void;
  onSetTheme: (theme: PreviewTheme) => void;
  onReset: () => void;
  children: ReactNode;
}

const roleLabels: Record<PortalKind, string> = {
  admin: 'Quản trị nền tảng',
  restaurant: 'Quản lý cửa hàng',
};

const Icon = ({ name }: { name: string }) => (
  <span aria-hidden="true" className="material-symbols-outlined">{name}</span>
);

const PortalPreviewShell = ({
  kind,
  page,
  identity,
  email,
  navigation,
  view,
  theme,
  onNavigate,
  onSetTheme,
  onReset,
  children,
}: PortalPreviewShellProps) => (
  <div
    className={`portal-preview-runtime portal-preview-mode-${view}${view === 'phone' ? ' portal-preview-phone' : ''}`}
    data-portal-kind={kind}
    data-theme={theme}
  >
    {view === 'workbench' && (
      <section className="portal-preview-toolbar" aria-label="Điều khiển preview">
        <div className="portal-preview-toolbar-intro">
          <Icon name="preview" />
          <div><strong>Portal Preview</strong><span>{identity} · UI production + fixture nội bộ</span></div>
        </div>
        <label>
          <span>Màn hình</span>
          <select aria-label="Màn hình preview" value={page} onChange={(event) => onNavigate(event.target.value as PortalPreviewPage)}>
            {navigation.map((item) => <option key={item.page} value={item.page}>{item.label}</option>)}
          </select>
        </label>
        <label>
          <span>Chủ đề</span>
          <select aria-label="Chủ đề preview" value={theme} onChange={(event) => onSetTheme(event.target.value as PreviewTheme)}>
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
        </label>
        <button type="button" className="portal-preview-reset" onClick={onReset}><Icon name="restart_alt" />Đặt lại fixture</button>
      </section>
    )}

    <div className={`portal-preview-frame ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="portal-theme dark-portal-scope">
        {children}
      </div>
    </div>
    <p className="portal-preview-attribution">
      {roleLabels[kind]} · {email} · preview dùng page/layout production, dữ liệu chỉ nằm trong bộ nhớ tab.
    </p>
  </div>
);

export default PortalPreviewShell;
