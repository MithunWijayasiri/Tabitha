<script lang="ts">
  import {
    commands,
    confirmRequest,
    paletteOpen,
    runCommand,
  } from "@/core/commands";
  import { resolveKeybinding } from "@/core/constants";
  import { sessions } from "@/core/state";
  import { shouldIgnoreShortcut } from "@/core/utils";
  import { CommandPalette, ConfirmModal } from "@/core/components";

  const busy = sessions.busy;

  let confirmOpen = false;

  $: confirmOpen = !!$confirmRequest;

  $: if (!confirmOpen) confirmRequest.set(undefined);

  function handleKeydown(ev: KeyboardEvent) {
    // Mutations queue rather than drop, so a held key would run once per repeat.
    if (ev.repeat || shouldIgnoreShortcut(ev, true)) return;

    const binding = resolveKeybinding(ev);

    if (!binding) return;

    ev.preventDefault();

    runCommand(binding.id);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<CommandPalette bind:open={$paletteOpen} commands={$commands} />

<ConfirmModal
  bind:open={confirmOpen}
  title={$confirmRequest?.title ?? ""}
  message={$confirmRequest?.message ?? ""}
  confirmLabel={$confirmRequest?.confirmLabel ?? "Delete"}
  disabled={$busy}
  on:confirm={() => {
    $confirmRequest?.run();

    confirmRequest.set(undefined);
  }}
/>
