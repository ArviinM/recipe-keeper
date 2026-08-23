import type { MetadataRoute } from "next";

/**
 * Makes the module installable to a phone's home screen. This is what lets the
 * research call it a "mobile-based" application: it gets an icon, launches
 * fullscreen, and shows no browser chrome.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Recipe Keeper — Mobile-Based Recipe Module",
    short_name: "Recipe Keeper",
    description:
      "A Cookery learning module for Grade 9 students — recipes, procedures, safety reminders, and quizzes.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdfcfa",
    theme_color: "#B84E64",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Padded safe zone so Android's circular crop never clips the mark.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
