<script lang="ts">
  import type { SessionSummary } from "@/core/types";
  import { createEventDispatcher } from "svelte";
  import { settings, filterOptions, sessions } from "@/core/state";
  import { IconButton } from "@/core/components";
  import {
    sendMessage,
    highlightMatch,
    sessionStore,
    getRelativeTime,
  } from "@/core/utils";

  export let session: SessionSummary;

  const selected = sessions.selection;

  const dispatch = createEventDispatcher();

  $: title = highlightMatch(session?.title, $filterOptions?.query.trim(), {
    caseSensitive: false,
  });

  $: isSelected = $selected?.id === session.id;

  $: band = session?.tag
    ? ($settings.tags[session.tag]?.bgColor ?? "hsl(var(--accent))")
    : "hsl(var(--line))";

  async function openSession() {
    const full = await sessionStore.hydrate(session);

    sendMessage({
      message: "restoreSession",
      session: full,
      discarded: $settings.discarded,
    });
  }
</script>

<li
  class="group relative border-t border-line {isSelected
    ? 'bg-accent-soft'
    : 'hover:bg-panel-alt'}"
>
  <div class="flex items-center gap-3 pr-3">
    <span
      class="w-[5px] self-stretch rounded-r-[3px]"
      style:background-color={band}
    ></span>

    <button
      type="button"
      class="min-w-0 flex-1 py-2.5 text-left"
      on:click={() => selected.select(session)}
    >
      <h2 class="truncate pr-16 text-[15px] leading-tight">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html title}
      </h2>

      <span class="facts mt-1.5">
        <span
          >{session?.windowsNumber}
          {session?.windowsNumber === 1 ? "window" : "windows"}</span
        >
        <span class="sep">&middot;</span>
        <span
          >{session?.tabsNumber}
          {session?.tabsNumber === 1 ? "tab" : "tabs"}</span
        >
        {#if session?.dateSaved}
          <span class="sep">&middot;</span>
          <span>{getRelativeTime(session.dateSaved)}</span>
        {/if}
        {#if session.tag}
          <span class="sep">&middot;</span>
          <span class="truncate uppercase tracking-[0.12em]">{session.tag}</span
          >
        {/if}
      </span>
    </button>
  </div>

  <div
    class="absolute right-3 top-2 hidden items-center gap-2.5 group-hover:flex"
  >
    <IconButton
      icon="open"
      title="Restore session"
      class="text-base text-ink-muted hover:text-accent-focus"
      on:click={openSession}
    />

    <IconButton
      icon="rename"
      title="Rename"
      class="text-base text-ink-muted hover:text-accent-focus"
      on:click={async () => {
        await selected.select(session);
        dispatch("renameModal");
      }}
    />

    <IconButton
      icon={session?.tag ? "untag" : "tag"}
      title={session?.tag ? "Remove tag" : "Add tag"}
      class="text-base text-ink-muted hover:text-accent-focus"
      on:click={async () => {
        await selected.select(session);

        if (!session?.tag) return dispatch("tagsModal");

        const full = await sessionStore.hydrate(session);

        delete full.tag;

        sessions.put(full);
      }}
    />

    <IconButton
      icon="delete"
      title="Delete"
      class="text-base text-ink-muted hover:text-danger"
      on:click={async () => {
        await selected.select(session);
        dispatch("deleteModal");
      }}
    />
  </div>
</li>
