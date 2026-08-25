import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import { Dialog } from '../Dialog';

describe('Dialog', () => {
  it('renders an open dialog and closes from the close button', async () => {
    const user = userEvent.setup(); const onOpenChange = vi.fn();
    render(<Dialog open onClose={onOpenChange} title="Edit order">Body</Dialog>);
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Edit order' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});
