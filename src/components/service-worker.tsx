"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that keeps already-opened lessons readable when
 * the connection drops. Registration is deliberately delayed until after load
 * so it never competes with the first paint on a slow phone.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is a convenience; failing to register must never
        // break the app.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
