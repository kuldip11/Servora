import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Breadcrumbs } from '../Breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders links and marks the last item as current', () => {
    render(<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Orders', href: '/orders' }]} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Orders')).toHaveAttribute('aria-current', 'page');
  });
});
