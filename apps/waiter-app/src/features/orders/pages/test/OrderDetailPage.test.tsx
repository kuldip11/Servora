import React from 'react'; import { describe, expect, it, vi } from 'vitest'; import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('../../hooks/useOrder',()=>({useOrder:vi.fn(()=>({data:null,isLoading:true}))}));
vi.mock('../../hooks/useUpdateOrderStatus',()=>({useUpdateOrderStatus:vi.fn(()=>({isPending:false,mutate:vi.fn()}))}));
vi.mock('../../hooks/useUpdateTicketStatus',()=>({useUpdateTicketStatus:vi.fn(()=>({isPending:false,variables:null,mutate:vi.fn()}))}));
import { OrderDetailPage } from '../OrderDetailPage';
describe('OrderDetailPage',()=>{it('renders loading state',()=>{const html=renderToStaticMarkup(<OrderDetailPage orderId="o1" onBack={vi.fn()} onAddItems={vi.fn()}/>);expect(html).toContain('Order Detail');});});
