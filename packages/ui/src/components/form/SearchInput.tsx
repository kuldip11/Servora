import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { TextInput, type TextInputProps } from './TextInput';

export interface SearchInputProps extends Omit<TextInputProps, 'icon' | 'suffix' | 'type'> {
  /** Called when the clear (×) button is pressed. Only shown when `value` is non-empty. */
  onClear?: () => void;
}

/**
 * `TextInput` preset with a leading search icon and a trailing clear
 * button that appears once there's a value. `value`/`onChange` are
 * required in practice (the clear button needs to know the current
 * value) but kept optional in the type to match `TextInput`'s HTML
 * input contract.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, ...props }, ref) => {
    const hasValue = typeof value === 'string' ? value.length > 0 : !!value;
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
SearchInput.displayName = 'SearchInput';
