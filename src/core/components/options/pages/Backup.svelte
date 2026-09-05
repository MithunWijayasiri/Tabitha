<script lang="ts">
  import { settings } from "@/core/state";
  import { Section, Switch } from "@/core/components";
  import { exportBackup, importBackup } from "@/core/utils";
</script>

<Section
  title="Backup"
  description="Write every saved session to a file, or read sessions back in from one."
>
  <Switch
    title="Compress the export file"
    description="Writes a .tab file. Turn this off to write readable .tab.json instead."
    checked={$settings.exportCompressed}
    on:change={() => {
      settings.changeSetting("exportCompressed", !$settings.exportCompressed);
    }}
  />

  <div class="flex gap-3 border-t border-line py-4">
    <button
      type="button"
      class="rounded bg-accent px-4 py-1.5 text-xs font-semibold text-accent-content hover:bg-accent-focus"
      on:click={() => exportBackup($settings.exportCompressed)}
    >
      Export sessions
    </button>

    <label
      class="cursor-pointer rounded border border-line px-4 py-1.5 text-xs font-semibold text-ink-muted hover:bg-panel-alt hover:text-ink"
    >
      Import sessions
      <input
        type="file"
        class="hidden"
        on:change={importBackup}
        accept=".tab, .tab.json, .txt"
      />
    </label>
  </div>

  <p class="text-xs text-ink-faint">
    Importing adds the sessions in the file to the ones you already have. It
    does not replace them.
  </p>
</Section>
