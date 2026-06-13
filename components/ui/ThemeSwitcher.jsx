"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/context/ThemeContext";

const THEMES = [
  {
    name: "classical",
    label: "Cổ Điển",
    sublabel: "VN · CN · KR · JP",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    name: "modern",
    label: "Hiện Đại",
    sublabel: "EN · DE · FR · US",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
];

export default function ThemeSwitcher({ compact = false }) {
  const { name, isManual, setTheme, resetToAuto } = useTheme();
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const dropRef = useRef(null);

  const recalcPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }, []);

  const handleToggle = () => {
    if (!open) recalcPos();
    setOpen((v) => !v);
  };

  // Close on outside click — check BOTH button and dropdown so that
  // clicking a menu item (mousedown) does not close the dropdown
  // before the item's onClick fires.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const inBtn  = btnRef.current?.contains(e.target);
      const inDrop = dropRef.current?.contains(e.target);
      if (!inBtn && !inDrop) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reposition when viewport changes
  useEffect(() => {
    if (!open) return;
    const update = () => recalcPos();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, recalcPos]);

  const current = THEMES.find((t) => t.name === name) || THEMES[0];

  const dropdown = open && (
    <div
      ref={dropRef}
      className="w-52 bg-[var(--t-bg-panel)] border border-[var(--t-accent)]/30 shadow-2xl font-serif"
      style={{ position: "fixed", top: dropPos.top, right: dropPos.right, zIndex: 9999 }}
    >
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--t-accent)]/60" />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--t-accent)]/60" />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--t-accent)]/60" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--t-accent)]/60" />

      <div className="px-3 pt-2.5 pb-1.5">
        <p className="text-[9px] font-bold text-[var(--t-text-inv-2)] uppercase tracking-[0.25em]">
          Giao diện
        </p>
      </div>

      {THEMES.map((t) => {
        const active = name === t.name;
        return (
          <button
            key={t.name}
            onClick={() => { setTheme(t.name); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
              active
                ? "bg-[var(--t-primary)] text-[var(--t-text-inv)]"
                : "text-[var(--t-text-inv-2)] hover:bg-[var(--t-text)]/10 hover:text-[var(--t-text-inv)]"
            }`}
          >
            <span className={active ? "text-[var(--t-accent-lt)]" : ""}>{t.icon}</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wide leading-tight">
                {t.label}
                {active && <span className="ml-1.5 text-[8px] opacity-70">✓</span>}
              </span>
              <span className="text-[9px] opacity-50">{t.sublabel}</span>
            </div>
          </button>
        );
      })}

      {isManual && (
        <>
          <div className="h-px bg-[var(--t-text)]/20 mx-3 my-1" />
          <button
            onClick={() => { resetToAuto(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[var(--t-text-inv-2)] hover:text-[var(--t-text-inv)] hover:bg-[var(--t-text)]/10 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
            </svg>
            <span className="text-[10px] uppercase tracking-wide">Tự động theo ngôn ngữ</span>
          </button>
        </>
      )}

      <div className="px-3 pb-2 pt-1">
        <p className="text-[9px] text-[var(--t-text-inv-2)]/50 italic">
          {isManual
            ? "Đã lưu thủ công"
            : "Tự động · " + (name === "classical" ? "Ngôn ngữ cổ điển" : "Ngôn ngữ phương Tây")}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Đổi giao diện"
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--t-accent)]/40 hover:border-[var(--t-accent)]/80 text-[var(--t-accent)] hover:bg-[var(--t-accent)]/10 transition-all text-[10px] font-bold uppercase tracking-wider"
      >
        {current.icon}
        {!compact && <span className="hidden sm:inline">{current.label}</span>}
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </>
  );
}
