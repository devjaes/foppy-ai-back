import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false, // Run test files sequentially to avoid database conflicts
    include: [
      "src/**/*.test.ts",
      "src/**/*.spec.ts",
      "tests/**/*.test.ts",
      "tests/**/*.spec.ts",
    ],
  },
});
