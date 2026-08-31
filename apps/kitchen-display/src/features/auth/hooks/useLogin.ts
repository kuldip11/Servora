import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@pos/ui";
import { extractApiError } from "@pos/api-client";
import { login, fetchMemberships } from "../api/login";
import { saveTokens, saveContext, clearTokens } from "../storage";
import type { AvailableMembership, CredentialsForm } from "../types";
interface UseLoginResult {
  step: "credentials" | "membership" | "branch";
  memberships: AvailableMembership[];
  branches: AvailableMembership["branches"];
  submitCredentials: (creds: CredentialsForm) => void;
  selectMembership: (id: string) => void;
  selectBranchForMembership: (id: string) => void;
  isLoading: boolean;
  resetToCredentials: () => void;
}
export function useLogin(onLogin: () => void): UseLoginResult {
  const [step, setStep] = useState<"credentials" | "membership" | "branch">(
    "credentials",
  );
  const [memberships, setMemberships] = useState<AvailableMembership[]>([]);
  const [branches, setBranches] = useState<AvailableMembership["branches"]>([]);
  const [activeMembership, setActiveMembership] =
    useState<AvailableMembership | null>(null);
  const activate = async (m: AvailableMembership) => {
    const branchId = m.roles.some((role) => role.scope === "TENANT")
      ? null
      : (m.branches[0]?.id ?? null);
    saveContext(m.tenant.id, branchId);
    setActiveMembership(m);
    if (branchId || m.roles.some((role) => role.scope === "TENANT")) {
      onLogin();
      return;
    }
    setBranches(m.branches);
    setStep("branch");
  };
  const mutation = useMutation({
    mutationFn: async (creds: CredentialsForm) => {
      const result = await login(creds.email, creds.password);
      saveTokens(result.accessToken);
      const list = await fetchMemberships();
      if (!list.length)
        throw new Error("No business membership is assigned to this account.");
      setMemberships(list);
      if (list.length === 1) await activate(list[0]!);
      else setStep("membership");
    },
    onError: (err: unknown) => {
      clearTokens();
      toast({ title: extractApiError(err), tone: "danger" });
    },
  });
  return {
    step,
    memberships,
    branches,
    submitCredentials: (c) => mutation.mutate(c),
    selectMembership: (id) => {
      const m = memberships.find((x) => x.membershipId === id);
      if (m)
        void activate(m).catch((e: unknown) =>
          toast({ title: extractApiError(e), tone: "danger" }),
        );
    },
    selectBranchForMembership: (id) => {
      if (!activeMembership) return;
      saveContext(activeMembership.tenant.id, id);
      onLogin();
    },
    isLoading: mutation.isPending,
    resetToCredentials: () => {
      setStep("credentials");
      setBranches([]);
      clearTokens();
    },
  };
}
