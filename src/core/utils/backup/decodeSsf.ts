import type { Session } from "@/core/types";
import { decompressFromUint8Array } from "lz-string";

export const BACKUP_MAGIC = "TBTH1";

function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) return false;

  const { id, title, windows } = value as Partial<Session>;

  return (
    typeof id === "string" &&
    typeof title === "string" &&
    Array.isArray(windows)
  );
}

// a record without `windows` persists and then breaks every later read
function asSessions(value: unknown): Session[] | null {
  if (!Array.isArray(value) || !value.every(isSession)) return null;

  return value;
}

export function decodeSsf(data: Uint8Array) {
  if (
    new TextDecoder().decode(data.slice(0, BACKUP_MAGIC.length)) ===
    BACKUP_MAGIC
  ) {
    try {
      return asSessions(
        JSON.parse(decompressFromUint8Array(data.slice(BACKUP_MAGIC.length))),
      );
    } catch {
      return null;
    }
  }

  try {
    const envelope = JSON.parse(new TextDecoder().decode(data)) as {
      tabitha?: number;
      sessions?: unknown;
    };

    if (envelope.tabitha !== 1) return null;

    return asSessions(envelope.sessions);
  } catch {
    return null;
  }
}
