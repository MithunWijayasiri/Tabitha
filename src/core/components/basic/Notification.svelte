<script lang="ts">
  import type { UiNotification } from "@/core/types";
  import { slide } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { IconButton } from "@/core/components";

  let {
    detail,
    slideDuration = 400,
  }: { detail: UiNotification; slideDuration?: number } = $props();

  let hidden = $state(false);
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  let show = $derived(!!detail && !hidden);

  let band = $derived(
    detail?.type === "success"
      ? "bg-success"
      : detail?.type === "warning"
        ? "bg-ochre"
        : detail?.type === "error"
          ? "bg-danger"
          : "bg-accent",
  );

  $effect(() => {
    if (!detail) return;

    hidden = false;

    hideTimer = setTimeout(() => {
      hidden = true;
    }, detail?.duration ?? 4000);

    return () => clearTimeout(hideTimer);
  });
</script>

{#if show && detail}
  {#key detail}
    <div
      role="status"
      class="absolute bottom-5 right-5 z-30 flex w-max max-w-sm items-center gap-3 overflow-hidden rounded border border-line bg-panel pr-2 shadow-lg shadow-black/20"
      transition:slide|global={{ duration: slideDuration, easing: cubicInOut }}
    >
      <span class="w-1 self-stretch {band}"></span>

      <p class="py-2 text-xs font-semibold text-ink">
        {detail.msg}
      </p>

      <IconButton
        icon="close"
        title="Dismiss"
        class="text-base text-ink-muted hover:text-danger"
        on:click={() => (hidden = true)}
      />
    </div>
  {/key}
{/if}
