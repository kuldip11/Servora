import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stack } from '../Stack';

describe('Stack', () => {
  it('renders a configurable flex layout', () => {
    render(<Stack direction="row" gap="lg" align="center" justify="between" wrap as="section"><span>One</span></Stack>);
    expect(screen.getByText('One').parentElement).toHaveClass('flex-row', 'gap-lg', 'items-center', 'justify-between', 'flex-wrap');
    expect(screen.getByText('One').parentElement?.tagName).toBe('SECTION');
  });
});
