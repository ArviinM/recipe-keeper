import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The full illustrated logo. Use on the splash and auth screens where there is
 * room for it.
 */
export function Logo({
  size = 140,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/recipe-keeper-logo.jpeg"
      alt="Recipe Keeper"
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-3xl object-cover shadow-sm", className)}
    />
  );
}

/**
 * Text wordmark for headers, where the illustration would be too small to read.
 * Mirrors the logo's two-tone treatment.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold tracking-tight", className)}>
      <span className="text-brand-pink">Recipe</span>{" "}
      <span className="text-brand-green">Keeper</span>
    </span>
  );
}
