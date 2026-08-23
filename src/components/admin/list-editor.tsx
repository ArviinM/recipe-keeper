"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Edits a plain list of sentences (objectives, safety reminders, tips).
 * One textarea per line with an obvious add and remove, rather than asking a
 * teacher to type separator characters.
 */
export function ListEditor({
  items,
  onChange,
  addLabel,
  placeholder,
  numbered = false,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  placeholder?: string;
  numbered?: boolean;
}) {
  const update = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          {numbered && (
            <span className="bg-secondary text-secondary-foreground mt-2 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
              {index + 1}
            </span>
          )}
          <Textarea
            value={item}
            onChange={(event) => update(index, event.target.value)}
            placeholder={placeholder}
            rows={2}
            className="min-h-16 flex-1 text-base"
            aria-label={`Item ${index + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive mt-1 size-10 shrink-0"
            onClick={() => remove(index)}
            aria-label={`Remove item ${index + 1}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full font-semibold"
        onClick={() => onChange([...items, ""])}
      >
        <Plus aria-hidden />
        {addLabel}
      </Button>
    </div>
  );
}
