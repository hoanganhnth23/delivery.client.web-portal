import { describe, expect, it } from 'vitest';
import { SYSTEM_CONNECTIONS, SYSTEM_NODES } from '@/modules/admin/data/systemOverviewData';
import { buildArchitectureGraph } from '@/modules/system-handbook/data/architectureGraph';
import { ARCHITECTURE_NODE_HEIGHT, layoutArchitectureGraph } from '@/modules/system-handbook/data/architectureLayout';

const layerColumnX = {
  client: 32,
  edge: 360,
  service: 688,
  infrastructure: 1016,
} as const;

describe('architecture graph layout', () => {
  it('keeps every layer in the column represented by the canvas header', async () => {
    const graph = buildArchitectureGraph({ layer: 'all', status: 'all', flowId: null, query: '' });
    const result = await layoutArchitectureGraph(graph.nodes, graph.edges);

    for (const node of result.nodes) {
      expect(node.position.x).toBe(layerColumnX[node.data.kind]);
    }
  });

  it('keeps nodes within a layer vertically distinct after column alignment', async () => {
    const graph = buildArchitectureGraph({ layer: 'all', status: 'all', flowId: null, query: '' });
    const result = await layoutArchitectureGraph(graph.nodes, graph.edges);

    for (const kind of ['client', 'edge', 'service', 'infrastructure'] as const) {
      const yPositions = result.nodes.filter((node) => node.data.kind === kind).map((node) => node.position.y);
      expect(new Set(yPositions).size).toBe(yPositions.length);
    }

    expect(result.nodes).toHaveLength(SYSTEM_NODES.length);
    expect(graph.edges).toHaveLength(SYSTEM_CONNECTIONS.length);
  });

  it('keeps enough vertical clearance for every node after layers share a column', async () => {
    const graph = buildArchitectureGraph({ layer: 'all', status: 'all', flowId: null, query: '' });
    const result = await layoutArchitectureGraph(graph.nodes, graph.edges);

    for (const kind of ['client', 'edge', 'service', 'infrastructure'] as const) {
      const yPositions = result.nodes
        .filter((node) => node.data.kind === kind)
        .map((node) => node.position.y)
        .sort((a, b) => a - b);

      for (let index = 1; index < yPositions.length; index += 1) {
        expect(yPositions[index] - yPositions[index - 1]).toBeGreaterThanOrEqual(ARCHITECTURE_NODE_HEIGHT + 28);
      }
    }
  });

  it('packs highlighted flow participants before dimmed nodes in each layer', async () => {
    const graph = buildArchitectureGraph({ layer: 'all', status: 'all', flowId: 'cod-order', query: '' });
    const result = await layoutArchitectureGraph(graph.nodes, graph.edges);

    for (const kind of ['client', 'edge', 'service', 'infrastructure'] as const) {
      const layerNodes = result.nodes.filter((node) => node.data.kind === kind);
      const highlightedY = layerNodes.filter((node) => node.data.highlighted).map((node) => node.position.y);
      const dimmedY = layerNodes.filter((node) => !node.data.highlighted).map((node) => node.position.y);

      if (highlightedY.length && dimmedY.length) {
        expect(Math.max(...highlightedY)).toBeLessThan(Math.min(...dimmedY));
      }
    }
  });
});
