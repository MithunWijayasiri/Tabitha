import { afterEach, describe, expect, it, vi } from "vitest";
import { get, writable } from "svelte/store";
import type { UUID } from "crypto";
import type { BrowserWindow, Session } from "@/core/types";
import {
  createCurrentSessionReader,
  type CurrentSessionEvents,
  type CurrentSessionPorts,
} from "./currentSession";

const DEBOUNCE_MS = 50;

function liveSession(): Session {
  return {
    title: "Current Session",
    id: "current",
    dateSaved: undefined,
    dateModified: undefined,
    windowsNumber: 1,
    tabsNumber: 2,
    windows: [{ id: 7, tabs: [{ id: 1 }, { id: 2 }] } as BrowserWindow],
  };
}

function harness(overrides: Partial<CurrentSessionPorts> = {}) {
  const session = liveSession();
  const store = writable<Session>();
  const read = vi.fn(async () => session);
  const select = vi.fn();
  const removeTab = vi.fn();
  const detach = vi.fn();

  let events: CurrentSessionEvents | undefined;
  let visibilityChanged: (() => void) | undefined;

  const watch = vi.fn((handlers: CurrentSessionEvents) => {
    events = handlers;

    return detach;
  });

  const ports: CurrentSessionPorts = {
    store,
    read,
    watch,
    visible: () => true,
    onVisibilityChange: (handler) => {
      visibilityChanged = handler;
    },
    selectedId: () => "current",
    select,
    removeTab,
    ...overrides,
  };

  const { ready } = createCurrentSessionReader(ports);

  return {
    session,
    store,
    read,
    select,
    removeTab,
    watch,
    detach,
    ready,
    events: () => events!,
    visibilityChange: () => visibilityChanged!(),
  };
}

afterEach(() => vi.useRealTimers());

describe("createCurrentSessionReader", () => {
  it("coalesces a burst of tab events into one read", async () => {
    vi.useFakeTimers();

    const { read, events } = harness();

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    read.mockClear();

    events().changed();
    events().changed();
    events().changed();

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    expect(read).toHaveBeenCalledTimes(1);
  });

  it("resolves the current session from the first read", async () => {
    vi.useFakeTimers();

    const { session, store, select, ready } = harness();

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    await ready;

    expect(get(store)).toBe(session);
    expect(select).toHaveBeenCalledWith(session);
  });

  /** Two overlapping reads, left pending so the test picks the settle order. */
  async function overlappingReads() {
    vi.useFakeTimers();

    const resolvers: ((session: Session) => void)[] = [];

    const read = vi.fn(
      () => new Promise<Session>((resolve) => resolvers.push(resolve)),
    );

    const harnessed = harness({ read });

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    harnessed.events().changed();

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    expect(resolvers).toHaveLength(2);

    return { ...harnessed, resolvers };
  }

  it("keeps the newest read when an older one resolves last", async () => {
    const { store, resolvers } = await overlappingReads();

    const stale = liveSession();
    const fresh = liveSession();

    resolvers[1]!(fresh);
    resolvers[0]!(stale);

    await vi.advanceTimersByTimeAsync(0);

    expect(get(store)).toBe(fresh);
  });

  it("commits both reads when they resolve in order", async () => {
    const { store, resolvers } = await overlappingReads();

    const first = liveSession();
    const second = liveSession();

    resolvers[0]!(first);

    await vi.advanceTimersByTimeAsync(0);

    expect(get(store)).toBe(first);

    resolvers[1]!(second);

    await vi.advanceTimersByTimeAsync(0);

    expect(get(store)).toBe(second);
  });

  it("settles ready when the first read fails", async () => {
    vi.useFakeTimers();

    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const read = vi.fn(() => Promise.reject(new Error("no tabs API")));

    const { store, ready } = harness({ read, visible: () => false });

    await ready;

    expect(get(store)).toBeUndefined();
    expect(error).toHaveBeenCalled();

    error.mockRestore();
  });

  it("still resolves the current session while the view is hidden", async () => {
    const { session, store, select, watch, ready } = harness({
      visible: () => false,
    });

    await ready;

    expect(get(store)).toBe(session);
    expect(select).toHaveBeenCalledWith(session);
    expect(watch).not.toHaveBeenCalled();
  });

  it("leaves a saved session selected", async () => {
    const { select, ready } = harness({
      visible: () => false,
      selectedId: () => "0192a4f1-0000-7000-8000-000000000000" as UUID,
    });

    await ready;

    expect(select).not.toHaveBeenCalled();
  });

  it("attaches the listeners only while the view is visible", async () => {
    let visible = false;

    const { watch, detach, ready, visibilityChange } = harness({
      visible: () => visible,
    });

    await ready;

    expect(watch).not.toHaveBeenCalled();

    visible = true;
    visibilityChange();

    expect(watch).toHaveBeenCalledTimes(1);

    visible = false;
    visibilityChange();

    expect(detach).toHaveBeenCalledTimes(1);
  });

  it("drops a closed tab from the live session", async () => {
    vi.useFakeTimers();

    const { session, events, removeTab, ready } = harness();

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    await ready;

    events().removed(2, { windowId: 7, isWindowClosing: false });

    expect(removeTab).toHaveBeenCalledWith(0, session.windows[0]!.tabs![1]);

    events().removed(1, { windowId: 7, isWindowClosing: true });

    expect(removeTab).toHaveBeenLastCalledWith(0);
  });

  it("ignores a tab removal outside the live windows", async () => {
    vi.useFakeTimers();

    const { events, removeTab, ready } = harness();

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    await ready;

    events().removed(1, { windowId: 99, isWindowClosing: false });

    expect(removeTab).not.toHaveBeenCalled();
  });
});
