import { ChefHat } from "lucide-react";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { BranchSelector } from "@/features/auth/components/BranchSelector";
import { MembershipSelector } from "@/features/auth/components/MembershipSelector";
export const KitchenLogin = ({ onLogin }: { onLogin: () => void }) => {
  const auth = useLogin(onLogin);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-card">
        <div className="text-center mb-7">
          <ChefHat className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-text-primary">
            Kitchen Display
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {auth.step === "credentials"
              ? "Sign in to continue"
              : auth.step === "membership"
                ? "Choose your business"
                : "Select the kitchen branch"}
          </p>
        </div>
        {auth.step === "credentials" ? (
          <LoginForm
            onSubmit={auth.submitCredentials}
            loading={auth.isLoading}
          />
        ) : auth.step === "membership" ? (
          <MembershipSelector
            memberships={auth.memberships}
            onSelect={auth.selectMembership}
          />
        ) : (
          <BranchSelector
            branches={auth.branches}
            onSelect={auth.selectBranchForMembership}
            onBack={auth.resetToCredentials}
          />
        )}
      </div>
    </div>
  );
};
