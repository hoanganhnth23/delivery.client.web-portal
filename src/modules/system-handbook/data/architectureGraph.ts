import type { Edge, Node } from '@xyflow/react';
import { FLOW_EXPLORER_FLOWS, getFlow } from './flowExplorerData';
import { HANDBOOK_ACTORS, HANDBOOK_CAPABILITIES, type HandbookCapability } from './handbookData';
import { SYSTEM_CONNECTIONS, SYSTEM_NODES, type SystemConnection, type SystemNode, type SystemNodeKind, type SystemNodeStatus } from '@/modules/admin/data/systemOverviewData';

export type ArchitectureLayerFilter = 'all' | SystemNodeKind;
export type ArchitectureStatusFilter = 'all' | 'active' | 'private';
export type ArchitectureViewMode = 'context' | 'runtime' | 'domain' | 'data';

export interface ArchitectureViewDefinition {
  id: ArchitectureViewMode;
  label: string;
  description: string;
  eyebrow: string;
}

export const ARCHITECTURE_VIEWS: ArchitectureViewDefinition[] = [
  { id: 'context', label: 'Bối cảnh hệ thống', eyebrow: 'System context', description: 'Ai sử dụng nền tảng và hệ thống kết nối với bên ngoài như thế nào.' },
  { id: 'runtime', label: 'Runtime topology', eyebrow: 'Runtime topology', description: 'Các service, hạ tầng dữ liệu và control plane đang chạy trong snapshot.' },
  { id: 'domain', label: 'Domain & chức năng', eyebrow: 'Domain map', description: 'Nhóm chức năng chính và service chịu trách nhiệm cho từng domain.' },
  { id: 'data', label: 'Dữ liệu & sự kiện', eyebrow: 'Data & events', description: 'Ownership, source of truth, event bus, projection và realtime state.' },
];

export interface ArchitectureGraphOptions {
  layer: ArchitectureLayerFilter;
  status: ArchitectureStatusFilter;
  flowId: string | null;
  query: string;
  view?: ArchitectureViewMode;
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
  onSelect?: () => void;
}

export type ArchitectureFlowNode = Node<ArchitectureNodeData, 'architecture'>;
export type ArchitectureFlowEdge = Edge<ArchitectureEdgeData, 'architecture'> & { data: ArchitectureEdgeData };

export interface ArchitectureGraph {
  layers: ArchitectureLayer[];
  nodes: ArchitectureFlowNode[];
  edges: ArchitectureFlowEdge[];
  flowParticipants: Set<string>;
  flowLabel: string | null;
  view: ArchitectureViewMode;
  capabilities: HandbookCapability[];
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

const normalize = (value: string) => value.trim().toLocaleLowerCase('vi-VN');

const isKnownFlow = (flowId: string | null): flowId is string =>
  Boolean(flowId && FLOW_EXPLORER_FLOWS.some((flow) => flow.id === flowId));

const clientIdsForAudience = (audience: string): string[] => {
  if (normalize(audience) === 'all clients') return SYSTEM_NODES.filter((node) => node.kind === 'client').map((node) => node.id);

  const actor = HANDBOOK_ACTORS.find((candidate) =>
    normalize(candidate.id) === normalize(audience) || normalize(candidate.label).startsWith(normalize(audience)),
  );
  return actor?.clientIds ?? [];
};

const flowParticipantIds = (flowId: string | null): Set<string> => {
  if (!isKnownFlow(flowId)) return new Set();
  const flow = getFlow(flowId);
  const audienceClientIds = flow.audience.flatMap(clientIdsForAudience);
  const publicEdgeContext = audienceClientIds.length ? ['gateway'] : [];
  return new Set(flow.steps.flatMap((step) => step.serviceIds).concat(audienceClientIds, publicEdgeContext));
};

const ARCHITECTURE_CONTEXT_NODE_IDS = new Set(['customer-app', 'delivery-web', 'shipper-app', 'gateway', 'mapbox', 'fcm']);
const ARCHITECTURE_DOMAIN_NODE_IDS = new Set([
  'customer-app', 'delivery-web', 'shipper-app', 'gateway',
  'auth-service', 'user-service', 'restaurant-service', 'order-service',
  'saga-service', 'delivery-service', 'match-service', 'shipper-service',
  'tracking-service', 'notification-service', 'settlement-service', 'search-service',
]);
const ARCHITECTURE_DATA_NODE_IDS = new Set([
  'auth-service', 'user-service', 'restaurant-service', 'order-service', 'saga-service',
  'delivery-service', 'match-service', 'shipper-service', 'tracking-service',
  'notification-service', 'settlement-service', 'search-service',
  'kafka', 'redis', 'postgresql', 'elasticsearch',
]);

const viewNodeIds = (view: ArchitectureViewMode): Set<string> | null => {
  if (view === 'context') return ARCHITECTURE_CONTEXT_NODE_IDS;
  if (view === 'domain') return ARCHITECTURE_DOMAIN_NODE_IDS;
  if (view === 'data') return ARCHITECTURE_DATA_NODE_IDS;
  return null;
};

const viewLayers = (view: ArchitectureViewMode): Array<Omit<ArchitectureLayer, 'nodes'>> => {
  if (view === 'context') {
    return ARCHITECTURE_LAYERS.filter((layer) => layer.id !== 'service').map((layer) => ({
      ...layer,
      title: layer.id === 'client' ? 'Người dùng & ứng dụng' : layer.id === 'edge' ? 'Cửa vào nền tảng' : layer.id === 'service' ? 'Delivery Platform' : 'Tích hợp bên ngoài',
      description: layer.id === 'client' ? 'Các actor sử dụng các client được hỗ trợ.' : layer.description,
    }));
  }
  if (view === 'domain') {
    return ARCHITECTURE_LAYERS.map((layer) => ({
      ...layer,
      title: layer.id === 'client' ? 'Client & actor' : layer.id === 'edge' ? 'Public edge' : layer.id === 'service' ? 'Domain services' : 'Platform support',
      description: layer.id === 'service' ? 'Service được nhóm theo domain nghiệp vụ.' : layer.description,
    }));
  }
  if (view === 'data') {
    return ARCHITECTURE_LAYERS.map((layer) => ({
      ...layer,
      title: layer.id === 'client' ? 'Consumers' : layer.id === 'edge' ? 'API edge' : layer.id === 'service' ? 'Service ownership' : 'Data & event plane',
      description: layer.id === 'infrastructure' ? 'Kho dữ liệu, event bus, cache và projection.' : layer.description,
    }));
  }
  return ARCHITECTURE_LAYERS;
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
  const view = options.view ?? 'runtime';
  const participants = flowParticipantIds(options.flowId);
  const flow = isKnownFlow(options.flowId) ? getFlow(options.flowId) : null;
  const allowedViewNodes = viewNodeIds(view);
  const visibleSourceNodes = SYSTEM_NODES.filter((node) =>
    (!allowedViewNodes || allowedViewNodes.has(node.id)) &&
    matchesLayer(node.kind, options.layer) && matchesStatus(node.status, options.status) && matchesQuery(node, options.query),
  ).sort((left, right) => {
    if (view === 'context') return [...ARCHITECTURE_CONTEXT_NODE_IDS].indexOf(left.id) - [...ARCHITECTURE_CONTEXT_NODE_IDS].indexOf(right.id);
    if (view === 'domain' || view === 'data') return left.group.localeCompare(right.group) || left.label.localeCompare(right.label);
    return 0;
  });
  const visibleNodeIds = new Set(visibleSourceNodes.map((node) => node.id));
  const flowIsActive = Boolean(flow);

  const nodes = visibleSourceNodes.map<ArchitectureFlowNode>((node) => {
    const highlighted = flowIsActive && participants.has(node.id);
    return {
      id: node.id,
      type: 'architecture',
      position: { x: 0, y: 0 },
      style: { width: 244, height: 132 },
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
    layers: viewLayers(view).map((layer) => ({
      ...layer,
      nodes: nodes.filter((node) => node.data.kind === layer.id),
    })),
    nodes,
    edges,
    flowParticipants: participants,
    flowLabel: flow?.label ?? null,
    view,
    capabilities: view === 'domain' ? HANDBOOK_CAPABILITIES : [],
  };
}

export function getArchitectureSelection(graph: ArchitectureGraph, selection: ArchitectureSelection | null): ArchitectureFlowNode | ArchitectureFlowEdge | null {
  if (!selection) return null;
  if (selection.type === 'node') return graph.nodes.find((node) => node.id === selection.id) ?? null;
  return graph.edges.find((edge) => edge.id === selection.id) ?? null;
}
