/**
 * One FIFO queue per context. Writes that read state and write it back — a save
 * signature, the session list — would read stale state if they overlapped.
 */
export function createSerializer() {
  let tail: Promise<unknown> = Promise.resolve();

  return function serialize<T>(action: () => Promise<T>): Promise<T> {
    // Both arms: a rejected action must not stall everything behind it.
    const run = tail.then(action, action);

    tail = run.catch(() => {});

    return run;
  };
}
