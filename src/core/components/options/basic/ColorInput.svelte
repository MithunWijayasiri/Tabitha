<script lang="ts">
  export let color: string;
</script>

<label class="flex max-w-max cursor-pointer items-center gap-2">
  <span class="label"><slot /></span>
  <!-- Color swatch opening a hidden native color picker. -->
  <span
    class="h-6 w-12 overflow-hidden rounded-sm border border-line"
    style:background-color={color}
  >
    <input
      type="color"
      class="invisible h-full w-full"
      bind:value={color}
      on:change
    />
  </span>
</label>
