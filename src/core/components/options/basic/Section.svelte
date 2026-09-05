<script lang="ts">
  export let title: string | undefined | null = undefined;
  export let description: string | undefined = undefined;
</script>

<section>
  {#if title}
    <h2 class="opsz-lg text-xl leading-none">{title}</h2>
  {/if}

  {#if description}
    <p class="mt-2 text-xs text-ink-faint">{description}</p>
  {/if}

  <div class="mt-4 flex flex-col">
    <slot />
  </div>
</section>
