<script lang="ts">
  export let path: string;
  export let title: string;

  export let group: string = window?.location?.href.split("#")[1] ?? "general";

  function getLocation() {
    if (window?.location?.href?.endsWith(`#${path}`)) group = path;
  }

  $: selected = group === path;
</script>

<svelte:window on:hashchange={getLocation} />

<a
  href="#{path}"
  aria-current={selected ? "page" : undefined}
  class="label -mb-px border-b-2 py-3 hover:text-ink {selected
    ? '!text-ink border-accent'
    : 'border-transparent'}">{title}</a
>
