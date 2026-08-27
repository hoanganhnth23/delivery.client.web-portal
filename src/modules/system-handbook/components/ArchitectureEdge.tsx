import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import type { ArchitectureFlowEdge } from '../data/architectureGraph';

const edgeColor: Record<ArchitectureFlowEdge['data']['kind'], string> = {
  sync: '#2563eb',
  async: '#7c3aed',
  storage: '#059669',
  external: '#0891b2',
  control: '#64748b',
};

const edgeLabel: Record<ArchitectureFlowEdge['data']['kind'], string> = {
  sync: 'HTTP / WebSocket',
  async: 'Kafka / Event',
  storage: 'Storage',
  external: 'External',
  control: 'Control plane',
};

export default function ArchitectureEdge({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps<ArchitectureFlowEdge>) {
  if (!data) return null;
  const color = edgeColor[data.kind];
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });
  const showLabel = selected || data.highlighted;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : data.highlighted ? 2.4 : 1.5,
          strokeDasharray: data.kind === 'async' || data.kind === 'control' ? '7 5' : undefined,
          opacity: data.dimmed ? 0.18 : 0.88,
        }}
      />
      {showLabel && (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="nodrag nopan pointer-events-auto absolute rounded-lg border border-white/80 bg-white/95 px-2.5 py-1.5 text-left shadow-[0_4px_14px_rgba(15,23,42,0.12)] transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-900/95"
            onClick={(event) => {
              event.stopPropagation();
              data.onSelect?.();
            }}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              color,
            }}
            aria-label={`${data.sourceLabel} → ${data.targetLabel} · ${data.label}`}
          >
            <span className="block font-mono text-[11px] font-extrabold leading-4">{data.label}</span>
            <span className="block text-[10px] font-bold leading-4 opacity-75">{edgeLabel[data.kind]}</span>
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
