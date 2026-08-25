import { SearchInput } from '@pos/ui';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

// Design-system Phase 11, Sprint WA-3. Genuine drop-in onto `SearchInput`
// (Phase 3/4) — a search icon + text field + clear button is exactly
// what this component already was by hand. `rounded-xl`/
// `bg-surface-secondary` passed via `className` since `SearchInput`'s
// (inherited from `TextInput`) defaults are `rounded-md`/`bg-surface`.
// Small, deliberate addition: `onClear` wires up the "×" button
// `SearchInput` renders once there's a value — the original had no way
// to clear the field except deleting text manually. Real UX add, not
// hidden — flagged the same way `StatusBadge`'s default dot indicator
// was in earlier sprints.
export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="px-4 pt-3 pb-2">
      <SearchInput
        placeholder="Search menu…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClear={() => onChange('')}
        className="rounded-xl bg-surface-secondary"
      />
    </div>
  );
}
