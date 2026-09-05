<script lang="ts">
  import browser from "webextension-polyfill";
  import { createEventDispatcher, onDestroy } from "svelte";
  import { settings, sessions, currentSession as session } from "@/core/state";
  import { getSession, isExtensionViewed } from "@/core/utils";

  const dispatch = createEventDispatcher();

  let timeout: NodeJS.Timeout;

  const selection = sessions.selection;

  $: selected = $selection === $session;

  $: windowsCount = $session?.windows?.length ?? 0;
  $: tabsCount = $session?.tabsNumber ?? 0;

  document.addEventListener("visibilitychange", handleVisibility);

  settings.init().then(handleVisibility);

  onDestroy(() => {
    removeEvents();

    document.removeEventListener("visibilitychange", handleVisibility);
  });

  function handleVisibility() {
    if (isExtensionViewed()) {
      handleUpdate();
      addEvents();
      return;
    }

    removeEvents();
  }

  function addEvents() {
    browser.windows.onFocusChanged.addListener(handleUpdate);
    browser.tabs.onCreated.addListener(handleUpdate);
    browser.tabs.onUpdated.addListener(handleUpdate);
    browser.tabs.onActivated.addListener(handleUpdate);
    browser.tabs.onMoved.addListener(handleUpdate);
    browser.tabs.onDetached.addListener(handleUpdate);
    browser.tabs.onRemoved.addListener(handleRemoval);
  }

  function removeEvents() {
    browser.windows.onFocusChanged.removeListener(handleUpdate);
    browser.tabs.onCreated.removeListener(handleUpdate);
    browser.tabs.onUpdated.removeListener(handleUpdate);
    browser.tabs.onActivated.removeListener(handleUpdate);
    browser.tabs.onMoved.removeListener(handleUpdate);
    browser.tabs.onDetached.removeListener(handleUpdate);
    browser.tabs.onRemoved.removeListener(handleRemoval);
  }

  function handleRemoval(
    tabId: number,
    removeInfo: browser.Tabs.OnRemovedRemoveInfoType,
  ) {
    const windowIndex = $session.windows.findIndex(
      (window) => window.id === removeInfo.windowId,
    );

    if (windowIndex === -1) return;

    if (removeInfo.isWindowClosing) return sessions.removeTab(windowIndex);

    const window = $session.windows[windowIndex]!;

    const tab = window.tabs?.find((t) => t.id === tabId);

    if (!tab) return;

    sessions.removeTab(windowIndex, tab);
  }

  async function handleUpdate() {
    clearTimeout(timeout);

    //should fix inconsistency in update flags
    timeout = setTimeout(async () => {
      $session = await getSession({
        pinned: $settings.excludePinned ? false : undefined,
        url: $settings.urlFilterList,
      });

      if ($settings.selectionId === "current")
        selection.selectById($session.id);
    }, 50);
  }
</script>

<div
  class="relative flex items-center gap-3 pr-3 {selected
    ? 'bg-accent-soft'
    : 'bg-panel-alt'}"
>
  <span class="w-[5px] self-stretch rounded-r-[3px] bg-accent"></span>

  <button
    type="button"
    class="flex-1 min-w-0 py-3 text-left"
    on:click={() => selection.select($session)}
  >
    <h2 class="truncate text-[15px] leading-tight">Current session</h2>
    <span class="facts mt-1.5">
      <span>{windowsCount} {windowsCount === 1 ? "window" : "windows"}</span>
      <span class="sep">&middot;</span>
      <span>{tabsCount} {tabsCount === 1 ? "tab" : "tabs"}</span>
    </span>
  </button>

  <button
    type="button"
    class="flex-none rounded bg-accent px-3 py-1.5 text-xs font-semibold text-accent-content hover:bg-accent-focus"
    on:click={() => dispatch("save")}
  >
    Save
  </button>
</div>
