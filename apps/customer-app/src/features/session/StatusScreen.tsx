import { Utensils } from "lucide-react";
import { Button, Spinner } from "@pos/ui";

type Props = {
  title: string;
  message: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function StatusScreen({
  title,
  message,
  loading = false,
  actionLabel,
  onAction,
}: Props) {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background p-5 text-center"
      aria-live={loading ? "polite" : "assertive"}
    >
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          {loading ? (
            <Spinner className="h-6 w-6 text-primary-foreground" />
          ) : (
            <Utensils className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{message}</p>
        {actionLabel && onAction && (
          <Button className="mt-5" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </main>
  );
}
