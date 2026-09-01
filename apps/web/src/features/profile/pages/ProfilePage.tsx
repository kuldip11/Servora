import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, Input, Page, PageHeader } from "@pos/ui";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/auth";
import { notifyError, notifySuccess } from "@/shared/lib/notify";

type ProfileValues = { firstName: string; lastName: string; displayName: string; phone: string; profileImageUrl: string };
type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };

export const ProfilePage = () => {
  const { user, setContext } = useAuthStore();
  const profile = useForm<ProfileValues>({ defaultValues: { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", displayName: user?.displayName ?? "", phone: user?.phone ?? "", profileImageUrl: user?.profileImageUrl ?? "" } });
  const password = useForm<PasswordValues>({ defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  const profileMutation = useMutation({ mutationFn: authService.updateProfile, onSuccess: (updated) => { const state = useAuthStore.getState(); setContext({ membershipId: state.membershipId, franchiseId: state.franchiseId, branchId: state.branchId, user: updated }); notifySuccess("Profile updated"); }, onError: (error) => notifyError(error, "Could not update profile") });
  const passwordMutation = useMutation({ mutationFn: authService.changePassword, onSuccess: () => { password.reset(); notifySuccess("Password changed"); }, onError: (error) => notifyError(error, "Could not change password") });

  return <Page><PageHeader title="My profile" description="Manage your personal details and sign-in password." />
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><h2 className="mb-4 text-base font-semibold">Personal details</h2><form className="space-y-4" onSubmit={profile.handleSubmit((values) => profileMutation.mutate(values))}>
        <div className="grid gap-4 sm:grid-cols-2"><Input label="First name" {...profile.register("firstName", { required: "First name is required" })} error={profile.formState.errors.firstName?.message} /><Input label="Last name" {...profile.register("lastName", { required: "Last name is required" })} error={profile.formState.errors.lastName?.message} /></div>
        <Input label="Display name (optional)" {...profile.register("displayName")} /><Input label="Email" value={user?.email ?? ""} disabled /><Input label="Phone (optional)" {...profile.register("phone")} /><Input label="Profile image URL (optional)" type="url" {...profile.register("profileImageUrl")} />
        <Button type="submit" loading={profileMutation.isPending}>Save profile</Button>
      </form></Card>
      <Card><h2 className="mb-4 text-base font-semibold">Change password</h2><form className="space-y-4" onSubmit={password.handleSubmit((values) => { if (values.newPassword !== values.confirmPassword) { password.setError("confirmPassword", { message: "Passwords do not match" }); return; } passwordMutation.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword }); })}>
        <Input label="Current password" type="password" autoComplete="current-password" {...password.register("currentPassword", { required: "Current password is required" })} error={password.formState.errors.currentPassword?.message} />
        <Input label="New password" type="password" autoComplete="new-password" {...password.register("newPassword", { required: "New password is required", minLength: { value: 8, message: "Use at least 8 characters" } })} error={password.formState.errors.newPassword?.message} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" {...password.register("confirmPassword", { required: "Confirm the password" })} error={password.formState.errors.confirmPassword?.message} />
        <Button type="submit" loading={passwordMutation.isPending}>Change password</Button>
      </form></Card>
    </div>
  </Page>;
};
