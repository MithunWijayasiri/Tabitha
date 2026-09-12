import { EXT_NAME } from "@/core/constants";
import { notification } from "@/core/state";
import { sessionStore } from "@/core/utils";
import { BACKUP_MAGIC } from "@/core/utils/backup/decodeSsf";
import { compressToUint8Array } from "lz-string";
import type { Session, SessionSummary } from "@/core/types";

export async function exportBackup(exportCompressed: boolean = false) {
  const date = new Date();

  let sessions: Session[];

  try {
    const summaries: SessionSummary[] = [];

    await sessionStore.iterateSessions("dateSaved", (batch) =>
      summaries.push(...batch),
    );

    sessions = await Promise.all(
      summaries.map((summary) => sessionStore.hydrate(summary)),
    );
  } catch (error) {
    notification.error("Export failed", (error as Error).message);

    return;
  }

  if (!sessions.length) {
    notification.error("Save a session before exporting", "Nothing to export");

    return;
  }

  const fileName = `[${EXT_NAME}:${sessions.length}]${date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })}.${exportCompressed ? "tab" : "tab.json"}`;

  const payload = exportCompressed
    ? (() => {
        const magic = new TextEncoder().encode(BACKUP_MAGIC);
        const compressed = compressToUint8Array(
          JSON.stringify(sessions),
        ) as Uint8Array<ArrayBuffer>;

        const bytes = new Uint8Array(magic.length + compressed.length);

        bytes.set(magic);
        bytes.set(compressed, magic.length);

        return bytes;
      })()
    : JSON.stringify({ tabitha: 1, sessions });

  const blob = new Blob([payload]);

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a") as HTMLAnchorElement;

  anchor.style.display = "none";

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);

  anchor.click();

  URL.revokeObjectURL(url);

  anchor.remove();
}
