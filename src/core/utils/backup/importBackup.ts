import { notification, sessions } from "@/core/state";
import { decodeSsf } from "@/core/utils/backup/decodeSsf";

export async function importBackup(event: Event) {
  const file = (event.target as HTMLInputElement).files![0]!;

  const ext = file.name.match(/\.tab(\.json)?$/)?.[0];

  if (!ext)
    return notification.error(
      "Choose a .tab or .tab.json file",
      "Unsupported file type",
    );

  try {
    const data = new Uint8Array(await file.arrayBuffer());

    const imported = decodeSsf(data);

    if (!imported?.length)
      return notification.error(
        "Choose a valid backup file",
        "This file is empty or corrupt",
      );

    await sessions.addBackup(imported);
  } catch (error) {
    notification.error("Import failed", (error as Error).message);
  }
}
