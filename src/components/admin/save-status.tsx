import { AlertCircle, Check, Loader2 } from "lucide-react";

import type { SaveStatus } from "./use-autosave";

export function SaveStatusLabel({
  status,
  error,
}: {
  status: SaveStatus;
  error?: string | null;
}) {
  if (status === "saving") {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm font-medium">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="text-brand-green inline-flex items-center gap-1.5 text-sm font-semibold">
        <Check className="size-4" aria-hidden />
        Saved automatically
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="text-destructive inline-flex items-center gap-1.5 text-sm font-semibold">
        <AlertCircle className="size-4" aria-hidden />
        {error ?? "Could not save"}
      </span>
    );
  }

  return <span className="text-muted-foreground text-sm">&nbsp;</span>;
}
