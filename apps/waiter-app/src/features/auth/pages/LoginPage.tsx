import { ChefHat } from 'lucide-react';
import { useLogin } from '../hooks/useLogin';
import { LoginForm } from '../components/LoginForm';
import { BranchSelector } from '../components/BranchSelector';
import { MembershipSelector } from '../components/MembershipSelector';

interface Props { onLogin: () => void; }
export function LoginPage({ onLogin }: Props) {
  const auth = useLogin(onLogin);
  return <div className="min-h-screen bg-primary flex flex-col"><div className="flex-1 flex items-center justify-center pt-12 pb-4"><div className="text-center"><div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--primary-foreground) 20%, transparent)' }}><ChefHat className="w-10 h-10 text-primary-foreground" /></div><h1 className="text-3xl font-bold text-primary-foreground">Waiter App</h1><p className="text-primary-foreground mt-1 text-sm" style={{ opacity: 0.75 }}>{auth.step === 'credentials' ? 'Sign in to start taking orders' : auth.step === 'membership' ? 'Choose your business' : 'Select your branch'}</p></div></div><div className="bg-surface rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl">{auth.step === 'credentials' ? <LoginForm onSubmit={auth.submitCredentials} loading={auth.isLoading} /> : auth.step === 'membership' ? <MembershipSelector memberships={auth.memberships} onSelect={auth.selectMembership} /> : <BranchSelector branches={auth.branches} onSelect={auth.selectBranchForMembership} onBack={auth.resetToCredentials} />}</div></div>;
}
