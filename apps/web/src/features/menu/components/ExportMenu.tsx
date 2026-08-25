import { useState } from "react";
import { Download } from "lucide-react";
import { Popover } from "@pos/ui";
import { useExportMenu } from "../hooks/useExportMenu";
import type {
  MenuExportEntity,
  MenuExportFormat,
} from "../services/menu-export.service";

const ENTITIES: { value: MenuExportEntity; label: string }[] = [
  { value: "items", label: "Items" },
  { value: "categories", label: "Categories" },
  { value: "recipes", label: "Recipes" },
  { value: "modifiers", label: "Modifiers" },
];

// Design-system Phase 13, Sprint AD-11: a 5th hand-rolled `fixed
// inset-0` overlay, found only now, not by the Phase 0 audit — this
// file didn't exist yet when that audit ran (same "written after the
// audit, don't assume it's already fine just because it's recent" risk
// the audit itself flagged for `ImportWizard.tsx`, and exactly what
// this cleanup phase's "confirm zero app has a local reimplementation"
// mandate exists to catch).
//
// Migrated onto `Popover` (Phase 5), not `DropdownMenu` — a
// considered choice, not the default overlay reach: `DropdownMenu`'s
// `items` prop is a flat list of single-action `MenuEntry` rows
// (label/onSelect/icon), but this menu's content is a 4×2 grid (one
// row per entity, two format buttons — CSV/XLSX — per row), not a
// list of single actions. Forcing it into `DropdownMenu` would mean
// either flattening to 8 separate rows (losing the entity/format
// grouping) or reaching past `DropdownMenu`'s public API for custom
// per-item content it doesn't expose — same "genuine shape mismatch,
// don't force it" reasoning `SplitButton`'s dropdown and
// `BottomNav`'s FAB slot have each carried. `Popover`'s `children` is
// arbitrary content, exactly this menu's actual shape; Radix handles
// the click-outside dismiss, portal, and positioning that the
// original hand-rolled with its own `fixed inset-0` backdrop `<div>`
// and manual `open` state plumbing.
export function ExportMenu() {
  const [open, setOpen] = useState(false);
  const { download, downloadingKey } = useExportMenu();

  async function handleDownload(
    entity: MenuExportEntity,
    format: MenuExportFormat,
  ) {
    await download(entity, format);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      trigger={
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      }
    >
      {/* `Popover`'s own content wrapper already supplies `p-4` +
          `menuContentClasses` (surface/border/shadow/radius) — the
          original's own `w-64 bg-white border-gray-200 rounded-md
          shadow-lg p-2` is dropped in favor of the primitive's
          styling rather than layered on top of it, same as every
          other overlay migration in this project. `w-64` specifically
          has no equivalent prop on `Popover` and is reproduced via
          `className` below since 4 entity rows at the primitive's
          default content width would wrap the format buttons
          awkwardly. */}
      <div className="w-64 -m-4 p-2">
        {ENTITIES.map((e) => (
          <div
            key={e.value}
            className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-surface-secondary"
          >
            <span className="text-sm text-text-primary">{e.label}</span>
            <div className="flex gap-1">
              {(["csv", "xlsx"] as MenuExportFormat[]).map((format) => {
                const key = `${e.value}-${format}`;
                return (
                  <button
                    key={format}
                    onClick={() => handleDownload(e.value, format)}
                    disabled={downloadingKey === key}
                    className="text-xs font-medium text-primary hover:opacity-80 disabled:opacity-40 px-1.5 py-0.5 rounded uppercase"
                  >
                    {downloadingKey === key ? "…" : format}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Popover>
  );
}
