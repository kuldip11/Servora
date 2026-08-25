import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import { Autocomplete } from '../Autocomplete';

describe('Autocomplete', () => {
  it('debounces search and allows selecting a returned option', async () => {
    const user = userEvent.setup(); const onSearch = vi.fn(); const onChange = vi.fn();
    render(<Autocomplete label="Customer" value={undefined} options={[{ value: '1', label: 'Alice' }]} onSearch={onSearch} onChange={onChange} debounceMs={10} />);
    const input = screen.getByRole('combobox', { name: 'Customer' });
    await user.click(input); await user.type(input, 'Ali');
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith('Ali'));
    await user.click(screen.getByRole('option', { name: 'Alice' }));
    expect(onChange).toHaveBeenCalledWith({ value: '1', label: 'Alice' });
  });
});
