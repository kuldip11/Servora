import { SearchInput } from "@pos/ui";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: Props) => {
  return (
    <div className="px-4 pb-2 pt-3">
      <SearchInput
        placeholder="Search dishes or scan code"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClear={() => onChange("")}
        className="min-h-[46px] rounded-[14px] bg-surface text-base"
      />
    </div>
  );
};
