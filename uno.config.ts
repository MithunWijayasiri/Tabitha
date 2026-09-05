import {
  defineConfig,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default defineConfig({
  content: { filesystem: ["./src/**/*.{html,js,ts,svelte}"] },
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      scrim: "rgb(0 0 0 / 0.55)",

      page: token("page"),
      panel: token("panel"),
      "panel-alt": token("panel-alt"),
      line: token("line"),

      ink: token("ink"),
      "ink-muted": token("ink-muted"),
      "ink-faint": token("ink-faint"),

      accent: token("accent"),
      "accent-focus": token("accent-focus"),
      "accent-soft": token("accent-soft"),
      "accent-content": token("accent-content"),

      ochre: token("ochre"),
      success: token("success"),
      danger: token("danger"),
      "danger-focus": token("danger-focus"),

      link: token("link"),
      "link-focus": token("link-focus"),

      tooltip: token("tooltip"),
      "tooltip-content": token("tooltip-content"),
    },

    fontFamily: {
      sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      display: "Fraunces, Georgia, 'Times New Roman', serif",
      mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    },
  },
  presets: [presetUno({})],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
