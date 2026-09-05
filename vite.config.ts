import { extension, isDEV } from "./tools/constants";
import { defineConfig, type CorsOptions, type UserConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";
import UnoCSS from "unocss/vite";
import { extensionManifestPlugin } from "./tools/manifestPlugin";

export const sharedConfig: UserConfig = {
  server: {
    // extension pages fetch dev modules cross-origin; default cors only allows local origins
    cors: {
      origin: ((
        origin: string | undefined,
        callback: (err: Error | null, allow: boolean) => void,
      ) => {
        if (
          !origin ||
          origin.startsWith("chrome-extension://") ||
          origin.startsWith("moz-extension://")
        )
          callback(null, true);
        else callback(null, false);
      }) as CorsOptions["origin"],
    },
  },

  define: {
    __EXT_NAME__: JSON.stringify(extension.name),
    __EXT_VER__: JSON.stringify(extension.version),
    __EXT_MODE__:
      parseInt(extension.version) < 1
        ? JSON.stringify("ALPHA")
        : isDEV
          ? JSON.stringify("DEV")
          : null,
  },

  resolve: {
    alias: {
      "@": resolve("src"),
      "@constants": resolve("src/core/constants"),
      "@utils": resolve("src/core/utils"),
      "@styles": resolve("src/core/styles"),
    },
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  ...sharedConfig,

  plugins: [UnoCSS(), svelte(), extensionManifestPlugin()],

  build: {
    emptyOutDir: false,

    // oxc minifier (vite 8 default) DCEs svelte's lazy runtime init (init_operations),
    // producing "Cannot read properties of undefined (reading 'call')"
    minify: "terser",

    rollupOptions: {
      input: {
        popup: "src/popup/index.html",
        options: "src/options/index.html",
        discarded: "src/discarded/index.html",
      },
    },
  },
});
