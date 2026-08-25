import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@pos/ui', () => ({
  BottomSheet: ({ children, footer, title }: any) => <section><h2>{title}</h2>{children}{footer}</section>,
  Button: ({ children, loading: _loading, ...props }: any) => <button {...props}>{children}</button>,
  TextInput: ({ label: _label, ...props }: any) => <input {...props} />,
  SearchInput: (props: any) => <input {...props} />,
}));

import { CartSummary } from '../CartSummary';
import { SearchBar } from '../SearchBar';
import { ItemCustomiser } from '../ItemCustomiser';

const cart: any = [{ menuItemId: 'm1', name: 'Burger', basePrice: 100, modifiers: [{ groupId: 'g1', optionId: 'o1', name: 'Cheese', quantity: 2 }], chefNotes: 'Hot', course: 1, quantity: 2, unitPrice: 120, variantName: 'Large' }];
const item: any = {
  id: 'm1', name: 'Burger', basePrice: '100', description: 'Tasty',
  variants: [{ id: 'v1', name: 'Large', price: '120' }],
  modifierGroupLinks: [{ group: { id: 'g1', name: 'Extras', selectionType: 'MULTIPLE', minSelections: 0, maxSelections: 2, options: [{ id: 'o1', name: 'Cheese', additionalPrice: '10', maxQuantity: 2, isAvailable: true }] } }],
  tags: ['Popular'], allergens: ['Milk'],
};

describe('remaining menu components', () => {
  it('renders cart contents, totals and validation state', () => {
    const html = renderToStaticMarkup(<CartSummary cart={cart} isAddingToExisting={false} orderNotes="note" onOrderNotesChange={vi.fn()} totalItems={2} totalPrice={240} isPending={false} needsTable onUpdateQty={vi.fn()} onSubmit={vi.fn()} onClose={vi.fn()} />);
    expect(html).toContain('Burger');
    expect(html).toContain('₹240.00');
    expect(html).toContain('Select a table');
  });

  it('renders search input', () => {
    expect(renderToStaticMarkup(<SearchBar value="burger" onChange={vi.fn()} />)).toContain('Search menu');
  });

  it('renders customiser with variants and modifiers', () => {
    const html = renderToStaticMarkup(<ItemCustomiser item={item} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(html).toContain('Large');
    expect(html).toContain('Extras');
    expect(html).toContain('Cheese');
  });
});
