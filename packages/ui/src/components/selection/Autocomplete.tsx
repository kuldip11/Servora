import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "../../utils/cn";
import {
  FieldLabel,
  FieldFooter,
  fieldBaseClasses,
  useFieldIds,
  describedBy,
} from "../form/shared";
import {
  type SelectOption,
  buildRows,
  rowDomId,
  useActiveRow,
  useDebouncedValue,
  useScrollActiveIntoView,
  VirtualListbox,
  popoverContentClasses,
} from "./shared";

export interface AutocompleteProps {

  value: SelectOption | undefined;
  onChange: (option: SelectOption | undefined) => void;

  options: readonly SelectOption[];

  onSearch: (query: string) => void;
  loading?: boolean | undefined;

  debounceMs?: number | undefined;

  minChars?: number | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  className?: string | undefined;
  maxListHeight?: number | undefined;
}

export function Autocomplete({
  value,
  onChange,
  options,
  onSearch,
  loading,
  debounceMs = 300,
  minChars = 1,
  label,
  placeholder = "Search…",
  hint,
  error,
  required,
  disabled,
  id,
  className,
  maxListHeight = 320,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value?.label ?? "");
  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const { fieldId, hintId, errorId } = useFieldIds(id);
  const listboxId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSearchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (open) lastSearchedRef.current = value?.label ?? "";
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debouncedQuery.length < minChars) return;
    if (lastSearchedRef.current === debouncedQuery) return;
    lastSearchedRef.current = debouncedQuery;
    onSearch(debouncedQuery);

  }, [debouncedQuery, open, minChars]);

  useEffect(() => {
    if (!open) setQuery(value?.label ?? "");
  }, [value, open]);

  const belowMinChars = query.length > 0 && query.length < minChars;
  const rows = buildRows(belowMinChars ? [] : options);

  const commitRow = (rowIndex: number) => {
    const row = rows[rowIndex];
    if (row?.kind !== "option" || row.option.disabled) return;
    onChange(row.option);
    setQuery(row.option.label);
    setOpen(false);
    inputRef.current?.blur();
  };

  const { activeRowIndex, setActiveRowIndex, onKeyDown } = useActiveRow(
    rows,
    commitRow,
  );
  useScrollActiveIntoView(listRef, activeRowIndex, open);

  useEffect(() => {
    if (open) setActiveRowIndex(rows.findIndex((r) => r.kind === "option"));
  }, [options, open]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery(value?.label ?? "");
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    onKeyDown(e);
  };

  const handleBlur = () => {

    window.setTimeout(() => {
      setOpen(false);
    }, 120);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={fieldId} required={required}>
        {label}
      </FieldLabel>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              id={fieldId}
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-activedescendant={
                open && activeRowIndex >= 0
                  ? rowDomId(listboxId, activeRowIndex)
                  : undefined
              }
              aria-invalid={!!error || undefined}
              aria-describedby={describedBy(hintId, errorId, hint, error)}
              autoComplete="off"
              disabled={disabled}
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className={cn(
                fieldBaseClasses(!!error),
                "px-3 py-2.5 pr-16",
                className,
              )}
            />
            {loading ? (
              <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-text-secondary" />
            ) : (
              <>
                {value && !disabled && (
                  <button
                    type="button"
                    aria-label="Clear selection"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(undefined);
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="absolute right-8 p-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown className="pointer-events-none absolute right-3 w-4 h-4 text-text-secondary" />
              </>
            )}
          </div>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={cn(
              popoverContentClasses,
              "w-[var(--radix-popover-anchor-width)]",
            )}
          >
            <VirtualListbox
              rows={rows}
              listboxId={listboxId}
              listRef={listRef}
              activeRowIndex={activeRowIndex}
              maxHeight={maxListHeight}
              isSelected={(opt) => opt.value === value?.value}
              onCommitRow={commitRow}
              emptyMessage={
                belowMinChars
                  ? `Type at least ${minChars} character${minChars === 1 ? "" : "s"}`
                  : loading
                    ? "Searching…"
                    : "No results"
              }
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <FieldFooter
        hint={hint}
        error={error}
        hintId={hintId}
        errorId={errorId}
      />
    </div>
  );
}
