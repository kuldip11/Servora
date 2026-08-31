import { SearchInput } from "@pos/ui";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="px-4 pt-3 pb-2">
      <SearchInput
        placeholder="Search menu…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClear={() => onChange("")}
        className="rounded-xl bg-surface-secondary"
      />
    </div>
  );
}
