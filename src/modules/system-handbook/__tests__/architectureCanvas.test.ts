import { describe, expect, it } from 'vitest';
import { buildArchitectureGraph } from '@/modules/system-handbook/data/architectureGraph';
import { getArchitectureFitNodeIds } from '@/modules/system-handbook/data/architectureViewport';

describe('architecture canvas viewport focus', () => {
  it('focuses the viewport on highlighted flow participants', () => {
    const graph = buildArchitectureGraph({ layer: 'all', status: 'all', flowId: 'cod-order', query: '' });

    expect(getArchitectureFitNodeIds(graph.nodes)).toEqual(
      graph.nodes.filter((node) => node.data.highlighted).map((node) => ({ id: node.id })),
    );
  });

  it('keeps the full visible graph as the fallback focus set', () => {
    const graph = buildArchitectureGraph({ layer: 'all', status: 'all', flowId: null, query: '' });

    expect(getArchitectureFitNodeIds(graph.nodes)).toEqual(graph.nodes.map((node) => ({ id: node.id })));
  });
});
