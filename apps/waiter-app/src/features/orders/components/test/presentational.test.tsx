import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusBadge } from '../StatusBadge';
import { OrderBanners } from '../OrderBanners';
import { OrderTimeline } from '../OrderTimeline';
import { OrderTotals } from '../OrderTotals';
import { OrderCard } from '../OrderCard';
import { OrderDetailHeader } from '../OrderDetailHeader';
import { TicketGroup } from '../TicketGroup';
import { OrderActions } from '../OrderActions';

const order: any = { id:'12345678-1234', status:'OPEN', type:'DINE_IN', subtotal:100, taxAmount:18, totalAmount:118, items:[{id:'1',quantity:1,menuItemName:'Paneer'},{id:'2',quantity:2,menuItemName:'Naan'},{id:'3',quantity:1,menuItemName:'Rice'}], table:{name:'7'}, statusHistory:[{id:'h1',changedAt:'2026-01-01T10:00:00Z',newStatus:'OPEN'}] };
const readyTicket: any = { id:'t1', ticketNumber:1, status:'READY', notes:'Hot', items:[{id:'i1',quantity:2,menuItemName:'Paneer',subtotal:200,variantName:'Large',modifiers:[{name:'Spicy'}],chefNotes:'No onion'}] };

describe('order presentational components', () => {
  it('renders all status badge paths', () => {
    expect(renderToStaticMarkup(<StatusBadge status="OPEN" />)).toContain('Open');
    expect(renderToStaticMarkup(<StatusBadge status="PAID" />)).toContain('Paid');
    expect(renderToStaticMarkup(<StatusBadge status="CUSTOM" />)).toContain('CUSTOM');
  });
  it('renders banners for ready tickets and bill requests', () => {
    expect(renderToStaticMarkup(<OrderBanners order={{...order,status:'BILL_REQUESTED'}} readyTickets={[readyTicket]} />)).toContain('Bill requested');
    expect(renderToStaticMarkup(<OrderBanners order={order} readyTickets={[readyTicket,readyTicket]} />)).toContain('2 rounds are ready');
  });
  it('renders timeline, totals, cards and header', () => {
    expect(renderToStaticMarkup(<OrderTimeline order={order} />)).toContain('Timeline');
    expect(renderToStaticMarkup(<OrderTimeline order={{...order,statusHistory:[]}} />)).toBe('');
    expect(renderToStaticMarkup(<OrderTotals order={order} />)).toContain('₹118.00');
    expect(renderToStaticMarkup(<OrderCard order={order} onSelect={vi.fn()} />)).toContain('+1 more');
    expect(renderToStaticMarkup(<OrderCard order={order} onSelect={vi.fn()} variant="compact" />)).toContain('3 items');
    expect(renderToStaticMarkup(<OrderDetailHeader order={order} onBack={vi.fn()} />)).toContain('Table 7');
  });
  it('renders ticket and action branches', () => {
    expect(renderToStaticMarkup(<TicketGroup ticket={readyTicket} onMarkServed={vi.fn()} isUpdating={false} />)).toContain('Mark Round Served');
    expect(renderToStaticMarkup(<OrderActions order={order} canRequestBill={false} canAddItems={false} canCancel={false} allTicketsServed={false} isUpdatingStatus={false} onRequestBill={vi.fn()} onAddItems={vi.fn()} onCancel={vi.fn()} />)).toBe('');
    const html = renderToStaticMarkup(<OrderActions order={order} canRequestBill canAddItems canCancel allTicketsServed={false} isUpdatingStatus={false} onRequestBill={vi.fn()} onAddItems={vi.fn()} onCancel={vi.fn()} />);
    expect(html).toContain('Request Bill'); expect(html).toContain('Add More Items'); expect(html).toContain('Cancel Order');
  });
});
