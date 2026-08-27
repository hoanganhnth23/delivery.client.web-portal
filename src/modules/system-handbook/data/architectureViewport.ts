import type { ArchitectureFlowNode } from './architectureGraph';

export function getArchitectureFitNodeIds(nodes: ArchitectureFlowNode[]): Array<{ id: string }> {
  const highlightedNodes = nodes.filter((node) => node.data.highlighted);
  return (highlightedNodes.length ? highlightedNodes : nodes).map((node) => ({ id: node.id }));
}
