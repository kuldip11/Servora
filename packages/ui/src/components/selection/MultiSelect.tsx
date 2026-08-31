import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";
import {
  FieldLabel,
  FieldFooter,
  useFieldIds,
  describedBy,
} from "../form/shared";
import {
  type SelectOption,
  buildRows,
  filterOptions,
  rowDomId,
  useActiveRow,
  useScrollActiveIntoView,
  VirtualListbox,
  popoverContentClasses,
  triggerBaseClasses,
} from "./shared";

export interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string | undefined;
  placeholder?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  className?: string | undefined;
  maxListHeight?: number | undefined;

  maxVisibleChips?: number | undefined;
}

export function MultiSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Select…",
  hint,
  error,
  required,
  disabled,
  id,
  className,
  maxListHeight = 320,
  maxVisibleChips = 3,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { fieldId, hintId, errorId } = useFieldIds(id);
  const listboxId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedSet = new Set(value);
  const selectedOptions = options.filter((o) => selectedSet.has(o.value));
  const filtered = filterOptions(options, query);
  const rows = buildRows(filtered);

  const toggle = (optValue: string) => {
    onChange(
      selectedSet.has(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue],
    );
  };

  const commitRow = (rowIndex: number) => {
    const row = rows[rowIndex];
    if (row?.kind !== "option" || row.option.disabled) return;
    toggle(row.option.value);

  };

  const { activeRowIndex, setActiveRowIndex, onKeyDown } = useActiveRow(
    rows,
    commitRow,
  );
  useScrollActiveIntoView(listRef, activeRowIndex, open);

  useEffect(() => {
    if (open) {
      setActiveRowIndex(rows.findIndex((r) => r.kind === "option"));
      window.setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setQuery("");
    }

  }, [open]);

  useEffect(() => {
    setActiveRowIndex(rows.findIndex((r) => r.kind === "option"));

  }, [query]);

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Backspace" && query === "" && value.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }
    onKeyDown(e);
  };

  const visibleChips = selectedOptions.slice(0, maxVisibleChips);
  const overflowCount = selectedOptions.length - visibleChips.length;

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={fieldId} required={required}>
        {label}
      </FieldLabel>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            id={fieldId}
            disabled={disabled}
            role="combobox"
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy(hintId, errorId, hint, error)}
            className={cn(
              triggerBaseClasses,
              "min-h-[42px] flex-wrap",
              error
                ? "border-danger focus:ring-danger"
                : "border-border focus:ring-primary",
              className,
            )}
          >
            {selectedOptions.length === 0 ? (
              <span className="text-text-disabled">{placeholder}</span>
            ) : (

              <span className="flex flex-1 flex-wrap items-center gap-1">
                {visibleChips.map((opt) => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center gap-1 rounded bg-primary-surface px-1.5 py-0.5 text-xs text-primary"
                  >
                    {opt.label}
                  </span>
                ))}
                {overflowCount > 0 && (
                  <span className="text-xs text-text-secondary">
                    +{overflowCount} more
                  </span>
                )}
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className={cn(
              popoverContentClasses,
              "w-[var(--radix-popover-trigger-width)] flex flex-col",
            )}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="border-b border-border p-1.5">
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-activedescendant={
                  activeRowIndex >= 0
                    ? rowDomId(listboxId, activeRowIndex)
                    : undefined
                }
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full px-2 py-1.5 text-sm bg-transparent outline-none placeholder:text-text-disabled focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              />
            </div>
            <VirtualListbox
              rows={rows}
              listboxId={listboxId}
              listRef={listRef}
              activeRowIndex={activeRowIndex}
              maxHeight={maxListHeight}
              isSelected={(opt) => selectedSet.has(opt.value)}
              onCommitRow={commitRow}
              multiselectable
              renderLeading={(_opt, selected) => (
                <span
                  className={cn(
                    "flex items-center justify-center w-4 h-4 rounded border shrink-0",
                    selected ? "bg-primary border-primary" : "border-border",
                  )}
                >
                  {selected && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </span>
              )}
            />
            {selectedOptions.length > 0 && (
              <div className="border-t border-border p-1.5 flex items-center justify-between">
                <span className="text-xs text-text-secondary px-1.5">
                  {selectedOptions.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-danger px-1.5 py-0.5 rounded hover:bg-danger-surface"
                >
                  Clear all
                </button>
              </div>
            )}
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
