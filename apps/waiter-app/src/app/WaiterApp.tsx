import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

/**
 * Waiter App routing boundary.
 *
 * Routes:
 *   /                     Home
 *   /menu                 Menu / new order
 *   /orders               Orders
 *   /orders/:orderId      Order Details
 *   /orders/:orderId/add  Add items to an existing order
 *   /profile              Profile
 *
 * KDS intentionally does not use this router; it remains a single-screen
 * kitchen board as required by the KDS interaction model.
 */
export function WaiterApp() {
  return <RouterProvider router={router} />;
}
