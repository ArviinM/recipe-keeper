/*
 * Recipe Keeper service worker.
 *
 * Students cook on patchy mobile data, so a lesson they have already opened
 * stays readable when the connection drops mid-recipe.
 *
 * What is cached is deliberately narrow. Only shared curriculum content is
 * stored: lesson pages, static assets, and recipe photos. Anything carrying a
 * student's own data — progress, profile, quiz pages, the whole dashboard — is
 * never written to the cache, because these are shared classroom phones.
 */

const VERSION = "v1";
const SHELL_CACHE = `rk-shell-${VERSION}`;
const PAGE_CACHE = `rk-pages-${VERSION}`;
const IMAGE_CACHE = `rk-images-${VERSION}`;

const SHELL_ASSETS = [
  "/offline",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.webmanifest",
];

/** Paths whose responses must never be stored. */
const NEVER_CACHE = [
  "/home",
  "/progress",
  "/profile",
  "/quiz",
  "/admin",
  "/api",
  "/login",
  "/register",
  "/change-password",
];

const MAX_IMAGES = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.endsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// The app asks for a full wipe on sign-out, so a cached lesson does not outlive
// the session on a shared phone.
self.addEventListener("message", (event) => {
  if (event.data === "clear-caches") {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
    );
  }
});

function isLessonPage(url) {
  return /^\/recipes\/[^/]+$/.test(url.pathname);
}

function isNeverCached(url) {
  return NEVER_CACHE.some(
    (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
  );
}

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Recipe photos live on Supabase storage: cache-first, they never change
  // under the same path.
  if (/\/storage\/v1\/object\/public\/recipe-media\//.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches
                .open(IMAGE_CACHE)
                .then((cache) => cache.put(request, copy))
                .then(() => trimCache(IMAGE_CACHE, MAX_IMAGES));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (isNeverCached(url)) return;

  // Build output is content-hashed, so it can be served from cache forever.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Lesson pages: fresh when online, cached copy when not.
  if (request.mode === "navigate" && isLessonPage(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/offline");
        }),
    );
    return;
  }

  // Any other navigation falls back to the offline notice rather than the
  // browser's error page.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
  }
});
