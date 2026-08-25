import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import { Tabs } from '../Tabs';

describe('Tabs', () => {
  it('selects the first tab by default and changes tabs', async () => {
    const user = userEvent.setup(); const onChange = vi.fn();
    render(<Tabs aria-label="Sections" onValueChange={onChange} items={[{ value: 'one', label: 'One', content: <p>First</p> }, { value: 'two', label: 'Two', content: <p>Second</p> }]} />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('First');
    await user.click(screen.getByRole('tab', { name: 'Two' }));
    expect(onChange).toHaveBeenCalledWith('two');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second');
  });
});
