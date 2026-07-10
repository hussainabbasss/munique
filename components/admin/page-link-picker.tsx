"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  filterSitePages,
  findSitePageByHref,
  type SitePageLink,
} from "@/lib/admin/site-pages";

type Props = {
  id?: string;
  name: string;
  value: string;
  required?: boolean;
};

export function PageLinkPicker({ id, name, value, required }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [href, setHref] = useState(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = findSitePageByHref(href);
  const options = filterSitePages(query);

  useEffect(() => {
    setHref(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function selectPage(page: SitePageLink) {
    setHref(page.href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleInputChange(nextQuery: string) {
    setQuery(nextQuery);
    if (!open) setOpen(true);
  }

  function handleInputFocus() {
    setOpen(true);
    setQuery("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, options.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const page = options[activeIndex];
      if (page) selectPage(page);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }

  const displayValue = open ? query : (selected?.label ?? href);

  return (
    <div ref={rootRef} className="admin-page-picker">
      <input type="hidden" name={name} value={href} required={required} />
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Search pages…"
        value={displayValue}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
      />
      {selected && !open && (
        <p className="admin-field-hint admin-page-picker-path">{selected.href}</p>
      )}
      {open && (
        <ul id={listId} className="admin-page-picker-list" role="listbox">
          {options.length === 0 ? (
            <li className="admin-page-picker-empty" role="option" aria-disabled>
              No pages match “{query.trim()}”
            </li>
          ) : (
            options.map((page, index) => (
              <li key={page.href} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={href === page.href}
                  className={
                    index === activeIndex
                      ? "admin-page-picker-option admin-page-picker-option-active"
                      : "admin-page-picker-option"
                  }
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectPage(page)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="admin-page-picker-label">{page.label}</span>
                  <span className="admin-page-picker-href">{page.href}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
