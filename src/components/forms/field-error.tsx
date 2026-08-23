export function FieldError({
  id,
  message,
}: {
  id?: string;
  message?: string;
}) {
  // Always rendered so screen readers announce the message when it appears.
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className="text-destructive min-h-5 text-sm font-medium"
    >
      {message}
    </p>
  );
}
