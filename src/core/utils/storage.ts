import type { Settings } from "@/core/types";
import { storage } from "webextension-polyfill";

export const STORAGE_PREFIX = "tabitha.";

const prefix = (items: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(items).map(([key, value]) => [STORAGE_PREFIX + key, value]),
  );

const unprefix = (items: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(items).map(([key, value]) => [
      key.slice(STORAGE_PREFIX.length),
      value,
    ]),
  );

export async function getStorageItem<K extends keyof Settings>(
  key: K,
  defaultVal: Settings[K],
) {
  const items = await storage.local.get(STORAGE_PREFIX + key);

  return (items[STORAGE_PREFIX + key] as Settings[K]) ?? defaultVal;
}

export async function getStorage<T extends Partial<Settings>>(
  keys: T | null | undefined,
) {
  const items = await storage.local.get(
    keys ? prefix(keys as unknown as Record<string, unknown>) : null,
  );

  return unprefix(items) as unknown as T;
}

export function setStorage(items: Partial<Settings>) {
  return storage.local.set(prefix(items as Record<string, unknown>));
}
