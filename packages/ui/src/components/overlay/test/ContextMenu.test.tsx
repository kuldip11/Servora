import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import { ContextMenu } from '../ContextMenu';

describe('ContextMenu', () => {
  it('opens its menu on context click', async () => {
    const user = userEvent.setup();
    render(<ContextMenu items={[{ type: 'item', label: 'Copy', onSelect: vi.fn() }]}><div>Target</div></ContextMenu>);
    await user.pointer({ target: screen.getByText('Target'), keys: '[MouseRight]' });
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeVisible();
  });
});
