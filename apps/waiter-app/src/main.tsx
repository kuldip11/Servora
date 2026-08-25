import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, Toaster } from '@pos/ui';
import { queryClient } from './shared/lib/query-client';
import { WaiterApp } from './app/WaiterApp';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WaiterApp />
        {/* Phase 14 toast consolidation: was `react-hot-toast`'s
         * `<Toaster position="top-center" />`. `@pos/ui`'s `Toaster` has
         * no `position` prop yet — it's a fixed bottom-right viewport
         * (see Toast.tsx) — so toasts move from top-center to
         * bottom-right in this app specifically. Flagged since this is
         * a real on-screen change, not just an implementation swap;
         * worth a look on a real device given this app is mobile-first
         * and bottom-right may sit under a thumb or the bottom nav. */}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
