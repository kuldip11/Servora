import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown } from "lucide-react";
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
  rowDomId,
  useActiveRow,
  useScrollActiveIntoView,
  useTypeaheadBuffer,
  VirtualListbox,
  popoverContentClasses,
  triggerBaseClasses,
} from "./shared";

export interface SelectMenuProps {
  options: SelectOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  label?: string | undefined;
  /** Accessible name used when the visible field label is omitted. */
  "aria-label"?: string | undefined;
  placeholder?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  className?: string | undefined;
  /** Max height of the open listbox before it scrolls. @default 320 */
  maxListHeight?: number | undefined;
}

/**
 * Single-select dropdown — the plan's canonical "Select" for Phase 4
 * (docs/design-system/00-PLAN.md), built on `@radix-ui/react-popover`
 * (see `selection/shared.tsx`'s doc comment for why Popover instead of
 * Radix's own `Select`). Virtualized: 10,000+ options scroll smoothly,
 * per this phase's exit criteria. Supports grouped options (`group` on
 * `SelectOption`), icons/avatars per option (`icon`/`media`), and
 * type-to-jump like a native `<select>`.
 *
 * **Deliberately not named `Select`, and not exported under that
 * name.** `@pos/ui` already exports a `Select`
 * (`components/Select.tsx`, wraps a native `<select>`) that 12 files
 * across `apps/web` depend on today via `options`/`value`/
 * `onChange={(e) => e.target.value}` — a native-event-shaped API this
 * component's `onChange(value: string)` isn't compatible with.
 * `Button`/`Input` could be "upgraded in place" in Phase 3 because
 * their DOM-event API didn't change; a Popover-backed listbox's
 * interaction model is a genuine break — exactly what
 * `docs/design-system/phase-0-ui-audit.md`'s migration map flags with
 * "every call site should be re-tested... not just the visuals." That
 * re-test is real work across 12 files, best done as its own pass
 * (Phase 10-12's app migrations), not folded silently into this
 * component-library phase — so the old `Select` keeps its name and
 * behavior untouched, and this ships as `SelectMenu` until that
 * migration is scheduled explicitly. See `docs/design-system/README.md`'s
 * Phase 4 section for the full decision record.
 */
export function SelectMenu({
  options,
  value,
  onChange,
  label,
  "aria-label": ariaLabel,
  placeholder = "Select…",
  hint,
  error,
  required,
  disabled,
  id,
  className,
  maxListHeight = 320,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const { fieldId, hintId, errorId } = useFieldIds(id);
  const listboxId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const rows = buildRows(options);
  const selectedOption = options.find((o) => o.value === value);

  const commitRow = (rowIndex: number) => {
    const row = rows[rowIndex];
    if (row?.kind !== "option" || row.option.disabled) return;
    onChange(row.option.value);
    setOpen(false);
  };

  const { activeRowIndex, setActiveRowIndex, onKeyDown, typeahead } =
    useActiveRow(rows, commitRow);
  const { onKeyDown: onTypeaheadKeyDown } = useTypeaheadBuffer(typeahead);
  useScrollActiveIntoView(listRef, activeRowIndex, open);

  useEffect(() => {
    if (!open) return;
    const selectedRow = rows.findIndex(
      (r) => r.kind === "option" && r.option.value === value,
    );
    if (selectedRow >= 0) setActiveRowIndex(selectedRow);
    // re-sync the highlighted row to the current value every time the popover opens
  }, [open]);

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (
      !open &&
      (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")
    ) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    onKeyDown(e);
    onTypeaheadKeyDown(e);
  };

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
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={
              open && activeRowIndex >= 0
                ? rowDomId(listboxId, activeRowIndex)
                : undefined
            }
            aria-label={label ? undefined : ariaLabel}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy(hintId, errorId, hint, error)}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              triggerBaseClasses,
              error
                ? "border-danger focus:ring-danger"
                : "border-border focus:ring-primary",
              className,
            )}
          >
            <span
              className={cn(
                "truncate",
                !selectedOption && "text-text-secondary",
              )}
            >
              {selectedOption?.label ?? placeholder}
            </span>
            <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className={cn(
              popoverContentClasses,
              "w-[var(--radix-popover-trigger-width)]",
            )}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <VirtualListbox
              rows={rows}
              listboxId={listboxId}
              listRef={listRef}
              activeRowIndex={activeRowIndex}
              maxHeight={maxListHeight}
              isSelected={(opt) => opt.value === value}
              onCommitRow={commitRow}
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
