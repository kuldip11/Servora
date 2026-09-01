import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  MapPin,
  Pencil,
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

type SelectedEntity =
  | { type: "organization"; id: string }
  | { type: "franchise"; id: string }
  | { type: "branch"; id: string };

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

const EntityDetailsHeader = ({
  icon,
  name,
  type,
  description,
  actions,
}: {
  icon: ReactNode;
  name: string;
  type: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-col gap-4 border-b border-divider pb-5 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-surface text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {type}
        </p>
        <h2 className="truncate text-xl font-semibold">{name}</h2>
        {description && (
          <p className="mt-1 text-sm capitalize text-text-secondary">
            {description.toLowerCase()}
          </p>
        )}
      </div>
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

const DetailItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: ReactNode;
}) => (
  <div className="rounded-lg border border-border bg-background p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
      {label}
    </p>
    <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-text-primary">
      {icon}
      {value || "Not provided"}
    </p>
  </div>
);

export const BusinessPage = () => {
  const queryClient = useQueryClient();
  const { has } = usePermissions();
  const { memberships, membershipId, user } = useAuthStore();
  const [organizationModal, setOrganizationModal] = useState(false);
  const [franchiseModal, setFranchiseModal] = useState(false);
  const [branchModal, setBranchModal] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(
    null,
  );
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
  const isOwner = user?.roles.some((role) => role.name === "OWNER") ?? false;
  const canCreateOrganization = isOwner;
  const canCreateFranchise = isOwner && has("tenant:create");
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
    if (!selectedOrganizationId && data.organizations[0]) {
      setSelectedOrganizationId(data.organizations[0].id);
    }
    if (!selectedEntity && data.organizations[0]) {
      setSelectedEntity({ type: "organization", id: data.organizations[0].id });
    }
  }, [data.organizations, selectedOrganizationId]);

  useEffect(() => {
    if (!selectedEntity) return;
    const selectionStillExists =
      (selectedEntity.type === "organization" &&
        data.organizations.some((item) => item.id === selectedEntity.id)) ||
      (selectedEntity.type === "franchise" &&
        data.franchises.some((item) => item.id === selectedEntity.id)) ||
      (selectedEntity.type === "branch" &&
        branches.some((item) => item.id === selectedEntity.id));
    if (!selectionStillExists && data.organizations[0]) {
      setSelectedEntity({ type: "organization", id: data.organizations[0].id });
    }
  }, [branches, data.franchises, data.organizations, selectedEntity]);

  const selectedOrganization =
    selectedEntity?.type === "organization"
      ? data.organizations.find((item) => item.id === selectedEntity.id)
      : undefined;
  const selectedFranchise =
    selectedEntity?.type === "franchise"
      ? data.franchises.find((item) => item.id === selectedEntity.id)
      : undefined;
  const selectedBranch =
    selectedEntity?.type === "branch"
      ? branches.find((item) => item.id === selectedEntity.id)
      : undefined;

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
          canCreateOrganization ? (
            <Button
              onClick={() => {
                setEditingOrganization(null);
                setOrganizationModal(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add business
            </Button>
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
            {onboardingStep === 1 && canCreateOrganization && (
              <Button onClick={() => setOrganizationModal(true)}>
                Create business <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {onboardingStep === 2 && canCreateFranchise && (
              <Button onClick={() => setFranchiseModal(true)}>
                Create Franchise <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {onboardingStep === 3 && has("branch:create") && (
              <Button onClick={() => setBranchModal(true)}>
                Create Branch <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      )}

      {!!data.organizations.length && (
        <div className="grid min-h-[560px] gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-divider px-4 py-4">
              <p className="text-sm font-semibold">Business structure</p>
              <p className="mt-1 text-xs text-text-secondary">
                Select an entity to view or manage it.
              </p>
            </div>
            <div className="max-h-[680px] overflow-y-auto p-2">
              {data.organizations.map((organization) => {
                const organizationFranchises = data.franchises.filter(
                  (franchise) => franchise.organizationId === organization.id,
                );
                return (
                  <div key={organization.id} className="mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEntity({
                          type: "organization",
                          id: organization.id,
                        });
                        setSelectedOrganizationId(organization.id);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${selectedEntity?.type === "organization" && selectedEntity.id === organization.id ? "bg-primary-surface text-primary" : "hover:bg-surface-secondary"}`}
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">{organization.name}</span>
                    </button>
                    <div className="ml-5 border-l border-divider pl-2">
                      {organizationFranchises.map((franchise) => {
                        const membership = memberships.find(
                          (item) => item.tenant.id === franchise.id,
                        );
                        return (
                          <div key={franchise.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEntity({
                                  type: "franchise",
                                  id: franchise.id,
                                });
                                setSelectedOrganizationId(organization.id);
                              }}
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedEntity?.type === "franchise" && selectedEntity.id === franchise.id ? "bg-primary-surface font-semibold text-primary" : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"}`}
                            >
                              <Store className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {franchise.displayName || franchise.name}
                              </span>
                            </button>
                            <div className="ml-5 space-y-0.5 border-l border-divider pl-2">
                              {(membership?.branches ?? []).map((branch) => (
                                <button
                                  key={branch.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedEntity({
                                      type: "branch",
                                      id: branch.id,
                                    })
                                  }
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedEntity?.type === "branch" && selectedEntity.id === branch.id ? "bg-primary-surface font-semibold text-primary" : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"}`}
                                >
                                  <GitBranch className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">
                                    {branch.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="min-w-0">
            {selectedOrganization && (
              <EntityDetailsHeader
                icon={<Building2 className="h-5 w-5" />}
                name={selectedOrganization.name}
                type="Organization"
                description={
                  selectedOrganization.businessType?.replace(/_/g, " ") ||
                  "Business profile"
                }
                actions={
                  <>
                    {canCreateFranchise && (
                      <Button
                        onClick={() => {
                          setSelectedOrganizationId(selectedOrganization.id);
                          setEditingFranchise(null);
                          setFranchiseModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4" /> Add franchise
                      </Button>
                    )}
                    {has("organization:manage") && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingOrganization(selectedOrganization);
                          setOrganizationModal(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                    )}
                  </>
                }
              />
            )}
            {selectedOrganization && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Business type"
                  value={selectedOrganization.businessType?.replace(/_/g, " ")}
                />
                <DetailItem
                  label="Franchises"
                  value={String(
                    data.franchises.filter(
                      (item) => item.organizationId === selectedOrganization.id,
                    ).length,
                  )}
                />
                <DetailItem
                  label="Primary contact"
                  value={selectedOrganization.primaryContactName}
                />
                <DetailItem
                  label="Business email"
                  value={selectedOrganization.businessEmail}
                />
                <DetailItem
                  label="Business phone"
                  value={selectedOrganization.businessPhone}
                />
                <DetailItem
                  label="Location"
                  value={[
                    selectedOrganization.city,
                    selectedOrganization.stateProvince,
                    selectedOrganization.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
              </div>
            )}

            {selectedFranchise && (
              <>
                <EntityDetailsHeader
                  icon={<Store className="h-5 w-5" />}
                  name={selectedFranchise.displayName || selectedFranchise.name}
                  type="Franchise"
                  description={
                    selectedFranchise.businessModel?.replace(/_/g, " ") ||
                    "Restaurant brand"
                  }
                  actions={
                    <>
                      {selectedFranchise.id === activeMembership?.tenant.id &&
                        has("branch:create") && (
                          <Button
                            onClick={() => {
                              setEditingBranch(null);
                              setBranchModal(true);
                            }}
                          >
                            <Plus className="h-4 w-4" /> Add branch
                          </Button>
                        )}
                      {selectedFranchise.id === activeMembership?.tenant.id &&
                        has("tenant:update") && (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingFranchise(selectedFranchise);
                              setSelectedOrganizationId(
                                selectedFranchise.organizationId ?? "",
                              );
                              setFranchiseModal(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </Button>
                        )}
                    </>
                  }
                />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Business model"
                    value={selectedFranchise.businessModel?.replace(/_/g, " ")}
                  />
                  <DetailItem
                    label="Cuisine"
                    value={selectedFranchise.cuisineTypes?.join(", ")}
                  />
                  <DetailItem
                    label="Default currency"
                    value={selectedFranchise.defaultCurrency}
                  />
                  <DetailItem
                    label="Default timezone"
                    value={selectedFranchise.defaultTimezone}
                  />
                  <DetailItem
                    label="Branches"
                    value={String(
                      memberships.find(
                        (item) => item.tenant.id === selectedFranchise.id,
                      )?.branches.length ?? 0,
                    )}
                  />
                  <DetailItem
                    label="Status"
                    value={selectedFranchise.isActive ? "Active" : "Inactive"}
                  />
                </div>
              </>
            )}

            {selectedBranch && (
              <>
                <EntityDetailsHeader
                  icon={<GitBranch className="h-5 w-5" />}
                  name={selectedBranch.name}
                  type="Branch"
                  description={selectedBranch.isActive ? "Active" : "Inactive"}
                  actions={
                    selectedBranch.tenantId === activeMembership?.tenant.id &&
                    has("branch:update") ? (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingBranch(selectedBranch as Branch);
                          setBranchModal(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                    ) : undefined
                  }
                />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Branch code" value={selectedBranch.code} />
                  <DetailItem
                    label="Status"
                    value={selectedBranch.isActive ? "Active" : "Inactive"}
                  />
                  <DetailItem
                    label="Location"
                    value={
                      selectedBranch.address ||
                      [selectedBranch.city, selectedBranch.stateProvince]
                        .filter(Boolean)
                        .join(", ")
                    }
                    icon={<MapPin className="h-4 w-4" />}
                  />
                  <DetailItem label="Phone" value={selectedBranch.phone} />
                  <DetailItem
                    label="Timezone"
                    value={selectedBranch.timezone}
                  />
                  <DetailItem
                    label="Tables"
                    value={
                      selectedBranch.tablesEnabled ? "Enabled" : "Disabled"
                    }
                  />
                </div>
              </>
            )}
          </Card>
        </div>
      )}

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
      title={organization ? "Edit business" : "Add business"}
      size="xl"
    >
      <form
        className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Organization / Business name"
            placeholder="e.g. KKS Hospitality Pvt Ltd"
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
            placeholder="e.g. Kuldip Sharma"
            error={e.primaryContactName?.message}
            {...form.register("primaryContactName")}
          />
          <Input
            label="Business email"
            type="email"
            placeholder="e.g. operations@kkshospitality.com"
            error={e.businessEmail?.message}
            {...form.register("businessEmail")}
          />
          <Input
            label="Business phone"
            placeholder="e.g. +91 98765 43210"
            error={e.businessPhone?.message}
            {...form.register("businessPhone")}
          />
          <Input
            label="Website (optional)"
            placeholder="e.g. https://kkshospitality.com"
            error={e.website?.message}
            {...form.register("website")}
          />
          <Input
            label="Address line 1"
            placeholder="Street address and building"
            error={e.addressLine1?.message}
            {...form.register("addressLine1")}
          />
          <Input
            label="Address line 2 (optional)"
            placeholder="Floor, suite or landmark"
            {...form.register("addressLine2")}
          />
          <Input
            label="City"
            placeholder="e.g. Gurugram"
            error={e.city?.message}
            {...form.register("city")}
          />
          <Input
            label="State / Province"
            placeholder="e.g. Haryana"
            error={e.stateProvince?.message}
            {...form.register("stateProvince")}
          />
          <Input
            label="Postal code"
            placeholder="e.g. 122001"
            error={e.postalCode?.message}
            {...form.register("postalCode")}
          />
          <Input
            label="Country code"
            placeholder="e.g. IN"
            error={e.country?.message}
            {...form.register("country")}
          />
          <Input
            label="Timezone"
            placeholder="e.g. Asia/Kolkata"
            error={e.timezone?.message}
            {...form.register("timezone")}
          />
          <Input
            label="Currency"
            placeholder="e.g. INR"
            error={e.currency?.message}
            {...form.register("currency")}
          />
          <Input
            label="Legal name (optional)"
            placeholder="Registered legal entity name"
            {...form.register("legalName")}
          />
          <Input
            label="GSTIN (optional)"
            placeholder="e.g. 06ABCDE1234F1Z5"
            error={e.gstin?.message}
            {...form.register("gstin")}
          />
          <Input
            label="PAN (optional)"
            placeholder="e.g. ABCDE1234F"
            error={e.pan?.message}
            {...form.register("pan")}
          />
          <Input
            label="Company registration (optional)"
            placeholder="e.g. CIN or registration number"
            {...form.register("companyRegistrationNumber")}
          />
          <Input
            label="Tax registration (optional)"
            placeholder="Local tax registration number"
            {...form.register("taxRegistrationNumber")}
          />
          <Input
            label="Logo URL (optional)"
            placeholder="https://example.com/logo.png"
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
              Save business
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
  const { has } = usePermissions();
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
      size="xl"
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
            placeholder="e.g. KKS Kitchen"
            error={e.name?.message}
            {...form.register("name")}
          />
          <Input
            label="Display name (optional)"
            placeholder="Name shown to customers"
            {...form.register("displayName")}
          />
          <Input
            label="Cuisine types"
            placeholder="e.g. Indian, Continental, Cafe"
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
            placeholder="e.g. INR"
            error={e.defaultCurrency?.message}
            {...form.register("defaultCurrency")}
          />
          <Input
            label="Default timezone"
            placeholder="e.g. Asia/Kolkata"
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
            placeholder="e.g. 5"
            {...form.register("defaultTaxRate", { valueAsNumber: true })}
          />
          <Input
            label="Service charge % (optional)"
            type="number"
            step="0.01"
            placeholder="e.g. 10"
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
            placeholder="e.g. support@kkskitchen.com"
            {...form.register("supportEmail")}
          />
          <Input
            label="Support phone (optional)"
            placeholder="e.g. +91 98765 43210"
            {...form.register("supportPhone")}
          />
          <Input
            label="Website (optional)"
            placeholder="e.g. https://kkskitchen.com"
            {...form.register("website")}
          />
          <Input
            label="Logo URL (optional)"
            placeholder="https://example.com/logo.png"
            {...form.register("logoUrl")}
          />
          <Input
            label="Brand image URL (optional)"
            placeholder="https://example.com/brand-cover.jpg"
            {...form.register("primaryBrandImageUrl")}
          />
        </div>
        <label className="block text-sm font-medium">
          Description
          <textarea
            className={`mt-1 ${inputClass}`}
            rows={3}
            placeholder="Briefly describe the brand and its customer experience"
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
          {franchise && has("tenant:archive") ? (
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
  const { has } = usePermissions();
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
      size="xl"
    >
      <form
        className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Branch name"
            placeholder="e.g. Airport Branch"
            error={e.name?.message}
            {...form.register("name")}
          />
          <Input
            label="Branch code"
            placeholder="e.g. DEL-T3"
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
            placeholder="Street address and building"
            error={e.addressLine1?.message}
            {...form.register("addressLine1")}
          />
          <Input
            label="Address line 2 (optional)"
            placeholder="Floor, unit or landmark"
            {...form.register("addressLine2")}
          />
          <Input
            label="City"
            placeholder="e.g. New Delhi"
            error={e.city?.message}
            {...form.register("city")}
          />
          <Input
            label="State"
            placeholder="e.g. Delhi"
            error={e.stateProvince?.message}
            {...form.register("stateProvince")}
          />
          <Input
            label="Postal code"
            placeholder="e.g. 110037"
            error={e.postalCode?.message}
            {...form.register("postalCode")}
          />
          <Input
            label="Country code"
            placeholder="e.g. IN"
            error={e.country?.message}
            {...form.register("country")}
          />
          <Input
            label="Timezone"
            placeholder="e.g. Asia/Kolkata"
            error={e.timezone?.message}
            {...form.register("timezone")}
          />
          <Input
            label="Phone"
            placeholder="e.g. +91 98765 43210"
            error={e.phone?.message}
            {...form.register("phone")}
          />
          <Input
            label="Manager name (optional)"
            placeholder="e.g. Aditi Verma"
            {...form.register("managerName")}
          />
          <Input
            label="Email (optional)"
            placeholder="e.g. airport@kkskitchen.com"
            {...form.register("email")}
          />
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
            placeholder="e.g. 5"
            {...form.register("taxOverride", { valueAsNumber: true })}
          />
          <Input
            label="Service charge override %"
            type="number"
            step="0.01"
            placeholder="e.g. 10"
            {...form.register("serviceChargeOverride", { valueAsNumber: true })}
          />
          <Input
            label="Invoice prefix (optional)"
            placeholder="e.g. DELT3"
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
            placeholder="e.g. Thank you for dining with us!"
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
          {branch && has("branch:archive") ? (
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
