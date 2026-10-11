import { useSyncExternalStore } from 'react';

// Keep a live-session copy even when browser storage is denied or its quota is exhausted.
const memory = new Map<string, string | null>();
const listeners = new Set<() => void>();
let temporary = false;
function unavailable() {
  if (!temporary) { temporary = true; queueMicrotask(() => listeners.forEach(listener => listener())); }
}
export function readStorage(key: string): string | null {
  if (temporary && memory.has(key)) return memory.get(key) ?? null;
  try {
    if (typeof window === 'undefined') return memory.get(key) ?? null;
    const value = window.localStorage.getItem(key);
    if (value !== null) memory.set(key, value); else memory.delete(key);
    return value;
  } catch { unavailable(); return memory.get(key) ?? null; }
}
export function writeStorage(key: string, value: string): boolean {
  memory.set(key, value);
  try { window.localStorage.setItem(key, value); return true; }
  catch { unavailable(); return false; }
}
export function removeStorage(key: string): boolean {
  memory.set(key, null);
  try { window.localStorage.removeItem(key); return true; }
  catch { unavailable(); return false; }
}
export function useTemporaryStorage(): boolean {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, () => temporary, () => false);
}
