import { defineConfig } from "vitest/config";
import { sharedConfig } from "./vite.config.ts";

export default defineConfig({
  ...sharedConfig,
  test: {
    environment: "node",
  },
});
