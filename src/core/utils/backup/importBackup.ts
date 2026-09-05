import { notification } from "@/core/state";
import { sessionStore } from "@/core/utils";
import { decodeSsf } from "@/core/utils/backup/decodeSsf";

export async function importBackup(event: Event) {
  const file = (event.target as HTMLInputElement).files![0]!;

  const ext = file.name.match(/\.tab(\.json)?$/)?.[0];

  if (!ext)
    return notification.error(
      "Unsupported file. Import accepts .tab and .tab.json only.",
    );

  try {
    const data = new Uint8Array(await file.arrayBuffer());

    const sessions = decodeSsf(data);

    if (!sessions?.length)
      return notification.error(
        "Nothing to import",
        "Invalid or corrupt backup file",
      );

    await sessionStore.saveSessions(sessions);
  } catch (error) {
    notification.error("Failed to import", (error as Error).message);
  }
}
