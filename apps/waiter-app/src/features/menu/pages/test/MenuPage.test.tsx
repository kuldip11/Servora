import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../shared/lib/realtime', () => ({ useRealtimeEvent: vi.fn() }));
vi.mock('../../orders/hooks/useCreateOrder', () => ({ useCreateOrder: () => ({ isPending: false, mutate: vi.fn() }) }));
vi.mock('../../orders/hooks/useAddOrderItems', () => ({ useAddOrderItems: () => ({ isPending: false, mutate: vi.fn(), mutateAsync: vi.fn(), isError: false, error: null, reset: vi.fn() }) }));
vi.mock('../../hooks/useMenuCategories', () => ({ useMenuCategories: () => ({ data: [{ id: 'c1', name: 'Burgers', menuItems: [{ id: 'm1', name: 'Burger', basePrice: '100', isAvailable: true, variants: [], modifierGroupLinks: [], foodType: 'VEG' }] }], isLoading: false }) }));
vi.mock('../../hooks/useMyBranch', () => ({ useMyBranch: () => ({ data: { id: 'b1', tablesEnabled: true, dineInEnabled: true, takeawayEnabled: true, deliveryEnabled: true } }) }));
vi.mock('../../hooks/useTables', () => ({ useTables: () => ({ data: [{ id: 't1', name: 'Table 1' }] }) }));
vi.mock('../../hooks/useCustomerSearch', () => ({ useCustomerSearch: () => ({ data: [] }) }));

import { MenuPage } from '../MenuPage';

function renderPage(props: React.ComponentProps<typeof MenuPage>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MenuPage {...props} />
    </QueryClientProvider>,
  );
}

describe('MenuPage', () => {
  it('renders menu shell and available item', () => {
    const html = renderPage({ onBack: vi.fn(), onOrderPlaced: vi.fn() });
    expect(html).toContain('New Order');
    expect(html).toContain('Burger');
  });

  it('renders existing-order mode', () => {
    const html = renderPage({ onBack: vi.fn(), onOrderPlaced: vi.fn(), existingOrderId: 'o1' });
    expect(html).toContain('Add Items to Order');
  });
});
