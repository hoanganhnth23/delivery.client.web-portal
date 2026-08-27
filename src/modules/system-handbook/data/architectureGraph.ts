import type { Edge, Node } from '@xyflow/react';
import { FLOW_EXPLORER_FLOWS, getFlow } from './flowExplorerData';
import { SYSTEM_CONNECTIONS, SYSTEM_NODES, type SystemConnection, type SystemNode, type SystemNodeKind, type SystemNodeStatus } from '@/modules/admin/data/systemOverviewData';

export type ArchitectureLayerFilter = 'all' | SystemNodeKind;
export type ArchitectureStatusFilter = 'all' | 'active' | 'private';

export interface ArchitectureGraphOptions {
  layer: ArchitectureLayerFilter;
  status: ArchitectureStatusFilter;
  flowId: string | null;
  query: string;
}

export interface ArchitectureLayer {
  id: SystemNodeKind;
  label: string;
  title: string;
  description: string;
  nodes: ArchitectureFlowNode[];
}

export interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  shortLabel: string;
  kind: SystemNodeKind;
  group: string;
  icon: string;
  description: string;
  responsibilities: string[];
  interface: string;
  dataStore?: string;
  status: SystemNodeStatus;
  mapColumn: SystemNode['mapColumn'];
  highlighted: boolean;
  dimmed: boolean;
  sourceNode: SystemNode;
}

export interface ArchitectureEdgeData extends Record<string, unknown> {
  label: string;
  kind: SystemConnection['kind'];
  detail: string;
  highlighted: boolean;
  dimmed: boolean;
  sourceLabel: string;
  targetLabel: string;
  sourceNode: SystemNode;
  targetNode: SystemNode;
}

export type ArchitectureFlowNode = Node<ArchitectureNodeData, 'architecture'>;
export type ArchitectureFlowEdge = Edge<ArchitectureEdgeData, 'architecture'>;

export interface ArchitectureGraph {
  layers: ArchitectureLayer[];
  nodes: ArchitectureFlowNode[];
  edges: ArchitectureFlowEdge[];
  flowParticipants: Set<string>;
  flowLabel: string | null;
}

export type ArchitectureSelection =
  | { type: 'node'; id: string }
  | { type: 'edge'; id: string };

export const ARCHITECTURE_LAYERS: Array<Omit<ArchitectureLayer, 'nodes'>> = [
  {
    id: 'client',
    label: 'Client applications',
    title: 'Ứng dụng khách',
    description: 'Các ứng dụng đi vào hệ thống qua public edge.',
  },
  {
    id: 'edge',
    label: 'Public application edge',
    title: 'Public edge',
    description: 'Cửa vào public duy nhất cho application traffic.',
  },
  {
    id: 'service',
    label: 'Private domain services',
    title: 'Dịch vụ nghiệp vụ',
    description: 'Các service sở hữu nghiệp vụ và state riêng.',
  },
  {
    id: 'infrastructure',
    label: 'State & event infrastructure',
    title: 'Hạ tầng dữ liệu & sự kiện',
    description: 'Database, event bus, cache và external provider.',
  },
];

const FLOW_CONTEXT_NODE_IDS = ['gateway', 'customer-app', 'delivery-web', 'shipper-app'] as const;

const normalize = (value: string) => value.trim().toLocaleLowerCase('vi-VN');

const isKnownFlow = (flowId: string | null): flowId is string =>
  Boolean(flowId && FLOW_EXPLORER_FLOWS.some((flow) => flow.id === flowId));

const flowParticipantIds = (flowId: string | null): Set<string> => {
  if (!isKnownFlow(flowId)) return new Set();
  const flow = getFlow(flowId);
  return new Set(flow.steps.flatMap((step) => step.serviceIds).concat([...FLOW_CONTEXT_NODE_IDS]));
};

const matchesQuery = (node: SystemNode, query: string): boolean => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  const searchableText = [
    node.label,
    node.shortLabel,
    node.group,
    node.description,
    node.interface,
    node.dataStore ?? '',
    ...node.responsibilities,
  ].join(' ');
  return normalize(searchableText).includes(normalizedQuery);
};

const matchesStatus = (status: SystemNodeStatus, filter: ArchitectureStatusFilter): boolean =>
  filter === 'all' || status === filter;

const matchesLayer = (kind: SystemNodeKind, filter: ArchitectureLayerFilter): boolean =>
  filter === 'all' || kind === filter;

const nodeData = (node: SystemNode, highlighted: boolean, dimmed: boolean): ArchitectureNodeData => ({
  label: node.label,
  shortLabel: node.shortLabel,
  kind: node.kind,
  group: node.group,
  icon: node.icon,
  description: node.description,
  responsibilities: node.responsibilities,
  interface: node.interface,
  dataStore: node.dataStore,
  status: node.status,
  mapColumn: node.mapColumn,
  highlighted,
  dimmed,
  sourceNode: node,
});

export function buildArchitectureGraph(options: ArchitectureGraphOptions): ArchitectureGraph {
  const participants = flowParticipantIds(options.flowId);
  const flow = isKnownFlow(options.flowId) ? getFlow(options.flowId) : null;
  const visibleSourceNodes = SYSTEM_NODES.filter((node) =>
    matchesLayer(node.kind, options.layer) && matchesStatus(node.status, options.status) && matchesQuery(node, options.query),
  );
  const visibleNodeIds = new Set(visibleSourceNodes.map((node) => node.id));
  const flowIsActive = Boolean(flow);

  const nodes = visibleSourceNodes.map<ArchitectureFlowNode>((node) => {
    const highlighted = flowIsActive && participants.has(node.id);
    return {
      id: node.id,
      type: 'architecture',
      position: { x: 0, y: 0 },
      data: nodeData(node, highlighted, flowIsActive && !highlighted),
      draggable: false,
      selectable: true,
      focusable: true,
      ariaLabel: `${node.label} · ${node.shortLabel}`,
    };
  });

  const nodeById = new Map(SYSTEM_NODES.map((node) => [node.id, node]));
  const edges = SYSTEM_CONNECTIONS
    .filter((connection) => visibleNodeIds.has(connection.source) && visibleNodeIds.has(connection.target))
    .map<ArchitectureFlowEdge>((connection) => {
      const sourceNode = nodeById.get(connection.source) ?? SYSTEM_NODES[0];
      const targetNode = nodeById.get(connection.target) ?? SYSTEM_NODES[0];
      const highlighted = flowIsActive && participants.has(connection.source) && participants.has(connection.target);
      return {
        id: connection.id,
        source: connection.source,
        target: connection.target,
        type: 'architecture',
        data: {
          label: connection.label,
          kind: connection.kind,
          detail: connection.detail,
          highlighted,
          dimmed: flowIsActive && !highlighted,
          sourceLabel: sourceNode.label,
          targetLabel: targetNode.label,
          sourceNode,
          targetNode,
        },
        selectable: true,
        focusable: true,
        ariaLabel: `${sourceNode.label} → ${targetNode.label} · ${connection.label}`,
      };
    });

  return {
    layers: ARCHITECTURE_LAYERS.map((layer) => ({
      ...layer,
      nodes: nodes.filter((node) => node.data.kind === layer.id),
    })),
    nodes,
    edges,
    flowParticipants: participants,
    flowLabel: flow?.label ?? null,
  };
}

export function getArchitectureSelection(graph: ArchitectureGraph, selection: ArchitectureSelection | null): ArchitectureFlowNode | ArchitectureFlowEdge | null {
  if (!selection) return null;
  if (selection.type === 'node') return graph.nodes.find((node) => node.id === selection.id) ?? null;
  return graph.edges.find((edge) => edge.id === selection.id) ?? null;
}
