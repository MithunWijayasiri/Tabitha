export const isFirefox = process.env.TARGET === "firefox";

export const extension = {
  name: "Tabitha",
  version: process.env.npm_package_version!,
  description:
    "Capture browser windows and tabs as sessions, then restore them whenever you need.",
  permissions: (firefox: boolean) => [
    "tabs",
    "storage",
    "unlimitedStorage",
    "alarms",
    "contextMenus",
    ...(firefox ? ["cookies"] : ["system.display", "favicon"]),
  ],
  firefoxId: "tabitha@mithunwijayasiri.dev",
};

export const isDEV = process.env.NODE_ENV !== "production";

export const dir = "./dist/";
