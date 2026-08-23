import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { config } from "dotenv";

// Integration tests talk to the real Supabase project, so they need the same
// environment the app uses.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Integration tests share one database; running them in parallel would let
    // one test's cleanup delete another's fixtures.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
