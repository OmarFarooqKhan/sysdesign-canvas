import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { GraphState } from '../../types';
import { GraphProvider, useGraph } from '../../store/GraphContext';
import { UIProvider, useUI } from '../../store/UIContext';
import { ViewportProvider, useViewport } from '../../store/ViewportContext';
import { RegionView } from '../../components/RegionView';

const region = { id: 'r1', title: 'Backend', x: 100, y: 100, w: 260, h: 180, color: '#34d399' };
const initial: GraphState = { nodes: {}, edges: [], regions: [region], seq: 1 };

function Probe() {
  const { state } = useGraph();
  return <pre data-testid="probe">{JSON.stringify(state.regions[0] ?? null)}</pre>;
}

function SelectProbe() {
  const { selectRegion } = useUI();
  return <button data-testid="select-r1" onClick={() => selectRegion('r1')} />;
}

function ZoomProbe() {
  const { setViewport } = useViewport();
  return <button data-testid="zoom-2x" onClick={() => setViewport({ zoom: 2 })} />;
}

function setup() {
  return render(
    <GraphProvider initial={initial}>
      <UIProvider>
        <ViewportProvider>
          <Probe />
          <SelectProbe />
          <ZoomProbe />
          <RegionView region={region} />
        </ViewportProvider>
      </UIProvider>
    </GraphProvider>,
  );
}

describe('RegionView', () => {
  it('selects the region on root mousedown', () => {
    setup();
    const root = document.querySelector('.region')!;
    fireEvent.mouseDown(root, { target: root, currentTarget: root });
    expect(root.className).toContain('selected');
  });

  it('does not select via the root handler when mousedown target is a child', () => {
    setup();
    const root = document.querySelector('.region')!;
    const handle = document.querySelector('.r-resize')!;
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(document, { clientX: 0, clientY: 0 });
    expect(root.className).not.toContain('selected');
  });

  it('drags the title to move the region as one undo step', () => {
    setup();
    const title = document.querySelector('.r-title')!;
    fireEvent.mouseDown(title, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 20, clientY: 30 });
    fireEvent.mouseMove(document, { clientX: 25, clientY: 35 });
    fireEvent.mouseUp(document, { clientX: 25, clientY: 35 });
    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe.x).toBe(125);
    expect(probe.y).toBe(135);
  });

  it('clamps move to a minimum of 0', () => {
    setup();
    const title = document.querySelector('.r-title')!;
    fireEvent.mouseDown(title, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: -500, clientY: -500 });
    fireEvent.mouseUp(document, { clientX: -500, clientY: -500 });
    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe.x).toBe(0);
    expect(probe.y).toBe(0);
  });

  it('resizes via the resize handle and respects the minimum size', () => {
    setup();
    const handle = document.querySelector('.r-resize')!;
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: -1000, clientY: -1000 });
    fireEvent.mouseUp(document, { clientX: -1000, clientY: -1000 });
    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe.w).toBe(120);
    expect(probe.h).toBe(90);
  });

  it('divides move and resize deltas by zoom', () => {
    setup();
    fireEvent.click(screen.getByTestId('zoom-2x'));
    const title = document.querySelector('.r-title')!;
    fireEvent.mouseDown(title, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 40, clientY: 60 });
    fireEvent.mouseUp(document, { clientX: 40, clientY: 60 });
    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe.x).toBe(120);
    expect(probe.y).toBe(130);

    const handle = document.querySelector('.r-resize')!;
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 20, clientY: 10 });
    fireEvent.mouseUp(document, { clientX: 20, clientY: 10 });
    const probe2 = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe2.w).toBe(270);
    expect(probe2.h).toBe(185);
  });

  it('resizes normally within bounds', () => {
    setup();
    const handle = document.querySelector('.r-resize')!;
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(document, { clientX: 10, clientY: 15 });
    fireEvent.mouseUp(document, { clientX: 10, clientY: 15 });
    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe.w).toBe(270);
    expect(probe.h).toBe(195);
  });

  it('renames via double-click, edit, and blur', async () => {
    setup();
    const title = document.querySelector('.r-title') as HTMLElement;
    fireEvent.doubleClick(title);
    await new Promise((r) => requestAnimationFrame(r));
    expect(document.activeElement).toBe(title);
    title.textContent = 'Frontend';
    fireEvent.blur(title);
    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe.title).toBe('Frontend');
  });

  it('blurs on Enter while editing the title', () => {
    setup();
    const title = document.querySelector('.r-title') as HTMLElement;
    fireEvent.doubleClick(title);
    title.textContent = 'Gateway';
    fireEvent.keyDown(title, { key: 'Enter' });
    fireEvent.blur(title);
    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe.title).toBe('Gateway');
  });

  it('ignores non-Enter keys while editing the title', () => {
    setup();
    const title = document.querySelector('.r-title') as HTMLElement;
    fireEvent.doubleClick(title);
    fireEvent.keyDown(title, { key: 'a' });
    expect(document.querySelector('.r-title')).toBeTruthy();
  });

  it('does not start a drag when mousedown happens while already editable', () => {
    setup();
    const title = document.querySelector('.r-title') as HTMLElement;
    fireEvent.doubleClick(title);
    fireEvent.mouseDown(title, { clientX: 5, clientY: 5 });
    fireEvent.mouseMove(document, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(document, { clientX: 50, clientY: 50 });
    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe.x).toBe(100);
    expect(probe.y).toBe(100);
  });

  it('deletes the region via the delete button without selecting it', () => {
    setup();
    const del = document.querySelector('.r-del') as HTMLElement;
    fireEvent.click(del);
    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe).toBeNull();
  });

  it('shows selected class when useUI().selectedRegionId matches', () => {
    setup();
    fireEvent.click(screen.getByTestId('select-r1'));
    const root = document.querySelector('.region')!;
    expect(root.className).toContain('selected');
  });
});
