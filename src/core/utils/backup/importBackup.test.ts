import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Session } from "@/core/types";
import { importBackup } from "./importBackup";

const { notification, sessions, decodeSsf } = vi.hoisted(() => ({
  notification: { error: vi.fn() },
  sessions: { addBackup: vi.fn(async () => {}) },
  decodeSsf: vi.fn(),
}));

vi.mock("@/core/state", () => ({ notification, sessions }));
vi.mock("@/core/utils/backup/decodeSsf", () => ({ decodeSsf }));

function fileEvent(name: string): Event {
  const file = { name, arrayBuffer: async () => new ArrayBuffer(1) };

  return { target: { files: [file] } } as unknown as Event;
}

beforeEach(() => {
  notification.error.mockClear();
  sessions.addBackup.mockClear();
  decodeSsf.mockReset();
});

describe("importBackup", () => {
  it("rejects an unsupported file extension", async () => {
    await importBackup(fileEvent("backup.zip"));

    expect(notification.error).toHaveBeenCalledWith(
      "Choose a .tab or .tab.json file",
      "Unsupported file type",
    );
    expect(sessions.addBackup).not.toHaveBeenCalled();
  });

  it("rejects an empty or corrupt decode result", async () => {
    decodeSsf.mockReturnValueOnce([]);

    await importBackup(fileEvent("backup.tab"));

    expect(notification.error).toHaveBeenCalledWith(
      "Choose a valid backup file",
      "This file is empty or corrupt",
    );
    expect(sessions.addBackup).not.toHaveBeenCalled();
  });

  it("writes decoded sessions through the sessions store", async () => {
    const decoded = [{ id: "a" }] as unknown as Session[];

    decodeSsf.mockReturnValueOnce(decoded);

    await importBackup(fileEvent("backup.tab"));

    expect(sessions.addBackup).toHaveBeenCalledWith(decoded);
  });

  it("reports a decode failure", async () => {
    decodeSsf.mockImplementationOnce(() => {
      throw new Error("bad magic");
    });

    await importBackup(fileEvent("backup.tab"));

    expect(notification.error).toHaveBeenCalledWith(
      "Import failed",
      "bad magic",
    );
    expect(sessions.addBackup).not.toHaveBeenCalled();
  });
});
