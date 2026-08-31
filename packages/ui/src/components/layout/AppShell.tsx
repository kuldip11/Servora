import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { SkipLink } from "../navigation/SkipLink";

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;

  sidebar?: ReactNode;

  topbar?: ReactNode;

  bottombar?: ReactNode;

  sidebarWidth?: string;

  skipLink?: boolean;
}

export function AppShell({
  children,
  sidebar,
  topbar,
  bottombar,
  sidebarWidth = "256px",
  skipLink = true,
  className,
  ...props
}: AppShellProps) {
  return (
    <div
      className={cn("min-h-screen bg-background flex", className)}
      {...props}
    >
      {skipLink && <SkipLink />}

      {sidebar && (
        <aside
          className="hidden lg:block shrink-0 border-r border-border bg-surface transition-[width] duration-base ease-standard"
          style={{ width: sidebarWidth }}
        >
          {sidebar}
        </aside>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {topbar && (
          <header className="shrink-0 border-b border-border bg-surface">
            {topbar}
          </header>
        )}

        {

           }
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 overflow-y-auto outline-none"
        >
          {children}
        </main>

        {bottombar && (
          <footer
            className="shrink-0 border-t border-border bg-surface"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {bottombar}
          </footer>
        )}
      </div>
    </div>
  );
}
