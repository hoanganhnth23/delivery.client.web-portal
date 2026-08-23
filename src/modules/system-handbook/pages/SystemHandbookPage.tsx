import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getHandbookOperations,
  getHandbookService,
  HANDBOOK_CAPABILITIES,
  HANDBOOK_MANIFEST,
  HANDBOOK_SOURCE_REFS,
  type HandbookApiOperation,
} from '../data/handbookData';
import {
  explorerEventCount,
  explorerOperationCount,
  FLOW_EXPLORER_FLOWS,
  getFlow,
  getFlowEvent,
  getFlowForService,
  getFlowOperation,
  getFlowStep,
  handbookContractHints,
  type FlowExplorerDefinition,
  type FlowMode,
  type FlowStep,
} from '../data/flowExplorerData';
import { SYSTEM_CONNECTIONS, SYSTEM_NODES, type SystemNode } from '@/modules/admin/data/systemOverviewData';

const basePath = '/system-overview';

type WorkspaceSection = 'overview' | 'flows' | 'architecture' | 'contracts' | 'operations';
type FlowVisualMode = 'tree' | 'swimlane';
type InspectorSelection =
  | { type: 'step'; id: string }
  | { type: 'service'; id: string }
  | { type: 'operation'; id: string }
  | { type: 'event'; id: string }
  | { type: 'branch'; id: string };

const workspaceNav: Array<{ id: WorkspaceSection; label: string; detail: string; icon: string }> = [
  { id: 'overview', label: 'Tổng quan', detail: 'Bắt đầu từ hệ thống', icon: 'space_dashboard' },
  { id: 'flows', label: 'Flow Explorer', detail: 'Luồng, API và failure', icon: 'route' },
  { id: 'architecture', label: 'Architecture', detail: 'Topology theo flow', icon: 'account_tree' },
  { id: 'contracts', label: 'Services & Contracts', detail: 'Ownership và API', icon: 'hub' },
  { id: 'operations', label: 'Operations', detail: 'Security và recovery', icon: 'shield' },
];

const sectionFromLocation = (pathname: string): WorkspaceSection => {
  if (pathname.includes('/workflows')) return 'flows';
  if (pathname.includes('/architecture')) return 'architecture';
  if (pathname.includes('/services') || pathname.includes('/apis') || pathname.includes('/capabilities') || pathname.includes('/actors')) return 'contracts';
  if (pathname.includes('/operations')) return 'operations';
  return 'overview';
};

const flowIdFromLocation = (pathname: string): string | null => {
  const match = pathname.match(/\/workflows\/([^/]+)/);
  return match?.[1] ?? null;
};

const chipStyles = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800',
  hidden: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  experimental: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800',
};

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all dark:border-slate-800/90 dark:bg-slate-900 ${className}`}>
      {children}
    </section>
  );
}

function StatusChip({ status }: { status: 'active' | 'hidden' | 'experimental' }) {
  const label = status === 'active' ? 'Active' : status === 'hidden' ? 'Hidden / off' : 'Experimental';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${chipStyles[status]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function MiniSource({ file, section }: { file: string; section: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-slate-400 dark:text-slate-500">
      <span className="material-symbols-outlined text-sm shrink-0">description</span>
      <span className="truncate">{file} · {section}</span>
    </span>
  );
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function Metric({ icon, value, label, detail }: { icon: string; value: string | number; label: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:shadow dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-xl text-primary">{icon}</span>
        <div className="min-w-0">
          <p className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{label}</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function methodBadgeColor(method: string) {
  const m = method.toUpperCase();
  if (m === 'POST') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400';
  if (m === 'GET') return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400';
  if (m === 'PUT' || m === 'PATCH') return 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400';
  if (m === 'DELETE') return 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400';
  return 'bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-400';
}

function actorIcon(actor: string) {
  const a = actor.toLowerCase();
  if (a.includes('khách') || a.includes('customer') || a.includes('user')) return 'person';
  if (a.includes('nhà hàng') || a.includes('restaurant') || a.includes('merchant')) return 'storefront';
  if (a.includes('shipper') || a.includes('driver')) return 'two_wheeler';
  return 'settings_suggest';
}

function communicationMeta(kind: string) {
  if (kind === 'event') return { icon: 'sync_alt', label: 'Kafka event', className: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300' };
  if (kind === 'websocket') return { icon: 'bolt', label: 'WebSocket', className: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300' };
  if (kind === 'storage') return { icon: 'database', label: 'State', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300' };
  return { icon: 'arrow_forward', label: 'HTTPS / REST', className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300' };
}

function queryState(location: ReturnType<typeof useLocation>) {
  const params = new URLSearchParams(location.search);
  const serviceMatch = location.pathname.match(/\/services\/([^/]+)/);
  return {
    mode: params.get('mode') === 'failure' ? 'failure' as FlowMode : 'happy' as FlowMode,
    step: params.get('step'),
    node: params.get('node') ?? serviceMatch?.[1] ?? null,
    operation: params.get('operation'),
    event: params.get('event'),
    branch: params.get('branch'),
  };
}

function buildSelection(state: ReturnType<typeof queryState>, flow: FlowExplorerDefinition): InspectorSelection {
  if (state.operation && getFlowOperation(state.operation)) return { type: 'operation', id: state.operation };
  if (state.event && getFlowEvent(state.event)) return { type: 'event', id: state.event };
  if (state.branch && flow.branches.some((branch) => branch.id === state.branch)) return { type: 'branch', id: state.branch };
  if (state.node && SYSTEM_NODES.some((node) => node.id === state.node)) return { type: 'service', id: state.node };
  return { type: 'step', id: getFlowStep(flow, state.step).id };
}

/**
 * Compact, modern Flow Switcher toolbar that doesn't waste vertical column space
 */
function CompactFlowBar({
  flow,
  mode,
  visualMode,
  onFlow,
  onMode,
  onVisualMode,
  inspectorExpanded,
  onToggleInspector,
}: {
  flow: FlowExplorerDefinition;
  mode: FlowMode;
  visualMode: FlowVisualMode;
  onFlow: (id: string) => void;
  onMode: (mode: FlowMode) => void;
  onVisualMode: (visual: FlowVisualMode) => void;
  inspectorExpanded: boolean;
  onToggleInspector: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const map = new Map<string, FlowExplorerDefinition[]>();
    FLOW_EXPLORER_FLOWS.forEach((item) => {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, []);

  const flowIndex = FLOW_EXPLORER_FLOWS.findIndex((f) => f.id === flow.id);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <Panel className="p-4 sm:p-5">
      {/* Top Row: Flow Selector Dropdown + Navigation + View Mode Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/90 pb-4 dark:border-slate-800">
        {/* Left: Compact Flow Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Luồng:</span>
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2 text-left font-black text-slate-900 shadow-xs transition hover:border-primary hover:bg-primary/10 dark:bg-primary/10 dark:text-white"
              aria-expanded={dropdownOpen}
              aria-label="Chọn luồng nghiệp vụ"
            >
              <span className="material-symbols-outlined text-lg text-primary shrink-0">route</span>
              <span className="text-sm font-black">{flow.label}</span>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                {flow.steps.length} steps
              </span>
              <span className="material-symbols-outlined text-base text-slate-400 transition-transform" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}>
                arrow_drop_down
              </span>
            </button>

            {/* Quick Flow Prev/Next Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => flowIndex > 0 && onFlow(FLOW_EXPLORER_FLOWS[flowIndex - 1].id)}
                disabled={flowIndex <= 0}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                title="Luồng trước"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => flowIndex < FLOW_EXPLORER_FLOWS.length - 1 && onFlow(FLOW_EXPLORER_FLOWS[flowIndex + 1].id)}
                disabled={flowIndex >= FLOW_EXPLORER_FLOWS.length - 1}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                title="Luồng sau"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Flow Selector Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 top-12 z-50 w-[340px] sm:w-[400px] max-h-[440px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl custom-scrollbar dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-2 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 dark:border-slate-800">
                Tất cả quy trình hệ thống ({FLOW_EXPLORER_FLOWS.length})
              </div>
              <div className="space-y-3">
                {groups.map(([group, flows]) => (
                  <div key={group}>
                    <p className="px-2 py-0.5 text-[10px] font-black uppercase text-primary tracking-wider">{group}</p>
                    <div className="mt-1 space-y-1">
                      {flows.map((item) => {
                        const isSelected = item.id === flow.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              onFlow(item.id);
                              setDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between gap-2 rounded-xl p-2.5 text-left transition ${
                              isSelected
                                ? 'bg-primary text-white shadow-xs font-bold'
                                : 'hover:bg-slate-100 text-slate-700 dark:text-slate-200 dark:hover:bg-slate-900'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="block text-xs font-bold truncate">{item.label}</span>
                              <span className={`block text-[10px] truncate ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                                {item.summary}
                              </span>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}>
                              {item.steps.length} steps
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Visualization Mode (Tree vs Swimlane) + Mode Toggle + Inspector Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Visual Style Selector: Tree Graph vs Swimlane */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => onVisualMode('tree')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                visualMode === 'tree'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">account_tree</span>
              <span>Sơ đồ cây</span>
            </button>
            <button
              type="button"
              onClick={() => onVisualMode('swimlane')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                visualMode === 'swimlane'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">view_column</span>
              <span>Thẻ ngang</span>
            </button>
          </div>

          {/* Happy vs Failure Mode Switcher */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              aria-pressed={mode === 'happy'}
              onClick={() => onMode('happy')}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                mode === 'happy'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Happy path
            </button>
            <button
              type="button"
              aria-pressed={mode === 'failure'}
              onClick={() => onMode('failure')}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                mode === 'failure'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Failure & recovery
            </button>
          </div>

          {/* Toggle Inspector View */}
          <button
            type="button"
            onClick={onToggleInspector}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              inspectorExpanded
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
            title={inspectorExpanded ? 'Thu gọn bảng chi tiết' : 'Mở rộng bảng chi tiết'}
          >
            <span className="material-symbols-outlined text-base">
              {inspectorExpanded ? 'dock_to_right' : 'fullscreen'}
            </span>
            <span className="hidden sm:inline">{inspectorExpanded ? 'Bảng chi tiết' : 'Toàn cảnh Canvas'}</span>
          </button>
        </div>
      </div>

      {/* Quick Flow Pills for 1-click switching */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">Chuyển nhanh:</span>
        {FLOW_EXPLORER_FLOWS.map((item) => {
          const isSelected = item.id === flow.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onFlow(item.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold shrink-0 transition ${
                isSelected
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Flow Details Banner */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{flow.group}</span>
            <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-xs text-slate-500 dark:text-slate-400">{flow.summary}</span>
          </div>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{flow.label}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {flow.audience.map((actor) => (
            <span
              key={actor}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              <span className="material-symbols-outlined text-[13px]">{actorIcon(actor)}</span>
              {actor}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="material-symbols-outlined text-[13px]">verified</span>
            {flow.successOutcome}
          </span>
        </div>
      </div>
    </Panel>
  );
}

/**
 * Modern, Interactive Tree-based Flow Graph Visualizer
 * Shows vertical Happy Path spine with branching decision points and failure/recovery paths
 */
function TreeFlowGraph({
  flow,
  mode,
  selected,
  onSelect,
  onNextStep,
  onPrevStep,
}: {
  flow: FlowExplorerDefinition;
  mode: FlowMode;
  selected: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}) {
  const activeBranch = selected.type === 'branch' ? flow.branches.find((branch) => branch.id === selected.id) : undefined;
  const activeStepIds = new Set(activeBranch?.stepIds ?? []);
  const selectedStepId = selected.type === 'step' ? selected.id : activeBranch?.fromStepId;
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active step card into center
  useEffect(() => {
    if (!selectedStepId || !treeContainerRef.current) return;
    const targetElement = treeContainerRef.current.querySelector(`[data-tree-step-id="${selectedStepId}"]`) as HTMLElement | null;
    if (typeof targetElement?.scrollIntoView === 'function') {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedStepId]);

  const currentIndex = flow.steps.findIndex((s) => s.id === selectedStepId);

  return (
    <Panel className="overflow-hidden">
      {/* Header with Tree Graph Legend & Controls */}
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950" />
              Trục chính (Happy path)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rotate-45 rounded-xs bg-amber-500" />
              Điểm rẽ nhánh (Decision node)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-rose-500" />
              Nhánh lỗi & Phục hồi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Bước <span className="text-primary font-black">{currentIndex >= 0 ? currentIndex + 1 : 1}</span> / {flow.steps.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPrevStep}
                disabled={currentIndex <= 0}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                aria-label="Bước trước"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={onNextStep}
                disabled={currentIndex >= flow.steps.length - 1}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                aria-label="Bước tiếp"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Visualization Canvas */}
      <div ref={treeContainerRef} className="p-5 sm:p-7 overflow-x-auto custom-scrollbar">
        <div className="min-w-[680px] max-w-4xl mx-auto space-y-0 relative">
          {/* Start Root Trigger Node */}
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/10 px-4 py-2.5 shadow-xs">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-white text-xs font-black shadow-xs">
                <span className="material-symbols-outlined text-sm">play_arrow</span>
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                Bắt đầu Use Case: {flow.label}
              </span>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                {flow.audience[0] ?? 'Actor'}
              </span>
            </div>

            {/* Vertical Flow Connector */}
            <div className="h-6 w-0.5 bg-gradient-to-b from-primary/60 to-primary" />
          </div>

          {/* Sequential Tree Step Spine with Dynamic Branching Arms */}
          {flow.steps.map((step, index) => {
            const isSelected = step.id === selectedStepId;
            const isBranchStep = mode === 'failure' && activeStepIds.has(step.id);
            const dimmed = mode === 'failure' && activeBranch && !activeStepIds.has(step.id) && step.id !== activeBranch.fromStepId;
            const isDecision = step.status === 'decision';
            const stepInteractions = flow.interactions.filter((interaction) => interaction.sourceStepId === step.id);
            const relatedBranches = flow.branches.filter((b) => b.fromStepId === step.id);

            return (
              <div key={step.id} data-tree-step-id={step.id} className="relative">
                {/* Step Row Layout: Main Step Card (Center) + Branch Card (Right) */}
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 items-start">
                  {/* Left Column: Flow Details or Actor Context */}
                  <div className="flex flex-col items-end pt-3 text-right">
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {step.phase}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <span>{step.actor}</span>
                      <span className="material-symbols-outlined text-sm text-primary">{actorIcon(step.actor)}</span>
                    </span>
                    {step.serviceIds.length > 0 && (
                      <span className="mt-1 font-mono text-[9px] text-slate-400 truncate max-w-[160px]">
                        {step.serviceIds.join(' · ')}
                      </span>
                    )}
                  </div>

                  {/* Center Column: Node Spine Icon & Vertical Track Line */}
                  <div className="flex flex-col items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelect({ type: 'step', id: step.id })}
                      className={`relative z-10 flex size-9 items-center justify-center rounded-full text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-primary text-white ring-4 ring-primary/30 shadow-md scale-110'
                          : isDecision
                            ? 'bg-amber-500 text-white ring-2 ring-amber-300 dark:ring-amber-900'
                            : isBranchStep
                              ? 'bg-rose-500 text-white'
                              : 'bg-white text-slate-700 border-2 border-slate-300 shadow-xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                      }`}
                      title={`Chọn bước ${step.sequence}`}
                    >
                      {isDecision ? (
                        <span className="material-symbols-outlined text-base">call_split</span>
                      ) : (
                        <span>{step.sequence}</span>
                      )}
                    </button>

                    {/* Connecting Vertical Trunk to next step */}
                    {index < flow.steps.length - 1 && (
                      <div className="h-28 w-0.5 bg-slate-300 dark:bg-slate-700 relative">
                        <div className={`absolute inset-0 ${isSelected ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      </div>
                    )}
                  </div>

                  {/* Center-Right: Main Step Card & Branching Cards */}
                  <div className="space-y-3 pb-4">
                    {/* Main Step Card */}
                    <button
                      type="button"
                      onClick={() => onSelect({ type: 'step', id: step.id })}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/40 shadow-md -translate-y-0.5 dark:bg-primary/[0.1]'
                          : isBranchStep
                            ? 'border-rose-300 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20'
                            : 'border-slate-200/90 bg-white hover:border-primary/50 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80'
                      } ${dimmed ? 'opacity-35' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                          {step.title}
                        </h3>
                        {isDecision && (
                          <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                            Decision point
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {step.explanation}
                      </p>

                      {/* State transition pill */}
                      <div className="mt-2.5 rounded-xl bg-slate-100/90 px-2.5 py-1.5 text-[10px] leading-4 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                        <span className="font-black uppercase tracking-wider text-slate-400 text-[9px]">State:</span>{' '}
                        <span className="font-bold text-slate-800 dark:text-slate-200">{step.stateAfter ?? 'Không đổi state'}</span>
                      </div>

                      {/* API / Kafka Interactions */}
                      {(stepInteractions.length > 0 || step.eventIds.length > 0) && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {stepInteractions.map((interaction) => {
                            const meta = communicationMeta(interaction.kind);
                            return (
                              <span
                                key={interaction.id}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${meta.className}`}
                              >
                                <span className="material-symbols-outlined text-[12px]">{meta.icon}</span>
                                <span>{interaction.label}</span>
                              </span>
                            );
                          })}
                          {step.eventIds.filter((eId) => !stepInteractions.some((inter) => inter.eventIds?.includes(eId))).map((eventId) => (
                            <span
                              key={eventId}
                              className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300"
                            >
                              <span className="material-symbols-outlined text-[12px]">sync_alt</span>
                              <span>{getFlowEvent(eventId)?.topic ?? eventId}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </button>

                    {/* Branch Cards (Sprouting out from parent step) */}
                    {relatedBranches.map((branch) => {
                      const isBranchSelected = activeBranch?.id === branch.id;
                      return (
                        <div key={branch.id} className="relative pl-6">
                          {/* Curved SVG Branch Connector Arm */}
                          <div className="absolute left-0 top-4 w-6 h-6 border-l-2 border-b-2 border-dashed border-rose-400 rounded-bl-xl dark:border-rose-600 pointer-events-none" />

                          {/* Branch Node Card */}
                          <button
                            type="button"
                            onClick={() => onSelect({ type: 'branch', id: branch.id })}
                            className={`w-full rounded-xl border p-3 text-left transition-all ${
                              isBranchSelected
                                ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-300 shadow-sm dark:bg-rose-950/40 dark:ring-rose-800'
                                : 'border-rose-200 bg-rose-50/50 hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/20'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-black text-rose-800 dark:text-rose-200">
                                <span className="material-symbols-outlined text-sm text-rose-500">alt_route</span>
                                {branch.label}
                              </span>
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-black uppercase text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                                {branch.severity}
                              </span>
                            </div>

                            <p className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-slate-300">
                              <span className="font-bold text-rose-700 dark:text-rose-400">Trigger:</span> {branch.trigger}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-slate-300">
                              <span className="font-bold text-amber-700 dark:text-amber-400">Recovery:</span> {branch.recovery}
                            </p>

                            <div className="mt-2 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-rose-800 border border-rose-200 dark:bg-slate-900 dark:text-rose-300 dark:border-rose-900/50">
                              Terminal: {branch.terminalOutcome}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Terminal Success Outcome Node */}
          <div className="flex flex-col items-center pt-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 px-5 py-3 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/40">
              <span className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                <span className="material-symbols-outlined text-base">check</span>
              </span>
              <div>
                <span className="block text-xs font-black text-emerald-900 dark:text-emerald-200">
                  Mục tiêu hoàn tất thành công (Success Terminal)
                </span>
                <span className="block text-[11px] text-emerald-700 dark:text-emerald-300">
                  {flow.successOutcome}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function FlowCanvas({
  flow,
  mode,
  selected,
  onSelect,
  onNextStep,
  onPrevStep,
}: {
  flow: FlowExplorerDefinition;
  mode: FlowMode;
  selected: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}) {
  const activeBranch = selected.type === 'branch' ? flow.branches.find((branch) => branch.id === selected.id) : undefined;
  const activeStepIds = new Set(activeBranch?.stepIds ?? []);
  const selectedStepId = selected.type === 'step' ? selected.id : activeBranch?.fromStepId;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active step card into center of horizontal view
  useEffect(() => {
    if (!selectedStepId || !scrollContainerRef.current) return;
    const targetElement = scrollContainerRef.current.querySelector(`[data-step-id="${selectedStepId}"]`) as HTMLElement | null;
    if (typeof targetElement?.scrollIntoView === 'function') {
      targetElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedStepId]);

  const currentIndex = flow.steps.findIndex((s) => s.id === selectedStepId);

  return (
    <Panel className="overflow-hidden">
      {/* Swimlane Header with Legend and Navigation */}
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full bg-primary" />
              HTTPS / Request
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-violet-500" />
              Kafka / Async
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              Failure point
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Bước <span className="text-primary font-black">{currentIndex >= 0 ? currentIndex + 1 : 1}</span> / {flow.steps.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPrevStep}
                disabled={currentIndex <= 0}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                aria-label="Bước trước"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={onNextStep}
                disabled={currentIndex >= flow.steps.length - 1}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                aria-label="Bước tiếp"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Swimlane Steps Canvas with Expanded Step Cards */}
      <div ref={scrollContainerRef} className="overflow-x-auto p-4 sm:p-5 custom-scrollbar">
        <div className="inline-flex gap-3.5 pb-2 pt-1 min-w-full">
          {flow.steps.map((step, index) => {
            const isBranchStep = mode === 'failure' && activeStepIds.has(step.id);
            const dimmed = mode === 'failure' && activeBranch && !activeStepIds.has(step.id) && step.id !== activeBranch.fromStepId;
            const isSelected = step.id === selectedStepId;
            const stepInteractions = flow.interactions.filter((interaction) => interaction.sourceStepId === step.id);
            const relatedBranches = flow.branches.filter((branch) => branch.fromStepId === step.id);

            return (
              <div
                key={step.id}
                data-step-id={step.id}
                className="flex w-[260px] sm:w-[280px] shrink-0 flex-col"
              >
                {/* Step Sequence Header & Progress Connector */}
                <div className="mb-2.5 flex items-center gap-2">
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all ${
                    isSelected
                      ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md scale-110'
                      : isBranchStep
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {step.sequence}
                  </div>
                  <div className="flex-1">
                    {index < flow.steps.length - 1 ? (
                      <div className={`h-1 w-full rounded-full ${
                        flow.interactions.some((item) => item.sourceStepId === step.id && item.kind === 'event')
                          ? 'border-t-2 border-dashed border-violet-400 dark:border-violet-600'
                          : 'bg-primary/40'
                      }`} />
                    ) : (
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Finish</span>
                    )}
                  </div>
                </div>

                {/* Unified Step Card */}
                <button
                  type="button"
                  onClick={() => onSelect({ type: 'step', id: step.id })}
                  className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all min-h-[330px] ${
                    isSelected
                      ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/40 shadow-lg -translate-y-1 dark:bg-primary/[0.1]'
                      : isBranchStep
                        ? 'border-rose-300 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20'
                        : 'border-slate-200/90 bg-slate-50/70 hover:border-primary/50 hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:bg-slate-900'
                  } ${dimmed ? 'opacity-35' : ''}`}
                >
                  <div>
                    {/* Phase Badge + Actor Tag */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
                        {step.phase}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isSelected ? 'bg-primary/20 text-primary' : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        <span className="material-symbols-outlined text-[13px]">{actorIcon(step.actor)}</span>
                        {step.actor}
                      </span>
                    </div>

                    {/* Step Title & Explanation */}
                    <h3 className="mt-3 text-sm font-black leading-snug text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500 line-clamp-3 dark:text-slate-400">
                      {step.explanation}
                    </p>
                  </div>

                  {/* State and Interactions Footprint inside Card */}
                  <div className="mt-4 space-y-2 border-t border-slate-200/80 pt-3 dark:border-slate-800/80">
                    {/* API / Event badging */}
                    {stepInteractions.length > 0 && (
                      <div className="space-y-1">
                        {stepInteractions.map((interaction) => {
                          const meta = communicationMeta(interaction.kind);
                          return (
                            <span
                              key={interaction.id}
                              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold leading-tight ${meta.className}`}
                            >
                              <span className="material-symbols-outlined text-[13px] shrink-0">{meta.icon}</span>
                              <span className="truncate">{interaction.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Standalone Event badging */}
                    {step.eventIds.filter((eId) => !stepInteractions.some((inter) => inter.eventIds?.includes(eId))).map((eventId) => (
                      <span
                        key={eventId}
                        className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-mono font-bold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300"
                      >
                        <span className="material-symbols-outlined text-[13px] shrink-0">sync_alt</span>
                        <span className="truncate">{getFlowEvent(eventId)?.topic ?? eventId}</span>
                      </span>
                    ))}

                    {/* State transition pill */}
                    <div className="rounded-xl bg-slate-100/90 px-2.5 py-1.5 text-[10px] leading-4 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                      <span className="font-black uppercase tracking-wider text-slate-400 text-[9px]">State:</span>{' '}
                      <span className="font-bold text-slate-800 dark:text-slate-200">{step.stateAfter ?? 'Không đổi state'}</span>
                    </div>

                    {/* Failure branch tag */}
                    {relatedBranches.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        {relatedBranches.length} failure branch
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failure branches section below canvas when in failure mode */}
      {mode === 'failure' && (
        <div className="border-t border-rose-200 bg-rose-50/60 px-4 py-3.5 dark:border-rose-900/60 dark:bg-rose-950/20">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">
              Nhánh lỗi & Kịch bản phục hồi ({flow.branches.length})
            </p>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Bấm branch để xem recovery</span>
          </div>
          <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
            {flow.branches.length ? (
              flow.branches.map((branch) => {
                const isSelected = activeBranch?.id === branch.id;
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => onSelect({ type: 'branch', id: branch.id })}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-white shadow-sm ring-1 ring-rose-300 dark:bg-slate-950 dark:ring-rose-800'
                        : 'border-rose-200/90 bg-white/80 hover:border-rose-400 dark:border-rose-900/60 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-rose-800 dark:text-rose-200">{branch.label}</span>
                      <span className="material-symbols-outlined text-base text-rose-500">alt_route</span>
                    </div>
                    <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-400 line-clamp-2">
                      {branch.trigger}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-slate-500">Luồng này là boundary mô tả, không có recovery branch hoạt động.</p>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

function ContractSummary({ operation, expanded, onToggle }: { operation: HandbookApiOperation; expanded: boolean; onToggle: () => void }) {
  const hint = handbookContractHints[operation.id];
  const [copied, setCopied] = useState(false);

  const copyEndpoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (operation.path && typeof navigator?.clipboard?.writeText === 'function') {
      navigator.clipboard.writeText(operation.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap gap-1">
          {operation.verbs.map((verb) => (
            <span key={verb} className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-black ${methodBadgeColor(verb)}`}>
              {verb}
            </span>
          ))}
        </div>
        <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {operation.classification}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="break-all font-mono text-xs font-black text-slate-900 dark:text-slate-100">
          {operation.path ?? 'Private source operation · path not published'}
        </p>
        {operation.path && (
          <button
            type="button"
            onClick={copyEndpoint}
            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800"
            title="Sao chép path"
          >
            <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
          </button>
        )}
      </div>

      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-primary">{operation.service}</span> · {operation.controller}.{operation.handler}
      </p>

      {hint && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>{expanded ? 'Ẩn contract chi tiết' : 'Xem payload & auth contract'}</span>
            <span className="material-symbols-outlined text-sm">{expanded ? 'expand_less' : 'expand_more'}</span>
          </button>

          {expanded && (
            <dl className="mt-2.5 grid gap-2 border-t border-slate-200 pt-2.5 text-[11px] leading-5 dark:border-slate-800">
              <div className="rounded-lg bg-white p-2 dark:bg-slate-950">
                <dt className="font-black uppercase tracking-wider text-slate-400 text-[10px]">Request body / params</dt>
                <dd className="mt-0.5 font-mono text-slate-700 dark:text-slate-300">{hint.request}</dd>
              </div>
              <div className="rounded-lg bg-white p-2 dark:bg-slate-950">
                <dt className="font-black uppercase tracking-wider text-slate-400 text-[10px]">Response schema</dt>
                <dd className="mt-0.5 font-mono text-slate-700 dark:text-slate-300">{hint.response}</dd>
              </div>
              <div className="rounded-lg bg-white p-2 dark:bg-slate-950">
                <dt className="font-black uppercase tracking-wider text-slate-400 text-[10px]">Authentication / Authorization</dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{hint.auth}</dd>
              </div>
              <div className="rounded-lg bg-white p-2 dark:bg-slate-950">
                <dt className="font-black uppercase tracking-wider text-rose-500 text-[10px]">Failure signals & Error codes</dt>
                <dd className="mt-0.5 font-mono text-rose-700 dark:text-rose-300">{hint.errors.join(' · ')}</dd>
              </div>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

function Inspector({
  flow,
  selection,
  onSelect,
  onNextStep,
  onPrevStep,
}: {
  flow: FlowExplorerDefinition;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
}) {
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  const body = (() => {
    if (selection.type === 'service') {
      const service = getHandbookService(selection.id);
      const relatedFlows = getFlowForService(service.id);
      const operations = getHandbookOperations(service.id);
      return (
        <>
          <InspectorHeading icon={service.icon} eyebrow={service.group} title={service.label} subtitle={service.shortLabel} />
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{service.description}</p>
          <InfoList title="Trách nhiệm cốt lõi" items={service.responsibilities} />
          <div className="mt-4 rounded-xl bg-slate-100 p-3 text-xs dark:bg-slate-900">
            <p className="font-black uppercase tracking-wider text-slate-400 text-[10px]">Interface & Data Store</p>
            <p className="mt-1 text-slate-700 dark:text-slate-200 font-medium">{service.interface}</p>
            {service.dataStore && <p className="mt-1 font-mono text-[11px] text-slate-500">{service.dataStore}</p>}
          </div>
          <RelatedFlows flows={relatedFlows} onSelect={onSelect} />
          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Danh mục API của Service ({operations.length})</p>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {operations.map((operation) => (
                <button
                  key={operation.id}
                  type="button"
                  onClick={() => onSelect({ type: 'operation', id: operation.id })}
                  className="block w-full rounded-xl border border-slate-200 p-2.5 text-left transition hover:border-primary/50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${methodBadgeColor(operation.verbs[0] ?? 'GET')}`}>
                    {operation.verbs.join('/')}
                  </span>
                  <span className="mt-1 block break-all font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {operation.path ?? 'private source operation'}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-slate-400 truncate">
                    {operation.controller}.{operation.handler}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      );
    }
    if (selection.type === 'operation') {
      const operation = getFlowOperation(selection.id)!;
      return (
        <>
          <InspectorHeading icon="terminal" eyebrow="HTTP Contract" title="API Operation" subtitle={`${operation.service} owner`} />
          <ContractSummary
            operation={operation}
            expanded={expandedContract === operation.id || true}
            onToggle={() => setExpandedContract(expandedContract === operation.id ? null : operation.id)}
          />
          <div className="mt-4 rounded-xl bg-slate-100 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            Operation được phân loại từ source HTTP inventory thực tế của backend microservices.
          </div>
        </>
      );
    }
    if (selection.type === 'event') {
      const item = getFlowEvent(selection.id)!;
      return (
        <>
          <InspectorHeading icon="sync_alt" eyebrow="Asynchronous Contract" title={item.topic} subtitle="Kafka Event Delivery" />
          <dl className="grid gap-3 text-sm">
            <InspectorField label="Producer Service" value={item.producer} />
            <InspectorField label="Consumer Services" value={item.consumers.join(' · ')} />
            <InspectorField label="Delivery Guarantee" value={item.delivery} />
            <InspectorField label="Replay & Ordering Rule" value={item.rule} />
          </dl>
          <div className="mt-5 border-t border-slate-200 pt-3 dark:border-slate-800">
            <MiniSource file={item.source.file} section={item.source.section} />
          </div>
        </>
      );
    }
    if (selection.type === 'branch') {
      const branch = flow.branches.find((item) => item.id === selection.id)!;
      const origin = getFlowStep(flow, branch.fromStepId);
      return (
        <>
          <InspectorHeading icon="alt_route" eyebrow="Failure & Recovery" title={branch.label} subtitle={`Xuất phát từ: ${origin.title}`} />
          <InspectorField label="Kích hoạt khi (Trigger)" value={branch.trigger} />
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Hướng phục hồi (Recovery)</p>
            <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{branch.recovery}</p>
          </div>
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/30">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">Kết quả cuối (Terminal Outcome)</p>
            <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{branch.terminalOutcome}</p>
          </div>
        </>
      );
    }
    const step = getFlowStep(flow, selection.id);
    return (
      <StepInspector
        flow={flow}
        step={step}
        onSelect={onSelect}
        expandedContract={expandedContract}
        onToggleContract={setExpandedContract}
        onNextStep={onNextStep}
        onPrevStep={onPrevStep}
      />
    );
  })();

  return (
    <Panel className="p-4 sm:p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain custom-scrollbar">
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">Chi tiết hành động & Hợp đồng</p>
        <span className="material-symbols-outlined text-lg text-slate-400">info</span>
      </div>
      {body}
    </Panel>
  );
}

function InspectorHeading({ icon, eyebrow, title, subtitle }: { icon: string; eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="material-symbols-outlined rounded-2xl bg-primary/10 p-2.5 text-2xl text-primary shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <h2 className="mt-0.5 break-words text-lg font-black text-slate-950 dark:text-white leading-snug">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

function InspectorField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm leading-6 text-slate-700 dark:text-slate-300 font-medium">{value}</p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">check_circle</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedFlows({ flows, onSelect }: { flows: FlowExplorerDefinition[]; onSelect: (selection: InspectorSelection) => void }) {
  return (
    <div className="mt-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Luồng sử dụng service này</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {flows.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect({ type: 'step', id: item.steps[0].id })}
            className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepInspector({
  flow,
  step,
  onSelect,
  expandedContract,
  onToggleContract,
  onNextStep,
  onPrevStep,
}: {
  flow: FlowExplorerDefinition;
  step: FlowStep;
  onSelect: (selection: InspectorSelection) => void;
  expandedContract: string | null;
  onToggleContract: (value: string | null) => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
}) {
  const relatedBranches = flow.branches.filter((branch) => branch.fromStepId === step.id || branch.stepIds.includes(step.id));
  const currentIndex = flow.steps.findIndex((s) => s.id === step.id);

  return (
    <div className="space-y-4">
      {/* Quick Step Navigator in Inspector */}
      {onNextStep && onPrevStep && (
        <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <button
            type="button"
            onClick={onPrevStep}
            disabled={currentIndex <= 0}
            className="inline-flex items-center gap-1 hover:text-primary disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Bước trước</span>
          </button>
          <span>Bước {currentIndex + 1} / {flow.steps.length}</span>
          <button
            type="button"
            onClick={onNextStep}
            disabled={currentIndex >= flow.steps.length - 1}
            className="inline-flex items-center gap-1 hover:text-primary disabled:opacity-30"
          >
            <span>Bước sau</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      )}

      <InspectorHeading
        icon={step.status === 'terminal' ? 'flag' : step.status === 'decision' ? 'call_split' : 'play_arrow'}
        eyebrow={`${step.phase} · Bước ${step.sequence}`}
        title={step.title}
        subtitle={`${step.actor} thực hiện`}
      />

      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{step.explanation}</p>

      {/* State Changes Card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Biến đổi trạng thái (State Transition)</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white p-2 dark:bg-slate-950">
            <span className="text-[10px] font-bold text-slate-400">Trước</span>
            <p className="mt-0.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {step.stateBefore ?? 'Không đổi'}
            </p>
          </div>
          <div className="rounded-lg bg-white p-2 dark:bg-slate-950">
            <span className="text-[10px] font-bold text-primary">Sau</span>
            <p className="mt-0.5 font-mono text-[11px] font-bold text-primary">
              {step.stateAfter ?? 'Không đổi'}
            </p>
          </div>
        </div>
      </div>

      {/* Participating Services */}
      {step.serviceIds.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Service tham gia</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {step.serviceIds.map((serviceId) => (
              <button
                key={serviceId}
                type="button"
                onClick={() => onSelect({ type: 'service', id: serviceId })}
                className="rounded-lg border border-primary/20 bg-primary/[0.04] px-2.5 py-1 font-mono text-[11px] font-bold text-primary hover:bg-primary/10 transition"
              >
                {serviceId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* APIs */}
      {step.apiOperationIds.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hợp đồng API tham gia ({step.apiOperationIds.length})</p>
          <div className="mt-2 space-y-2">
            {step.apiOperationIds.map((operationId) => {
              const operation = getFlowOperation(operationId);
              return operation ? (
                <ContractSummary
                  key={operation.id}
                  operation={operation}
                  expanded={expandedContract === operation.id}
                  onToggle={() => onToggleContract(expandedContract === operation.id ? null : operation.id)}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Events */}
      {step.eventIds.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sự kiện Kafka / Asynchronous</p>
          <div className="mt-2 space-y-1.5">
            {step.eventIds.map((eventId) => {
              const item = getFlowEvent(eventId);
              return item ? (
                <button
                  key={eventId}
                  type="button"
                  onClick={() => onSelect({ type: 'event', id: eventId })}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50/70 p-2.5 text-left transition hover:border-violet-400 dark:border-violet-900/60 dark:bg-violet-950/30"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[11px] font-black text-violet-700 dark:text-violet-300">
                      {item.topic}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {item.producer} → {item.consumers.join(', ')}
                    </span>
                  </span>
                  <span className="material-symbols-outlined text-base text-violet-500 shrink-0">chevron_right</span>
                </button>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Failure Branches */}
      {relatedBranches.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Nhánh lỗi tại bước này</p>
          <div className="mt-2 space-y-1.5">
            {relatedBranches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => onSelect({ type: 'branch', id: branch.id })}
                className="w-full rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-left text-xs font-bold text-rose-700 transition hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
              >
                <div className="flex items-center justify-between">
                  <span>{branch.label}</span>
                  <span className="material-symbols-outlined text-sm">alt_route</span>
                </div>
                <span className="mt-1 block text-[10px] font-normal text-slate-500 dark:text-slate-400">{branch.trigger}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
        <MiniSource file={flow.source.file} section={flow.source.section} />
      </div>
    </div>
  );
}

function FlowExplorer({
  flow,
  mode,
  selection,
  onMode,
  onFlow,
  onSelect,
}: {
  flow: FlowExplorerDefinition;
  mode: FlowMode;
  selection: InspectorSelection;
  onMode: (mode: FlowMode) => void;
  onFlow: (id: string) => void;
  onSelect: (selection: InspectorSelection) => void;
}) {
  const [visualMode, setVisualMode] = useState<FlowVisualMode>('tree');
  const [inspectorExpanded, setInspectorExpanded] = useState(true);
  const selectedStepId = selection.type === 'step' ? selection.id : flow.steps[0].id;
  const currentIndex = flow.steps.findIndex((s) => s.id === selectedStepId);

  const handleNextStep = () => {
    if (currentIndex < flow.steps.length - 1) {
      onSelect({ type: 'step', id: flow.steps[currentIndex + 1].id });
    }
  };

  const handlePrevStep = () => {
    if (currentIndex > 0) {
      onSelect({ type: 'step', id: flow.steps[currentIndex - 1].id });
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        eyebrow="Connected runtime story"
        title="Flow Explorer"
        description="Khám phá toàn bộ luồng nghiệp vụ kết nối giữa các Actor, Service, API contract, Kafka event và kịch bản phục hồi lỗi."
        action={<StatusChip status={flow.status} />}
      />

      {/* Top Compact Flow Selector Bar */}
      <CompactFlowBar
        flow={flow}
        mode={mode}
        visualMode={visualMode}
        onFlow={onFlow}
        onMode={onMode}
        onVisualMode={setVisualMode}
        inspectorExpanded={inspectorExpanded}
        onToggleInspector={() => setInspectorExpanded((exp) => !exp)}
      />

      {/* Main Flow Content: Tree Graph or Swimlane + Side Inspector */}
      <div className={`grid gap-5 items-start ${
        inspectorExpanded
          ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]'
          : 'grid-cols-1'
      }`}>
        {/* Visualizer Canvas Area (Tree Graph or Swimlane) */}
        <div className="min-w-0">
          {visualMode === 'tree' ? (
            <TreeFlowGraph
              flow={flow}
              mode={mode}
              selected={selection}
              onSelect={onSelect}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
            />
          ) : (
            <FlowCanvas
              flow={flow}
              mode={mode}
              selected={selection}
              onSelect={onSelect}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
            />
          )}
        </div>

        {/* Side Inspector (Collapsible) */}
        {inspectorExpanded && (
          <div className="min-w-0">
            <Inspector
              flow={flow}
              selection={selection}
              onSelect={onSelect}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ArchitectureView({
  flow,
  selection,
  onSelect,
  onFlow,
}: {
  flow: FlowExplorerDefinition;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
  onFlow: (id: string) => void;
}) {
  const activeNodes = new Set(flow.steps.flatMap((step) => step.serviceIds).concat(['gateway', 'customer-app', 'delivery-web', 'shipper-app']));
  const relevantConnections = SYSTEM_CONNECTIONS.filter((connection) => activeNodes.has(connection.source) && activeNodes.has(connection.target));
  const groups = [
    { label: 'Clients', nodes: SYSTEM_NODES.filter((node) => node.kind === 'client') },
    { label: 'Public edge', nodes: SYSTEM_NODES.filter((node) => node.kind === 'edge') },
    { label: 'Domain services', nodes: SYSTEM_NODES.filter((node) => node.kind === 'service') },
    { label: 'Data & control', nodes: SYSTEM_NODES.filter((node) => node.kind === 'infrastructure') },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="Topology with runtime context"
        title="Architecture overlay"
        description="Bản đồ highlight các block tham gia flow đang chọn; node còn lại vẫn hiển thị để giữ toàn cảnh kiến trúc."
        action={
          <button
            type="button"
            onClick={() => onFlow('cod-order')}
            className="rounded-xl bg-primary px-3.5 py-2 text-xs font-black text-white shadow-xs transition hover:bg-primary-hover"
          >
            Đổi flow →
          </button>
        }
      />

      <Panel className="overflow-hidden bg-slate-950 p-4 text-white">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full bg-primary/20 px-3 py-1 font-bold text-orange-200">
            Flow đang xem: {flow.label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="size-2 rounded-full bg-primary" />
            Tham gia trong flow
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <span className="size-2 rounded-full bg-slate-600" />
            Toàn cảnh hệ thống
          </span>
          <span className="inline-flex items-center gap-1.5 text-violet-300">
            <span className="w-5 border-t border-dashed" />
            Async connection
          </span>
        </div>
      </Panel>

      {/* 4-Layer Architecture Topology Columns */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => (
          <Panel key={group.label} className="p-3.5">
            <p className="border-b border-slate-200 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary dark:border-slate-800">
              {group.label}
            </p>
            <div className="mt-3 space-y-2">
              {group.nodes.map((node) => (
                <ArchitectureNode
                  key={node.id}
                  node={node}
                  active={activeNodes.has(node.id)}
                  selected={selection.type === 'service' && selection.id === node.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </Panel>
        ))}
      </div>

      {/* Highlighted Connections */}
      <Panel className="p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Highlighted Communication Edges</p>
        <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {relevantConnections.length ? (
            relevantConnections.map((connection) => (
              <button
                key={connection.id}
                type="button"
                onClick={() => onSelect({ type: 'service', id: connection.target })}
                className={`rounded-xl border p-3 text-left transition-all ${
                  connection.kind === 'async'
                    ? 'border-violet-200 bg-violet-50/70 hover:border-violet-400 dark:border-violet-900/60 dark:bg-violet-950/20'
                    : 'border-slate-200/90 bg-slate-50/70 hover:border-primary/50 dark:border-slate-800 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-black text-primary">{connection.source}</span>
                  <span className={`material-symbols-outlined text-sm ${connection.kind === 'async' ? 'text-violet-500' : 'text-primary'}`}>
                    {connection.kind === 'async' ? 'sync_alt' : 'arrow_forward'}
                  </span>
                  <span className="font-mono text-[10px] font-black text-primary">{connection.target}</span>
                </div>
                <span className="mt-2 block text-xs font-bold text-slate-700 dark:text-slate-200">{connection.label}</span>
                <span className="mt-1 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{connection.detail}</span>
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-500">Flow này dùng connection tổng quát; chọn step để xem giao tiếp chi tiết.</p>
          )}
        </div>
      </Panel>

      {/* Flow Trace & Inspector Split */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Flow-to-Architecture Trace</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {flow.steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelect({ type: 'step', id: step.id })}
                className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-primary/50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <span className="text-[10px] font-black text-primary">{step.sequence}. {step.phase}</span>
                <span className="mt-1 block text-sm font-black text-slate-900 dark:text-white">{step.title}</span>
                <span className="mt-1.5 block font-mono text-[10px] text-slate-500">{step.serviceIds.join(' · ')}</span>
              </button>
            ))}
          </div>
        </Panel>
        <Inspector flow={flow} selection={selection} onSelect={onSelect} />
      </div>
    </div>
  );
}

function ArchitectureNode({
  node,
  active,
  selected,
  onSelect,
}: {
  node: SystemNode;
  active: boolean;
  selected: boolean;
  onSelect: (selection: InspectorSelection) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect({ type: 'service', id: node.id })}
      className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
        selected
          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
          : active
            ? 'border-primary/40 bg-primary/[0.04] hover:border-primary'
            : 'border-slate-200/80 opacity-50 hover:opacity-90 dark:border-slate-800'
      }`}
    >
      <span className={`material-symbols-outlined rounded-lg p-1.5 text-base shrink-0 ${active ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
        {node.icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block break-all text-[11px] font-black text-slate-900 dark:text-white">{node.label}</span>
        <span className="mt-0.5 block text-[9px] leading-4 text-slate-500 dark:text-slate-400 truncate">{node.shortLabel}</span>
      </div>
    </button>
  );
}

function ContractsView({
  flow,
  selection,
  onSelect,
}: {
  flow: FlowExplorerDefinition;
  selection: InspectorSelection;
  onSelect: (selection: InspectorSelection) => void;
}) {
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const relevantServices = new Set(flow.steps.flatMap((step) => step.serviceIds));

  const operations = useMemo(() => {
    return getHandbookOperations().filter((operation) => {
      const matchText = `${operation.service} ${operation.path ?? ''} ${operation.handler} ${operation.controller}`.toLowerCase().includes(query.toLowerCase());
      if (!matchText) return false;
      if (methodFilter !== 'ALL' && !operation.verbs.includes(methodFilter)) return false;
      return true;
    });
  }, [query, methodFilter]);

  const visibleServices = SYSTEM_NODES.filter((node) => node.kind === 'service' || node.kind === 'infrastructure');

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="Ownership and contracts"
        title="Services & Contracts"
        description="Xem owner, state và API catalog. Khi đang chọn một flow, các service tham gia được ưu tiên highlight."
        action={<span className="text-xs font-bold text-slate-400">{getHandbookOperations().length} classified operations</span>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4 min-w-0">
          {/* Services Grid */}
          <Panel className="p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Service Ownership & Domain</p>
            <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {visibleServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onSelect({ type: 'service', id: service.id })}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    relevantServices.has(service.id)
                      ? 'border-primary/50 bg-primary/[0.04] ring-1 ring-primary/20'
                      : 'border-slate-200 hover:border-primary/50 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">{service.icon}</span>
                    <span className="break-all text-xs font-black text-slate-900 dark:text-white">{service.label}</span>
                  </div>
                  <span className="mt-1.5 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{service.shortLabel}</span>
                  <span className="mt-1.5 block font-mono text-[9px] text-slate-400 truncate">{service.dataStore ?? service.interface}</span>
                </button>
              ))}
            </div>
          </Panel>

          {/* API Catalog Search & Filters */}
          <Panel className="overflow-hidden">
            <div className="border-b border-slate-200 p-4 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">API Catalog ({operations.length})</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setMethodFilter(method)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-black font-mono transition ${
                        methodFilter === method
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-2.5 text-lg text-slate-400">search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm service, endpoint hoặc handler…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="max-h-[560px] overflow-auto custom-scrollbar">
              <table className="min-w-[650px] w-full text-left">
                <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3">Operation & Endpoint</th>
                    <th className="px-4 py-3">Owner Service</th>
                    <th className="px-4 py-3">Exposure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {operations.map((operation) => (
                    <tr
                      key={operation.id}
                      className="cursor-pointer align-top hover:bg-primary/[0.04] transition"
                      onClick={() => onSelect({ type: 'operation', id: operation.id })}
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[9px] font-black ${methodBadgeColor(operation.verbs[0] ?? 'GET')}`}>
                          {operation.verbs.join('/')}
                        </span>
                        <span className="mt-1 block break-all font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {operation.path ?? 'private source operation'}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-400">
                          {operation.controller}.{operation.handler}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {operation.service}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {operation.classification}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Inspector flow={flow} selection={selection} onSelect={onSelect} />
      </div>
    </div>
  );
}

function Overview({ onFlow, onSection }: { onFlow: (id: string) => void; onSection: (section: WorkspaceSection) => void }) {
  const coreFlow = getFlow('cod-order');
  const activeCapabilities = HANDBOOK_CAPABILITIES.filter((capability) => capability.status === 'active').slice(0, 8);

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="As-built system handbook"
        title="Hiểu hệ thống qua một luồng liên kết"
        description="Bắt đầu từ workflow thay vì danh sách service. Mỗi hành động dẫn tới actor, API/event, state owner, nhánh lỗi và kiến trúc phía sau."
        action={<StatusChip status="active" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon="route" value={FLOW_EXPLORER_FLOWS.length} label="Workflows chính" detail="Happy path + Failure recovery" />
        <Metric icon="hub" value={SYSTEM_NODES.filter((node) => node.kind === 'service').length} label="Domain Services" detail="Owner-based boundaries" />
        <Metric icon="terminal" value={explorerOperationCount} label="Flow-linked APIs" detail="Progressive contracts" />
        <Metric icon="sync_alt" value={explorerEventCount} label="Flow-linked Events" detail="Producer, consumer, replay" />
      </div>

      <Panel className="overflow-hidden bg-slate-950 p-6 text-white shadow-md">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-300">Recommended starting point</p>
            <h2 className="mt-2 text-2xl font-black">COD order → delivery</h2>
            <p className="mt-2.5 max-w-xl text-sm leading-6 text-slate-300">
              Từ checkout tới settlement: bấm từng step để xem request, event, service owner và cách hệ thống recover khi quote lỗi, nhà hàng reject hoặc không tìm được shipper.
            </p>
            <button
              type="button"
              onClick={() => onFlow(coreFlow.id)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary/25 transition hover:bg-primary-hover"
            >
              <span>Khám phá luồng COD</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['1', 'Chọn flow', 'Bắt đầu bằng mục tiêu nghiệp vụ thực tế'],
              ['2', 'Bấm hành động', 'Xem actor, service, API contract và event'],
              ['3', 'Chuyển failure', 'Xem recovery branches và terminal outcome'],
            ].map(([number, label, detail]) => (
              <div key={number} className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
                <span className="text-[10px] font-black text-orange-300">0{number}</span>
                <p className="mt-1 text-sm font-black">{label}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-4 sm:p-5">
          <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Business Capabilities</p>
              <h2 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">Hệ thống giải quyết nghiệp vụ gì?</h2>
            </div>
            <button type="button" onClick={() => onSection('contracts')} className="text-xs font-bold text-primary hover:underline">
              Services & contracts →
            </button>
          </div>
          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {activeCapabilities.map((capability) => (
              <button
                key={capability.id}
                type="button"
                onClick={() => capability.workflows[0] ? onFlow(capability.workflows[0]) : onSection('contracts')}
                className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 text-left transition hover:border-primary/50 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40"
              >
                <p className="text-sm font-black text-slate-900 dark:text-white">{capability.label}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500 line-clamp-2 dark:text-slate-400">{capability.summary}</p>
                <p className="mt-2 font-mono text-[9px] font-bold text-primary truncate">{capability.services.join(' · ')}</p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Architecture Reader Path</p>
          <h2 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">Từ flow đến topology</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Chọn Architecture để nhìn các service trong luồng được highlight trên topology. Mỗi node trả lời ownership, state và contract footprint.
          </p>
          <button
            type="button"
            onClick={() => onSection('architecture')}
            className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs font-black text-primary transition hover:bg-primary/10"
          >
            Mở architecture overlay →
          </button>
          <div className="mt-5 border-t border-slate-200 pt-3 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Source snapshot</p>
            <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">{HANDBOOK_MANIFEST.generatedAt} · không gọi backend live</p>
          </div>
        </Panel>
      </div>

      <Panel className="p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Source of Truth References</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {HANDBOOK_SOURCE_REFS.slice(0, 8).map((ref) => (
            <div key={`${ref.file}-${ref.section}`} className="rounded-xl border border-slate-200/90 p-3 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{ref.label}</p>
              <div className="mt-2">
                <MiniSource file={ref.file} section={ref.section} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function OperationsView() {
  const cards = [
    ['public', 'Gateway là public edge duy nhất', 'Client không gọi service port, database, Kafka, Redis hay control plane trực tiếp.'],
    ['verified_user', 'Resource service tự authorize', 'JWT/JWKS, role và ownership được kiểm tra ở service sở hữu endpoint.'],
    ['sync_alt', 'Outbox + dedup cho async flow', 'Kafka at-least-once được an toàn nhờ transaction, receipt/fingerprint, retry và DLT.'],
    ['database', 'State ownership rõ ràng', 'Mỗi service viết database của mình; Redis/search projection không phải business truth.'],
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="System boundaries"
        title="Operations & recovery"
        description="Các quy tắc để system flow hoạt động an toàn khi lỗi, replay hoặc dependency không sẵn sàng."
      />

      <div className="grid gap-3.5 md:grid-cols-2">
        {cards.map(([icon, title, detail]) => (
          <Panel key={title} className="p-5">
            <span className="material-symbols-outlined text-3xl text-primary">{icon}</span>
            <h2 className="mt-3 text-base font-black text-slate-950 dark:text-white">{title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{detail}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Classification Policy</p>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Source controller/schema tồn tại không tự biến một capability thành public MVP. Handbook hiển thị catalog với classification để phân biệt active/protected, internal, gated và experimental.
        </p>
      </Panel>
    </div>
  );
}

function SearchBox({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const flows = FLOW_EXPLORER_FLOWS.filter((item) => `${item.label} ${item.summary} ${item.group}`.toLowerCase().includes(normalized))
      .slice(0, 4)
      .map((item) => ({ id: item.id, label: item.label, detail: `Flow · ${item.group}`, path: `${basePath}/workflows/${item.id}`, icon: 'route' }));
    const services = SYSTEM_NODES.filter((item) => `${item.label} ${item.shortLabel}`.toLowerCase().includes(normalized))
      .slice(0, 3)
      .map((item) => ({ id: item.id, label: item.label, detail: `Service · ${item.group}`, path: `${basePath}/services/${item.id}?node=${item.id}`, icon: 'hub' }));
    const operations = getHandbookOperations().filter((item) => `${item.path ?? ''} ${item.handler} ${item.service}`.toLowerCase().includes(normalized))
      .slice(0, 3)
      .map((item) => ({ id: item.id, label: item.path ?? item.handler, detail: `API · ${item.service}`, path: `${basePath}/apis?operation=${encodeURIComponent(item.id)}`, icon: 'terminal' }));
    return [...flows, ...services, ...operations].slice(0, 8);
  }, [query]);

  // Keyboard shortcut handler (Cmd+K / Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-xl">
      <label className="relative block">
        <span className="sr-only">Tìm handbook</span>
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-2.5 text-lg text-slate-400">search</span>
        <input
          ref={inputRef}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          placeholder="Tìm flow, service, API, event… (⌘K)"
          className="w-full rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 pl-10 pr-10 text-sm placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-2 rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </label>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-black uppercase text-slate-400 dark:border-slate-800">
            Kết quả tìm kiếm
          </div>
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => {
                onNavigate(result.path);
                setQuery('');
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-primary/[0.04] transition dark:border-slate-800"
            >
              <span className="material-symbols-outlined text-lg text-primary">{result.icon}</span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-200">{result.label}</span>
                <span className="block text-[10px] text-slate-400">{result.detail}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SystemHandbookPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const section = sectionFromLocation(location.pathname);
  const state = queryState(location);
  const flow = getFlow(flowIdFromLocation(location.pathname) ?? (section === 'flows' || section === 'architecture' || section === 'contracts' ? state.step?.split('-')[0] : null));
  const selection = buildSelection(state, flow);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const go = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  const updateFlowState = (patch: Record<string, string | null>, targetFlow = flow) => {
    const params = new URLSearchParams(location.search);
    Object.entries(patch).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
    const query = params.toString();
    go(`${basePath}/workflows/${targetFlow.id}${query ? `?${query}` : ''}`);
  };

  const select = (next: InspectorSelection) => {
    const patch: Record<string, string | null> = { step: null, node: null, operation: null, event: null, branch: null };
    if (next.type === 'step') patch.step = next.id;
    if (next.type === 'service') patch.node = next.id;
    if (next.type === 'operation') patch.operation = next.id;
    if (next.type === 'event') patch.event = next.id;
    if (next.type === 'branch') patch.branch = next.id;
    const params = new URLSearchParams(location.search);
    Object.entries(patch).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
    const query = params.toString();
    const target = section === 'architecture' ? `${basePath}/architecture` : section === 'contracts' ? `${basePath}/services` : `${basePath}/workflows/${flow.id}`;
    go(`${target}${query ? `?${query}` : ''}`);
  };

  const chooseFlow = (id: string) =>
    updateFlowState({ step: getFlow(id).steps[0].id, node: null, operation: null, event: null, branch: null }, getFlow(id));

  const chooseSection = (target: WorkspaceSection) => {
    if (target === 'overview') return go(basePath);
    if (target === 'flows') return updateFlowState({ step: getFlow('cod-order').steps[0].id }, getFlow('cod-order'));
    if (target === 'architecture') return go(`${basePath}/architecture?step=${encodeURIComponent(getFlow('cod-order').steps[0].id)}`);
    if (target === 'contracts') return go(`${basePath}/services?node=order-service`);
    return go(`${basePath}/operations`);
  };

  const content =
    section === 'overview' ? (
      <Overview onFlow={chooseFlow} onSection={chooseSection} />
    ) : section === 'flows' ? (
      <FlowExplorer
        flow={flow}
        mode={state.mode}
        selection={selection}
        onMode={(mode) => updateFlowState({ mode })}
        onFlow={chooseFlow}
        onSelect={select}
      />
    ) : section === 'architecture' ? (
      <ArchitectureView flow={flow} selection={selection} onSelect={select} onFlow={chooseFlow} />
    ) : section === 'contracts' ? (
      <ContractsView flow={flow} selection={selection} onSelect={select} />
    ) : (
      <OperationsView />
    );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 dark:bg-slate-950 dark:text-white flex flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:px-6 lg:px-8 shadow-xs">
        <div className="mx-auto flex max-w-[1840px] items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-900"
            aria-label="Mở điều hướng handbook"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <button
            type="button"
            onClick={() => chooseSection('overview')}
            className="flex shrink-0 items-center gap-2.5 text-left transition hover:opacity-85"
          >
            <span className="material-symbols-outlined rounded-2xl bg-gradient-to-tr from-primary to-amber-500 p-2 text-xl text-white shadow-sm">
              architecture
            </span>
            <div className="hidden sm:block">
              <span className="block text-sm font-black tracking-tight">Delivery System Handbook</span>
              <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">Flow-first · public read-only · as-built</span>
            </div>
          </button>

          <div className="ml-auto min-w-0 flex-1 flex justify-end">
            <SearchBox onNavigate={go} />
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="mx-auto flex w-full max-w-[1840px] flex-1 gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {/* Left Sidebar Navigation */}
        <aside
          className={`${
            mobileNavOpen ? 'block' : 'hidden'
          } fixed inset-x-4 top-[74px] z-30 max-h-[calc(100vh-90px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-20 lg:block lg:h-fit lg:w-56 lg:shrink-0 lg:rounded-2xl lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          <nav aria-label="Mục lục handbook" className="space-y-1.5">
            {workspaceNav.map((item) => {
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => chooseSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20 ring-1 ring-primary/40'
                      : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl shrink-0">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-black">{item.label}</span>
                    <span className={`mt-0.5 block text-[10px] ${isActive ? 'text-orange-100 font-medium' : 'text-slate-400'}`}>
                      {item.detail}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[10px] font-black uppercase tracking-wider text-primary">Snapshot</p>
            <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">{HANDBOOK_MANIFEST.generatedAt}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">Không live backend · không mutation</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="min-w-0 flex-1">{content}</main>
      </div>
    </div>
  );
};

export default SystemHandbookPage;
