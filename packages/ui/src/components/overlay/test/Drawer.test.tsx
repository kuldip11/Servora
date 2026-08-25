import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import { Drawer } from '../Drawer';

describe('Drawer', () => {
  it('renders content and supports closing', async () => {
    const user = userEvent.setup(); const onOpenChange = vi.fn();
    render(<Drawer open onClose={onOpenChange} title="Filters">Filters here</Drawer>);
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText('Filters here')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});
