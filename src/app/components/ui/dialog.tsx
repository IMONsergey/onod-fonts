import * as React from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";
import { cn } from "./utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog() {
  const value = React.useContext(DialogContext);
  if (!value) throw new Error("Dialog components must be used inside <Dialog>.");
  return value;
}

function Dialog({ open = false, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }) {
  const baseId = React.useId();
  const setOpen = React.useCallback((next: boolean) => onOpenChange?.(next), [onOpenChange]);
  const value = React.useMemo(() => ({
    open,
    setOpen,
    titleId: `${baseId}-title`,
    descriptionId: `${baseId}-description`,
  }), [baseId, open, setOpen]);
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

function DialogTrigger({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return <button type="button" data-slot="dialog-trigger" onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) setOpen(true); }} {...props}>{children}</button>;
}

function DialogClose({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return <button type="button" data-slot="dialog-close" onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) setOpen(false); }} {...props}>{children}</button>;
}

function DialogPortal({ children }: { children?: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

function DialogOverlay({ className, onClick, ...props }: React.ComponentProps<"div">) {
  const { setOpen } = useDialog();
  return <div data-slot="dialog-overlay" className={cn("fixed inset-0 z-50 bg-black/50", className)} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) setOpen(false); }} {...props} />;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const DialogContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, children, ...props }, forwardedRef) => {
    const { open, setOpen, titleId, descriptionId } = useDialog();
    const localRef = React.useRef<HTMLDivElement>(null);
    const previousActiveRef = React.useRef<HTMLElement | null>(null);

    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);

    React.useEffect(() => {
      if (!open) return;
      previousActiveRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const focusFirst = () => {
        const focusables = Array.from(localRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) || []);
        (focusables[0] || localRef.current)?.focus();
      };
      const raf = requestAnimationFrame(focusFirst);

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          setOpen(false);
          return;
        }
        if (event.key !== "Tab") return;

        const focusables = Array.from(localRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) || []).filter(element => !element.hasAttribute('disabled'));
        if (!focusables.length) {
          event.preventDefault();
          localRef.current?.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || !localRef.current?.contains(active))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      };

      document.addEventListener("keydown", onKeyDown);
      return () => {
        cancelAnimationFrame(raf);
        document.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = previousOverflow;
        requestAnimationFrame(() => previousActiveRef.current?.focus());
      };
    }, [open, setOpen]);

    if (!open) return null;

    return (
      <DialogPortal>
        <DialogOverlay />
        <div
          ref={localRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          data-slot="dialog-content"
          className={cn(
            "bg-white fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-neutral-200 p-6 shadow-xl outline-none sm:max-w-lg",
            className,
          )}
          {...props}
        >
          {children}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = "DialogContent";

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const { titleId } = useDialog();
  return <h2 id={titleId} data-slot="dialog-title" className={cn("text-lg leading-none font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { descriptionId } = useDialog();
  return <p id={descriptionId} data-slot="dialog-description" className={cn("text-neutral-500 text-sm", className)} {...props} />;
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };
