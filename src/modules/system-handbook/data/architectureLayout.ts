import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { Position, type Edge, type Node } from '@xyflow/react';
import type { ArchitectureEdgeData, ArchitectureFlowEdge, ArchitectureFlowNode, ArchitectureNodeData } from './architectureGraph';

export const ARCHITECTURE_NODE_WIDTH = 244;
export const ARCHITECTURE_NODE_HEIGHT = 132;
export const ARCHITECTURE_NODE_GAP = 28;

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
    return [node.id, { x: fallbackColumnX[node.data.kind], y: 32 + row * (ARCHITECTURE_NODE_HEIGHT + ARCHITECTURE_NODE_GAP) }];
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
    const elkYById = new Map((result.children ?? []).map((child) => [child.id, child.y ?? 0]));
    const nodesByKind = new Map<ArchitectureFlowNode['data']['kind'], ArchitectureFlowNode[]>();
    nodes.forEach((node) => {
      const layerNodes = nodesByKind.get(node.data.kind) ?? [];
      layerNodes.push(node);
      nodesByKind.set(node.data.kind, layerNodes);
    });
    const positions = new Map<string, { x: number; y: number }>();
    nodesByKind.forEach((layerNodes, kind) => {
      layerNodes
        .slice()
        .sort((left, right) => {
          const highlightOrder = Number(right.data.highlighted) - Number(left.data.highlighted);
          return highlightOrder || (elkYById.get(left.id) ?? 0) - (elkYById.get(right.id) ?? 0);
        })
        .forEach((node, index) => {
          positions.set(node.id, {
            x: fallbackColumnX[kind],
            y: 32 + index * (ARCHITECTURE_NODE_HEIGHT + ARCHITECTURE_NODE_GAP),
          });
        });
    });
    if (positions.size !== nodes.length) return fallbackLayout(nodes);
    const maxY = Math.max(0, ...Array.from(positions.values(), (position) => position.y));
    return {
      nodes: withPositions(nodes, positions),
      width: Math.max(1310, (result.width ?? 0) + 48),
      height: Math.max(560, maxY + ARCHITECTURE_NODE_HEIGHT + 48),
      usedFallback: false,
    };
  } catch {
    return fallbackLayout(nodes);
  }
}

export type ArchitectureReactFlowNode = Node<ArchitectureNodeData, 'architecture'>;
export type ArchitectureReactFlowEdge = Edge<ArchitectureEdgeData, 'architecture'>;
