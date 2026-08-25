import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Accordion } from '../Accordion';

describe('Accordion', () => {
  it('opens a single section and exposes its content', async () => {
    const user = userEvent.setup();
    render(<Accordion items={[{ value: 'one', title: 'One', content: <p>Content one</p> }]} />);
    await user.click(screen.getByRole('button', { name: 'One' }));
    expect(screen.getByText('Content one')).toBeVisible();
  });
});
