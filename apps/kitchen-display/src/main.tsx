import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, Toaster } from '@pos/ui';
import { queryClient } from './shared/lib/query-client';
import { KitchenApp } from './features/kitchen';
import "./index.css";

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    {/* Phase 16 — KDS moves onto the shared `ThemeProvider` used by
     * Admin/Waiter App instead of the standalone `data-theme="dark"`
     * hardcoded in `index.html` (removed there in this same change).
     * `defaultTheme="dark"` preserves KDS's current dark-only behavior
     * for anyone who's never touched the new theme control — the app
     * still boots dark exactly like before — but now that's a default,
     * not a ceiling: `KitchenBoard`'s header exposes the same shared
     * `ThemeSwitcher` (see that file), and `useTheme()` is available to
     * every KDS component like it already is in the other two apps. */}
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <KitchenApp />
        {/* Phase 14 toast consolidation: was `react-hot-toast`'s
         * `<Toaster position="top-right" />`. `@pos/ui`'s `Toaster` is a
         * fixed bottom-right viewport (see Toast.tsx, no `position` prop
         * yet) — same top-right corner, different vertical edge. Lower
         * risk than waiter-app's top-center → bottom-right move, but
         * still worth a glance given this is a large-screen, glanceable
         * board where a bottom-right toast could sit under a ticket card. */}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
