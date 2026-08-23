"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { uploadRecipeImage } from "@/app/(admin)/admin/recipes/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ImagePicker({
  recipeId,
  path,
  onChange,
  label = "Add photo",
  aspect = "aspect-[16/10]",
}: {
  recipeId: string;
  path: string | null;
  onChange: (path: string | null) => void;
  label?: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const publicUrl = path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/recipe-media/${path}`
    : null;

  function handleFile(file: File) {
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("recipeId", recipeId);

    startTransition(async () => {
      const result = await uploadRecipeImage(formData);
      if (result.error) setError(result.error);
      else if (result.path) onChange(result.path);
    });
  }

  return (
    <div className="space-y-2">
      {publicUrl ? (
        <div className={cn("bg-muted relative w-full overflow-hidden rounded-xl", aspect)}>
          <Image
            src={publicUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className={cn(
            "border-border text-muted-foreground hover:bg-secondary/50 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors",
            aspect,
          )}
        >
          {pending ? (
            <Loader2 className="size-7 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="size-7" aria-hidden />
          )}
          <span className="text-sm font-semibold">
            {pending ? "Uploading…" : label}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />

      <div className="flex items-center gap-2">
        {publicUrl && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
            >
              {pending ? "Uploading…" : "Replace"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onChange(null)}
            >
              <Trash2 className="size-4" aria-hidden />
              Remove
            </Button>
          </>
        )}
      </div>

      {error && <p className="text-destructive text-sm font-medium">{error}</p>}
      <p className="text-muted-foreground text-xs">
        Use your own photo of the dish. JPG or PNG, up to 5&nbsp;MB.
      </p>
    </div>
  );
}
