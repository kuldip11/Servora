import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipProvider } from '../Tooltip';

describe('Tooltip', () => {
  it('shows content when the trigger is focused', async () => {
    const user = userEvent.setup();
    render(<TooltipProvider delayDuration={0}><Tooltip trigger={<button>Help</button>} content="Helpful text" /></TooltipProvider>);
    await user.hover(screen.getByRole('button', { name: 'Help' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful text');
  });
});
