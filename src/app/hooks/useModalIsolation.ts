import React from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

let activeModalCount = 0;
let previousBodyOverflow = "";
let previousRootInert = false;
let previousRootAriaHidden: string | null = null;

function isolateApplication() {
  const root = document.getElementById("root");
  if (activeModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousRootInert = root?.inert ?? false;
    previousRootAriaHidden = root?.getAttribute("aria-hidden") ?? null;
    document.body.style.overflow = "hidden";
    if (root) {
      root.inert = true;
      root.setAttribute("aria-hidden", "true");
    }
  }
  activeModalCount += 1;

  return () => {
    activeModalCount = Math.max(0, activeModalCount - 1);
    if (activeModalCount !== 0) return;
    document.body.style.overflow = previousBodyOverflow;
    if (root) {
      root.inert = previousRootInert;
      if (previousRootAriaHidden === null) root.removeAttribute("aria-hidden");
      else root.setAttribute("aria-hidden", previousRootAriaHidden);
    }
  };
}

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(element => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");
}

interface ModalIsolationOptions {
  open: boolean;
  containerRef: React.RefObject<HTMLElement>;
  onDismiss: () => void;
  returnFocusRef?: React.RefObject<HTMLElement>;
}

export function useModalIsolation({ open, containerRef, onDismiss, returnFocusRef }: ModalIsolationOptions) {
  const onDismissRef = React.useRef(onDismiss);
  onDismissRef.current = onDismiss;

  React.useEffect(() => {
    if (!open) return;
    const previouslyFocused = returnFocusRef?.current
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const restoreApplication = isolateApplication();

    const frame = window.requestAnimationFrame(() => {
      const focusable = focusableElements(containerRef.current);
      (focusable[0] ?? containerRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismissRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = focusableElements(containerRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        containerRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !containerRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !containerRef.current?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      restoreApplication();
      window.requestAnimationFrame(() => previouslyFocused?.focus({ preventScroll: true }));
    };
  }, [containerRef, open, returnFocusRef]);
}
