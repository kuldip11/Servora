import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { TextInput, type TextInputProps } from "./TextInput";

export interface SearchInputProps extends Omit<
  TextInputProps,
  "icon" | "suffix" | "type"
> {

  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, ...props }, ref) => {
    const hasValue = typeof value === "string" ? value.length > 0 : !!value;
    return (
      <TextInput
        ref={ref}
        type="search"
        icon={Search}
        value={value}
        suffix={
          hasValue && onClear ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className="text-text-secondary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  },
);
SearchInput.displayName = "SearchInput";
