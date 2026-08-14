import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphProvider } from '../../store/GraphContext';
import { UIProvider } from '../../store/UIContext';
import { ShareButton } from '../../components/ShareButton';

const renderHarness = () => render(<GraphProvider><UIProvider><ShareButton /></UIProvider></GraphProvider>);

describe('ShareButton', () => {
  it('copies a share link to the clipboard and confirms via AlertDialog, dismissible via OK', async () => {
    // userEvent.setup() replaces navigator.clipboard with its own stub, so the mock must be
    // installed (overriding that stub) after setup() rather than before.
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeTextMock }, configurable: true });

    renderHarness();
    await user.click(screen.getByRole('button', { name: /Share/ }));
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock.mock.calls[0][0]).toContain('#');
    expect(await screen.findByText('Share link copied to clipboard.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByText('Share link copied to clipboard.')).not.toBeInTheDocument();
  });
});
