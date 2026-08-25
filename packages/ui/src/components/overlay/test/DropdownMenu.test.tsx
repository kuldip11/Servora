import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import { DropdownMenu } from '../DropdownMenu';

describe('DropdownMenu', () => {
  it('opens and selects a menu item', async () => {
    const user = userEvent.setup(); const onSelect = vi.fn();
    render(<DropdownMenu trigger={<button>Actions</button>} items={[{ type: 'item', label: 'Edit', onSelect }]} />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
