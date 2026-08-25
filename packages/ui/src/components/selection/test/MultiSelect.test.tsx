import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import { MultiSelect } from '../MultiSelect';

describe('MultiSelect', () => {
  it('toggles options without closing the list', async () => {
    const user = userEvent.setup(); const onChange = vi.fn();
    render(<MultiSelect label="Tags" options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]} value={[]} onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: 'Tags' }));
    await user.click(screen.getByRole('option', { name: 'Alpha' }));
    expect(onChange).toHaveBeenCalledWith(['a']);
    expect(screen.getByRole('listbox')).toBeVisible();
  });
});
