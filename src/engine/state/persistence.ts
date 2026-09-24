/**
 * Session persistence (PROGRESSION_LOGIC.md §7; assessment.json
 * progression.autosave). Full CandidateState is saved to localStorage under a
 * versioned key on every action, and loaded on boot. Corrupt JSON, a version
 * mismatch, or a shape that fails validation returns null so the caller can
 * start fresh — this module never throws into the UI.
 *
 * The storage backend is injectable so node tests can use an in-memory shim.
 */

import type { CandidateState } from "../../types";

export const STATE_VERSION = 2;
export const STORAGE_KEY = `vistara-ir-sim:v${STATE_VERSION}`;

/** Minimal subset of the Web Storage API this module relies on. */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory shim for tests / non-browser environments. */
export function createMemoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function defaultStorage(): StorageAdapter {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // Accessing localStorage can throw (e.g. disabled cookies) — fall through.
  }
  return createMemoryStorage();
}

/**
 * Structural sanity check — not a full schema validation, just enough to
 * prove the payload is a CandidateState of the current version.
 */
function isCandidateState(value: unknown): value is CandidateState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === STATE_VERSION &&
    typeof v.candidateName === "string" &&
    typeof v.candidateRole === "string" &&
    typeof v.startedAt === "string" &&
    typeof v.currentPhase === "string" &&
    typeof v.phaseStatus === "object" &&
    v.phaseStatus !== null &&
    typeof v.taskStatus === "object" &&
    v.taskStatus !== null &&
    typeof v.submissions === "object" &&
    v.submissions !== null &&
    Array.isArray(v.revealedEvidence) &&
    Array.isArray(v.viewedEvidence) &&
    Array.isArray(v.hintsUsed) &&
    typeof v.safeState === "object" &&
    v.safeState !== null &&
    typeof v.consequences === "object" &&
    v.consequences !== null &&
    Array.isArray(v.nudgedPhases) &&
    typeof v.finished === "boolean"
  );
}

export class Persistence {
  private storage: StorageAdapter;
  private key: string;

  constructor(storage?: StorageAdapter, key: string = STORAGE_KEY) {
    this.storage = storage ?? defaultStorage();
    this.key = key;
  }

  /** Serialize and persist; swallow storage failures (quota, private mode). */
  save(state: CandidateState): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(state));
    } catch {
      // Autosave must never break the run.
    }
  }

  /** Load the saved state, or null when absent/corrupt/wrong version. */
  load(): CandidateState | null {
    let raw: string | null;
    try {
      raw = this.storage.getItem(this.key);
    } catch {
      return null;
    }
    if (raw === null) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    return isCandidateState(parsed) ? parsed : null;
  }

  clear(): void {
    try {
      this.storage.removeItem(this.key);
    } catch {
      // Ignore.
    }
  }
}
