import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders its content and default variant', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeVisible();
  });
  it('applies the selected variant and custom class', () => {
    const { container } = render(<Badge variant="danger" className="custom">Blocked</Badge>);
    expect(container.firstElementChild).toHaveClass('bg-danger-surface', 'custom');
  });
});
