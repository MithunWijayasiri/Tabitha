<script lang="ts">
  import {
    currentSession,
    filtered,
    filterOptions,
    sessions,
    settings,
  } from "@/core/state";
  import {
    VirtualList,
    Windows,
    InputModal,
    ConfirmModal,
    TagsModal,
    Session,
    CurrentSession,
  } from "@/core/components";
  import { shouldIgnoreShortcut } from "@/core/utils";
  import { resolveKeybinding } from "@/core/constants";

  const selection = sessions.selection;

  $: if ($selection && typeof scrollToIndex !== "undefined" && !isScrolled) {
    isScrolled = true;
    scrollToIndex(
      $sessions.findIndex((session) => session.id === $selection.id),
    );
  }

  let modalShow = false;
  let modalType: "Save" | "Rename" = "Rename";

  let deleteShow = false;

  let scrollToIndex: (index: number) => void;

  let isScrolled = false;

  let tagsShow = false;

  async function saveSession(title: string) {
    $currentSession.title = title;

    const id = await sessions.add($currentSession);

    scrollToIndex($sessions.findIndex((session) => session.id === id));
  }

  export function saveAction() {
    modalType = "Save";
    if ($settings.doNotAskForTitle) return saveSession("Unnamed session");

    modalShow = true;
  }

  async function handleKeydown(ev: KeyboardEvent) {
    if (shouldIgnoreShortcut(ev)) return;

    const binding = resolveKeybinding(ev);

    if (!binding) return;

    switch (binding.code) {
      case "KeyS":
        saveAction();
        break;

      case "KeyC":
        selection.select($currentSession);
        break;

      case "KeyE": {
        const sessions = await $filtered;

        if (!sessions.length) break;

        let index =
          sessions.findIndex((session) => session.id === $selection.id) + 1;

        if (index >= sessions.length || index <= 0) index = 0;

        selection.select(sessions[index]!);
        scrollToIndex(index);
        break;
      }

      case "KeyD": {
        const sessions = await $filtered;

        if (!sessions.length) break;

        let index =
          sessions.findIndex((session) => session.id === $selection.id) - 1;

        if (index <= -1) index = sessions.length - 1;

        selection.select(sessions[index]!);

        scrollToIndex(index);
        break;
      }

      case "KeyR":
        modalType = "Rename";
        modalShow = true;
        break;

      case "Delete":
        deleteShow = true;
        break;

      default:
        return;
    }

    ev.preventDefault();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="flex min-h-0 flex-1">
  <div
    class="flex w-[280px] flex-none flex-col border-r-[1.5px] border-ink bg-panel xl:w-[340px]"
  >
    <p class="label px-4 pb-2 pt-3">Current</p>

    <CurrentSession on:save={saveAction} />

    <p class="label px-4 pb-2 pt-4">Saved sessions</p>

    {#await $filtered}
      <p class="px-4 text-xs text-ink-faint">Loading sessions…</p>
    {:then list}
      {#if list?.length}
        <VirtualList items={list} let:item class="flex-1" bind:scrollToIndex>
          <Session
            session={item}
            on:renameModal={() => {
              modalType = "Rename";
              modalShow = true;
            }}
            on:deleteModal={() => (deleteShow = true)}
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
    {/await}
  </div>

  <Windows class="flex-1" />
</div>

<InputModal
  bind:open={modalShow}
  type={modalType}
  on:inputSubmit={async (event) => {
    if (modalType === "Rename" && $selection.title !== event.detail) {
      selection.update((value) => {
        value.title = event.detail;
        return value;
      });

      await sessions.put($selection);

      scrollToIndex(
        $sessions.findIndex((session) => session.id === $selection.id),
      );
    } else if (modalType === "Save") {
      saveSession(event.detail);
    }

    modalShow = false;
  }}
/>

<ConfirmModal
  bind:open={deleteShow}
  title="Delete session"
  message="Delete “{$selection?.title ?? ''}”? This cannot be undone."
  confirmLabel="Delete"
  on:confirm={async () => {
    await sessions.remove($selection);

    selection.select($currentSession);

    deleteShow = false;
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
