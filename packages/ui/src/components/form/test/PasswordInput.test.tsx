import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from '../PasswordInput';

describe('PasswordInput', () => {
  it('renders a password field and supports its inherited input behavior', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await user.type(input, 'secret');
    expect(input).toHaveValue('secret');
  });
});
