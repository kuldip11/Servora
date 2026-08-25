import { useState } from 'react';
import {
  AppShell,
  Page,
  PageHeader,
  Section,
  Card,
  Stack,
  Grid,
  Button,
  IconButton,
  SplitButton,
  StatusBadge,
  TextInput,
  TextArea,
  SearchInput,
  NumberInput,
  CurrencyInput,
  PasswordInput,
  OTPInput,
} from '@pos/ui';
import { Mail, Trash2, Copy, Archive, Download } from 'lucide-react';

/**
 * Internal-only route (`/dev/form-preview`, no auth guard). Phase 3
 * exit criteria (docs/design-system/00-PLAN.md): "a form built entirely
 * from these components passes a manual keyboard-only pass and a
 * screen-reader smoke test." Every field below is a Phase 3 component —
 * nothing hand-rolled — and the validation example wires a real error
 * through `aria-describedby` so a screen reader announces it.
 *
 * Manual checks to run against this page before calling Phase 3 done:
 * - Tab through the whole form with no mouse; every control (including
 *   the number/currency steppers, the password toggle, and the OTP
 *   boxes) must be reachable and operable from the keyboard alone.
 * - VoiceOver/NVDA: focusing the email field after submitting empty
 *   should announce its error text, not just show it visually.
 */
export function FormPreviewPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [bio, setBio] = useState('');
  const [search, setSearch] = useState('');
  const [covers, setCovers] = useState(2);
  const [price, setPrice] = useState(12.5);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpComplete, setOtpComplete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(email.includes('@') ? undefined : 'Enter a valid email address.');
  };

  return (
    <AppShell
      topbar={
        <div className="px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-text-primary">Form & Button Preview</span>
          <StatusBadge label="Phase 3" tone="info" />
        </div>
      }
    >
      <Page>
        <PageHeader
          title="Form & Input Components Preview"
          description="Phase 3 exit-criteria page — every control below is a @pos/ui form or button component, nothing hand-rolled."
        />

        <Section title="Text fields">
          <form onSubmit={handleSubmit} noValidate>
            <Grid columns={{ base: 1, md: 2 }} gap="md">
              <TextInput
                label="Email"
                type="email"
                icon={Mail}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
                hint={emailError ? undefined : "We'll send the confirmation here."}
              />
              <PasswordInput
                label="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="At least 8 characters."
              />
              <SearchInput
                label="Search menu items"
                placeholder="Margherita, Caesar salad…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
              />
              <TextArea
                label="Bio"
                placeholder="A short description…"
                maxLength={140}
                showCharCount
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <NumberInput
                label="Covers"
                value={covers}
                onChange={setCovers}
                min={1}
                max={20}
                hint="Party size for this reservation."
              />
              <CurrencyInput label="Menu item price" value={price} onChange={setPrice} />
            </Grid>

            <div className="mt-lg">
              <OTPInput
                label="Verification code"
                length={6}
                value={otp}
                onChange={setOtp}
                onComplete={() => setOtpComplete(true)}
                hint={otpComplete ? 'Code complete.' : 'Enter the 6-digit code we sent you.'}
              />
            </div>

            <Stack direction="row" gap="sm" className="mt-lg">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="secondary" onClick={() => setEmailError(undefined)}>
                Reset error
              </Button>
            </Stack>
          </form>
        </Section>

        <Section title="Button family" description="Every variant × the icon and split variants.">
          <Stack direction="row" gap="sm" wrap>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
            <Button loading>Loading</Button>
          </Stack>
          <Stack direction="row" gap="sm" wrap className="mt-md">
            <IconButton icon={Trash2} aria-label="Delete" variant="danger" />
            <IconButton icon={Copy} aria-label="Duplicate" />
            <IconButton icon={Download} aria-label="Download" variant="secondary" />
            <SplitButton
              onClick={() => {}}
              actions={[
                { label: 'Duplicate', icon: Copy, onClick: () => {} },
                { label: 'Archive', icon: Archive, onClick: () => {} },
                { label: 'Delete', icon: Trash2, onClick: () => {}, danger: true },
              ]}
            >
              Save order
            </SplitButton>
          </Stack>
        </Section>

        <Section title="StatusBadge" description="Every tone the Phase 3 primitive supports.">
          <Stack direction="row" gap="sm" wrap>
            <StatusBadge label="Active" tone="success" />
            <StatusBadge label="Pending" tone="warning" />
            <StatusBadge label="Cancelled" tone="danger" />
            <StatusBadge label="Seasonal" tone="info" />
            <StatusBadge label="Archived" tone="neutral" />
          </Stack>
        </Section>

        <Section
          title="Loading & disabled states"
          description="Every input's loading/disabled treatment side by side."
        >
          <Grid columns={{ base: 1, md: 2 }} gap="md">
            <TextInput label="Loading" loading value="Saving…" onChange={() => {}} />
            <TextInput label="Disabled" disabled value="Read-only" onChange={() => {}} />
          </Grid>
        </Section>

        <Card className="mt-lg">
          <p className="text-sm text-text-secondary">
            Live state — email: <span className="text-text-primary">{email || '(empty)'}</span>,
            covers: <span className="text-text-primary">{covers}</span>, price:{' '}
            <span className="text-text-primary">${price.toFixed(2)}</span>, OTP:{' '}
            <span className="text-text-primary">{otp || '(empty)'}</span>
          </p>
        </Card>
      </Page>
    </AppShell>
  );
}
