import { getFlowForService, type FlowExplorerDefinition } from '../data/flowExplorerData';
import type { ArchitectureFlowEdge, ArchitectureFlowNode, ArchitectureGraph, ArchitectureSelection } from '../data/architectureGraph';

const statusLabel: Record<ArchitectureFlowNode['data']['status'], string> = {
  active: 'Đang sử dụng',
  private: 'Private',
  hidden: 'Hidden',
  'test-only': 'Test-only',
};

function InspectorField({ label, value, technical = false }: { label: string; value: string; technical?: boolean }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800">
      <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`mt-1.5 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-200 ${technical ? 'break-words font-mono text-[12px]' : ''}`}>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: ArchitectureFlowNode['data']['status'] }) {
  const tone = status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : status === 'private' ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${tone}`}>{statusLabel[status]}</span>;
}

function InspectorHeader({ icon, eyebrow, title, subtitle, status }: { icon: string; eyebrow: string; title: string; subtitle: string; status?: ArchitectureFlowNode['data']['status'] }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
      <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">{eyebrow}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="break-words font-mono text-lg font-black leading-6 text-slate-950 dark:text-white">{title}</h2>
          {status && <StatusBadge status={status} />}
        </div>
        <p className="mt-1 text-sm font-semibold leading-5 text-slate-600 dark:text-slate-300">{subtitle}</p>
      </div>
    </div>
  );
}

function RelatedFlows({ flows, onFlow }: { flows: FlowExplorerDefinition[]; onFlow?: (flowId: string) => void }) {
  if (!flows.length) return null;
  return (
    <div className="mt-5">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Flow liên quan</p>
      <div className="mt-2 space-y-2">
        {flows.map((flow) => (
          <button
            key={flow.id}
            type="button"
            onClick={() => onFlow?.(flow.id)}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-primary/60 hover:bg-primary/[0.04] dark:border-slate-800 dark:hover:bg-slate-800/70"
          >
            <span className="material-symbols-outlined text-lg text-primary">route</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-extrabold text-slate-800 dark:text-slate-100">{flow.label}</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">{flow.group}</span>
            </span>
            <span className="material-symbols-outlined text-base text-slate-400">arrow_forward</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConnectionRows({ nodeId, graph, onSelect }: { nodeId: string; graph: ArchitectureGraph; onSelect?: (selection: ArchitectureSelection) => void }) {
  const connections = graph.edges.filter((edge) => edge.source === nodeId || edge.target === nodeId);
  if (!connections.length) return null;
  return (
    <div className="mt-5">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Kết nối ({connections.length})</p>
      <div className="mt-2 space-y-2">
        {connections.slice(0, 8).map((edge) => (
          <button
            key={edge.id}
            type="button"
            onClick={() => onSelect?.({ type: 'edge', id: edge.id })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-primary/60 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
          >
            <span className="block break-words font-mono text-[11px] font-extrabold text-slate-800 dark:text-slate-100">{edge.source} → {edge.target}</span>
            <span className="mt-1 block text-[11px] font-semibold text-primary">{edge.data.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NodeInspector({ node, graph, onSelect, onFlow }: { node: ArchitectureFlowNode; graph: ArchitectureGraph; onSelect?: (selection: ArchitectureSelection) => void; onFlow?: (flowId: string) => void }) {
  const source = node.data.sourceNode;
  const relatedFlows = getFlowForService(source.id);
  return (
    <>
      <InspectorHeader icon={source.icon} eyebrow={source.group} title={source.label} subtitle={source.shortLabel} status={source.status} />
      <dl className="mt-2">
        <InspectorField label="Vai trò" value={source.description} />
        <div className="border-b border-slate-100 py-3 dark:border-slate-800">
          <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Trách nhiệm cốt lõi</dt>
          <dd className="mt-2 space-y-2">
            {source.responsibilities.map((item) => <span key={item} className="flex gap-2 text-sm font-semibold leading-5 text-slate-800 dark:text-slate-200"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{item}</span>)}
          </dd>
        </div>
        <InspectorField label="Interface" value={source.interface} />
        {source.dataStore && <InspectorField label="Data owner / State" value={source.dataStore} technical />}
        <div className="py-3">
          <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Trạng thái snapshot</dt>
          <dd className="mt-1.5"><StatusBadge status={source.status} /></dd>
        </div>
      </dl>
      <RelatedFlows flows={relatedFlows} onFlow={onFlow} />
      <ConnectionRows nodeId={source.id} graph={graph} onSelect={onSelect} />
    </>
  );
}

function EdgeInspector({ edge }: { edge: ArchitectureFlowEdge }) {
  const kindLabel: Record<ArchitectureFlowEdge['data']['kind'], string> = { sync: 'Đồng bộ · HTTP/WebSocket', async: 'Bất đồng bộ · Kafka/Event', storage: 'Lưu trữ / state', external: 'Tích hợp external', control: 'Private control plane' };
  return (
    <>
      <InspectorHeader icon={edge.data.kind === 'async' ? 'sync_alt' : 'arrow_forward'} eyebrow="Communication edge" title={edge.data.label} subtitle={kindLabel[edge.data.kind]} />
      <p className="mt-4 break-words rounded-xl bg-slate-50 px-3 py-2.5 font-mono text-sm font-extrabold text-slate-800 dark:bg-slate-950 dark:text-slate-100">
        {edge.source} <span className="mx-1.5 text-primary">→</span> {edge.target}
      </p>
      <dl className="mt-2">
        <InspectorField label="Source" value={`${edge.source} · ${edge.data.sourceLabel}`} technical />
        <InspectorField label="Target" value={`${edge.target} · ${edge.data.targetLabel}`} technical />
        <InspectorField label="Kiểu giao tiếp" value={kindLabel[edge.data.kind]} />
        <InspectorField label="Chi tiết" value={edge.data.detail} />
      </dl>
      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.05] p-3 text-xs font-semibold leading-5 text-slate-700 dark:text-slate-300">
        Đây là connection được ghi trong snapshot canonical; handbook không suy diễn thêm route hoặc database edge.
      </div>
    </>
  );
}

export default function ArchitectureInspector({ selection, graph, onSelect, onFlow }: { selection: ArchitectureSelection | null; graph: ArchitectureGraph; onSelect?: (selection: ArchitectureSelection) => void; onFlow?: (flowId: string) => void }) {
  const selected = selection ? (selection.type === 'node' ? graph.nodes.find((node) => node.id === selection.id) : graph.edges.find((edge) => edge.id === selection.id)) : null;
  return (
    <aside className="architecture-inspector rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:p-5" aria-label="Chi tiết kiến trúc">
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">Chi tiết thành phần</p>
        <span className="material-symbols-outlined text-lg text-slate-400">info</span>
      </div>
      {selected ? selection?.type === 'node' ? <NodeInspector node={selected as ArchitectureFlowNode} graph={graph} onSelect={onSelect} onFlow={onFlow} /> : <EdgeInspector edge={selected as ArchitectureFlowEdge} /> : (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-3xl text-primary">touch_app</span>
          <h2 className="mt-4 text-base font-black text-slate-900 dark:text-white">Chọn một thành phần</h2>
          <p className="mt-2 max-w-[240px] text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">Bấm vào node hoặc đường kết nối để xem vai trò, dữ liệu sở hữu và cách giao tiếp.</p>
        </div>
      )}
    </aside>
  );
}
