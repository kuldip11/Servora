import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Home, ClipboardList, Plus, LogOut, Settings } from 'lucide-react';
import { IconButton } from '@pos/ui';
import { LoginPage, getToken, getWaiterName, logout } from '../features/auth';
import { HomePage } from '../features/home/pages/HomePage';
import { OrdersPage } from '../features/orders/pages/OrdersPage';
import { MenuPage } from '../features/menu';
import { OrderDetailPage } from '../features/orders/pages/OrderDetailPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';

function AuthBoundary() {
  const [loggedIn, setLoggedIn] = useState(() => !!getToken());

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return <Outlet />;
}

function AppLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === '/';
  const isOrders = pathname === '/orders' || pathname.startsWith('/orders/');

  function handleLogout() {
    logout();
    navigate({ to: '/' });
    window.location.reload();
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <IconButton
          icon={Settings}
          aria-label="Profile and settings"
          onClick={() => navigate({ to: '/profile' })}
          className="w-9 h-9 rounded-full bg-surface/80 backdrop-blur shadow-sm text-text-secondary hover:bg-surface-secondary/80"
        />
        <IconButton
          icon={LogOut}
          aria-label="Log out"
          onClick={handleLogout}
          className="w-9 h-9 rounded-full bg-surface/80 backdrop-blur shadow-sm text-text-secondary hover:bg-surface-secondary/80"
        />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {children ?? <Outlet />}
      </div>

      <nav aria-label="Primary" className="bg-surface border-t border-border flex">
        <button
          onClick={() => navigate({ to: '/' })}
          aria-current={isHome ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium ${isHome ? 'text-primary' : 'text-text-disabled'}`}
        >
          <Home className="w-5 h-5" />
          Home
        </button>
        <button
          onClick={() => navigate({ to: '/menu' })}
          aria-label="Create new order"
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium text-text-disabled"
        >
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center -mt-5 shadow-md">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="mt-0.5">Order</span>
        </button>
        <button
          onClick={() => navigate({ to: '/orders' })}
          aria-current={isOrders ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium ${isOrders ? 'text-primary' : 'text-text-disabled'}`}
        >
          <ClipboardList className="w-5 h-5" />
          Orders
        </button>
      </nav>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: AuthBoundary,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    const navigate = useNavigate();
    return (
      <AppLayout>
        <HomePage
          waiterName={getWaiterName()}
          onNewOrder={() => navigate({ to: '/menu' })}
          onViewOrders={() => navigate({ to: '/orders' })}
          onSelectOrder={(orderId) => navigate({ to: '/orders/$orderId', params: { orderId } })}
        />
      </AppLayout>
    );
  },
});

const menuRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/menu',
  component: () => {
    const navigate = useNavigate();
    return (
      <MenuPage
        onBack={() => navigate({ to: '/' })}
        onOrderPlaced={(orderId) => navigate({ to: '/orders/$orderId', params: { orderId }, replace: true })}
      />
    );
  },
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  component: () => {
    const navigate = useNavigate();
    return (
      <AppLayout>
        <OrdersPage onSelectOrder={(orderId) => navigate({ to: '/orders/$orderId', params: { orderId } })} />
      </AppLayout>
    );
  },
});

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  component: () => {
    const navigate = useNavigate();
    const { orderId } = orderDetailRoute.useParams();
    return (
      <OrderDetailPage
        orderId={orderId}
        onBack={() => navigate({ to: '/orders' })}
        onAddItems={(id) => navigate({ to: '/orders/$orderId/add', params: { orderId: id } })}
      />
    );
  },
});

const addItemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId/add',
  component: () => {
    const navigate = useNavigate();
    const { orderId } = addItemsRoute.useParams();
    return (
      <MenuPage
        existingOrderId={orderId}
        onBack={() => navigate({ to: '/orders/$orderId', params: { orderId } })}
        onOrderPlaced={(id) => navigate({ to: '/orders/$orderId', params: { orderId: id }, replace: true })}
      />
    );
  },
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => {
    const navigate = useNavigate();
    return <ProfilePage waiterName={getWaiterName()} onBack={() => navigate({ to: '/' })} />;
  },
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  menuRoute,
  ordersRoute,
  orderDetailRoute,
  addItemsRoute,
  profileRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
