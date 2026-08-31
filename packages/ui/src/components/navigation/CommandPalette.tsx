import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { cn } from "../../utils/cn";
import { overlayScrimClasses } from "../overlay/shared";

export interface CommandItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }> | undefined;

  group?: string | undefined;

  shortcut?: string | undefined;

  keywords?: string | undefined;
  onSelect: () => void;
  disabled?: boolean | undefined;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string | undefined;
  emptyMessage?: string | undefined;
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Type a command or search…",
  emptyMessage = "No matching commands",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const results = useMemo(
    () => filterAndRankCommands(items, query),
    [items, query],
  );
  const activeCommand = results[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function commit(index: number) {
    const command = results[index];
    if (!command || command.disabled) return;
    onOpenChange(false);
    command.onSelect();
  }

  function move(dir: 1 | -1) {
    if (results.length === 0) return;
    setActiveIndex((prev) => (prev + dir + results.length) % results.length);
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlayScrimClasses} />
        <RadixDialog.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className={cn(
            "fixed left-1/2 top-24 z-50 w-full max-w-lg -translate-x-1/2",
            "bg-surface border border-border shadow-dropdown rounded-lg overflow-hidden",
          )}
        >
          <RadixDialog.Title className="sr-only">
            Command palette
          </RadixDialog.Title>
          <RadixDialog.Description className="sr-only">
            Search for a command or page and press Enter to run it.
          </RadixDialog.Description>

          <div className="flex items-center gap-2.5 px-4 border-b border-border">
            <Search className="w-4 h-4 text-text-secondary shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              role="combobox"
              aria-expanded={open}
              aria-controls="command-palette-listbox"
              aria-activedescendant={
                activeCommand ? `command-item-${activeCommand.id}` : undefined
              }
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  move(1);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  move(-1);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  commit(activeIndex);
                }
              }}
              className="flex-1 min-w-0 py-3.5 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            />
          </div>

          {

                                                                          }
          <div aria-live="polite" className="sr-only">
            {query.trim() &&
              (results.length === 0
                ? emptyMessage
                : `${results.length} result${results.length === 1 ? "" : "s"}`)}
          </div>

          <ul
            id="command-palette-listbox"
            role="listbox"
            className="max-h-80 overflow-y-auto py-1.5"
          >
            {results.length === 0 ? (
              <li className="px-4 py-6 text-sm text-center text-text-secondary">
                {emptyMessage}
              </li>
            ) : (
              renderRows(results, query, activeIndex, commit)
            )}
          </ul>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

function renderRows(
  results: CommandItem[],
  query: string,
  activeIndex: number,
  commit: (index: number) => void,
) {
  if (query.trim()) {
    return results.map((command, index) => (
      <CommandRow
        key={command.id}
        command={command}
        active={index === activeIndex}
        onClick={() => commit(index)}
      />
    ));
  }

  const seenGroups = new Set<string | undefined>();
  const rows: ReactNode[] = [];
  results.forEach((command, index) => {
    if (!seenGroups.has(command.group)) {
      seenGroups.add(command.group);
      if (command.group) {
        rows.push(
          <li
            key={`__group_${command.group}`}
            role="presentation"
            className="px-4 pt-3 pb-1 text-xs font-semibold text-text-secondary uppercase tracking-wide"
          >
            {command.group}
          </li>,
        );
      }
    }
    rows.push(
      <CommandRow
        key={command.id}
        command={command}
        active={index === activeIndex}
        onClick={() => commit(index)}
      />,
    );
  });
  return rows;
}

function CommandRow({
  command,
  active,
  onClick,
}: {
  command: CommandItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = command.icon;
  return (

    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <li
      id={`command-item-${command.id}`}
      role="option"
      aria-selected={active}
      aria-disabled={command.disabled || undefined}
      onClick={() => !command.disabled && onClick()}
      className={cn(
        "flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer select-none",
        command.disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        active && !command.disabled && "bg-surface-secondary",
      )}
    >
      {Icon && <Icon className="w-4 h-4 text-text-secondary shrink-0" />}
      <span className="flex-1 min-w-0 truncate text-text-primary">
        {command.label}
      </span>
      {command.shortcut && (
        <span className="text-xs text-text-secondary tracking-widest shrink-0">
          {command.shortcut}
        </span>
      )}
    </li>
  );
}

function fuzzyScore(query: string, target: string): number | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  let score = 0;
  let run = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      run++;
      score += run;
    } else {
      run = 0;
    }
  }
  return qi === q.length ? score : null;
}

export function useCommandPaletteHotkey() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}

function filterAndRankCommands(
  items: CommandItem[],
  query: string,
): CommandItem[] {
  const trimmed = query.trim();
  if (!trimmed) return items;
  return items
    .map((item) => ({
      item,
      score: fuzzyScore(trimmed, `${item.label} ${item.keywords ?? ""}`),
    }))
    .filter(
      (entry): entry is { item: CommandItem; score: number } =>
        entry.score !== null,
    )
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
