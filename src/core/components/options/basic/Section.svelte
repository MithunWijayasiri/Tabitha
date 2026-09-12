<script lang="ts">
  export let title: string | undefined | null = undefined;
  export let description: string | undefined = undefined;
</script>

<section>
  {#if title}
    <h2 class="opsz-lg text-lg leading-none">{title}</h2>
  {/if}

  {#if description}
    <p class="mt-1.5 max-w-[52ch] text-xs text-ink-faint">{description}</p>
  {/if}

  <div class="mt-3 flex flex-col">
    <slot />
  </div>
</section>
