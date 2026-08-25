import { Elysia } from 'elysia';
import { requireAuthPlugin } from '../../core/auth';
import { billingController } from './billing.controller';
import { createPaymentBody, createRefundBody, billIdParams } from './billing.validator';

export const billingRouter = new Elysia()
  .use(requireAuthPlugin())
  .post('/api/payments', ({ auth, body, set }) => {
    set.status = 201;
    return billingController.createPayment(auth, body);
  }, { body: createPaymentBody })
  .post('/api/refunds', ({ auth, body, set }) => {
    set.status = 201;
    return billingController.createRefund(auth, body);
  }, { body: createRefundBody })
  .get('/api/bills/:id', ({ auth, params }) => billingController.getBill(auth, params.id), { params: billIdParams });
