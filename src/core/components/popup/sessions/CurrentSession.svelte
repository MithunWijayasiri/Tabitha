<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    sessions,
    currentSessionSaved,
    currentSession as session,
  } from "@/core/state";
  import { countSites } from "@/core/utils";
  import { SiteChips } from "@/core/components";

  const dispatch = createEventDispatcher();

  const selection = sessions.selection;
  const busy = sessions.busy;

  $: selected = $selection === $session;

  $: windowsCount = $session?.windows?.length ?? 0;
  $: tabsCount = $session?.tabsNumber ?? 0;

  $: sites = countSites($session?.windows ?? []);
</script>

<div
  class="relative flex items-center gap-3 pr-3 {selected
    ? 'bg-accent-soft'
    : 'hover:bg-panel-alt'}"
>
  <span class="w-[5px] self-stretch rounded-r-[3px] bg-accent"></span>

  <button
    type="button"
    class="min-w-0 flex-1 py-2.5 text-left"
    on:click={() => selection.select($session)}
  >
    <h2 class="truncate text-[15px] font-medium leading-tight">
      Current session
    </h2>
    <span class="facts mt-1.5">
      <span>{windowsCount} {windowsCount === 1 ? "window" : "windows"}</span>
      <span class="sep">&middot;</span>
      <span>{tabsCount} {tabsCount === 1 ? "tab" : "tabs"}</span>
    </span>

    <SiteChips {sites} tabsNumber={tabsCount} />
  </button>

  <button
    type="button"
    disabled={$busy || $currentSessionSaved}
    class="flex-none rounded bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-content hover:bg-accent-focus disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
    on:click={() => dispatch("save")}
  >
    Save
  </button>
</div>
