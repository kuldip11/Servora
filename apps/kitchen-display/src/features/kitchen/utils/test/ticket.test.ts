import { describe, expect, it, vi } from 'vitest';
import { calculateElapsedMs, formatTicketAge, groupTicketsByStatus, isUrgent } from '../ticket';
import { URGENT_THRESHOLD_MS } from '../../constants';
import { ticket } from '../../test/fixtures';
describe('ticket utils',()=>{it('calculates age and urgency',()=>{const now=Date.now();vi.spyOn(Date,'now').mockReturnValue(now);expect(calculateElapsedMs(new Date(now-1000).toISOString())).toBe(1000);expect(isUrgent(new Date(now-URGENT_THRESHOLD_MS-1).toISOString())).toBe(true);vi.restoreAllMocks();});it('formats and groups tickets',()=>{expect(formatTicketAge(ticket.firedAt)).toContain('minute');expect(groupTicketsByStatus([ticket,{...ticket,id:'2',status:'READY'}],'FIRED')).toHaveLength(1);expect(groupTicketsByStatus(undefined,'READY')).toEqual([]);});});
