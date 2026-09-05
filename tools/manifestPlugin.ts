import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { AddressInfo } from "node:net";
import type { Plugin } from "vite";
import { buildManifest } from "./buildManifest.ts";
import { dir, isDEV, isFirefox } from "./constants.ts";

export function extensionManifestPlugin(): Plugin {
  let views: string[] = [];
  let port = 5173;

  const manifestPath = resolve(dir, "manifest.json");
  const srcPath = resolve("src");

  function writeManifest(flag: "wx" | "w" = "w") {
    const data = JSON.stringify(
      buildManifest({ firefox: isFirefox, dev: isDEV, port }),
      null,
      2,
    );

    mkdirSync(dirname(manifestPath), { recursive: true });

    writeFileSync(manifestPath, data, { flag });
  }

  function writeViews() {
    for (const view of views) {
      const source = readFileSync(resolve(`src/${view}/index.html`), {
        encoding: "utf-8",
      }).replace(
        '"./main.ts"',
        `"http://localhost:${port}/src/${view}/main.ts"`,
      );

      const target = resolve(dir, `src/${view}/index.html`);

      mkdirSync(dirname(target), { recursive: true });

      writeFileSync(target, source, { encoding: "utf-8" });
    }
  }

  return {
    name: "tabitha-extension-manifest",

    configResolved(config) {
      const input = config.build.rollupOptions.input;

      if (!input || typeof input === "string" || Array.isArray(input)) return;

      views = Object.values(input)
        .filter((path) => path.endsWith("/index.html"))
        .map((path) =>
          path.replace(/^src\//, "").replace(/\/index\.html$/, ""),
        );
    },

    buildStart() {
      if (isDEV) {
        writeManifest(existsSync(manifestPath) ? "w" : "wx");
        writeViews();
        return;
      }

      writeManifest("wx");
    },

    configureServer(server) {
      server.httpServer?.once("listening", () => {
        port = (server.httpServer!.address() as AddressInfo).port;

        writeManifest();
        writeViews();
      });

      // Vite owns this watcher and closes it on shutdown.
      server.watcher.on("change", (file) => {
        if (file.startsWith(srcPath) && file.endsWith(".html")) writeViews();
      });
    },
  };
}
