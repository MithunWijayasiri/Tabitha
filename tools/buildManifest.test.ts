import { describe, expect, it } from "vitest";
import { buildManifest } from "./buildManifest";

describe("buildManifest", () => {
  it("produces a Chromium MV3 manifest", () => {
    const manifest = buildManifest({ firefox: false, dev: false });

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.background).toHaveProperty("service_worker");
    expect(manifest.browser_specific_settings).toBeUndefined();
    expect(manifest.permissions).toContain("system.display");
    expect(manifest.permissions).not.toContain("cookies");
  });

  it("produces a Firefox MV3 manifest with gecko id", () => {
    const manifest = buildManifest({ firefox: true, dev: false });

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.background).toHaveProperty("scripts");
    expect(manifest.browser_specific_settings).toEqual({
      gecko: { id: "tabitha@tabitha" },
    });
    expect(manifest.permissions).toContain("cookies");
    expect(manifest.permissions).not.toContain("system.display");
  });

  it("downgrades Firefox dev to MV2 with browser_action", () => {
    const manifest = buildManifest({ firefox: true, dev: true });

    expect(manifest.manifest_version).toBe(2);
    expect(manifest.browser_action?.default_popup).toBe(
      "./src/popup/index.html",
    );
    expect(manifest.action).toBeUndefined();
  });

  it("loosens CSP only in dev, using the port", () => {
    expect(
      buildManifest({ firefox: false, dev: false }).content_security_policy,
    ).toBeUndefined();

    const manifest = buildManifest({ firefox: false, dev: true, port: 5174 });

    expect(manifest.content_security_policy).toEqual({
      extension_pages: expect.stringContaining("http://localhost:5174/"),
    });
  });
});
