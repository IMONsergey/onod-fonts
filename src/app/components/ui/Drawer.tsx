import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useModalIsolation } from "@/hooks/useModalIsolation";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  returnFocusRef?: React.RefObject<HTMLElement>;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  returnFocusRef,
}: DrawerProps) {
  const { language } = useLanguage();
  const titleId = React.useId();
  const descriptionId = React.useId();
  const drawerRef = React.useRef<HTMLElement>(null);

  useModalIsolation({
    open,
    containerRef: drawerRef,
    onDismiss: () => onOpenChange(false),
    returnFocusRef,
  });

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] xl:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/25"
        aria-label={language === "ru" ? "Закрыть фильтры" : "Close filters"}
        onClick={() => onOpenChange(false)}
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(90vw,22rem)] flex-col border-r border-neutral-300 bg-white shadow-2xl outline-none",
          className,
        )}
      >
        <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-neutral-200 px-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-900">
              {title}
            </h2>
            {description && <p id={descriptionId} className="mt-0.5 text-xs text-neutral-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="onod-icon-button"
            aria-label={language === "ru" ? "Закрыть фильтры" : "Close filters"}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
