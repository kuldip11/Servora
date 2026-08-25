import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import { UserMenu } from '../UserMenu';

describe('UserMenu', () => {
  it('renders initials and opens menu actions', async () => {
    const user = userEvent.setup(); const action = vi.fn();
    render(<UserMenu name="Kuldip Kumar" detail="Owner" items={[{ type: 'item', label: 'Sign out', onSelect: action }]} />);
    expect(screen.getByText('KK')).toBeVisible();
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  });
});
