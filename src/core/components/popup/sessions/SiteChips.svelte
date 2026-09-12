<script lang="ts">
  import type { SiteCount } from "@/core/types";
  import { siteLabel } from "@/core/utils";

  export let sites: SiteCount[] | undefined = undefined;
  export let tabsNumber: number;

  $: listed = sites ?? [];

  $: others =
    tabsNumber - listed.reduce((total, site) => total + site.count, 0);
</script>

<!-- Fixed height, never wraps: VirtualList derives row height from the first row. -->
<span class="mt-1.5 flex h-4 items-center gap-1 overflow-hidden">
  {#if listed.length}
    {#each listed as site (site.domain)}
      <span class="chip">
        <span class="font-semibold text-ink">{site.count}</span>
        {siteLabel(site.domain)}
      </span>
    {/each}

    {#if others > 0}
      <span class="chip text-ink-faint">{others} others</span>
    {/if}
  {/if}
</span>
