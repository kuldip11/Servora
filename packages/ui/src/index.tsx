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

// Theme switching is exported alongside `ThemeProvider`; the control reuses
// the shared `SelectMenu` primitive instead of defining another selector.
export * from "./components/theme";

// Layout primitives
export * from "./components/layout/AppShell";
export * from "./components/layout/Container";
export * from "./components/layout/Grid";
export * from "./components/layout/Page";
export * from "./components/layout/PageHeader";
export * from "./components/layout/Section";
export * from "./components/layout/SplitView";
export * from "./components/layout/Stack";

// Form and input components
export * from "./components/form/TextInput";
export * from "./components/form/TextArea";
export * from "./components/form/SearchInput";
export * from "./components/form/NumberInput";
export * from "./components/form/CurrencyInput";
export * from "./components/form/PasswordInput";
export * from "./components/form/OTPInput";

// Selection components
// `SelectMenu`, `Combobox`, and `Autocomplete` are popover-backed controls.
// The native-select `Select` remains a separate primitive for native semantics.
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

// Navigation components
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

// Data-display components, including virtualized `DataGrid` for larger datasets.
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

// Motion tokens mirror the Tailwind preset and expose reduced-motion detection.
export * from "./animations";
