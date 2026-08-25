import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Popover } from '../Popover';

describe('Popover', () => {
  it('opens content from its trigger', async () => {
    const user = userEvent.setup();
    render(<Popover trigger={<button>Open</button>}>Popover content</Popover>);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('Popover content')).toBeVisible();
  });
});
