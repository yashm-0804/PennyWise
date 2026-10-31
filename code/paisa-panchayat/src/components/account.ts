/** Prototype sign-in: a name kept on this device. There's no password and no server account yet, and the screen says so. */
import { useSyncExternalStore } from "react";

const KEY = "pennywise.name";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return memory;
  }
}
let memory: string | null = null;

export function signIn(name: string): void {
  memory = name.trim();
  try {
    window.localStorage.setItem(KEY, memory);
  } catch {
    // Private windows can refuse storage. The name then lasts until the page closes.
  }
  listeners.forEach((l) => l());
}

export function signOut(): void {
  memory = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing stored, so nothing to clear.
  }
  listeners.forEach((l) => l());
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** undefined while the server renders, null when signed out, otherwise the name. */
export function useAccountName(): string | null | undefined {
  return useSyncExternalStore<string | null | undefined>(subscribe, read, () => undefined);
}
