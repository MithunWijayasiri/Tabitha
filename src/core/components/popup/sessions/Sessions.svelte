<script lang="ts">
  import { onMount } from "svelte";
  import { filtered, filterOptions, sessions } from "@/core/state";
  import {
    VirtualList,
    Windows,
    InputModal,
    TagsModal,
    Session,
    CurrentSession,
  } from "@/core/components";
  import { provideCommandPorts, runCommand } from "@/core/commands";

  const selection = sessions.selection;

  let scrollToIndex: (index: number) => void;

  let isScrolled = false;

  let modalShow = false;
  let modalType: "Save" | "Rename" = "Rename";
  let resolveTitle: ((title?: string) => void) | undefined;

  let tagsShow = false;

  $: visible = $filtered ?? [];

  $: if ($selection && typeof scrollToIndex !== "undefined" && !isScrolled) {
    isScrolled = true;
    reveal($selection.id);
  }

  // A dismissed modal never dispatches, so the pending prompt is settled here.
  $: if (!modalShow && resolveTitle) {
    resolveTitle(undefined);
    resolveTitle = undefined;
  }

  function reveal(id: string) {
    const index = visible.findIndex((session) => session.id === id);

    if (index !== -1) scrollToIndex(index);
  }

  function promptTitle(type: "Save" | "Rename") {
    modalType = type;
    modalShow = true;

    return new Promise<string | undefined>(
      (resolve) => (resolveTitle = resolve),
    );
  }

  onMount(() =>
    provideCommandPorts({
      promptTitle,
      reveal,
      visibleSessions: () => visible,
    }),
  );
</script>

<div class="flex min-h-0 flex-1">
  <div
    class="flex w-[280px] flex-none flex-col border-r border-line bg-panel xl:w-[340px]"
  >
    <CurrentSession on:save={() => runCommand("save")} />

    {#if visible.length}
      <VirtualList items={visible} let:item class="flex-1" bind:scrollToIndex>
        <Session
          session={item}
          on:renameModal={() => runCommand("rename")}
          on:deleteModal={() => runCommand("delete")}
          on:tagsModal={() => (tagsShow = true)}
        />
      </VirtualList>
    {:else}
      <div class="border-t border-line px-4 py-6">
        {#if $filterOptions.query.trim()}
          <p class="text-xs font-medium text-ink-muted">
            No session or tab matches “{$filterOptions.query.trim()}”.
          </p>
        {:else if $filterOptions.tagsFilter !== "__all__"}
          <p class="text-xs font-medium text-ink-muted">
            No session carries the tag “{$filterOptions.tagsFilter}”.
          </p>
        {:else}
          <p class="text-xs font-medium text-ink-muted">
            You have not saved a session yet.
          </p>
          <p class="mt-2 text-xs text-ink-faint">
            Click Save to keep the windows and tabs you have open right now.
          </p>
        {/if}
      </div>
    {/if}
  </div>

  <Windows class="flex-1" />
</div>

<InputModal
  bind:open={modalShow}
  type={modalType}
  on:inputSubmit={(event) => {
    modalShow = false;

    resolveTitle?.(event.detail);
    resolveTitle = undefined;
  }}
/>

<TagsModal
  bind:open={tagsShow}
  on:tagSubmit={(event) => {
    const tag = event.detail;

    selection.update((value) => {
      value.tag = tag;
      return value;
    });

    sessions.put($selection);
  }}
/>
