import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
} from '@tanstack/react-router';
import { lazy, Suspense, type ComponentType } from 'react';
import { Spinner } from '@pos/ui';
import { RootLayout } from '../shared/components/layout/RootLayout';
import { DashboardLayout } from '../shared/components/layout/DashboardLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignupPage } from '../features/auth/pages/SignupPage';
import { ForbiddenPage } from '../features/auth/pages/ForbiddenPage';
import { userHasPermission } from '../shared/auth/permissions';
import { useAuthStore } from '../store/auth';

// Phase 14 perf pass: every route below except /login and /signup was
// previously a static top-level import, so all 7 internal /dev/*
// preview pages (Phase 1/2/3/4/5/6/7 exit-criteria routes, never linked
// from app navigation — see the "Internal-only" comments this replaces)
// and all 10 authenticated feature pages shipped in the single
// production chunk every real user downloads, MenuPage included (this
// app's largest feature at 123KB pre-minify, per a real `vite build`
// with rollup-plugin-visualizer run this pass). Wrapping each in
// `lazyPage` below turns every one into its own on-demand chunk instead
// — login/signup stay eager since they're the one screen a logged-out
// user needs immediately. Measured effect of this change is recorded in
// docs/design-system/README.md "Phase 14 detail".
function lazyPage(loader: () => Promise<{ default: ComponentType<Record<string, never>> }>) {
  const LazyComponent = lazy(loader);
  return function LazyPageWrapper() {
    return (
      <Suspense
        fallback={
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Spinner className="h-8 w-8" />
          </div>
        }
      >
        <LazyComponent />
      </Suspense>
    );
  };
}

// Root
const rootRoute = createRootRoute({ component: RootLayout });

// Internal-only, no auth guard — see docs/design-system/README.md
// Phase 1 exit criteria. Not linked from app navigation.
const themePreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev/theme-preview',
  component: lazyPage(() => import('../dev/ThemePreviewPage').then((m) => ({ default: m.ThemePreviewPage }))),
});

// Internal-only, no auth guard — Phase 2 exit criteria
// (docs/design-system/00-PLAN.md). Not linked from app navigation.
const layoutPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev/layout-preview',
  component: lazyPage(() => import('../dev/LayoutPreviewPage').then((m) => ({ default: m.LayoutPreviewPage }))),
});

// Internal-only, no auth guard — Phase 3 exit criteria
// (docs/design-system/00-PLAN.md). Not linked from app navigation.
const formPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev/form-preview',
  component: lazyPage(() => import('../dev/FormPreviewPage').then((m) => ({ default: m.FormPreviewPage }))),
});

// Internal-only, no auth guard — Phase 4 exit criteria
// (docs/design-system/00-PLAN.md). Not linked from app navigation.
const selectionPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev/selection-preview',
  component: lazyPage(() => import('../dev/SelectionPreviewPage').then((m) => ({ default: m.SelectionPreviewPage }))),
});

// Internal-only, no auth guard — Phase 5 exit criteria
// (docs/design-system/00-PLAN.md). Not linked from app navigation.
const overlayPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev/overlay-preview',
  component: lazyPage(() => import('../dev/OverlayPreviewPage').then((m) => ({ default: m.OverlayPreviewPage }))),
});

// Internal-only, no auth guard — Phase 6 exit criteria
// (docs/design-system/00-PLAN.md). Not linked from app navigation.
const navigationPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev/navigation-preview',
  component: lazyPage(() => import('../dev/NavigationPreviewPage').then((m) => ({ default: m.NavigationPreviewPage }))),
});

// Internal-only, no auth guard — Phase 7 (Part 1) exit criteria
// (docs/design-system/00-PLAN.md / README.md "Phase 7 detail"). Not
// linked from app navigation.
const dataPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev/data-preview',
  component: lazyPage(() => import('../dev/DataPreviewPage').then((m) => ({ default: m.DataPreviewPage }))),
});

// Auth routes
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/login',
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/signup',
  component: SignupPage,
});

// Protected routes
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: ({ location }) => {
    const { isAuthenticated, franchiseId } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    if (!franchiseId && location.pathname !== '/context') {
      throw redirect({ to: '/context' });
    }
  },
  component: DashboardLayout,
});

const forbiddenRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/forbidden',
  component: ForbiddenPage,
});

function requirePermission(permission: string) {
  return () => {
    const state = useAuthStore.getState();
    if (!userHasPermission(state.user, permission)) throw redirect({ to: '/forbidden' });
  };
}

const contextRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/context',
  component: lazyPage(() => import('../features/auth/pages/ContextPage').then((m) => ({ default: m.ContextPage }))),
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/dashboard',
  beforeLoad: requirePermission('analytics:read'),
  component: lazyPage(() => import('../features/analytics/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))),
});

const ordersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/orders',
  beforeLoad: requirePermission('orders:read'),
  component: lazyPage(() => import('../features/orders/pages/OrdersPage').then((m) => ({ default: m.OrdersPage }))),
});

const orderDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/orders/$orderId',
  beforeLoad: requirePermission('orders:read'),
  component: lazyPage(() => import('../features/orders/pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage }))),
});

const menuRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/menu',
  beforeLoad: requirePermission('menu:read'),
  component: lazyPage(() => import('../features/menu/pages/MenuPage').then((m) => ({ default: m.MenuPage }))),
});

const tablesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/tables',
  beforeLoad: requirePermission('tables:read'),
  component: lazyPage(() => import('../features/tables/pages/TablesPage').then((m) => ({ default: m.TablesPage }))),
});

const inventoryRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/inventory',
  beforeLoad: requirePermission('inventory:read'),
  component: lazyPage(() => import('../features/inventory/pages/InventoryPage').then((m) => ({ default: m.InventoryPage }))),
});

const staffRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/staff',
  beforeLoad: requirePermission('staff:read'),
  component: lazyPage(() => import('../features/staff/pages/StaffPage').then((m) => ({ default: m.StaffPage }))),
});

const billingRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/billing',
  beforeLoad: requirePermission('billing:read'),
  component: lazyPage(() => import('../features/billing/pages/BillingPage').then((m) => ({ default: m.BillingPage }))),
});

const settingsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings',
  component: lazyPage(() => import('../features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))),
});

const branchesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/branches',
  beforeLoad: requirePermission('branch:read'),
  component: lazyPage(() => import('../features/branches/pages/BranchesPage').then((m) => ({ default: m.BranchesPage }))),
});

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const { isAuthenticated, franchiseId } = useAuthStore.getState();
    throw redirect({ to: !isAuthenticated ? '/login' : franchiseId ? '/dashboard' : '/context' });
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  themePreviewRoute,
  layoutPreviewRoute,
  formPreviewRoute,
  selectionPreviewRoute,
  overlayPreviewRoute,
  navigationPreviewRoute,
  dataPreviewRoute,
  authRoute.addChildren([loginRoute, signupRoute]),
  protectedRoute.addChildren([
    contextRoute,
    forbiddenRoute,
    dashboardRoute,
    ordersRoute,
    orderDetailRoute,
    menuRoute,
    tablesRoute,
    inventoryRoute,
    staffRoute,
    billingRoute,
    settingsRoute,
    branchesRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
