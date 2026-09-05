import { defineConfig } from "vite";
import { isDEV } from "./tools/constants";
import { sharedConfig } from "./vite.config";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  ...sharedConfig,

  build: {
    emptyOutDir: false,

    // see vite.config.ts — oxc minifier breaks svelte runtime code
    minify: "terser",

    ...(isDEV && {
      watch: {},
      sourcemap: "inline",
    }),

    rollupOptions: {
      input: {
        background: resolve("src/background/background.ts"),
      },
      output: {
        format: "iife",
        entryFileNames: "src/background/background.js",
      },
    },
  },
});
