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
