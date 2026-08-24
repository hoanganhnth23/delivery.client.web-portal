import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HANDBOOK_DOCUMENTS } from '../data/generatedDocumentManifest';
import MarkdownDocument from '../components/MarkdownDocument';

const basePath = '/system-overview/docs';

type HandbookDocument = (typeof HANDBOOK_DOCUMENTS.documents)[number];

function statusLabel(status: string) {
  if (status === 'decision-required') return 'Decision required';
  if (status === 'dev-only') return 'Dev-only';
  if (status === 'historical') return 'Historical';
  return 'Current';
}

function statusClass(status: string) {
  if (status === 'decision-required') return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800';
  if (status === 'dev-only') return 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-800';
  if (status === 'historical') return 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800';
}

function DocumentBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black ring-1 ${statusClass(status)}`}>{statusLabel(status)}</span>;
}

function DocumentListItem({ document, selected, onSelect }: { document: HandbookDocument; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`w-full rounded-2xl border p-3 text-left transition ${selected ? 'border-primary bg-primary/[0.06] shadow-sm' : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-primary/[0.03] dark:border-slate-800 dark:bg-slate-900'}`}>
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined mt-0.5 text-lg text-primary">description</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black text-slate-800 dark:text-slate-100">{document.title}</span>
          <span className="mt-1 block truncate text-[10px] text-slate-400">{document.source}</span>
        </span>
      </div>
      <span className="mt-2 flex items-center gap-2"><DocumentBadge status={document.status} /><span className="text-[10px] text-slate-400">{document.language}</span></span>
    </button>
  );
}

export default function DocsPortalView() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedId = location.pathname.match(/\/system-overview\/docs\/([^/]+)/)?.[1] ?? null;
  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [section, setSection] = useState(params.get('section') ?? 'all');
  const selected = HANDBOOK_DOCUMENTS.documents.find((document) => document.id === selectedId) ?? null;
  const sections = useMemo(() => [...new Set(HANDBOOK_DOCUMENTS.documents.map((document) => document.section))].sort(), []);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return HANDBOOK_DOCUMENTS.documents.filter((document) => {
      if (section !== 'all' && document.section !== section) return false;
      if (!normalized) return true;
      return `${document.title} ${document.source} ${document.content}`.toLowerCase().includes(normalized);
    });
  }, [query, section]);

  const updateQuery = (nextQuery: string, nextSection = section) => {
    const next = new URLSearchParams();
    if (nextQuery.trim()) next.set('q', nextQuery.trim());
    if (nextSection !== 'all') next.set('section', nextSection);
    const suffix = next.toString();
    navigate(`${basePath}${suffix ? `?${suffix}` : ''}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Canonical document portal</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Tài liệu hệ thống</h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Đọc corpus đã allowlist từ source hiện hành. Mỗi tài liệu hiển thị owner, ngôn ngữ, trạng thái và ngày kiểm chứng; handbook không gọi backend live.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800"><span className="size-2 rounded-full bg-current" />{HANDBOOK_DOCUMENTS.documents.length} tài liệu · snapshot {HANDBOOK_DOCUMENTS.generatedAt}</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="space-y-3">
          <form onSubmit={(event) => { event.preventDefault(); updateQuery(query); }} className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-2.5 text-lg text-slate-400">search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tiêu đề, path, nội dung…" aria-label="Tìm tài liệu" className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs outline-none ring-primary/20 transition focus:ring-2 dark:border-slate-800 dark:bg-slate-900" />
          </form>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Nhóm tài liệu
            <select value={section} onChange={(event) => { setSection(event.target.value); updateQuery(query, event.target.value); }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <option value="all">Tất cả nhóm</option>
              {sections.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <div className="max-h-[calc(100vh-17rem)] space-y-2 overflow-y-auto pr-1" aria-label="Danh sách tài liệu">
            {filtered.map((document) => <DocumentListItem key={document.id} document={document} selected={document.id === selected?.id} onSelect={() => navigate(`${basePath}/${document.id}`)} />)}
            {filtered.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-xs leading-5 text-slate-500 dark:border-slate-700">Không tìm thấy tài liệu phù hợp.</p>}
          </div>
        </aside>

        <section className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900 sm:p-7">
          {selected ? (
            <>
              <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
                <button type="button" onClick={() => navigate(basePath)} className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"><span className="material-symbols-outlined text-sm">arrow_back</span> Mục lục tài liệu</button>
                <div className="flex flex-wrap items-center gap-2"><DocumentBadge status={selected.status} /><span className="text-[10px] font-semibold text-slate-400">{selected.section} · {selected.language} · verified {selected.verifiedAt}</span></div>
                <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">{selected.title}</h2>
                <p className="mt-1 break-all font-mono text-[10px] text-slate-400">{selected.source}</p>
              </div>
              <MarkdownDocument content={selected.content} source={selected.source} documents={HANDBOOK_DOCUMENTS.documents} />
            </>
          ) : (
            <div className="flex min-h-[26rem] flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined rounded-3xl bg-primary/10 p-4 text-4xl text-primary">menu_book</span>
              <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Chọn một tài liệu để bắt đầu</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Dùng search để tìm service, API path, workflow hoặc runbook. Các tài liệu historical/plan không nằm trong public index.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
