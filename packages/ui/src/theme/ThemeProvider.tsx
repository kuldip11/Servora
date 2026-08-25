import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'high-contrast';

const THEMES: Theme[] = ['light', 'dark', 'high-contrast'];
const STORAGE_KEY = 'pos-theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isTheme(value: string | null): value is Theme {
  return value !== null && (THEMES as string[]).includes(value);
}

function getInitialTheme(defaultTheme: Theme): Theme {
  if (typeof window === 'undefined') return defaultTheme;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isTheme(stored) ? stored : defaultTheme;
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** Used only if nothing is in localStorage yet. Defaults to 'light'. */
  defaultTheme?: Theme;
}

/**
 * Sets `data-theme` on <html> and persists the choice to localStorage.
 * Used by all three apps — Admin (`apps/web`), Waiter App, and, as of
 * Phase 16, Kitchen Display too. KDS renders `<ThemeProvider
 * defaultTheme="dark">` (see `apps/kitchen-display/src/main.tsx`) rather
 * than the standalone hardcoded `data-theme="dark"` its `index.html`
 * used before Phase 16 (open decision #3 in
 * docs/design-system/README.md, now resolved) — it keeps the same dark
 * boot behavior by default but is a real, switchable participant in
 * this provider like the other two apps.
 */
export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme(defaultTheme));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
