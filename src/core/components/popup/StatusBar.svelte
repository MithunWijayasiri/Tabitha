<script lang="ts">
  import type { UiNotification } from "@/core/types";
  import { onDestroy } from "svelte";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { currentSessionSaved, notification } from "@/core/state";

  let toast: UiNotification | undefined;
  let timer: ReturnType<typeof setTimeout>;

  $: show($notification);

  function show(detail: UiNotification | undefined) {
    clearTimeout(timer);

    toast = detail;

    if (!detail) return;

    timer = setTimeout(() => (toast = undefined), detail.duration ?? 4000);
  }

  onDestroy(() => clearTimeout(timer));

  // A transient notification outranks the standing hint.
  let message: UiNotification | undefined;

  $: message =
    toast ??
    ($currentSessionSaved
      ? { type: "info", msg: "Change a tab before saving again" }
      : undefined);

  $: band =
    message?.type === "success"
      ? "bg-success"
      : message?.type === "warning"
        ? "bg-ochre"
        : message?.type === "error"
          ? "bg-danger"
          : "bg-accent";
</script>

<footer
  class="flex flex-none items-center gap-1.5 border-t border-line bg-panel px-4 py-1.5"
>
  <kbd class="kbd">Ctrl</kbd>
  <kbd class="kbd">K</kbd>
  <span class="label ml-1.5">Command palette</span>

  <div class="ml-auto min-w-0 pl-4" role="status" aria-live="polite">
    {#if message}
      {#key message}
        <div
          class="flex items-center gap-2.5 overflow-hidden"
          in:fly|global={{ y: 8, duration: 200, easing: cubicOut }}
        >
          <span class="h-3.5 w-1 flex-none rounded-full {band}"></span>
          <p class="flex-none text-xs font-semibold text-ink">{message.msg}</p>
          {#if message.detail}
            <p class="truncate text-xs text-ink-muted">{message.detail}</p>
          {/if}
        </div>
      {/key}
    {/if}
  </div>
</footer>
