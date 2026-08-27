import { useState } from 'react';
import type { ArchitectureFlowEdge, ArchitectureFlowNode, ArchitectureLayer, ArchitectureSelection } from '../data/architectureGraph';

const statusLabel: Record<ArchitectureFlowNode['data']['status'], string> = {
  active: 'Active',
  private: 'Private',
  hidden: 'Hidden',
  'test-only': 'Test-only',
};

function MobileNodeRow({ node, selected, onSelect }: { node: ArchitectureFlowNode; selected: boolean; onSelect: (selection: ArchitectureSelection) => void }) {
  return (
    <button
      type="button"
      aria-label={`${node.data.label} · ${node.data.shortLabel}`}
      onClick={() => onSelect({ type: 'node', id: node.id })}
      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-4 focus:ring-primary/20 ${selected ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/30' : 'border-slate-200 bg-white hover:border-primary/50 dark:border-slate-800 dark:bg-slate-900'}`}
    >
      <span className="material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg text-primary">{node.data.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block break-words font-mono text-[13px] font-extrabold leading-5 text-slate-900 dark:text-white">{node.data.label}</span>
        <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{node.data.shortLabel}</span>
        {node.data.dataStore && <span className="mt-1 block break-words font-mono text-[11px] font-semibold leading-4 text-slate-500 dark:text-slate-400">{node.data.dataStore}</span>}
      </span>
      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{statusLabel[node.data.status]}</span>
    </button>
  );
}

export default function ArchitectureMobileList({ layers, edges, selectedNodeId, selectedEdgeId, onNodeSelect, onEdgeSelect }: { layers: ArchitectureLayer[]; edges: ArchitectureFlowEdge[]; selectedNodeId: string | null; selectedEdgeId: string | null; onNodeSelect: (selection: ArchitectureSelection) => void; onEdgeSelect: (selection: ArchitectureSelection) => void }) {
  const [expandedLayers, setExpandedLayers] = useState<string[]>([]);
  const toggleLayer = (layerId: string) => setExpandedLayers((current) => current.includes(layerId) ? current.filter((id) => id !== layerId) : [...current, layerId]);

  return (
    <section className="architecture-mobile-list space-y-3 md:hidden" aria-labelledby="architecture-mobile-title">
      <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined flex size-10 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">view_list</span>
          <div>
            <h2 id="architecture-mobile-title" className="text-base font-black text-slate-950 dark:text-white">Danh sách theo lớp</h2>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-600 dark:text-slate-300">Mở từng lớp để xem thành phần và bấm vào một dòng để xem chi tiết.</p>
          </div>
        </div>
      </div>

      {layers.map((layer) => {
        const expanded = expandedLayers.includes(layer.id);
        return (
          <div key={layer.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={`${layer.label} · ${layer.nodes.length} thành phần`}
              onClick={() => toggleLayer(layer.id)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left focus:outline-none focus:ring-4 focus:ring-inset focus:ring-primary/20"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-primary dark:bg-slate-800"><span className="material-symbols-outlined text-lg">{layer.id === 'client' ? 'devices' : layer.id === 'edge' ? 'router' : layer.id === 'service' ? 'hub' : 'database'}</span></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-900 dark:text-white">{layer.label}</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{layer.nodes.length} thành phần · {layer.title}</span>
              </span>
              <span className="material-symbols-outlined text-slate-400">{expanded ? 'expand_less' : 'expand_more'}</span>
            </button>
            {expanded && (
              <div className="space-y-2 border-t border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                {layer.nodes.length ? layer.nodes.map((node) => <MobileNodeRow key={node.id} node={node} selected={node.id === selectedNodeId} onSelect={onNodeSelect} />) : <p className="px-2 py-3 text-sm font-semibold text-slate-500">Không có thành phần khớp bộ lọc.</p>}
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Kết nối ({edges.length})</h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bấm để xem chi tiết</span>
        </div>
        <div className="mt-3 space-y-2">
          {edges.length ? edges.map((edge) => (
            <button key={edge.id} type="button" aria-label={`${edge.data.sourceLabel} → ${edge.data.targetLabel} · ${edge.data.label}`} onClick={() => onEdgeSelect({ type: 'edge', id: edge.id })} className={`w-full rounded-xl border p-3 text-left transition focus:outline-none focus:ring-4 focus:ring-primary/20 ${edge.id === selectedEdgeId ? 'border-primary bg-primary/[0.05]' : 'border-slate-200 hover:border-primary/50 dark:border-slate-800 dark:hover:bg-slate-800/60'}`}>
              <span className="block break-words font-mono text-[11px] font-extrabold leading-5 text-slate-800 dark:text-slate-100">{edge.source} → {edge.target}</span>
              <span className="mt-1 block text-xs font-bold text-primary">{edge.data.label}</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{edge.data.detail}</span>
            </button>
          )) : <p className="py-3 text-sm font-semibold text-slate-500">Không có connection khớp bộ lọc.</p>}
        </div>
      </div>
    </section>
  );
}
