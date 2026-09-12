import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";
import { keymap } from "@constants/keymap";
import {
  commands,
  confirmRequest,
  paletteOpen,
  provideCommandPorts,
  runCommand,
} from "./commands";

const mocks = vi.hoisted(() => {
  function store<T>(initial: T) {
    let value = initial;
    const subs = new Set<(next: T) => void>();

    const self = {
      subscribe(run: (next: T) => void) {
        subs.add(run);
        run(value);

        return () => subs.delete(run);
      },
      set(next: T) {
        value = next;

        for (const run of subs) run(value);
      },
      update(fn: (current: T) => T) {
        self.set(fn(value));
      },
    };

    return self;
  }

  return {
    list: store<unknown[]>([]),
    selection: store<unknown>(undefined),
    settings: store({ doNotAskForTitle: false, exportCompressed: false }),
    currentSession: store<unknown>(undefined),
    add: vi.fn(async () => "new-id"),
    remove: vi.fn(async () => {}),
    removeAll: vi.fn(async () => {}),
    put: vi.fn(async () => {}),
    select: vi.fn(async () => {}),
    hydrate: vi.fn(async (session: unknown) => session),
    exportBackup: vi.fn(),
    openFullView: vi.fn(),
    openOptions: vi.fn(),
    formatTimestamp: vi.fn(() => "12 Sep 2026, 10:00"),
  };
});

vi.mock("@/core/state", () => ({
  currentSession: mocks.currentSession,
  settings: mocks.settings,
  sessions: {
    subscribe: mocks.list.subscribe,
    add: mocks.add,
    remove: mocks.remove,
    removeAll: mocks.removeAll,
    put: mocks.put,
    selection: {
      subscribe: mocks.selection.subscribe,
      select: mocks.select,
      update: mocks.selection.update,
    },
  },
}));

vi.mock("@/core/utils", () => ({
  exportBackup: mocks.exportBackup,
  formatTimestamp: mocks.formatTimestamp,
  openFullView: mocks.openFullView,
  openOptions: mocks.openOptions,
  sessionStore: { hydrate: mocks.hydrate },
}));

const session = { id: "current", windows: [{}], tabsNumber: 2 };

beforeEach(() => {
  vi.clearAllMocks();

  mocks.list.set([]);
  mocks.selection.set(undefined);
  mocks.currentSession.set(undefined);
  mocks.settings.set({ doNotAskForTitle: false, exportCompressed: false });

  paletteOpen.set(false);
  confirmRequest.set(undefined);
});

describe("command table", () => {
  it("binds every keymap entry to a command", () => {
    const ids = get(commands).map((command) => command.id);

    for (const binding of keymap) expect(ids).toContain(binding.id);
  });

  it("derives every keyed title and hint from the keymap", () => {
    for (const command of get(commands)) {
      if (!command.id) continue;

      const binding = keymap.find((entry) => entry.id === command.id)!;

      expect(command.title).toBe(binding.action);
      expect(command.hint).toBe(binding.keys.join(" + "));
    }
  });

  it("keeps unbound commands out of the keymap", () => {
    const unbound = get(commands).filter((command) => !command.id);

    expect(unbound.every((command) => command.palette)).toBe(true);
    expect(unbound.every((command) => command.hint === undefined)).toBe(true);
  });

  it("throws on a command that nothing binds", () => {
    // @ts-expect-error deliberately outside CommandId
    expect(() => runCommand("nope")).toThrow();
  });
});

describe("palette", () => {
  it("toggles open and closed", () => {
    runCommand("palette");
    expect(get(paletteOpen)).toBe(true);

    runCommand("palette");
    expect(get(paletteOpen)).toBe(false);
  });
});

describe("save", () => {
  it("skips the prompt when doNotAskForTitle is set", async () => {
    mocks.currentSession.set(session);
    mocks.settings.set({ doNotAskForTitle: true, exportCompressed: false });

    const promptTitle = vi.fn();
    const reveal = vi.fn();
    const unregister = provideCommandPorts({ promptTitle, reveal });

    await runCommand("save");

    expect(promptTitle).not.toHaveBeenCalled();
    expect(mocks.add).toHaveBeenCalledWith({
      ...session,
      title: "12 Sep 2026, 10:00",
    });
    expect(reveal).toHaveBeenCalledWith("new-id");

    unregister();
  });

  it("saves under the entered title", async () => {
    mocks.currentSession.set(session);

    const unregister = provideCommandPorts({
      promptTitle: async () => "Audit",
    });

    await runCommand("save");

    expect(mocks.add).toHaveBeenCalledWith({ ...session, title: "Audit" });

    unregister();
  });

  it("aborts when the prompt is dismissed", async () => {
    mocks.currentSession.set(session);

    const unregister = provideCommandPorts({
      promptTitle: async () => undefined,
    });

    await runCommand("save");

    expect(mocks.add).not.toHaveBeenCalled();

    unregister();
  });

  // The options page mounts no InputModal; the save must still honour the timestamp.
  it("falls back to a timestamp where no prompt exists", async () => {
    mocks.currentSession.set(session);

    await runCommand("save");

    expect(mocks.add).toHaveBeenCalledWith({
      ...session,
      title: "12 Sep 2026, 10:00",
    });
  });

  it("does nothing when the current session was never read", async () => {
    await runCommand("save");

    expect(mocks.add).not.toHaveBeenCalled();
  });
});

describe("delete", () => {
  it("deletes the session selected when the confirm opened", async () => {
    mocks.selection.set({ id: "a", title: "A" });

    runCommand("delete");

    const request = get(confirmRequest)!;

    expect(request.message).toContain("A");

    mocks.selection.set({ id: "b", title: "B" });

    await request.run();

    expect(mocks.remove).toHaveBeenCalledWith({ id: "a", title: "A" });
  });

  it("counts the sessions when delete-all opens its confirm", () => {
    mocks.list.set([{ id: "a" }, { id: "b" }]);

    get(commands)
      .find((command) => command.title === "Delete all sessions")!
      .run();

    expect(get(confirmRequest)?.message).toContain("Delete all 2");
  });
});

describe("selection stepping", () => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("wraps forward past the end", async () => {
    mocks.selection.set({ id: "c" });

    const unregister = provideCommandPorts({
      visibleSessions: () => list as never,
      reveal: vi.fn(),
    });

    await runCommand("next");

    expect(mocks.select).toHaveBeenCalledWith(list[0]);

    unregister();
  });

  it("wraps backward past the start", async () => {
    mocks.selection.set({ id: "a" });

    const unregister = provideCommandPorts({
      visibleSessions: () => list as never,
    });

    await runCommand("previous");

    expect(mocks.select).toHaveBeenCalledWith(list[2]);

    unregister();
  });

  it("does nothing without a list", async () => {
    await runCommand("next");

    expect(mocks.select).not.toHaveBeenCalled();
  });
});

describe("search", () => {
  it("focuses the search box when a context offers one", () => {
    const focusSearch = vi.fn();
    const unregister = provideCommandPorts({ focusSearch });

    runCommand("search");

    expect(focusSearch).toHaveBeenCalled();

    unregister();

    runCommand("search");

    expect(focusSearch).toHaveBeenCalledTimes(1);
  });
});
