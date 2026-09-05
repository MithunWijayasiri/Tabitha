<script lang="ts">
  import browser from "webextension-polyfill";
  import type { BrowserTab, BrowserWindow } from "@/core/types";
  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";
  import { settings } from "@/core/state";
  import { IconButton, TabItem } from "@/core/components";
  import { tooltip, sendMessage } from "@/core/utils";

  const dispatch = createEventDispatcher<{
    delete: BrowserTab | undefined;
  }>();

  export let window: BrowserWindow;

  export let current = false;

  export let index = 1;

  let collapsed = false;

  $: name = window?.incognito ? "Private window" : `Window ${index}`;

  $: focused = window?.focused ? "text-link" : "text-ink-muted";

  function openInNewWindow() {
    sendMessage({
      message: "openWindow",
      window,
      discarded: $settings.discarded,
    });
  }
</script>

{#if window?.tabs?.length}
  <li>
    <div class="group flex items-center gap-3 pb-1.5 pt-4">
      <IconButton
        icon={window?.incognito ? "incognito" : "window"}
        role="img"
        class="text-sm {focused}"
      />

      <button
        type="button"
        class="label hover:underline {focused}"
        use:tooltip={{ title: "Open in a new window" }}
        on:click={openInNewWindow}
      >
        {name}
      </button>

      <span class="rule"></span>

      <span class="label">
        {window.tabs.length}
        {window.tabs.length === 1 ? "tab" : "tabs"}
      </span>

      <IconButton
        icon={current ? "close" : "delete"}
        title={current ? "Close this window" : "Remove from session"}
        class="hidden text-base text-ink-muted hover:text-danger group-hover:block group-focus-within:block"
        on:click={() => {
          if (current && window.id) browser.windows.remove(window.id);
          else dispatch("delete");
        }}
      />

      <IconButton
        icon={collapsed ? "expand" : "collapse"}
        title={collapsed ? "Show tabs" : "Hide tabs"}
        class="text-base text-ink-muted hover:text-accent-focus"
        on:click={() => (collapsed = !collapsed)}
      />
    </div>

    {#if !collapsed && window?.tabs}
      <ul class="flex flex-col" transition:slide={{ duration: 180 }}>
        {#each window.tabs as tab (tab.id ?? tab.index)}
          <TabItem {tab} on:delete {current} />
        {/each}
      </ul>
    {/if}
  </li>
{/if}
