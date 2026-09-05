<script lang="ts">
  import { IconButton } from "@/core/components";

  export let open = false;

  export let width = "fit-content";

  let dialogEl: HTMLDialogElement;

  $: if (open) dialogEl?.showModal();
  else dialogEl?.close();
</script>

<dialog
  bind:this={dialogEl}
  class="max-w-3xl rounded border-[1.5px] border-ink bg-panel p-0 text-ink outline-none"
  on:mousedown|self={() => (open = false)}
  on:keydown={(event) => {
    if (event.key === "Escape") open = false;
  }}
>
  <div
    role="none"
    style:width
    class="flex min-w-[20rem] flex-col gap-4 px-5 py-4"
    on:click|stopPropagation
  >
    {#if $$slots.header}
      <div class="flex items-center gap-4 border-b border-line pb-3">
        <h2 class="text-lg leading-none">
          <slot name="header" />
        </h2>

        <IconButton
          icon="close"
          title="Close"
          class="ml-auto text-lg text-ink-muted hover:text-danger"
          on:click={() => (open = false)}
        />
      </div>
    {/if}

    <slot name="content" />

    {#if $$slots.footer}
      <div class="ml-auto mt-2 flex gap-2">
        <button
          class="rounded border border-line px-4 py-1.5 text-xs font-semibold text-ink-muted hover:bg-panel-alt hover:text-ink"
          type="button"
          on:click={() => (open = false)}>Cancel</button
        >
        <slot name="footer" />
      </div>
    {/if}
  </div>
</dialog>

<style>
  dialog::backdrop {
    background-color: rgb(0 0 0 / 0.55);
  }
</style>
