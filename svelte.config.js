import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  compilerOptions: {
    // `new Popup({ target })` must compile to createClassComponent so svelte's
    // mount() runs init_operations; without it the popup throws on first render
    compatibility: {
      componentApi: 4,
    },
  },
};
