import { describe, expect, it } from 'vitest';
import { Elysia } from 'elysia';
import { requestContextPlugin } from '../request-context';

describe('requestContextPlugin', () => {
  it('adds request id and response-time headers', async () => {
    const app = new Elysia().use(requestContextPlugin()).get('/health', ({ requestContext }) => ({ requestId: requestContext.requestId }));
    const response = await app.handle(new Request('http://localhost/health', { headers: { 'user-agent': 'vitest' } }));
    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get('x-response-time')).toMatch(/^\d+ms$/);
    const body = (await response.json()) as { requestId: string };
    expect(body.requestId).toBe(response.headers.get('x-request-id'));
  });

  it('uses the first forwarded-for address as the client ip', async () => {
    const app = new Elysia().use(requestContextPlugin()).get('/health', ({ requestContext }) => ({ ip: requestContext.ip }));
    const response = await app.handle(new Request('http://localhost/health', { headers: { 'x-forwarded-for': ' 10.0.0.1, 10.0.0.2 ', 'x-real-ip': '10.0.0.3' } }));
    expect(await response.json()).toEqual({ ip: '10.0.0.1' });
  });

  it('falls back to x-real-ip when forwarded-for is absent', async () => {
    const app = new Elysia().use(requestContextPlugin()).get('/health', ({ requestContext }) => ({ ip: requestContext.ip }));
    const response = await app.handle(new Request('http://localhost/health', { headers: { 'x-real-ip': '10.0.0.3' } }));
    expect(await response.json()).toEqual({ ip: '10.0.0.3' });
  });
});
