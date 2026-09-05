<script lang="ts">
  import type { BrowserTab } from "@/core/types";
  import { afterUpdate } from "svelte";
  import { getScrollbarPadding } from "@utils/scrollbar";
  import { sessions, currentSession, settings } from "@/core/state";
  import { Window } from "@/core/components";

  export { className as class };
  let className = "";

  let ulEl: HTMLUListElement;

  let scrollBarPadding = "0";

  afterUpdate(() => {
    scrollBarPadding = getScrollbarPadding(ulEl);
  });

  const session = sessions.selection;

  $: current = $session === $currentSession;

  $: hasTabs = !!$session?.windows?.length && !!$session?.tabsNumber;

  $: savedAt =
    $session?.dateSaved &&
    new Date($session.dateSaved).toLocaleString(navigator.language, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  function deleteTab(windowIndex: number, tab: BrowserTab | undefined) {
    sessions.removeTab(windowIndex, tab);
  }
</script>

<div class="flex min-h-0 flex-col {className}">
  {#if hasTabs}
    <div class="flex-none border-b-[1.5px] border-ink px-5 py-3">
      <h2 class="opsz-lg truncate text-[21px] leading-tight">
        {current ? "Current session" : $session.title}
      </h2>

      <p class="facts mt-2">
        <span>{current ? "Open now" : `Saved ${savedAt}`}</span>
        <span class="sep">&middot;</span>
        <span
          >{$session.windows.length}
          {$session.windows.length === 1 ? "window" : "windows"}</span
        >
        <span class="sep">&middot;</span>
        <span
          >{$session.tabsNumber}
          {$session.tabsNumber === 1 ? "tab" : "tabs"}</span
        >
        {#if $session.tag}
          <span class="sep">&middot;</span>
          <span
            class="rounded-sm px-1 py-0.5 uppercase tracking-[0.12em]"
            style:background-color={$settings.tags[$session.tag]?.bgColor}
            style:color={$settings.tags[$session.tag]?.textColor}
            >{$session.tag}</span
          >
        {/if}
      </p>
    </div>

    <ul
      bind:this={ulEl}
      class="flex-1 overflow-y-auto pb-4 pl-5"
      style:padding-right="calc(1.25rem + {scrollBarPadding})"
    >
      {#each $session.windows as window, windowIndex (window.id)}
        <Window
          {window}
          {current}
          index={windowIndex + 1}
          on:delete={(event) => {
            deleteTab(windowIndex, event.detail);
          }}
        />
      {/each}
    </ul>
  {:else}
    <div class="flex flex-1 items-center justify-center px-8">
      <p class="max-w-[22rem] text-center text-xs text-ink-faint">
        Select a session on the left to read its windows and tabs.
      </p>
    </div>
  {/if}
</div>
