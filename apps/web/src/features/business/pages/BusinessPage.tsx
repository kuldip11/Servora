import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Plus,
  Store,
} from "lucide-react";
import { Button, Card, Input, Modal, Page, PageHeader, Spinner } from "@pos/ui";
import type { OrganizationSummary, Tenant, Branch } from "@pos/types";
import {
  businessBranchFormSchema,
  franchiseBusinessFormSchema,
  organizationBusinessFormSchema,
  type BusinessBranchFormValues,
  type FranchiseBusinessFormValues,
  type OrganizationBusinessFormValues,
} from "@pos/validation";
import { businessService } from "@/features/business/services/business.service";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/auth";
import { activateMembershipContext } from "@/shared/auth/active-context";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import { usePermissions } from "@/shared/auth/permissions";

const businessKeys = { all: ["business"] as const };
const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary";
const checkboxClass = "h-4 w-4 rounded border-border text-primary";

const organizationDefaults: OrganizationBusinessFormValues = {
  name: "",
  businessType: "INDEPENDENT_RESTAURANT",
  country: "IN",
  timezone: "Asia/Kolkata",
  currency: "INR",
  primaryContactName: "",
  businessEmail: "",
  businessPhone: "",
  addressLine1: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  legalName: "",
  addressLine2: "",
  website: "",
  taxRegistrationNumber: "",
  gstin: "",
  pan: "",
  companyRegistrationNumber: "",
  logoUrl: "",
};
const franchiseDefaults: FranchiseBusinessFormValues = {
  name: "",
  cuisineTypes: [],
  businessModel: "RESTAURANT",
  defaultTaxMode: "EXCLUSIVE",
  defaultCurrency: "INR",
  defaultTimezone: "Asia/Kolkata",
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: true,
  customerQrEnabled: true,
  tableManagementEnabled: true,
  kdsEnabled: true,
  waiterServiceEnabled: true,
  displayName: "",
  description: "",
  supportEmail: "",
  supportPhone: "",
  website: "",
  logoUrl: "",
  primaryBrandImageUrl: "",
  defaultTaxRate: null,
  serviceChargePercent: null,
  serviceChargeTaxable: false,
  roundingPolicy: "NONE",
  courseSequencingEnabled: false,
};
const branchDefaults: BusinessBranchFormValues = {
  name: "",
  code: "",
  status: "ACTIVE",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "IN",
  timezone: "Asia/Kolkata",
  phone: "",
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: true,
  customerQrEnabled: true,
  tablesEnabled: true,
  kdsEnabled: true,
  waiterAppEnabled: true,
  managerName: "",
  email: "",
  openingTime: "",
  closingTime: "",
  weeklyOperatingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
  taxOverride: null,
  serviceChargeOverride: null,
  invoicePrefix: "",
  receiptFooter: "",
  inventoryTrackingEnabled: true,
  negativeStockPolicy: "BLOCK",
};

type BusinessData = {
  organizations: OrganizationSummary[];
  franchises: Tenant[];
};

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-danger">{message}</p> : null;

const CapabilityGrid = ({
  values,
  setValue,
  prefix = "",
}: {
  values: Record<string, boolean>;
  setValue: (key: string, value: boolean) => void;
  prefix?: string;
}) => (
  <div className="grid gap-2 sm:grid-cols-2">
    {Object.entries(values).map(([key, value]) => (
      <label
        key={key}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
      >
        <input
          className={checkboxClass}
          type="checkbox"
          checked={value}
          onChange={(event) => setValue(key, event.target.checked)}
        />
        {prefix}
        {key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (letter) => letter.toUpperCase())}
      </label>
    ))}
  </div>
);

export const BusinessPage = () => {
  const queryClient = useQueryClient();
  const { has } = usePermissions();
  const { memberships, membershipId } = useAuthStore();
  const [organizationModal, setOrganizationModal] = useState(false);
  const [franchiseModal, setFranchiseModal] = useState(false);
  const [branchModal, setBranchModal] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [editingOrganization, setEditingOrganization] =
    useState<OrganizationSummary | null>(null);
  const [editingFranchise, setEditingFranchise] = useState<Tenant | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const query = useQuery({
    queryKey: businessKeys.all,
    queryFn: async (): Promise<BusinessData> => {
      const organizations = await businessService.organizations();
      const franchiseGroups = await Promise.all(
        organizations.map((organization) =>
          businessService.franchises(organization.id).catch(() => []),
        ),
      );
      return { organizations, franchises: franchiseGroups.flat() };
    },
  });

  const activeMembership = memberships.find(
    (item) => item.membershipId === membershipId,
  );
  const branches = memberships.flatMap((membership) =>
    membership.branches.map((branch) => ({
      ...branch,
      tenantId: membership.tenant.id,
    })),
  );
  const data = query.data ?? { organizations: [], franchises: [] };
  const onboardingStep = !data.organizations.length
    ? 1
    : !data.franchises.length
      ? 2
      : !branches.length
        ? 3
        : 4;
  const onboarding = onboardingStep < 4;

  useEffect(() => {
    if (!selectedOrganizationId && data.organizations[0])
      setSelectedOrganizationId(data.organizations[0].id);
  }, [data.organizations, selectedOrganizationId]);

  const refresh = async () => {
    const nextMemberships = await authService.memberships();
    useAuthStore.getState().setContext({
      membershipId: useAuthStore.getState().membershipId,
      franchiseId: useAuthStore.getState().franchiseId,
      branchId: useAuthStore.getState().branchId,
      memberships: nextMemberships,
    });
    await queryClient.invalidateQueries({ queryKey: businessKeys.all });
  };

  if (query.isLoading)
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );

  return (
    <Page>
      <PageHeader
        title={onboarding ? "Set up your business" : "Business"}
        description={
          onboarding
            ? "Complete the minimum Organization → Franchise → Branch hierarchy to start operating."
            : "Manage your Organization → Franchise → Branch hierarchy and operational status."
        }
        actions={
          !onboarding && has("organization:manage") ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingOrganization(null);
                  setOrganizationModal(true);
                }}
              >
                <Plus className="h-4 w-4" /> Organization
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingFranchise(null);
                  setFranchiseModal(true);
                }}
              >
                <Plus className="h-4 w-4" /> Franchise
              </Button>
              {activeMembership && has("branch:create") && (
                <Button
                  onClick={() => {
                    setEditingBranch(null);
                    setBranchModal(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Branch
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {onboarding && (
        <Card className="mb-6">
          <div className="grid gap-3 md:grid-cols-4">
            {["Organization", "Franchise", "Branch", "Ready"].map(
              (label, index) => {
                const step = index + 1;
                const complete = step < onboardingStep;
                const current = step === onboardingStep;
                return (
                  <div
                    key={label}
                    className={`rounded-xl border p-4 ${current ? "border-primary bg-primary-surface" : "border-border"}`}
                  >
                    <div className="flex items-center gap-2">
                      {complete ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${current ? "bg-primary text-white" : "bg-surface-secondary text-text-secondary"}`}
                        >
                          {step}
                        </span>
                      )}
                      <span className="font-semibold">{label}</span>
                    </div>
                    <p className="mt-2 text-xs text-text-secondary">
                      {complete
                        ? "Complete"
                        : current
                          ? "Required next"
                          : "Waiting"}
                    </p>
                  </div>
                );
              },
            )}
          </div>
          <div className="mt-6">
            {onboardingStep === 1 && (
              <Button onClick={() => setOrganizationModal(true)}>
                Create Organization <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {onboardingStep === 2 && (
              <Button onClick={() => setFranchiseModal(true)}>
                Create Franchise <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {onboardingStep === 3 && (
              <Button onClick={() => setBranchModal(true)}>
                Create Branch <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-5">
        {data.organizations.map((organization) => {
          const franchises = data.franchises.filter(
            (franchise) => franchise.organizationId === organization.id,
          );
          return (
            <Card key={organization.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="rounded-lg bg-primary-surface p-2 text-primary">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {organization.name}
                    </h2>
                    <p className="text-sm text-text-secondary">
                      {organization.businessType?.replace(/_/g, " ") ||
                        "Business profile in progress"}
                    </p>
                  </div>
                </div>
                {has("organization:manage") && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingOrganization(organization);
                      setOrganizationModal(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
              <div className="mt-5 space-y-3 border-l-2 border-divider pl-5">
                {franchises.map((franchise) => {
                  const membership = memberships.find(
                    (item) => item.tenant.id === franchise.id,
                  );
                  return (
                    <div
                      key={franchise.id}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <Store className="mt-0.5 h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-semibold">
                              {franchise.displayName || franchise.name}
                            </h3>
                            <p className="text-xs text-text-secondary">
                              {franchise.businessModel?.replace(/_/g, " ") ||
                                "Franchise"}
                            </p>
                          </div>
                        </div>
                        {franchise.id === activeMembership?.tenant.id &&
                          has("tenant:update") && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingFranchise(franchise);
                                setSelectedOrganizationId(organization.id);
                                setFranchiseModal(true);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {(membership?.branches ?? []).map((branch) => (
                          <div
                            key={branch.id}
                            className="flex items-center justify-between rounded-lg bg-surface-secondary p-3"
                          >
                            <span className="flex items-center gap-2 text-sm">
                              <GitBranch className="h-4 w-4 text-text-secondary" />
                              {branch.name}
                            </span>
                            {franchise.id === activeMembership?.tenant.id &&
                              has("branch:update") && (
                                <button
                                  className="text-xs font-semibold text-primary"
                                  onClick={() => {
                                    setEditingBranch(branch as Branch);
                                    setBranchModal(true);
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {!franchises.length && (
                  <p className="text-sm text-text-secondary">
                    No franchises yet.
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <OrganizationModal
        open={organizationModal}
        organization={editingOrganization}
        onClose={() => {
          setOrganizationModal(false);
          setEditingOrganization(null);
        }}
        onSaved={refresh}
      />
      <FranchiseModal
        open={franchiseModal}
        franchise={editingFranchise}
        organizations={data.organizations}
        organizationId={selectedOrganizationId}
        onOrganizationChange={setSelectedOrganizationId}
        onClose={() => {
          setFranchiseModal(false);
          setEditingFranchise(null);
        }}
        onSaved={refresh}
      />
      <BranchModal
        open={branchModal}
        branch={editingBranch}
        currency={activeMembership?.tenant.defaultCurrency || "INR"}
        onClose={() => {
          setBranchModal(false);
          setEditingBranch(null);
        }}
        onSaved={refresh}
      />
    </Page>
  );
};

const OrganizationModal = ({
  open,
  organization,
  onClose,
  onSaved,
}: {
  open: boolean;
  organization: OrganizationSummary | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) => {
  const form = useForm<OrganizationBusinessFormValues>({
    resolver: zodResolver(organizationBusinessFormSchema),
    defaultValues: organizationDefaults,
  });
  useEffect(() => {
    if (open)
      form.reset(
        organization
          ? ({
              ...organizationDefaults,
              ...organization,
            } as OrganizationBusinessFormValues)
          : organizationDefaults,
      );
  }, [open, organization]);
  const mutation = useMutation({
    mutationFn: async (
      values: OrganizationBusinessFormValues,
    ): Promise<void> => {
      if (organization)
        await businessService.updateOrganization(organization.id, values);
      else await businessService.createOrganization(values);
    },
    onSuccess: async () => {
      notifySuccess(
        organization ? "Organization updated" : "Organization created",
      );
      await onSaved();
      onClose();
    },
    onError: (error) => notifyError(error, "Could not save organization"),
  });
  const archiveMutation = useMutation({
    mutationFn: () => businessService.archiveOrganization(organization!.id),
    onSuccess: async () => {
      notifySuccess("Organization archived");
      await onSaved();
      onClose();
    },
    onError: (error) => notifyError(error, "Could not archive organization"),
  });
  const e = form.formState.errors;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={organization ? "Edit Organization" : "Create Organization"}
    >
      <form
        className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Organization / Business name"
            error={e.name?.message}
            {...form.register("name")}
          />
          <label className="text-sm font-medium">
            Business type
            <select
              className={`mt-1 ${inputClass}`}
              {...form.register("businessType")}
            >
              {[
                "RESTAURANT_GROUP",
                "INDEPENDENT_RESTAURANT",
                "HOSPITALITY_GROUP",
                "CLOUD_KITCHEN_GROUP",
                "CAFE_GROUP",
                "QSR_GROUP",
                "FOOD_SERVICE_COMPANY",
                "OTHER",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <Input
            label="Primary contact name"
            error={e.primaryContactName?.message}
            {...form.register("primaryContactName")}
          />
          <Input
            label="Business email"
            type="email"
            error={e.businessEmail?.message}
            {...form.register("businessEmail")}
          />
          <Input
            label="Business phone"
            error={e.businessPhone?.message}
            {...form.register("businessPhone")}
          />
          <Input
            label="Website (optional)"
            error={e.website?.message}
            {...form.register("website")}
          />
          <Input
            label="Address line 1"
            error={e.addressLine1?.message}
            {...form.register("addressLine1")}
          />
          <Input
            label="Address line 2 (optional)"
            {...form.register("addressLine2")}
          />
          <Input
            label="City"
            error={e.city?.message}
            {...form.register("city")}
          />
          <Input
            label="State / Province"
            error={e.stateProvince?.message}
            {...form.register("stateProvince")}
          />
          <Input
            label="Postal code"
            error={e.postalCode?.message}
            {...form.register("postalCode")}
          />
          <Input
            label="Country code"
            error={e.country?.message}
            {...form.register("country")}
          />
          <Input
            label="Timezone"
            error={e.timezone?.message}
            {...form.register("timezone")}
          />
          <Input
            label="Currency"
            error={e.currency?.message}
            {...form.register("currency")}
          />
          <Input
            label="Legal name (optional)"
            {...form.register("legalName")}
          />
          <Input
            label="GSTIN (optional)"
            error={e.gstin?.message}
            {...form.register("gstin")}
          />
          <Input
            label="PAN (optional)"
            error={e.pan?.message}
            {...form.register("pan")}
          />
          <Input
            label="Company registration (optional)"
            {...form.register("companyRegistrationNumber")}
          />
          <Input
            label="Tax registration (optional)"
            {...form.register("taxRegistrationNumber")}
          />
          <Input
            label="Logo URL (optional)"
            error={e.logoUrl?.message}
            {...form.register("logoUrl")}
          />
        </div>
        <div className="flex justify-between gap-2">
          {organization ? (
            <Button
              type="button"
              variant="danger"
              loading={archiveMutation.isPending}
              onClick={() =>
                window.confirm("Archive this organization?") &&
                archiveMutation.mutate()
              }
            >
              Archive
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save Organization
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const FranchiseModal = ({
  open,
  franchise,
  organizations,
  organizationId,
  onOrganizationChange,
  onClose,
  onSaved,
}: {
  open: boolean;
  franchise: Tenant | null;
  organizations: OrganizationSummary[];
  organizationId: string;
  onOrganizationChange: (id: string) => void;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) => {
  const form = useForm<FranchiseBusinessFormValues>({
    resolver: zodResolver(franchiseBusinessFormSchema),
    defaultValues: franchiseDefaults,
  });
  useEffect(() => {
    if (open)
      form.reset(
        franchise
          ? ({
              ...franchiseDefaults,
              ...franchise,
              cuisineTypes: franchise.cuisineTypes ?? [],
            } as FranchiseBusinessFormValues)
          : franchiseDefaults,
      );
  }, [open, franchise]);
  const mutation = useMutation({
    mutationFn: async (values: FranchiseBusinessFormValues) => {
      if (franchise)
        return businessService.updateFranchise(franchise.id, values);
      const created = await businessService.createFranchise(
        organizationId,
        values,
      );
      const memberships = await authService.memberships();
      const membership = memberships.find(
        (item) => item.membershipId === created.membershipId,
      );
      if (membership)
        await activateMembershipContext(
          membership,
          memberships,
          organizationId,
        );
      return created.tenant;
    },
    onSuccess: async () => {
      notifySuccess(franchise ? "Franchise updated" : "Franchise created");
      await onSaved();
      onClose();
    },
    onError: (error) => notifyError(error, "Could not save franchise"),
  });
  const archiveMutation = useMutation({
    mutationFn: () => businessService.archiveFranchise(franchise!.id),
    onSuccess: async () => {
      notifySuccess("Franchise archived");
      await onSaved();
      onClose();
    },
    onError: (error) => notifyError(error, "Could not archive franchise"),
  });
  const values = form.watch();
  const e = form.formState.errors;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={franchise ? "Edit Franchise" : "Create Franchise"}
    >
      <form
        className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        {!franchise && (
          <label className="block text-sm font-medium">
            Organization
            <select
              className={`mt-1 ${inputClass}`}
              value={organizationId}
              onChange={(event) => onOrganizationChange(event.target.value)}
            >
              {organizations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Franchise / Brand name"
            error={e.name?.message}
            {...form.register("name")}
          />
          <Input
            label="Display name (optional)"
            {...form.register("displayName")}
          />
          <Input
            label="Cuisine types"
            placeholder="Indian, Cafe"
            error={e.cuisineTypes?.message}
            value={values.cuisineTypes.join(", ")}
            onChange={(event) =>
              form.setValue(
                "cuisineTypes",
                event.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
                { shouldValidate: true },
              )
            }
          />
          <label className="text-sm font-medium">
            Business model
            <select
              className={`mt-1 ${inputClass}`}
              {...form.register("businessModel")}
            >
              {[
                "RESTAURANT",
                "CAFE",
                "CLOUD_KITCHEN",
                "QSR",
                "FINE_DINING",
                "FOOD_COURT",
                "BAKERY",
                "BAR_PUB",
                "OTHER",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <Input
            label="Default currency"
            error={e.defaultCurrency?.message}
            {...form.register("defaultCurrency")}
          />
          <Input
            label="Default timezone"
            error={e.defaultTimezone?.message}
            {...form.register("defaultTimezone")}
          />
          <label className="text-sm font-medium">
            Default tax mode
            <select
              className={`mt-1 ${inputClass}`}
              {...form.register("defaultTaxMode")}
            >
              <option value="EXCLUSIVE">Exclusive</option>
              <option value="INCLUSIVE">Inclusive</option>
            </select>
          </label>
          <Input
            label="Default tax rate (optional)"
            type="number"
            step="0.01"
            {...form.register("defaultTaxRate", { valueAsNumber: true })}
          />
          <Input
            label="Service charge % (optional)"
            type="number"
            step="0.01"
            {...form.register("serviceChargePercent", { valueAsNumber: true })}
          />
          <label className="text-sm font-medium">
            Rounding policy
            <select
              className={`mt-1 ${inputClass}`}
              {...form.register("roundingPolicy")}
            >
              <option value="NONE">None</option>
              <option value="NEAREST_1">Nearest 1</option>
              <option value="NEAREST_5">Nearest 5</option>
              <option value="NEAREST_10">Nearest 10</option>
            </select>
          </label>
          <Input
            label="Support email (optional)"
            {...form.register("supportEmail")}
          />
          <Input
            label="Support phone (optional)"
            {...form.register("supportPhone")}
          />
          <Input label="Website (optional)" {...form.register("website")} />
          <Input label="Logo URL (optional)" {...form.register("logoUrl")} />
          <Input
            label="Brand image URL (optional)"
            {...form.register("primaryBrandImageUrl")}
          />
        </div>
        <label className="block text-sm font-medium">
          Description
          <textarea
            className={`mt-1 ${inputClass}`}
            rows={3}
            {...form.register("description")}
          />
        </label>
        <CapabilityGrid
          values={{
            dineInEnabled: values.dineInEnabled,
            takeawayEnabled: values.takeawayEnabled,
            deliveryEnabled: values.deliveryEnabled,
            customerQrEnabled: values.customerQrEnabled,
            tableManagementEnabled: values.tableManagementEnabled,
            kdsEnabled: values.kdsEnabled,
            waiterServiceEnabled: values.waiterServiceEnabled,
            serviceChargeTaxable: values.serviceChargeTaxable ?? false,
            courseSequencingEnabled: values.courseSequencingEnabled ?? false,
          }}
          setValue={(key, value) =>
            form.setValue(
              key as keyof FranchiseBusinessFormValues,
              value as never,
              { shouldValidate: true },
            )
          }
        />
        <div className="flex justify-between gap-2">
          {franchise ? (
            <Button
              type="button"
              variant="danger"
              loading={archiveMutation.isPending}
              onClick={() =>
                window.confirm("Archive this franchise?") &&
                archiveMutation.mutate()
              }
            >
              Archive
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={!organizationId}
            >
              Save Franchise
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const BranchModal = ({
  open,
  branch,
  currency,
  onClose,
  onSaved,
}: {
  open: boolean;
  branch: Branch | null;
  currency: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) => {
  const form = useForm<BusinessBranchFormValues>({
    resolver: zodResolver(businessBranchFormSchema),
    defaultValues: branchDefaults,
  });
  useEffect(() => {
    if (open)
      form.reset(
        branch
          ? ({
              ...branchDefaults,
              ...branch,
              status: branch.isActive ? "ACTIVE" : "INACTIVE",
              addressLine1: branch.addressLine1 || branch.address || "",
            } as BusinessBranchFormValues)
          : branchDefaults,
      );
  }, [open, branch]);
  const mutation = useMutation({
    mutationFn: (values: BusinessBranchFormValues) =>
      branch
        ? businessService.updateBranch(branch.id, { ...values, currency })
        : businessService.createBranch({ ...values, currency }),
    onSuccess: async () => {
      notifySuccess(branch ? "Branch updated" : "Branch created");
      await onSaved();
      onClose();
    },
    onError: (error) => notifyError(error, "Could not save branch"),
  });
  const archiveMutation = useMutation({
    mutationFn: () => businessService.archiveBranch(branch!.id),
    onSuccess: async () => {
      notifySuccess("Branch deactivated");
      await onSaved();
      onClose();
    },
    onError: (error) => notifyError(error, "Could not deactivate branch"),
  });
  const values = form.watch();
  const e = form.formState.errors;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={branch ? "Edit Branch" : "Create Branch"}
    >
      <form
        className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Branch name"
            error={e.name?.message}
            {...form.register("name")}
          />
          <Input
            label="Branch code"
            error={e.code?.message}
            {...form.register("code")}
          />
          <label className="text-sm font-medium">
            Status
            <select
              className={`mt-1 ${inputClass}`}
              {...form.register("status")}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
          <Input
            label="Address line 1"
            error={e.addressLine1?.message}
            {...form.register("addressLine1")}
          />
          <Input
            label="Address line 2 (optional)"
            {...form.register("addressLine2")}
          />
          <Input
            label="City"
            error={e.city?.message}
            {...form.register("city")}
          />
          <Input
            label="State"
            error={e.stateProvince?.message}
            {...form.register("stateProvince")}
          />
          <Input
            label="Postal code"
            error={e.postalCode?.message}
            {...form.register("postalCode")}
          />
          <Input
            label="Country code"
            error={e.country?.message}
            {...form.register("country")}
          />
          <Input
            label="Timezone"
            error={e.timezone?.message}
            {...form.register("timezone")}
          />
          <Input
            label="Phone"
            error={e.phone?.message}
            {...form.register("phone")}
          />
          <Input
            label="Manager name (optional)"
            {...form.register("managerName")}
          />
          <Input label="Email (optional)" {...form.register("email")} />
          <Input
            label="Opening time"
            placeholder="09:00"
            {...form.register("openingTime")}
          />
          <Input
            label="Closing time"
            placeholder="23:00"
            {...form.register("closingTime")}
          />
          <Input
            label="Tax override % (optional)"
            type="number"
            step="0.01"
            {...form.register("taxOverride", { valueAsNumber: true })}
          />
          <Input
            label="Service charge override %"
            type="number"
            step="0.01"
            {...form.register("serviceChargeOverride", { valueAsNumber: true })}
          />
          <Input
            label="Invoice prefix (optional)"
            {...form.register("invoicePrefix")}
          />
          <label className="text-sm font-medium">
            Negative stock policy
            <select
              className={`mt-1 ${inputClass}`}
              {...form.register("negativeStockPolicy")}
            >
              <option value="BLOCK">Block</option>
              <option value="WARN">Warn</option>
              <option value="ALLOW">Allow</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium">
          Weekly operating days
          <div className="mt-2 flex flex-wrap gap-2">
            {(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const).map(
              (day) => (
                <label
                  key={day}
                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={values.weeklyOperatingDays?.includes(day) ?? false}
                    onChange={(event) =>
                      form.setValue(
                        "weeklyOperatingDays",
                        event.target.checked
                          ? [...(values.weeklyOperatingDays ?? []), day]
                          : (values.weeklyOperatingDays ?? []).filter(
                              (item) => item !== day,
                            ),
                        { shouldValidate: true },
                      )
                    }
                  />
                  {day}
                </label>
              ),
            )}
          </div>
        </label>
        <label className="block text-sm font-medium">
          Receipt footer
          <textarea
            className={`mt-1 ${inputClass}`}
            rows={2}
            {...form.register("receiptFooter")}
          />
        </label>
        <CapabilityGrid
          values={{
            dineInEnabled: values.dineInEnabled,
            takeawayEnabled: values.takeawayEnabled,
            deliveryEnabled: values.deliveryEnabled,
            customerQrEnabled: values.customerQrEnabled,
            tablesEnabled: values.tablesEnabled,
            kdsEnabled: values.kdsEnabled,
            waiterAppEnabled: values.waiterAppEnabled,
            inventoryTrackingEnabled: values.inventoryTrackingEnabled ?? true,
          }}
          setValue={(key, value) =>
            form.setValue(
              key as keyof BusinessBranchFormValues,
              value as never,
              { shouldValidate: true },
            )
          }
        />
        <div className="flex justify-between gap-2">
          {branch ? (
            <Button
              type="button"
              variant="danger"
              loading={archiveMutation.isPending}
              onClick={() =>
                window.confirm("Deactivate this branch?") &&
                archiveMutation.mutate()
              }
            >
              Deactivate
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save Branch
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
