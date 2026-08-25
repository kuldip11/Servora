import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from '@tanstack/react-router';
import { ChefHat } from 'lucide-react';
import { z } from 'zod';

import { authService } from '../services/auth.service';
import { useAuthStore } from '../../../store/auth';
import { Button, Card, Input, toast } from '@pos/ui';
import { extractApiError } from '../../../shared/lib/api-client';
import { signupSchema } from '@pos/validation';

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  async function handleSignup(form: SignupFormValues) {
    setLoading(true);
    try {
      await authService.signup(
        form.tenantName
          ? { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, tenantName: form.tenantName }
          : { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password },
      );
      // Signup creates the identity only; authenticate next so the user can create/select a business.
      const login = await authService.login({ email: form.email, password: form.password });
      setAuth(login);
      toast({ title: 'Account created. Choose or create a business.', tone: 'success' });
      router.navigate({ to: '/context' });
    } catch (err: unknown) {
      toast({ title: extractApiError(err), tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-surface via-surface to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl shadow-elevated mb-4">
            <ChefHat className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Get started</h1>
          <p className="text-sm text-text-secondary mt-1">Create your account</p>
        </div>

        <Card className="rounded-xl p-8" padding="none">
          <form onSubmit={handleSubmit(handleSignup)} className="space-y-5" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                placeholder="John"
                error={errors.firstName?.message}
                autoComplete="given-name"
                {...register('firstName')}
              />
              <Input
                label="Last name"
                placeholder="Doe"
                error={errors.lastName?.message}
                autoComplete="family-name"
                {...register('lastName')}
              />
            </div>
            <Input
              label="Email address"
              type="email"
              placeholder="you@restaurant.com"
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              autoComplete="new-password"
              {...register('password')}
            />
            <Button type="submit" loading={loading} className="w-full mt-2">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:text-primary-hover font-medium">
              Sign in
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
