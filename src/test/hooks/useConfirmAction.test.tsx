import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useConfirmAction } from '../../hooks/useConfirmAction';

function Harness({ run }: { run: () => void }) {
  const { pending, request, resolve, cancel } = useConfirmAction();
  return (
    <>
      <span data-testid="pending">{pending?.message ?? ''}</span>
      <button onClick={() => request('Do it?', run)}>request</button>
      <button onClick={resolve}>resolve</button>
      <button onClick={cancel}>cancel</button>
    </>
  );
}

describe('useConfirmAction', () => {
  it('starts with no pending request', () => {
    render(<Harness run={vi.fn()} />);
    expect(screen.getByTestId('pending')).toHaveTextContent('');
  });

  it('request() sets the pending message', async () => {
    const user = userEvent.setup();
    render(<Harness run={vi.fn()} />);
    await user.click(screen.getByText('request'));
    expect(screen.getByTestId('pending')).toHaveTextContent('Do it?');
  });

  it('resolve() runs the callback and clears the pending state', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<Harness run={run} />);
    await user.click(screen.getByText('request'));
    await user.click(screen.getByText('resolve'));
    expect(run).toHaveBeenCalledOnce();
    expect(screen.getByTestId('pending')).toHaveTextContent('');
  });

  it('resolve() with no pending request is a no-op', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<Harness run={run} />);
    await user.click(screen.getByText('resolve'));
    expect(run).not.toHaveBeenCalled();
  });

  it('cancel() clears the pending state without running the callback', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<Harness run={run} />);
    await user.click(screen.getByText('request'));
    await user.click(screen.getByText('cancel'));
    expect(run).not.toHaveBeenCalled();
    expect(screen.getByTestId('pending')).toHaveTextContent('');
  });
});
