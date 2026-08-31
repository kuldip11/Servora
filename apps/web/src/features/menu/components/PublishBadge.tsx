import { Badge } from "@pos/ui";

export const PublishBadge = ({ isPublished }: { isPublished: boolean }) => {
  if (isPublished) return null;
  return (
    <Badge
      variant="default"
      className="inline-flex items-center gap-1 bg-surface-secondary text-text-secondary"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-text-disabled" />
      Draft
    </Badge>
  );
};
