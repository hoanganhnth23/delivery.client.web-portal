import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { Position, type Edge, type Node } from '@xyflow/react';
import type { ArchitectureEdgeData, ArchitectureFlowEdge, ArchitectureFlowNode, ArchitectureNodeData } from './architectureGraph';

export const ARCHITECTURE_NODE_WIDTH = 244;
export const ARCHITECTURE_NODE_HEIGHT = 132;

export interface ArchitectureLayoutResult {
  nodes: ArchitectureFlowNode[];
  width: number;
  height: number;
  usedFallback: boolean;
}

const fallbackColumnX: Record<ArchitectureFlowNode['data']['kind'], number> = {
  client: 32,
  edge: 360,
  service: 688,
  infrastructure: 1016,
};

function fallbackPositions(nodes: ArchitectureFlowNode[]): Map<string, { x: number; y: number }> {
  const rows = new Map<string, number>();
  return new Map(nodes.map((node) => {
    const row = rows.get(node.data.kind) ?? 0;
    rows.set(node.data.kind, row + 1);
    return [node.id, { x: fallbackColumnX[node.data.kind], y: 32 + row * (ARCHITECTURE_NODE_HEIGHT + 28) }];
  }));
}

function withPositions(
  nodes: ArchitectureFlowNode[],
  positions: Map<string, { x: number; y: number }>,
): ArchitectureFlowNode[] {
  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));
}

function fallbackLayout(nodes: ArchitectureFlowNode[]): ArchitectureLayoutResult {
  const positions = fallbackPositions(nodes);
  const maxRow = Math.max(0, ...nodes.map((node) => {
    const position = positions.get(node.id);
    return position ? position.y : 0;
  }));
  return {
    nodes: withPositions(nodes, positions),
    width: 1310,
    height: maxRow + ARCHITECTURE_NODE_HEIGHT + 32,
    usedFallback: true,
  };
}

export async function layoutArchitectureGraph(
  nodes: ArchitectureFlowNode[],
  edges: ArchitectureFlowEdge[],
): Promise<ArchitectureLayoutResult> {
  if (!nodes.length) return fallbackLayout(nodes);

  const layoutInput: ElkNode = {
    id: 'architecture-root',
    children: nodes.map((node) => ({
      id: node.id,
      width: ARCHITECTURE_NODE_WIDTH,
      height: ARCHITECTURE_NODE_HEIGHT,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': '32',
      'elk.layered.spacing.nodeNodeBetweenLayers': '112',
      'elk.layered.spacing.edgeNodeBetweenLayers': '28',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    },
  };

  try {
    const result = await new ELK().layout(layoutInput);
    const positions = new Map(
      (result.children ?? []).map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]),
    );
    if (positions.size !== nodes.length) return fallbackLayout(nodes);
    return {
      nodes: withPositions(nodes, positions),
      width: Math.max(1310, (result.width ?? 0) + 48),
      height: Math.max(560, (result.height ?? 0) + 48),
      usedFallback: false,
    };
  } catch {
    return fallbackLayout(nodes);
  }
}

export type ArchitectureReactFlowNode = Node<ArchitectureNodeData, 'architecture'>;
export type ArchitectureReactFlowEdge = Edge<ArchitectureEdgeData, 'architecture'>;
