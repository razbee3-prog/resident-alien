"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { countries, flagSrc, type Country } from "@/lib/countries";

type Props = {
  value: Country;
  onChange: (c: Country) => void;
  label?: string;
  className?: string;
};

export function CountryPicker({ value, onChange, label = "Where are you from?", className = "" }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const blurTimer = useRef(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries.slice(0, 8);
    return countries
      .filter((c) => c.name.toLowerCase().includes(q) || c.a3.toLowerCase().startsWith(q) || c.a2.toLowerCase() === q)
      .slice(0, 8);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function choose(c: Country) {
    onChange(c);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={`${id}-input`} className="label">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 overflow-hidden rounded-[3px] border border-hairline-strong">
          <Image src={flagSrc(value.a2)} alt="" width={24} height={16} unoptimized className="block h-4 w-6 object-cover" />
        </span>
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
          className="field pl-12 pr-16"
          placeholder={value.name}
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => {
            window.clearTimeout(blurTimer.current);
            setOpen(true);
          }}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(results.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              if (open && results[active]) {
                e.preventDefault();
                choose(results[active]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.7rem] tracking-[0.12em] text-muted">
          {value.a3}
        </span>
      </div>

      {open ? (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          className="panel-2 absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-auto py-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,.9)]"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted">No country matches “{query}”. Try the English name or a three-letter code.</li>
          ) : (
            results.map((c, i) => (
              <li
                key={c.a2}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={c.a2 === value.a2}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm ${i === active ? "bg-white/[.06] text-ink" : "text-muted"}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(c);
                }}
              >
                <span className="overflow-hidden rounded-[3px] border border-hairline-strong">
                  <Image src={flagSrc(c.a2)} alt="" width={24} height={16} unoptimized className="block h-4 w-6 object-cover" />
                </span>
                <span className="flex-1">{c.name}</span>
                <span className="font-mono text-[0.68rem] tracking-[0.12em] text-faint">{c.a3}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
