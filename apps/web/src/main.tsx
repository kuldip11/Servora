import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider, Toaster } from "@pos/ui";
import { router } from "./routes";
import { queryClient } from "./shared/lib/query-client";
import "./index.css";
import { bootstrapAuthSession } from "./shared/auth/bootstrap";
import { PerformanceProfiler } from "./shared/components/PerformanceProfiler";

const root = document.getElementById("root") as HTMLElement | null;
if (!root) throw new Error("Root element not found");
const rootElement: HTMLElement = root;

async function start() {
  await bootstrapAuthSession();

  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <PerformanceProfiler id="web-router">
            <RouterProvider router={router} />
          </PerformanceProfiler>
          {/* Phase 14 fix: this was still passing react-hot-toast's
           * `position`/`toastOptions` props, left over from the Phase 14
           * migration bullet 2 that swapped the import but never updated
           * this call site — `@pos/ui`'s `Toaster` (see Toast.tsx) takes
           * no props at all, so all of `position="top-right"` and the
           * custom `toastOptions` styling were silently no-ops. Both
           * `apps/waiter-app` and `apps/kitchen-display` already caught
           * and fixed this same thing; `apps/web` was the one app that
           * hadn't been. `Toaster` renders at a fixed bottom-right
           * position with baked-in styling — see README.md "Phase 14
           * detail" for the flagged UX-shift discussion. */}
          <Toaster />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

void start();
