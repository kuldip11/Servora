export * from "./components/Button";
export * from "./components/IconButton";
export * from "./components/SplitButton";
export * from "./components/Select";
export * from "./components/Badge";
export * from "./components/StatusBadge";
export * from "./components/Card";
export * from "./components/Spinner";
export * from "./components/EmptyState";
export * from "./components/StatCard";
export * from "./theme/ThemeProvider";

// Phase 16 — Theme Switcher. Exported alongside `ThemeProvider` above
// since both live under the same `theme/` concern; see
// `components/theme/ThemeSwitcher.tsx` for why it's built on
// `SelectMenu` rather than a new control.
export * from "./components/theme";

// Phase 2 — Layout Primitives
export * from "./components/layout/AppShell";
export * from "./components/layout/Container";
export * from "./components/layout/Grid";
export * from "./components/layout/Page";
export * from "./components/layout/PageHeader";
export * from "./components/layout/Section";
export * from "./components/layout/SplitView";
export * from "./components/layout/Stack";

// Phase 3 — Form & Input Components
export * from "./components/form/TextInput";
export * from "./components/form/TextArea";
export * from "./components/form/SearchInput";
export * from "./components/form/NumberInput";
export * from "./components/form/CurrencyInput";
export * from "./components/form/PasswordInput";
export * from "./components/form/OTPInput";

// Phase 4 — Selection Components
// Note: `SelectMenu`/`Combobox`/`Autocomplete` are the new Radix-Popover-backed
// components (see the design-system guidance's Phase 4 section for why they
// aren't exported as `Select` — the legacy native-`<select>`-wrapping `Select`
// above keeps its name and behavior for its 12 existing call sites).
export type { SelectOption } from "./components/selection/shared";
export * from "./components/selection/SelectMenu";
export * from "./components/selection/MultiSelect";
export * from "./components/selection/Combobox";
export * from "./components/selection/Autocomplete";

// Overlay components. `Dialog` is the canonical modal surface; `Modal` is
// exported below as an API-compatible alias for existing consumers.
export type {
  MenuEntry,
  MenuItemDef,
  MenuSeparatorDef,
} from "./components/overlay/shared";
export * from "./components/overlay/Dialog";
export * from "./components/overlay/Drawer";
export * from "./components/overlay/BottomSheet";
export * from "./components/overlay/Popover";
export * from "./components/overlay/DropdownMenu";
export * from "./components/overlay/ContextMenu";
export * from "./components/overlay/Tooltip";
export * from "./components/overlay/Toast";

// Phase 6 — Navigation Components
export type { NavItem } from "./components/navigation/shared";
export * from "./components/navigation/Sidebar";
export * from "./components/navigation/TopNav";
export * from "./components/navigation/BottomNav";
export * from "./components/navigation/Breadcrumbs";
export * from "./components/navigation/Tabs";
export * from "./components/navigation/Accordion";
export * from "./components/navigation/UserMenu";
export * from "./components/navigation/CommandPalette";
export * from "./components/navigation/SkipLink";

// Phase 7 — Data Components: Table/Pagination/FilterBar/Toolbar/
// SkeletonLoader + the upgraded EmptyState above (Part 1), plus
// `DataGrid` — virtualized, bulk-select, sticky columns, column
// visibility (Part 2). See the design-system guidance's "Phase 7
// detail" for the two-part split and what each part shipped.
export type {
  Column,
  ColumnAlign,
  SortDirection,
  SortState,
  TableDensity,
} from "./components/data/shared";
export * from "./components/data/Table";
export * from "./components/data/DataGrid";
export * from "./components/data/Pagination";
export * from "./components/data/FilterBar";
export * from "./components/data/Toolbar";
export * from "./components/data/SkeletonLoader";

// Phase 8 — Motion System: duration/easing tokens (mirrors `tailwind-preset.js`'s
// `duration-*`/`ease-*` utilities as JS-importable constants) + `usePrefersReducedMotion`.
export * from "./animations";
