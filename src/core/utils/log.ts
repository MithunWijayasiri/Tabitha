import { isDEV } from "@constants/shared";

export const log = {
  info: (...args: unknown[]) => isDEV && console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
