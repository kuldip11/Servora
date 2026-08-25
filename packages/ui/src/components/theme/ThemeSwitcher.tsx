import { useMemo, type ComponentType } from "react";
import { Sun, Moon, Contrast } from "lucide-react";
import { SelectMenu } from "../selection/SelectMenu";
import type { SelectOption } from "../selection/shared";
import { useTheme, type Theme } from "../../theme/ThemeProvider";

/**
 * Phase 16 — shared theme switcher.
 *
 * Deliberately built on `SelectMenu` (Phase 4's canonical listbox — see
 * that file's own doc comment), not a hand-rolled `<select>` or a new
 * segmented-control component. `SelectMenu` already gives this exactly
 * what the phase's accessibility requirements ask for for free: a
 * `role="combobox"` trigger with a correct accessible name via
 * `FieldLabel`, `aria-expanded`/`aria-activedescendant`, full arrow-key/
 * Home/End/typeahead navigation, a visible focus ring from
 * `triggerBaseClasses`, and a `role="option"`/`aria-selected` listbox —
 * all wired through semantic tokens (`border-border`, `text-text-*`,
 * `bg-primary-surface`, etc.), so High Contrast and Dark both fall out
 * of the existing token system rather than needing bespoke styling here.
 *
 * This component owns no theme state or persistence of its own — both
 * come from `useTheme()`, which is the single source of truth
 * (`ThemeProvider`, `packages/ui/src/theme/ThemeProvider.tsx`) already
 * used by Admin and Waiter App. Rendering it under a `ThemeProvider` is
 * required, same as any other `useTheme()` consumer.
 */

const THEME_ICONS: Record<Theme, ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  "high-contrast": Contrast,
};

const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  "high-contrast": "High Contrast",
};

const THEME_ORDER: Theme[] = ["light", "dark", "high-contrast"];

export interface ThemeSwitcherProps {
  /** @default 'Theme' */
  label?: string | undefined;
  id?: string | undefined;
  className?: string | undefined;
}

export function ThemeSwitcher({
  label = "Theme",
  id,
  className,
}: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  const options: SelectOption[] = useMemo(
    () =>
      THEME_ORDER.map((value) => ({
        value,
        label: THEME_LABELS[value],
        icon: THEME_ICONS[value],
      })),
    [],
  );

  return (
    <SelectMenu
      id={id}
      label={label}
      options={options}
      value={theme}
      onChange={(value) => setTheme(value as Theme)}
      className={className}
    />
  );
}
