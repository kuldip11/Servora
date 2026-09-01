import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Home, ClipboardList, Plus } from "lucide-react";
import {
  LoginPage,
  getToken,
  getWaiterName,
  logout,
  logoutSession,
  restoreSession,
} from "@/features/auth";
import { HomePage } from "@/features/home/pages/HomePage";
import { OrdersPage } from "@/features/orders/pages/OrdersPage";
import { MenuPage } from "@/features/menu";
import { OrderDetailPage } from "@/features/orders/pages/OrderDetailPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { useWaiterAttention } from "@/features/orders/hooks/useWaiterAttention";
import { useConnectionStatus } from "@/shared/lib/realtime";
import { useMyBranch } from "@/features/menu/hooks/useMyBranch";

const AuthBoundary = () => {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(() =>
    getToken() ? true : null,
  );

  useEffect(() => {
    if (loggedIn !== null) return;
    restoreSession()
      .then(() => setLoggedIn(true))
      .catch(() => {
        logout();
        setLoggedIn(false);
      });
  }, [loggedIn]);

  if (loggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        Restoring session…
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return <Outlet />;
};

const AppLayout = ({ children }: { children?: ReactNode }) => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isHome = pathname === "/";
  const isOrders = pathname === "/orders" || pathname.startsWith("/orders/");
  const connected = useConnectionStatus();
  const { data: branch } = useMyBranch();
  const waiterName = getWaiterName();
  useWaiterAttention();

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-divider bg-surface px-4 py-3 safe-area-top">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
            <span
              className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-success" : "bg-warning"}`}
            />
            {branch?.name ?? "Current branch"} ·{" "}
            {connected ? "Live" : "Reconnecting"}
          </p>
          <p className="mt-0.5 truncate text-base font-semibold text-text-primary">
            {waiterName}&apos;s service
          </p>
        </div>
        <button
          type="button"
          aria-label="Open profile"
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-surface text-sm font-semibold text-primary"
        >
          {waiterName
            .split(" ")
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "W"}
        </button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {children ?? <Outlet />}
      </div>

      <nav
        aria-label="Primary"
        className="grid grid-cols-3 border-t border-border bg-surface safe-area-bottom"
      >
        <button
          onClick={() => navigate({ to: "/" })}
          aria-current={isHome ? "page" : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${isHome ? "text-primary" : "text-text-secondary"}`}
        >
          <Home className="w-5 h-5" />
          Home
        </button>
        <button
          onClick={() => navigate({ to: "/menu" })}
          aria-label="Create new order"
          className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-text-secondary"
        >
          <Plus className="h-5 w-5" />
          <span>New order</span>
        </button>
        <button
          onClick={() => navigate({ to: "/orders" })}
          aria-current={isOrders ? "page" : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${isOrders ? "text-primary" : "text-text-secondary"}`}
        >
          <ClipboardList className="w-5 h-5" />
          Orders
        </button>
      </nav>
    </div>
  );
};

const rootRoute = createRootRoute({
  component: AuthBoundary,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => {
    const navigate = useNavigate();
    return (
      <AppLayout>
        <HomePage
          waiterName={getWaiterName()}
          onNewOrder={() => navigate({ to: "/menu" })}
          onViewOrders={() => navigate({ to: "/orders" })}
          onSelectOrder={(orderId) =>
            navigate({ to: "/orders/$orderId", params: { orderId } })
          }
        />
      </AppLayout>
    );
  },
});

const menuRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/menu",
  component: () => {
    const navigate = useNavigate();
    return (
      <MenuPage
        onBack={() => navigate({ to: "/" })}
        onOrderPlaced={(orderId) =>
          navigate({
            to: "/orders/$orderId",
            params: { orderId },
            replace: true,
          })
        }
      />
    );
  },
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: () => {
    const navigate = useNavigate();
    return (
      <AppLayout>
        <OrdersPage
          onSelectOrder={(orderId) =>
            navigate({ to: "/orders/$orderId", params: { orderId } })
          }
        />
      </AppLayout>
    );
  },
});

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId",
  component: () => {
    const navigate = useNavigate();
    const { orderId } = orderDetailRoute.useParams();
    return (
      <OrderDetailPage
        orderId={orderId}
        onBack={() => navigate({ to: "/orders" })}
        onAddItems={(id) =>
          navigate({ to: "/orders/$orderId/add", params: { orderId: id } })
        }
      />
    );
  },
});

const addItemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId/add",
  component: () => {
    const navigate = useNavigate();
    const { orderId } = addItemsRoute.useParams();
    return (
      <MenuPage
        existingOrderId={orderId}
        onBack={() => navigate({ to: "/orders/$orderId", params: { orderId } })}
        onOrderPlaced={(id) =>
          navigate({
            to: "/orders/$orderId",
            params: { orderId: id },
            replace: true,
          })
        }
      />
    );
  },
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => {
    const navigate = useNavigate();
    return (
      <ProfilePage
        waiterName={getWaiterName()}
        onBack={() => navigate({ to: "/" })}
        onLogout={async () => {
          try {
            await logoutSession();
          } finally {
            logout();
            navigate({ to: "/" });
            window.location.reload();
          }
        }}
      />
    );
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

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
