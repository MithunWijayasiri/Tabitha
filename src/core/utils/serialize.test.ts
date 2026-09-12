import { describe, expect, it } from "vitest";
import { createSerializer } from "./serialize";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("createSerializer", () => {
  it("holds a queued action until the running one settles", async () => {
    const serialize = createSerializer();
    const first = deferred<string>();
    const started: string[] = [];

    const a = serialize(async () => {
      started.push("a");

      return first.promise;
    });

    const b = serialize(async () => {
      started.push("b");

      return "b";
    });

    await Promise.resolve();

    expect(started).toEqual(["a"]);

    first.resolve("a");

    expect(await Promise.all([a, b])).toEqual(["a", "b"]);
    expect(started).toEqual(["a", "b"]);
  });

  it("runs actions in call order", async () => {
    const serialize = createSerializer();
    const order: number[] = [];

    const delays = [30, 10, 0];

    await Promise.all(
      delays.map((delay, index) =>
        serialize(async () => {
          await new Promise((resolve) => setTimeout(resolve, delay));

          order.push(index);
        }),
      ),
    );

    expect(order).toEqual([0, 1, 2]);
  });

  it("keeps draining after an action rejects", async () => {
    const serialize = createSerializer();

    const failed = serialize(async () => {
      throw new Error("write failed");
    });

    const next = serialize(async () => "next");

    await expect(failed).rejects.toThrow("write failed");
    expect(await next).toBe("next");
  });

  it("rejects only the caller whose action threw", async () => {
    const serialize = createSerializer();

    serialize(async () => {
      throw new Error("write failed");
    }).catch(() => {});

    await expect(serialize(async () => "fine")).resolves.toBe("fine");
  });

  it("gives each serializer its own queue", async () => {
    const one = createSerializer();
    const two = createSerializer();
    const blocker = deferred<void>();
    const started: string[] = [];

    one(async () => {
      started.push("one");

      return blocker.promise;
    });

    const independent = two(async () => {
      started.push("two");

      return "two";
    });

    expect(await independent).toBe("two");
    expect(started).toEqual(["one", "two"]);

    blocker.resolve();
  });
});
