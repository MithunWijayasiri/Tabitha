import type { SessionSummary } from "@/core/types";
import { derived, get, writable } from "svelte/store";
import { bindingFor, type CommandId } from "@constants/keymap";
import { currentSession, sessions, settings } from "@/core/state";
import {
  exportBackup,
  formatTimestamp,
  openFullView,
  openOptions,
  sessionStore,
} from "@/core/utils";

/**
 * Affordances a context can lend the command table. Each is optional: the options
 * page has no list and no search box, so those commands degrade instead of failing.
 */
export interface CommandPorts {
  /** Resolves to the entered title, or undefined when the modal is dismissed. */
  promptTitle: (type: "Save" | "Rename") => Promise<string | undefined>;
  focusSearch: () => void;
  reveal: (id: string) => void;
  visibleSessions: () => SessionSummary[];
}

export interface Command {
  /** Present when a keybinding drives the command; title and hint come from it. */
  id?: CommandId;
  title: string;
  hint?: string;
  palette: boolean;
  run: () => unknown;
}

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  run: () => void | Promise<void>;
}

export const paletteOpen = writable(false);

export const confirmRequest = writable<ConfirmRequest | undefined>(undefined);

const ports = writable<Partial<CommandPorts>>({});

/** Register what this context can do. Returns the unregister callback for `onMount`. */
export function provideCommandPorts(partial: Partial<CommandPorts>) {
  ports.update((current) => ({ ...current, ...partial }));

  return () =>
    ports.update((current) => {
      const next = { ...current };

      for (const key of Object.keys(partial))
        delete next[key as keyof CommandPorts];

      return next;
    });
}

function keyed(id: CommandId, palette: boolean, run: () => unknown): Command {
  const binding = bindingFor(id);

  return {
    id,
    title: binding.action,
    hint: binding.keys.join(" + "),
    palette,
    run,
  };
}

function build(available: Partial<CommandPorts>): Command[] {
  const selection = sessions.selection;

  async function step(delta: 1 | -1) {
    const list = available.visibleSessions?.() ?? [];

    if (!list.length) return;

    const selected = get(selection);
    const from = list.findIndex((session) => session.id === selected?.id);

    const index =
      from === -1
        ? delta === 1
          ? 0
          : list.length - 1
        : (from + delta + list.length) % list.length;

    const target = list[index]!;

    await selection.select(target);

    available.reveal?.(target.id);
  }

  async function saveCurrent() {
    const current = get(currentSession);

    if (!current) return;

    let title = formatTimestamp(Date.now());

    if (!get(settings).doNotAskForTitle && available.promptTitle) {
      const entered = await available.promptTitle("Save");

      if (!entered) return;

      title = entered;
    }

    const id = await sessions.add({ ...current, title });

    if (id) available.reveal?.(id);
  }

  async function renameSelected() {
    const target = get(selection);

    if (!target || !available.promptTitle) return;

    const title = await available.promptTitle("Rename");

    if (!title || title === target.title) return;

    selection.update((value) => {
      value.title = title;

      return value;
    });

    await sessions.put(get(selection));

    available.reveal?.(target.id);
  }

  async function duplicate() {
    const target = get(selection);

    if (!target || target.id === "current") return;

    const full = await sessionStore.hydrate(target);

    await sessions.add({ ...full, title: `${full.title} (copy)` });
  }

  function deleteSelected() {
    // Snapshotted: a dbChanged broadcast can move the selection while the modal is open.
    const target = get(selection);

    confirmRequest.set({
      title: "Delete session",
      message: `Delete “${target?.title ?? ""}”? This cannot be undone.`,
      confirmLabel: "Delete",
      run: async () => {
        await sessions.remove(target);

        await selection.select(get(currentSession));
      },
    });
  }

  function deleteAll() {
    confirmRequest.set({
      title: "Delete all sessions",
      message: `Delete all ${get(sessions).length} saved sessions? This cannot be undone.`,
      confirmLabel: "Delete",
      run: sessions.removeAll,
    });
  }

  return [
    keyed("palette", false, () => paletteOpen.update((open) => !open)),
    keyed("save", true, saveCurrent),
    { title: "Duplicate selected session", palette: true, run: duplicate },
    keyed("rename", false, renameSelected),
    keyed("search", false, () => available.focusSearch?.()),
    keyed("current", false, () => selection.select(get(currentSession))),
    keyed("next", false, () => step(1)),
    keyed("previous", false, () => step(-1)),
    keyed("delete", true, deleteSelected),
    { title: "Delete all sessions", palette: true, run: deleteAll },
    {
      title: "Export sessions to a file",
      palette: true,
      run: () => exportBackup(get(settings).exportCompressed),
    },
    { title: "Open full view", palette: true, run: openFullView },
    { title: "Open settings", palette: true, run: openOptions },
  ];
}

export const commands = derived(ports, build);

export function runCommand(id: CommandId) {
  const command = get(commands).find((entry) => entry.id === id);

  if (!command) throw new Error(`No command bound to "${id}"`);

  return command.run();
}
