import { SearchInput } from "@pos/ui";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: Props) => {
  return (
    <div className="px-4 pb-2 pt-3">
      <SearchInput
        placeholder="Search menu…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClear={() => onChange("")}
        className="min-h-12 rounded-2xl bg-surface text-base"
      />
    </div>
  );
};
