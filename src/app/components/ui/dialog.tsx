import * as React from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";
import { cn } from "./utils";

type DialogContextValue = { open: boolean; setOpen: (open: boolean) => void };
const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog() {
  const value = React.useContext(DialogContext);
  if (!value) throw new Error("Dialog components must be used inside <Dialog>.");
  return value;
}

function Dialog({ open = false, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }) {
  const setOpen = React.useCallback((next: boolean) => onOpenChange?.(next), [onOpenChange]);
  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

function DialogTrigger({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return (
    <button type="button" data-slot="dialog-trigger" onClick={(e) => { onClick?.(e); if (!e.defaultPrevented) setOpen(true); }} {...props}>
      {children}
    </button>
  );
}

function DialogClose({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return (
    <button type="button" data-slot="dialog-close" onClick={(e) => { onClick?.(e); if (!e.defaultPrevented) setOpen(false); }} {...props}>
      {children}
    </button>
  );
}

function DialogPortal({ children }: { children?: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

function DialogOverlay({ className, onClick, ...props }: React.ComponentProps<"div">) {
  const { setOpen } = useDialog();
  return (
    <div
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      onClick={(e) => { onClick?.(e); if (!e.defaultPrevented) setOpen(false); }}
      {...props}
    />
  );
}

const DialogContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useDialog();

    React.useEffect(() => {
      if (!open) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", onKeyDown);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = previousOverflow;
      };
    }, [open, setOpen]);

    if (!open) return null;

    return (
      <DialogPortal>
        <DialogOverlay />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          data-slot="dialog-content"
          className={cn(
            "bg-white fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-neutral-200 p-6 shadow-xl sm:max-w-lg",
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
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
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
  return <h2 data-slot="dialog-title" className={cn("text-lg leading-none font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="dialog-description" className={cn("text-neutral-500 text-sm", className)} {...props} />;
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };