<script lang="ts">
  import browser from "webextension-polyfill";
  import type { BrowserTab } from "@/core/types";
  import { createEventDispatcher } from "svelte";
  import { IconButton } from "@/core/components";
  import { filterOptions } from "@/core/state";
  import {
    getDomain,
    getFavIcon,
    getFavIconType,
    highlightMatch,
  } from "@/core/utils";

  export let tab: BrowserTab;
  export let current = false;

  const dispatch = createEventDispatcher<{ delete: BrowserTab }>();

  $: active = tab.active ? "text-link" : "text-ink";

  $: favIconUrl = getFavIcon(tab.url, tab.favIconUrl);

  $: domain = getDomain(tab.url);

  $: title =
    tab.title &&
    highlightMatch(tab.title, $filterOptions?.query.trim(), {
      caseSensitive: false,
    });
</script>

{#if tab?.url}
  <li
    class="group flex items-center gap-2.5 border-b border-line/60 py-1.5 pl-1 pr-1"
  >
    {#if favIconUrl}
      <img
        class="h-4 w-4 max-h-4 max-w-4 flex-none rounded-sm"
        src={favIconUrl}
        alt=""
        role="presentation"
      />
    {:else}
      <IconButton
        icon={getFavIconType(tab.url)}
        role="img"
        class="text-base text-ink-faint"
      />
    {/if}

    <a
      class="min-w-0 flex-1 truncate text-[13px] font-medium hover:underline {active}"
      href={tab.url}
      target="_blank"
      rel="noreferrer"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html title}
    </a>

    {#if domain}
      <span
        class="max-w-[9rem] flex-none truncate font-mono text-[10px] text-ink-faint"
        >{domain}</span
      >
    {/if}

    <IconButton
      icon={current ? "close" : "delete"}
      title={current ? "Close tab" : "Remove from session"}
      class="hidden text-base text-ink-muted hover:text-danger group-hover:block"
      on:click={() => {
        if (current && tab.id) browser.tabs.remove(tab.id);
        else dispatch("delete", tab);
      }}
    />
  </li>
{/if}
