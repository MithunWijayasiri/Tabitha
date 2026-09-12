import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
  type StoreNames,
} from "idb";
import type { UUID } from "crypto";
import type { Session, SessionSummary } from "@/core/types";
import { log } from "@/core/utils/log";
import { countSites } from "@/core/utils/sessionSites";

export function toSummary({ windows, ...summary }: Session): SessionSummary {
  return { ...summary, windowsNumber: windows.length };
}

interface DB extends DBSchema {
  sessions: {
    value: Session;
    key: UUID;
    indexes: { title: string; dateSaved: number; tag: string };
  };
}

class SessionStore {
  private static instance: SessionStore;
  private version = 3;
  private dbPromise?: Promise<IDBPDatabase<DB>>;

  constructor() {
    if (!SessionStore.instance) SessionStore.instance = this;

    return SessionStore.instance;
  }

  private get db() {
    this.dbPromise ??= openDB<DB>("tabitha", this.version, {
      upgrade: this.upgradeSessions,
    })
      .then((db) => {
        db.onerror = (event) => log.error("db error:", event);
        db.onabort = (event) => log.error("db transaction aborted:", event);

        return db;
      })
      .catch((error) => {
        log.error("failed to open db:", error);

        this.dbPromise = undefined;

        throw error;
      });

    return this.dbPromise;
  }

  async iterateSessions(
    index: keyof DB["sessions"]["indexes"] = "dateSaved",
    callback: (sessions: SessionSummary[]) => unknown,
    maxBatch?: number | IDBKeyRange,
    direction?: IDBCursorDirection,
  ) {
    const sessions: SessionSummary[] = [];

    const db = await this.db;
    const tx = db.transaction("sessions").store.index(index);

    const totalCount = await tx.count();
    let currentCount = 0;

    maxBatch ??= totalCount;

    for await (const cursor of tx.iterate(undefined, direction)) {
      sessions.push(toSummary(cursor.value));

      currentCount++;

      if (currentCount === maxBatch || sessions.length === totalCount) {
        currentCount = 0;
        callback(sessions);
      }
    }

    return totalCount;
  }

  async hydrate(summary: SessionSummary) {
    const db = await this.db;
    const session = await db.get("sessions", summary.id as UUID);

    if (!session) throw new Error(`Session ${summary.id} not found`);

    return session;
  }

  async filterSessions(query: string) {
    const needle = query.toLowerCase();

    const results: SessionSummary[] = [];

    const db = await this.db;
    const tx = db.transaction("sessions").store.index("dateSaved");

    for await (const cursor of tx.iterate()) {
      const session = cursor.value;

      const matches =
        session?.title?.toLowerCase().includes(needle) ||
        session.windows.some((window) =>
          window.tabs?.some((tab) => tab.title?.toLowerCase().includes(needle)),
        );

      if (matches) results.push(toSummary(session));
    }

    return results;
  }

  async saveSession(session: Session) {
    const db = await this.db;

    return db.add("sessions", session);
  }

  async saveSessions(sessions: Session[]) {
    const db = await this.db;
    const tx = db.transaction("sessions", "readwrite");

    return new Promise<void>((resolve, reject) => {
      for (const session of sessions) {
        tx.store.add(session);
      }

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        log.error("save failed:", sessions.length, "sessions");
        reject(new Error("Failed to save sessions"));
      };

      tx.onabort = () => {
        log.error("save aborted:", sessions.length, "sessions");
        reject(new Error("Saving sessions aborted"));
      };
    });
  }

  async updateSession(session: Session) {
    const db = await this.db;

    return db.put("sessions", session);
  }

  async deleteSession(session: SessionSummary) {
    const db = await this.db;

    return db.delete("sessions", session.id as UUID);
  }

  async getAutosavedCount() {
    const db = await this.db;

    return db.countFromIndex("sessions", "tag", "Autosave");
  }

  async deleteLastAutosavedSession(count: number = 1) {
    const db = await this.db;
    const tx = db.transaction("sessions", "readwrite").store.index("dateSaved");

    for await (const cursor of tx.iterate(null, "next")) {
      if (cursor.value.tag === "Autosave") {
        cursor.delete();

        count--;
        if (!count) break;
      }
    }
  }

  async deleteSessions() {
    const db = await this.db;

    return db.clear("sessions");
  }
  async upgradeSessions(
    db: IDBPDatabase<DB>,
    oldVersion: number,
    newVersion: number,
    transaction: IDBPTransaction<
      DB,
      ArrayLike<StoreNames<DB>>,
      "versionchange"
    >,
  ) {
    if (oldVersion < 1) {
      const sessionsStore = db.createObjectStore("sessions", {
        keyPath: "id",
      });

      sessionsStore.createIndex("title", "title", { unique: false });
      sessionsStore.createIndex("dateSaved", "dateSaved", { unique: false });
      sessionsStore.createIndex("tag", "tag", { unique: false });
    }

    // v1 stored the session tag under `tags`; rename to `tag`
    if (oldVersion === 1) {
      const sessionsStore = transaction.objectStore("sessions");

      sessionsStore.deleteIndex("tags");

      for (
        let cursor = await sessionsStore.openCursor();
        cursor;
        cursor = await cursor.continue()
      ) {
        const session = cursor.value as Session & { tags?: string };

        session.tag = session.tags;

        delete session.tags;

        cursor.update(session);
      }

      sessionsStore.createIndex("tag", "tag", { unique: false });
    }

    // Records older than v3 predate the stored domain breakdown.
    if (oldVersion > 0 && oldVersion < 3) {
      const sessionsStore = transaction.objectStore("sessions");

      for (
        let cursor = await sessionsStore.openCursor();
        cursor;
        cursor = await cursor.continue()
      ) {
        const session = cursor.value;

        session.sites = countSites(session.windows);

        cursor.update(session);
      }
    }
  }
}

export const sessionStore = new SessionStore();
