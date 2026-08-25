import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Grid } from '../Grid';

describe('Grid', () => {
  it('renders fixed and responsive column classes', () => {
    render(<Grid columns={{ base: 1, md: 3 }} gap="lg"><span>One</span></Grid>);
    expect(screen.getByText('One').parentElement).toHaveClass('grid-cols-1', 'md:grid-cols-3', 'gap-lg');
  });
});
