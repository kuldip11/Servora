import { Link } from '@tanstack/react-router';
import { ShieldAlert } from 'lucide-react';
import { Button, Card, Page } from '@pos/ui';

export function ForbiddenPage() {
  return (
    <Page className="min-h-full flex items-center justify-center">
      <Card className="max-w-md text-center">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-danger" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-text-primary">Access denied</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Your current franchise access does not have permission to access this area.
        </p>
        <Link to="/dashboard" className="mt-5 inline-block">
          <Button>Back to dashboard</Button>
        </Link>
      </Card>
    </Page>
  );
}
