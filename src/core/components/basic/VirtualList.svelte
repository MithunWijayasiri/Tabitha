<script lang="ts">
  import { afterUpdate } from "svelte";
  import { createViewportCalculator } from "@utils/viewport";
  import { getScrollbarPadding } from "@utils/scrollbar";

  export { className as class };
  let className: string = "";

  type T = $$Generic;

  export let items: T[];

  export let start: number = 0;
  export let end: number = 0;

  export function scrollToIndex(
    index: number,
    behavior: ScrollBehavior = "smooth",
  ) {
    if (index < 0) return;

    divEl?.scrollTo({
      top: (divEl?.scrollHeight / items.length) * index,
      left: 0,
      behavior: behavior,
    });
  }

  let scrollBarPadding = "0";

  let viewport = { start: 0, end: 0, paddingTop: 0, paddingBottom: 0 };

  let divEl: HTMLDivElement;
  let timeout: NodeJS.Timeout;

  const getViewport = createViewportCalculator();

  function computeViewport() {
    const next = getViewport(divEl, items?.length, 300);

    // A fresh object every call would dirty the component and force a second render pass.
    if (
      next.start === viewport.start &&
      next.end === viewport.end &&
      next.paddingTop === viewport.paddingTop &&
      next.paddingBottom === viewport.paddingBottom
    )
      return;

    viewport = next;
    start = viewport.start;
    end = viewport.end;
  }

  afterUpdate(() => {
    computeViewport();

    scrollBarPadding = getScrollbarPadding(divEl);
  });

  function handleScroll() {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(computeViewport, 5);
  }
</script>

{#if items && items.length}
  <div
    bind:this={divEl}
    style:padding-right={scrollBarPadding}
    class="overflow-y-auto {className}"
    on:scroll={handleScroll}
  >
    <ul
      style:padding-top="{viewport.paddingTop}px"
      style:padding-bottom="{viewport.paddingBottom}px"
    >
      <!--  eslint-disable-next-line @typescript-eslint/no-unused-vars -->
      {#each { length: end - start } as _, i (i)}
        {@const item = items[i + start]}
        <slot {item} />
      {/each}
    </ul>
  </div>
{/if}
