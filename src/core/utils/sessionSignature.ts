import type { Session } from "@/core/types";

/**
 * Identity of a session's tab layout, used to tell whether the current session
 * changed since it was last saved. Title, dates and favicons are excluded:
 * favicon compression is not byte-stable and an auto-generated title always differs.
 */
export function sessionSignature(session: Session | undefined): string {
  if (!session?.windows?.length) return "";

  return JSON.stringify(
    session.windows.map((window) => (window.tabs ?? []).map((tab) => tab.url)),
  );
}
