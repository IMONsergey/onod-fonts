import React from "react";

export type FontRuntimeStatus = "idle" | "loading" | "ready" | "error";

export interface FontRuntimeSnapshot {
  status: FontRuntimeStatus;
  message?: string;
  updatedAt: number;
}

const DEFAULT_SNAPSHOT: FontRuntimeSnapshot = { status: "idle", updatedAt: 0 };
const snapshots = new Map<string, FontRuntimeSnapshot>();
const listeners = new Map<string, Set<() => void>>();

export function getFontRuntimeSnapshot(fontId: string): FontRuntimeSnapshot {
  return snapshots.get(fontId) ?? DEFAULT_SNAPSHOT;
}

export function setFontRuntimeStatus(fontId: string, status: FontRuntimeStatus, message?: string) {
  const previous = snapshots.get(fontId);
  if (previous?.status === status && previous?.message === message) return;
  snapshots.set(fontId, { status, message, updatedAt: Date.now() });
  listeners.get(fontId)?.forEach(listener => listener());
}

export function subscribeFontRuntime(fontId: string, listener: () => void) {
  let fontListeners = listeners.get(fontId);
  if (!fontListeners) {
    fontListeners = new Set();
    listeners.set(fontId, fontListeners);
  }
  fontListeners.add(listener);
  return () => {
    fontListeners?.delete(listener);
    if (fontListeners?.size === 0) listeners.delete(fontId);
  };
}

export function useFontRuntimeStatus(fontId: string): FontRuntimeSnapshot {
  return React.useSyncExternalStore(
    React.useCallback(listener => subscribeFontRuntime(fontId, listener), [fontId]),
    React.useCallback(() => getFontRuntimeSnapshot(fontId), [fontId]),
    () => DEFAULT_SNAPSHOT,
  );
}
