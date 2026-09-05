import { defineConfig } from "vitest/config";
import { sharedConfig } from "./vite.config";

export default defineConfig({
  ...sharedConfig,
  test: {
    environment: "node",
  },
});
