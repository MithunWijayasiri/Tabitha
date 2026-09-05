import type { Manifest } from "webextension-polyfill";
import { extension } from "./constants";

export interface ManifestTarget {
  firefox: boolean;
  dev: boolean;
  port?: number;
}

export function buildManifest({
  firefox,
  dev,
  port = 5173,
}: ManifestTarget): Manifest.WebExtensionManifest {
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: firefox && dev ? 2 : 3,
    name: extension.name,
    version: extension.version,
    description: extension.description,

    action: {
      default_title: extension.name,
      default_popup: "./src/popup/index.html",
      default_icon: {
        16: "./favicons/16.png",
        32: "./favicons/32.png",
        64: "./favicons/64.png",
      },
    },

    background: firefox
      ? {
          scripts: ["./src/background/background.js"],
          type: "module",
        }
      : {
          service_worker: "./src/background/background.js",
          type: "module",
        },

    options_ui: {
      page: "./src/options/index.html",
      open_in_tab: true,
    },

    permissions: extension.permissions(firefox),

    icons: {
      16: "./favicons/16.png",
      32: "./favicons/32.png",
      48: "./favicons/48.png",
      64: "./favicons/64.png",
      96: "./favicons/96.png",
    },

    ...(firefox && {
      browser_specific_settings: {
        gecko: {
          id: extension.firefoxId,
          // Required for AMO submissions since 2025-11-03. Tabitha stores
          // everything locally, so nothing is collected.
          data_collection_permissions: { required: ["none"] },
        },
      },
    }),
  };

  if (dev) {
    manifest.content_security_policy = firefox
      ? `script-src 'self' http://localhost:${port}/ 'unsafe-eval'; object-src 'self'`
      : {
          extension_pages: `script-src 'self'; object-src 'self'; script-src-elem 'self' 'unsafe-inline' http://localhost:${port}/;`,
        };
  }

  if (firefox && dev) {
    manifest.browser_action = { ...manifest.action };
    delete manifest.action;
  }

  return manifest;
}
