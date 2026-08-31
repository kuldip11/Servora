import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, X } from "lucide-react";
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
  filterOptions,
  rowDomId,
  useActiveRow,
  useScrollActiveIntoView,
  VirtualListbox,
  popoverContentClasses,
} from "./shared";

export interface ComboboxProps {
  options: SelectOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  label?: string | undefined;
  placeholder?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  className?: string | undefined;
  maxListHeight?: number | undefined;

  emptyMessage?: string | undefined;
}

export function Combobox({
  options,
  value,
  onChange,
  label,
  placeholder = "Search…",
  hint,
  error,
  required,
  disabled,
  id,
  className,
  maxListHeight = 320,
  emptyMessage = "No results",
}: ComboboxProps) {
  const selectedOption = options.find((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedOption?.label ?? "");
  const { fieldId, hintId, errorId } = useFieldIds(id);
  const listboxId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) setQuery(selectedOption?.label ?? "");
  }, [value, open, selectedOption?.label]);

  const isSelectedLabel = selectedOption?.label === query;
  const filtered = filterOptions(
    options,
    open && !isSelectedLabel ? query : "",
  );
  const rows = buildRows(filtered);

  const commitRow = (rowIndex: number) => {
    const row = rows[rowIndex];
    if (row?.kind !== "option" || row.option.disabled) return;
    onChange(row.option.value);
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

  }, [query, open]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery(selectedOption?.label ?? "");
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
      setQuery(selectedOption?.label ?? "");
    }, 120);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={fieldId} required={required}>
        {label}
      </FieldLabel>
      <Popover.Root open={open}>
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
            {value && !disabled && (
              <button
                type="button"
                aria-label="Clear selection"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange("");
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-8 p-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown className="pointer-events-none absolute right-3 w-4 h-4 text-text-secondary" />
          </div>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
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
              isSelected={(opt) => opt.value === value}
              onCommitRow={commitRow}
              emptyMessage={emptyMessage}
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
