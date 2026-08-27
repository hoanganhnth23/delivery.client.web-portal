import { describe, expect, it } from 'vitest';
import { SYSTEM_CONNECTIONS, SYSTEM_NODES } from '@/modules/admin/data/systemOverviewData';
import {
  buildArchitectureGraph,
  type ArchitectureGraphOptions,
} from '@/modules/system-handbook/data/architectureGraph';

const allGraphOptions: ArchitectureGraphOptions = {
  layer: 'all',
  status: 'all',
  flowId: null,
  query: '',
};

describe('architecture graph model', () => {
  it('builds a full layered graph from canonical nodes and connections', () => {
    const graph = buildArchitectureGraph(allGraphOptions);

    expect(graph.nodes).toHaveLength(SYSTEM_NODES.length);
    expect(graph.edges).toHaveLength(SYSTEM_CONNECTIONS.length);
    expect(graph.layers.map((layer) => layer.id)).toEqual(['client', 'edge', 'service', 'infrastructure']);
  });

  it('does not infer database edges from dataStore text', () => {
    const graph = buildArchitectureGraph(allGraphOptions);

    expect(graph.edges.some((edge) => edge.source === 'order-service' && edge.target === 'order_db')).toBe(false);
    expect(graph.edges.every((edge) => SYSTEM_CONNECTIONS.some((connection) => connection.id === edge.id))).toBe(true);
  });

  it('marks only canonical flow participants as highlighted', () => {
    const graph = buildArchitectureGraph({ ...allGraphOptions, flowId: 'cod-order' });

    expect(graph.nodes.find((node) => node.id === 'order-service')?.data.highlighted).toBe(true);
    expect(graph.nodes.find((node) => node.id === 'livestream-service')?.data.highlighted).toBe(false);
    expect(graph.edges.find((edge) => edge.id === 'customer-gateway-rest')?.data?.highlighted).toBe(true);
  });

  it('derives client participants from the selected flow audience', () => {
    const graph = buildArchitectureGraph({ ...allGraphOptions, flowId: 'catalog-search' });

    expect(graph.nodes.find((node) => node.id === 'customer-app')?.data.highlighted).toBe(true);
    expect(graph.nodes.find((node) => node.id === 'delivery-web')?.data.highlighted).toBe(true);
    expect(graph.nodes.find((node) => node.id === 'shipper-app')?.data.highlighted).toBe(false);
  });

  it('filters nodes using a readable technical query', () => {
    const graph = buildArchitectureGraph({ ...allGraphOptions, query: 'order-service' });

    expect(graph.nodes.map((node) => node.id)).toEqual(['order-service']);
    expect(graph.edges).toHaveLength(0);
  });

  it('filters by layer without changing the canonical layer order', () => {
    const graph = buildArchitectureGraph({ ...allGraphOptions, layer: 'service' });

    expect(graph.nodes.every((node) => node.data.kind === 'service')).toBe(true);
    expect(graph.layers.map((layer) => layer.id)).toEqual(['client', 'edge', 'service', 'infrastructure']);
  });
});
