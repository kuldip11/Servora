import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextInput, PasswordInput, Button } from "@pos/ui";
import { credentialsSchema, type CredentialsForm } from "../types";
export function LoginForm({
  onSubmit,
  loading,
}: {
  onSubmit: (creds: CredentialsForm) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <TextInput
        label="Email"
        type="email"
        placeholder="chef@restaurant.com"
        {...register("email")}
        error={errors.email?.message}
      />
      <PasswordInput
        label="Password"
        placeholder="••••••••"
        {...register("password")}
        error={errors.password?.message}
      />
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? "Signing in…" : "Continue"}
      </Button>
    </form>
  );
}
