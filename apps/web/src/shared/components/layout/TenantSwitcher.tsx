import { useEffect, useRef, useState } from "react";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { Button, Dialog, Input, toast } from "@pos/ui";
import type { AvailableMembership } from "@pos/types";
import { useRouter } from "@tanstack/react-router";
import { authService } from "../../../features/auth/services/auth.service";
import { useAuthStore } from "../../../store/auth";
import { cn } from "../../utils";
import { extractApiError } from "../../lib/api-client";

export function TenantSwitcher() {
  const router = useRouter();
  const { user, membershipId, memberships, setContext } = useAuthStore();
  const [items, setItems] = useState<AvailableMembership[]>(memberships);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Franchise switching is a context operation, not a permission-gated action.
  // Access is determined by the franchises returned by the authenticated server session.
  const canRead = items.length > 0;
  // Creating a new franchise is an ownership operation: only the global OWNER can do it.
  const canCreate =
    items.some((membership) => membership.isGlobalOwner) ||
    user?.roles?.some((role) => role.name === "OWNER");
  const current = items.find(
    (membership) => membership.membershipId === membershipId,
  );

  useEffect(() => {
    setItems(memberships);
  }, [memberships]);

  useEffect(() => {
    if (!user || !canRead) return;
    authService
      .memberships()
      .then((next) => {
        setItems(next);
        const currentStillExists = next.some(
          (item) => item.membershipId === membershipId,
        );
        if (!currentStillExists) {
          setContext({
            membershipId: null,
            franchiseId: null,
            memberships: next,
            branchId: null,
          });
        } else {
          setContext({
            membershipId: membershipId ?? null,
            franchiseId:
              next.find((item) => item.membershipId === membershipId)?.tenant
                .id ?? null,
            memberships: next,
          });
        }
      })
      .catch(() => {
        // Keep the in-memory franchise access list if the refresh fails.
      });
  }, [user, canRead, membershipId, setContext]);

  async function activate(membership: AvailableMembership) {
    if (membership.membershipId === membershipId) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    try {
      const branchId =
        membership.isGlobalOwner ||
        membership.roles.some((role) => role.scope === "TENANT")
          ? null
          : (membership.branches[0]?.id ?? null);
      setContext({
        membershipId: membership.membershipId,
        franchiseId: membership.tenant.id,
        memberships: items,
        branchId,
      });
      setOpen(false);
      router.navigate({ to: "/dashboard" });
    } finally {
      setSwitching(false);
    }
  }

  async function createBusiness() {
    const name = businessName.trim();
    if (!name) return;

    setCreating(true);
    try {
      const organizations = await authService.organizations();
      const organization = organizations.find((item) => item.isActive);
      if (!organization) throw new Error("Create or select an active organization first");
      const created = await authService.createTenant(name, organization.id);
      const next = await authService.memberships();
      setItems(next);
      setContext({
        membershipId: created.membershipId,
        organizationId: organization.id,
        franchiseId: created.tenant.id,
        memberships: next,
        branchId: null,
      });

      toast({
        title: "Franchise created. Add a branch to get started.",
        tone: "success",
      });
      setBusinessName("");
      setCreateOpen(false);
      setOpen(false);
      router.navigate({ to: "/branches" });
    } catch (err: unknown) {
      toast({ title: extractApiError(err), tone: "danger" });
    } finally {
      setCreating(false);
    }
  }

  if (!items.length && !canCreate) return null;

  return (
    <>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          disabled={switching}
          className="flex items-center gap-2 min-w-0 max-w-[260px] rounded-lg border border-border bg-surface px-3 py-2 text-left hover:bg-surface-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
        >
          <span className="w-8 h-8 shrink-0 rounded-md bg-primary-surface flex items-center justify-center">
            <Building2 aria-hidden="true" className="w-4 h-4 text-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase tracking-wide font-semibold text-text-secondary">
              Franchise
            </span>
            <span className="block text-sm font-semibold text-text-primary truncate">
              {current?.tenant.name ?? "Select franchise"}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "w-4 h-4 shrink-0 text-text-secondary transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-label="Close franchise menu"
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setOpen(false)}
            />
            <div
              role="menu"
              className="absolute left-0 top-full mt-2 z-40 w-[320px] rounded-xl border border-border bg-surface shadow-elevated p-2"
            >
              <div className="px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Your franchises
                </p>
                <p className="text-xs text-text-disabled mt-0.5">
                  Switch businesses without signing out.
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {items.map((membership) => (
                  <button
                    key={membership.membershipId}
                    type="button"
                    role="menuitem"
                    onClick={() => activate(membership)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="w-8 h-8 shrink-0 rounded-md bg-surface-secondary flex items-center justify-center">
                      <Building2
                        aria-hidden="true"
                        className="w-4 h-4 text-text-secondary"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-text-primary truncate">
                        {membership.tenant.name}
                      </span>
                      <span className="block text-xs text-text-secondary truncate">
                        {membership.isGlobalOwner
                          ? "OWNER"
                          : membership.roles
                              .map((role) => role.name)
                              .join(", ")}
                      </span>
                    </span>
                    {membership.membershipId === membershipId && (
                      <Check
                        aria-hidden="true"
                        className="w-4 h-4 text-primary shrink-0"
                      />
                    )}
                  </button>
                ))}
              </div>

              {canCreate && (
                <div className="border-t border-border mt-2 pt-2">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      setCreateOpen(true);
                    }}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-primary hover:bg-primary-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="w-8 h-8 shrink-0 rounded-md border border-primary/30 flex items-center justify-center">
                      <Plus aria-hidden="true" className="w-4 h-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        Create / add new franchise
                      </span>
                      <span className="block text-xs text-text-secondary">
                        Add another franchise to your account
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title="Create a new franchise"
        description="Create another franchise or business under your owner account."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={createBusiness}
              loading={creating}
              disabled={!businessName.trim()}
            >
              Create franchise
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-primary-surface border border-border p-4">
            <p className="text-sm font-semibold text-text-primary">
              Add another business
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Each franchise gets its own tenant, branches, menu, staff, orders,
              and settings.
            </p>
          </div>
          <Input
            label="Franchise / business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Downtown Restaurant"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: this input is the sole field in a just-opened create-franchise dialog
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && businessName.trim() && !creating)
                createBusiness();
            }}
          />
        </div>
      </Dialog>
    </>
  );
}
