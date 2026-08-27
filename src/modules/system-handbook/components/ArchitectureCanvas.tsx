import { useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel as FlowPanel,
  ReactFlow,
  ReactFlowProvider,
  useNodes,
  useReactFlow,
  useStore,
  type EdgeTypes,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ArchitectureEdge from './ArchitectureEdge';
import ArchitectureNode from './ArchitectureNode';
import type { ArchitectureFlowEdge, ArchitectureFlowNode, ArchitectureLayer } from '../data/architectureGraph';
import { getArchitectureFitNodeIds } from '../data/architectureViewport';

const nodeTypes: NodeTypes = { architecture: ArchitectureNode };
const edgeTypes: EdgeTypes = { architecture: ArchitectureEdge };
const markerColor: Record<ArchitectureFlowEdge['data']['kind'], string> = {
  sync: '#2563eb',
  async: '#7c3aed',
  storage: '#059669',
  external: '#0891b2',
  control: '#64748b',
};

const architectureMarker = (kind: ArchitectureFlowEdge['data']['kind']) => ({
  type: MarkerType.ArrowClosed,
  color: markerColor[kind],
  width: 18,
  height: 18,
});

interface ArchitectureCanvasProps {
  layers: ArchitectureLayer[];
  nodes: ArchitectureFlowNode[];
  edges: ArchitectureFlowEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onNodeSelect: (id: string) => void;
  onEdgeSelect: (id: string) => void;
}

function CanvasInner({
  layers,
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onNodeSelect,
  onEdgeSelect,
}: ArchitectureCanvasProps) {
  const reactFlow = useReactFlow<ArchitectureFlowNode, ArchitectureFlowEdge>();
  const internalNodes = useNodes<ArchitectureFlowNode>();
  const allNodesMeasured = useStore((state) => {
    if (!state.nodeLookup.size) return false;
    for (const node of state.nodeLookup.values()) {
      if (!node.hidden && (!node.measured.width || !node.measured.height)) return false;
    }
    return true;
  });
  const visibleNodes = useMemo<ArchitectureFlowNode[]>(
    () => nodes.map((node) => ({ ...node, selected: node.id === selectedNodeId })),
    [nodes, selectedNodeId],
  );
  const visibleEdges = useMemo<ArchitectureFlowEdge[]>(
    () => edges.map((edge) => ({
      ...edge,
      selected: edge.id === selectedEdgeId,
      markerEnd: architectureMarker(edge.data.kind),
      data: { ...edge.data, onSelect: () => onEdgeSelect(edge.id) },
    })),
    [edges, onEdgeSelect, selectedEdgeId],
  );
  const fitNodeIds = useMemo(() => getArchitectureFitNodeIds(nodes), [nodes]);
  const nodeLayoutKey = useMemo(
    () => nodes.map((node) => `${node.id}:${node.position.x}:${node.position.y}`).join('|'),
    [nodes],
  );
  const internalNodeLayoutKey = useMemo(
    () => internalNodes.map((node) => `${node.id}:${node.position.x}:${node.position.y}`).join('|'),
    [internalNodes],
  );

  useEffect(() => {
    if (!allNodesMeasured || !nodes.length || !fitNodeIds.length || internalNodeLayoutKey !== nodeLayoutKey) return;

    const frame = window.requestAnimationFrame(() => {
      void reactFlow.fitView({ nodes: fitNodeIds, padding: 0.16, duration: 260, minZoom: 0.4, maxZoom: 1.15 });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [allNodesMeasured, fitNodeIds, internalNodeLayoutKey, nodeLayoutKey, nodes.length, reactFlow]);

  return (
    <div className="architecture-canvas-shell overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950">
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/90 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900/90">
        {layers.map((layer) => (
          <div key={layer.id} className="min-w-0 border-r border-slate-200 px-3 py-3 last:border-r-0 sm:px-4 dark:border-slate-800">
            <p className="min-h-[2rem] break-words text-[10px] font-black uppercase leading-4 tracking-[0.08em] text-slate-500 dark:text-slate-400" title={layer.title}>{layer.title}</p>
            <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{layer.nodes.length} thành phần</p>
          </div>
        ))}
      </div>
      <div className="architecture-flow h-[min(720px,72vh)] min-h-[560px] w-full">
        <ReactFlow<ArchitectureFlowNode, ArchitectureFlowEdge>
            nodes={visibleNodes}
            edges={visibleEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(_, node) => onNodeSelect(node.id)}
            onEdgeClick={(_, edge) => onEdgeSelect(edge.id)}
            onPaneClick={() => undefined}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesReconnectable={false}
            elementsSelectable
            edgesFocusable
            nodesFocusable
            deleteKeyCode={null}
            selectionOnDrag={false}
            panOnScroll
            minZoom={0.35}
            maxZoom={1.6}
            defaultEdgeOptions={{ selectable: true, deletable: false, focusable: true }}
            ariaLabelConfig={{
              'controls.ariaLabel': 'Điều khiển bản đồ',
              'controls.zoomIn.ariaLabel': 'Phóng to',
              'controls.zoomOut.ariaLabel': 'Thu nhỏ',
              'controls.fitView.ariaLabel': 'Vừa khung',
              'node.a11yDescription.default': 'Bấm để xem chi tiết thành phần',
              'edge.a11yDescription.default': 'Bấm để xem chi tiết kết nối',
            }}
            className="bg-white dark:bg-slate-950"
          >
            <Background color="#d9e1ea" gap={24} size={1} />
            <Controls showInteractive={false} aria-label="Điều khiển bản đồ" position="bottom-left" />
            <MiniMap
              pannable
              zoomable
              ariaLabel="Bản đồ thu nhỏ kiến trúc"
              nodeColor={(node) => {
                const kind = (node.data as { kind?: string } | undefined)?.kind;
                if (kind === 'client') return '#38bdf8';
                if (kind === 'edge') return '#f97316';
                if (kind === 'service') return '#f49d25';
                return '#8b5cf6';
              }}
              nodeStrokeColor="#ffffff"
              nodeBorderRadius={5}
              maskColor="rgba(15, 23, 42, 0.08)"
              position="bottom-right"
            />
            <FlowPanel position="top-left" className="pointer-events-none !m-3 !rounded-xl !border !border-slate-200 !bg-white/95 !px-3 !py-2 !shadow-sm dark:!border-slate-700 dark:!bg-slate-900/95">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Bản đồ tương tác</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">Kéo nền để di chuyển · bấm khối để xem chi tiết</p>
            </FlowPanel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function ArchitectureCanvas(props: ArchitectureCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
