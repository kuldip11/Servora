import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import { OTPInput } from '../OTPInput';

describe('OTPInput', () => {
  it('accepts digits and calls onComplete at the requested length', async () => {
    const user = userEvent.setup(); const onChange = vi.fn(); const onComplete = vi.fn();
    const { rerender } = render(<OTPInput label="Code" length={4} value="" onChange={onChange} onComplete={onComplete} />);
    expect(screen.getAllByRole('textbox', { name: /Digit/ })).toHaveLength(4);
    rerender(<OTPInput label="Code" length={4} value="1234" onChange={onChange} onComplete={onComplete} />);
    const boxes = screen.getAllByRole('textbox', { name: /Digit/ });
    await user.click(boxes[3]!); await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenCalled();
  });
  it('renders error state', () => {
    render(<OTPInput label="Code" length={4} value="12" onChange={() => {}} error="Invalid code" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid code');
  });
});
