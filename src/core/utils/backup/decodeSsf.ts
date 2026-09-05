import type { Session } from "@/core/types";
import { decompressFromUint8Array } from "lz-string";

export const BACKUP_MAGIC = "TBTH1";

export function decodeSsf(data: Uint8Array) {
  if (
    new TextDecoder().decode(data.slice(0, BACKUP_MAGIC.length)) ===
    BACKUP_MAGIC
  ) {
    try {
      return JSON.parse(
        decompressFromUint8Array(data.slice(BACKUP_MAGIC.length)),
      ) as Session[];
    } catch {
      return null;
    }
  }

  try {
    const envelope = JSON.parse(new TextDecoder().decode(data)) as {
      tabitha?: number;
      sessions?: Session[];
    };

    if (envelope.tabitha !== 1 || !Array.isArray(envelope.sessions))
      return null;

    return envelope.sessions;
  } catch {
    return null;
  }
}
