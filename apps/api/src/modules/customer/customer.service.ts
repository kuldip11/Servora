import { customerSessionService } from "./customer-session.service";
import { customerPaymentService } from "./customer-payment.service";
import { customerMenuService } from "./customer-menu.service";
import { customerOrderService } from "./customer-order.service";

export const customerService = {
  createSession: customerSessionService.createSession,
  getSession: customerSessionService.getSession,
  getMenu: customerMenuService.getMenu,
  createOrder: customerOrderService.createOrder,
  initiateTakeawayPayment: customerPaymentService.initiateTakeawayPayment,
  verifyTakeawayPayment: customerPaymentService.verifyTakeawayPayment,
  checkout: customerPaymentService.checkout,
  getOrder: customerPaymentService.getOrder,
};

export type { CreateCustomerOrderInput } from "./customer-order.service";
