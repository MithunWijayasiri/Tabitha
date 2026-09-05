<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Modal } from "@/core/components";

  export let open: boolean;

  export let title = "Delete session";
  export let message = "Delete this session? This cannot be undone.";
  export let confirmLabel = "Delete";

  const dispatch = createEventDispatcher();
</script>

<Modal bind:open>
  <svelte:fragment slot="header">{title}</svelte:fragment>

  <p slot="content" class="max-w-[26rem] text-sm text-ink-muted">
    {message}
  </p>

  <button
    slot="footer"
    type="button"
    class="rounded bg-danger px-4 py-1.5 text-xs font-semibold text-white hover:bg-danger-focus"
    on:click={() => dispatch("confirm")}>{confirmLabel}</button
  >
</Modal>
