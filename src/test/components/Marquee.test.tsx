import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { GraphProvider } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
import { ViewportProvider } from '../../store/ViewportContext';
import { PlaythroughProvider } from '../../store/PlaythroughContext';
import { Canvas } from '../../components/Canvas';
import type { GraphState } from '../../types';

function seed(): GraphState {
  return {
    nodes: {
      n1: { id: 'n1', key: 'server', icon: 'server', label: 'API', x: 50, y: 50 },
      n2: { id: 'n2', key: 'sql', icon: 'sql', label: 'DB', x: 300, y: 300 },
    },
    edges: [],
    regions: [],
    seq: 2,
  };
}

let probeIds: string[] | null = null;
function Probe() {
  probeIds = useUI().selectedNodeIds;
  return null;
}

function renderCanvas(initial: GraphState) {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <ViewportProvider>
          <PlaythroughProvider>
            <Probe />
            <Canvas />
          </PlaythroughProvider>
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

describe('marquee selection (via Canvas)', () => {
  it('drags a rectangle and selects only nodes whose box intersects it', () => {
    const { container } = renderCanvas(seed());
    const canvas = container.querySelector('.canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(document, { clientX: 200, clientY: 200 });
    expect(probeIds).toEqual(['n1']);
    expect(container.querySelector('[data-id="n1"]')).toHaveClass('selected');
    expect(container.querySelector('[data-id="n2"]')).not.toHaveClass('selected');
  });

  it('selects every node fully spanned by a large rectangle', () => {
    const { container } = renderCanvas(seed());
    const canvas = container.querySelector('.canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 1000, clientY: 1000 });
    fireEvent.mouseUp(document, { clientX: 1000, clientY: 1000 });
    expect(probeIds).toEqual(['n1', 'n2']);
    expect(container.querySelector('[data-id="n1"]')).toHaveClass('selected');
    expect(container.querySelector('[data-id="n2"]')).toHaveClass('selected');
  });

  it('renders a visual rectangle while dragging, sized from the drag points', () => {
    const { container } = renderCanvas(seed());
    const canvas = container.querySelector('.canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 90, clientY: 60 });
    const rect = container.querySelector('.marquee') as HTMLElement;
    expect(rect).toBeTruthy();
    expect(rect.style.left).toBe('10px');
    expect(rect.style.top).toBe('10px');
    expect(rect.style.width).toBe('80px');
    expect(rect.style.height).toBe('50px');
    fireEvent.mouseUp(document, { clientX: 90, clientY: 60 });
    expect(container.querySelector('.marquee')).toBeNull();
  });

  it('a plain click with no movement selects nothing (clears the selection)', () => {
    const { container } = renderCanvas(seed());
    const canvas = container.querySelector('.canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 500, clientY: 500 });
    fireEvent.mouseUp(document, { clientX: 500, clientY: 500 });
    expect(probeIds).toEqual([]);
    expect(container.querySelector('[data-id="n1"]')).not.toHaveClass('selected');
  });

  it('mousedown on a node does not start a marquee drag', () => {
    const { container } = renderCanvas(seed());
    const box = container.querySelector('[data-id="n1"] .box')!;
    fireEvent.mouseDown(box, { clientX: 60, clientY: 60 });
    fireEvent.mouseMove(document, { clientX: 400, clientY: 400 });
    expect(container.querySelector('.marquee')).toBeNull();
    fireEvent.mouseUp(document);
  });
});
