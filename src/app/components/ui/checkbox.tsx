import * as React from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "./utils";

type CheckboxProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

function Checkbox({ className, checked = false, onCheckedChange, disabled, ...props }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      data-slot="checkbox"
      disabled={disabled}
      className={cn(
        "peer border bg-white data-[state=checked]:bg-neutral-800 data-[state=checked]:text-white data-[state=checked]:border-neutral-800 size-4 shrink-0 rounded-[4px] shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented && !disabled) onCheckedChange?.(!checked);
      }}
      {...props}
    >
      <span className="flex items-center justify-center text-current transition-none" aria-hidden="true">
        {checked ? <CheckIcon className="size-3.5" /> : null}
      </span>
    </button>
  );
}

export { Checkbox };
