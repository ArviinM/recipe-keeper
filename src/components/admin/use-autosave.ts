"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave.
 *
 * Teachers work on classroom wifi, so nothing waits for a Save button. The
 * first run is skipped: loading a recipe should not immediately write it back.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<{ ok: boolean; error?: string }>,
  { delay = 900 }: { delay?: number } = {},
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Guarding on the value rather than a "first render" flag: React StrictMode
  // double-invokes effects in development, which let a boolean flag through and
  // wrote the record straight back on load.
  const lastSaved = useRef(JSON.stringify(value));
  const latest = useRef(value);
  const saveRef = useRef(save);

  // Refs are updated in an effect, never during render.
  useEffect(() => {
    latest.current = value;
    saveRef.current = save;
  });

  const run = useCallback(async (next: T) => {
    setStatus("saving");
    const result = await saveRef.current(next);
    if (result.ok) {
      lastSaved.current = JSON.stringify(next);
      setStatus("saved");
      setError(null);
    } else {
      setStatus("error");
      setError(result.error ?? "Could not save.");
    }
  }, []);

  const serialised = JSON.stringify(value);

  useEffect(() => {
    if (serialised === lastSaved.current) return;

    const snapshot = latest.current;
    const timer = setTimeout(() => void run(snapshot), delay);
    return () => clearTimeout(timer);
    // Compared by value: these are plain objects rebuilt on every keystroke.
  }, [serialised, delay, run]);

  const saveNow = useCallback(() => run(latest.current), [run]);

  return { status, error, saveNow };
}
