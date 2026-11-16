import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { autoUpdate, flip, hide, offset, shift, size, useFloating } from "@floating-ui/react-dom";
import { Check, ChevronDown } from "lucide-react";
import "../../../styles/dropdown.css";

type Option<T extends string> = { value: T; label: string };

interface DropdownProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
  align?: "start" | "end";
}

const menuPosition = [
  offset(4),
  flip({ padding: 8 }),
  shift({ padding: 8 }),
  size({
    padding: 8,
    apply({ availableWidth, availableHeight, rects, elements }) {
      const style = elements.floating.style;
      style.minWidth = Math.min(Math.max(rects.reference.width, 164), availableWidth) + "px";
      style.maxWidth = Math.max(0, availableWidth) + "px";
      style.maxHeight = Math.max(0, Math.min(320, availableHeight)) + "px";
    },
  }),
  hide(),
];

export function Dropdown<T extends string>({
  id, label, value, options, onChange, className = "", disabled = false, align = "start",
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const search = useRef({ text: "", time: 0 });
  const selected = options.findIndex(option => option.value === value);
  const inactive = disabled || options.length === 0;
  const expanded = open && !inactive;
  const menuId = id + "-listbox";
  const { refs, floatingStyles, isPositioned, middlewareData } = useFloating<HTMLButtonElement>({
    open: expanded, placement: `bottom-${align}`, strategy: "fixed",
    whileElementsMounted: autoUpdate, middleware: menuPosition,
  });

  useEffect(() => {
    if (!expanded) return;
    function dismiss(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !refs.reference.current?.contains(target) && !refs.floating.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, [expanded, refs]);

  useEffect(() => {
    if (inactive || (expanded && middlewareData.hide?.referenceHidden)) setOpen(false);
  }, [inactive, expanded, middlewareData.hide?.referenceHidden]);

  useLayoutEffect(() => {
    const menu = refs.floating.current;
    const row = menu?.children[active];
    if (!expanded || !isPositioned || !menu || !(row instanceof HTMLElement)) return;
    const top = row.offsetTop;
    if (top < menu.scrollTop) menu.scrollTop = top;
    else if (top + row.offsetHeight > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = top + row.offsetHeight - menu.clientHeight;
    }
  }, [active, expanded, isPositioned, refs]);

  function show(index = Math.max(0, selected)) {
    search.current = { text: "", time: 0 };
    setActive(index);
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    setOpen(false);
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.metaKey || event.ctrlKey || event.nativeEvent.isComposing) return;
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!expanded) show();
        else if (event.altKey && event.key === "ArrowUp") choose(active);
        else setActive(Math.max(0, Math.min(last, active + (event.key === "ArrowDown" ? 1 : -1))));
        return;
      }
      case "Home":
      case "End": {
        event.preventDefault();
        const index = event.key === "Home" ? 0 : last;
        if (expanded) setActive(index);
        else show(index);
        return;
      }
      case "Enter":
      case " ":
        event.preventDefault();
        if (expanded) choose(active);
        else show();
        return;
      case "Escape":
        if (expanded) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
        return;
      case "Tab":
        if (expanded) choose(active);
        return;
    }
    if (event.altKey || event.key.length !== 1) return;
    event.preventDefault();
    const now = Date.now();
    const char = event.key.toLocaleLowerCase();
    const prefix = now - search.current.time < 650 ? search.current.text + char : char;
    const repeated = [...prefix].every(letter => letter === char);
    const query = repeated ? char : prefix;
    const start = expanded ? active : selected;
    const offset = prefix.length === 1 || repeated ? 1 : 0;
    for (let i = 0; i < options.length; i++) {
      const index = (Math.max(0, start) + offset + i) % options.length;
      if (!options[index].label.toLocaleLowerCase().startsWith(query)) continue;
      if (expanded) setActive(index);
      else show(index);
      break;
    }
    search.current = { text: prefix, time: now };
  }

  return <>
    <button id={id} type="button" role="combobox" ref={refs.setReference}
      aria-label={label} aria-haspopup="listbox" aria-expanded={expanded}
      aria-controls={expanded ? menuId : undefined}
      aria-activedescendant={expanded ? `${menuId}-${active}` : undefined}
      disabled={inactive} className={`onod-dropdown ${className}`}
      onClick={event => {
        event.currentTarget.focus({ preventScroll: true });
        if (expanded) setOpen(false);
        else show();
      }}
      onBlur={() => setOpen(false)} onKeyDown={keyDown}>
      <span className="onod-dropdown-value">{options[selected]?.label ?? value}</span>
      <ChevronDown aria-hidden="true" className="onod-dropdown-arrow" />
    </button>
    {expanded && createPortal(
      <ul id={menuId} role="listbox" aria-label={label} ref={refs.setFloating}
        className="onod-dropdown-menu" style={{ ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }}
        onMouseDown={event => event.preventDefault()}>
        {options.map((option, index) => (
          <li key={option.value} id={`${menuId}-${index}`} role="option"
            aria-selected={index === selected} data-active={index === active || undefined}
            onPointerMove={event => { if (event.pointerType === "mouse") setActive(index); }}
            onClick={() => choose(index)}>
            <span>{option.label}</span>
            {index === selected && <Check aria-hidden="true" />}
          </li>
        ))}
      </ul>, document.body)}
  </>;
}
