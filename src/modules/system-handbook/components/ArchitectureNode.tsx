import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ArchitectureFlowNode } from '../data/architectureGraph';

const statusLabel: Record<ArchitectureFlowNode['data']['status'], string> = {
  active: 'Active',
  private: 'Private',
  hidden: 'Hidden',
  'test-only': 'Test-only',
};

const toneByKind: Record<ArchitectureFlowNode['data']['kind'], { surface: string; icon: string; accent: string }> = {
  client: {
    surface: 'border-sky-200 bg-sky-50/90 hover:border-sky-400 dark:border-sky-900/70 dark:bg-sky-950/30',
    icon: 'bg-sky-100 text-sky-700 dark:bg-sky-900/70 dark:text-sky-300',
    accent: 'bg-sky-500',
  },
  edge: {
    surface: 'border-orange-300 bg-orange-50/95 hover:border-orange-500 dark:border-orange-800 dark:bg-orange-950/30',
    icon: 'bg-orange-100 text-orange-700 dark:bg-orange-900/70 dark:text-orange-300',
    accent: 'bg-orange-500',
  },
  service: {
    surface: 'border-slate-200 bg-white hover:border-primary dark:border-slate-700 dark:bg-slate-900',
    icon: 'bg-primary/10 text-primary dark:bg-primary/15',
    accent: 'bg-primary',
  },
  infrastructure: {
    surface: 'border-violet-200 bg-violet-50/75 hover:border-violet-400 dark:border-violet-900/70 dark:bg-violet-950/25',
    icon: 'bg-violet-100 text-violet-700 dark:bg-violet-900/70 dark:text-violet-300',
    accent: 'bg-violet-500',
  },
};

function statusClass(status: ArchitectureFlowNode['data']['status']) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300';
  if (status === 'private') return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  if (status === 'hidden') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
  return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
}

export default function ArchitectureNode({ data, selected }: NodeProps<ArchitectureFlowNode>) {
  const tone = toneByKind[data.kind];
  const accessibleLabel = `${data.label} · ${data.shortLabel}`;

  return (
    <div className={`architecture-node h-full w-full transition-opacity duration-200 ${data.dimmed ? 'opacity-35' : 'opacity-100'}`}>
      <Handle type="target" position={Position.Left} isConnectable={false} className="!size-2 !border-2 !border-white !bg-slate-400 dark:!border-slate-900" />
      <button
        type="button"
        aria-label={accessibleLabel}
        className={`nodrag nopan group relative flex h-full w-full flex-col rounded-2xl border-2 p-3.5 text-left shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition duration-200 focus:outline-none focus:ring-4 focus:ring-primary/25 ${tone.surface} ${
          selected
            ? 'border-primary ring-4 ring-primary/20 shadow-[0_12px_26px_rgba(244,157,37,0.16)]'
            : data.highlighted
              ? 'border-primary/70 shadow-[0_10px_24px_rgba(244,157,37,0.12)]'
              : ''
        }`}
      >
        <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${tone.accent}`} aria-hidden="true" />
        <span className="flex items-start justify-between gap-2 pl-1">
          <span className={`material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-xl text-xl ${tone.icon}`}>
            {data.icon}
          </span>
          <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${statusClass(data.status)}`}>
            {statusLabel[data.status]}
          </span>
        </span>
        <span className="mt-3 block break-words pl-1 font-mono text-[13px] font-extrabold leading-5 text-slate-950 dark:text-white">
          {data.label}
        </span>
        <span className="mt-0.5 block line-clamp-2 pl-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
          {data.shortLabel}
        </span>
        <span className="mt-auto flex items-center gap-1.5 pt-2 pl-1 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-sm">{data.kind === 'infrastructure' ? 'database' : 'account_tree'}</span>
          <span className="truncate">{data.group}</span>
        </span>
        {data.dataStore && (
          <span className="mt-1 block truncate pl-1 font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400" title={data.dataStore}>
            {data.dataStore}
          </span>
        )}
      </button>
      <Handle type="source" position={Position.Right} isConnectable={false} className="!size-2 !border-2 !border-white !bg-slate-400 dark:!border-slate-900" />
    </div>
  );
}
