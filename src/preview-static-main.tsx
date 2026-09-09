import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import './components/layouts/portal.css';
import { StaticPreviewApp } from './preview-static-app';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <HashRouter>
    <StaticPreviewApp />
  </HashRouter>,
);
