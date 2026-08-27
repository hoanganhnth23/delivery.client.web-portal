import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildArchitectureGraph } from '@/modules/system-handbook/data/architectureGraph';
import ArchitectureCanvas from '@/modules/system-handbook/components/ArchitectureCanvas';
import ArchitectureMobileList from '@/modules/system-handbook/components/ArchitectureMobileList';

describe('architecture mobile fallback', () => {
  it('shows expandable layers and readable connection rows', async () => {
    const user = userEvent.setup();
    const graph = buildArchitectureGraph({ layer: 'all', status: 'all', flowId: null, query: '' });

    render(
      <ArchitectureMobileList
        layers={graph.layers}
        edges={graph.edges}
        selectedNodeId={null}
        selectedEdgeId={null}
        onNodeSelect={vi.fn()}
        onEdgeSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Danh sách theo lớp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Client applications/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Client applications/ }));
    expect(screen.getByRole('button', { name: /delivery_app.*Customer app/ })).toBeInTheDocument();
    expect(screen.getByText(/customer-app → gateway/)).toBeInTheDocument();
  });

  it('keeps all architecture layer titles readable in the desktop canvas header', () => {
    const graph = buildArchitectureGraph({ layer: 'all', status: 'all', flowId: null, query: '' });

    render(
      <ArchitectureCanvas
        layers={graph.layers}
        nodes={[]}
        edges={[]}
        selectedNodeId={null}
        selectedEdgeId={null}
        onNodeSelect={vi.fn()}
        onEdgeSelect={vi.fn()}
      />,
    );

    const title = screen.getByText('Hạ tầng dữ liệu & sự kiện');
    expect(title).toHaveClass('break-words');
    expect(title).not.toHaveClass('truncate');

    expect(screen.getByText('Bản đồ tương tác').parentElement).toHaveClass('pointer-events-none');
  });
});
