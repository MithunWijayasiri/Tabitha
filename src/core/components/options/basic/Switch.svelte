<script lang="ts">
  export let title: string;
  export let checked = false;
  export let description = "";
</script>

<label
  class="flex cursor-pointer items-center gap-4 border-t border-line py-3 hover:bg-panel-alt"
>
  <span class="min-w-0 flex-1">
    <span class="block text-sm font-medium text-ink">{title}</span>
    {#if description}
      <span class="mt-1 block text-xs text-ink-faint">{description}</span>
    {/if}
  </span>

  <!-- Visually hidden rather than display:none so it keeps keyboard focus and toggling. -->
  <input
    type="checkbox"
    role="switch"
    aria-label={title}
    bind:checked
    on:change
    class="sr-only"
  />

  <span
    aria-hidden="true"
    class="before:fade relative block h-5 w-9 flex-none rounded-full border-[1.5px] border-ink-faint before:absolute before:left-[2px] before:top-[2px] before:block before:h-[13px] before:w-[13px] before:rounded-full before:bg-ink-faint before:content-['']"
  ></span>
</label>

<style>
  input:checked + span {
    border-color: hsl(var(--accent));
  }

  input:checked + span:before {
    translate: 16px 0;
    background-color: hsl(var(--accent));
  }

  input:focus-visible + span {
    outline: 2px solid hsl(var(--accent));
    outline-offset: 2px;
  }
</style>
