"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
} from "react";
import { COUNTRIES, type Country } from "@/lib/data/countries";

interface Props {
  value:    string;                  // country code (ISO alpha-2), e.g. "AU"
  onChange: (country: Country) => void;
  label?:   string;
  required?: boolean;
}

export default function CountrySelect({ value, onChange, label = "Country", required }: Props) {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const [cursor, setCursor] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const listRef      = useRef<HTMLUListElement>(null);

  const selected = COUNTRIES.find(c => c.code === value) ?? null;

  const filtered = query.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.dialCode.includes(query) ||
        c.code.toLowerCase().includes(query.toLowerCase())
      )
    : COUNTRIES;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setCursor(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  // Keep highlighted item scrolled into view
  useEffect(() => {
    if (cursor < 0 || !listRef.current) return;
    const item = listRef.current.children[cursor] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const select = useCallback((country: Country) => {
    onChange(country);
    setOpen(false);
    setQuery("");
    setCursor(-1);
  }, [onChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (cursor >= 0 && filtered[cursor]) select(filtered[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setCursor(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Label */}
      <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 tracking-wide uppercase">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111]"
        style={{ color: selected ? "#111" : "#9CA3AF" }}
      >
        <span className="flex items-center gap-2.5 truncate">
          {selected ? (
            <>
              <span className="text-[18px] leading-none">{selected.flag}</span>
              <span className="font-medium">{selected.name}</span>
              <span className="text-[#9CA3AF] text-[13px]">{selected.dialCode}</span>
            </>
          ) : (
            "Select your country…"
          )}
        </span>
        <svg
          className="shrink-0 ml-2 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="#9CA3AF" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-xl overflow-hidden"
          style={{ maxHeight: 320 }}
        >
          {/* Search */}
          <div className="sticky top-0 bg-white border-b border-[#F3F4F6] px-3 py-2.5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setCursor(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search countries…"
                className="flex-1 bg-transparent text-[13px] text-[#111] placeholder-[#9CA3AF] outline-none"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); setCursor(-1); inputRef.current?.focus(); }}
                  className="text-[#9CA3AF] hover:text-[#374151]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <ul ref={listRef} className="overflow-y-auto" style={{ maxHeight: 240 }}>
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-[13px] text-[#9CA3AF] text-center">
                No countries found
              </li>
            ) : (
              filtered.map((country, i) => (
                <li
                  key={country.code}
                  onMouseDown={() => select(country)}
                  onMouseEnter={() => setCursor(i)}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-[13px]"
                  style={{
                    background: i === cursor
                      ? "#F3F4F6"
                      : country.code === value
                        ? "#F9FAFB"
                        : "transparent",
                    fontWeight: country.code === value ? 600 : 400,
                  }}
                >
                  <span className="text-[17px] leading-none shrink-0">{country.flag}</span>
                  <span className="flex-1 truncate text-[#111]">{country.name}</span>
                  <span className="text-[#9CA3AF] text-[12px] shrink-0">{country.dialCode}</span>
                  {country.code === value && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
