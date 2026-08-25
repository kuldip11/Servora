import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BottomNav } from '../BottomNav';

describe('BottomNav', () => {
  it('renders primary navigation items and active state', () => {
    render(<BottomNav items={[{ label: 'Home', href: '/', active: true }, { label: 'Orders', href: '/orders', badge: <span>2</span> }]} />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    expect(screen.getByRole('link', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('2')).toBeVisible();
  });
});
