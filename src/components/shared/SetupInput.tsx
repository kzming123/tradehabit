"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Plus } from "lucide-react";

const STORAGE_KEY = "tradehabit_custom_setups";

function loadSetups(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveSetup(name: string) {
  if (typeof window === "undefined") return;
  const existing = loadSetups();
  if (existing.includes(name)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([name, ...existing].slice(0, 30)));
}

function removeSetup(name: string) {
  if (typeof window === "undefined") return;
  const updated = loadSetups().filter((s) => s !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

interface SetupInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SetupInput({ value, onChange }: SetupInputProps) {
  const [inputText, setInputText] = useState("");
  const [savedSetups, setSavedSetups] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedSetups(loadSetups());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = savedSetups.filter(
    (s) => s.toLowerCase().includes(inputText.toLowerCase()) && s !== value
  );

  function selectSetup(name: string) {
    onChange(name);
    setInputText("");
    setShowDropdown(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && inputText.trim()) {
      e.preventDefault();
      const name = inputText.trim();
      saveSetup(name);
      setSavedSetups(loadSetups());
      selectSetup(name);
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
      setInputText("");
    }
  }

  function handleDelete(name: string) {
    removeSetup(name);
    setSavedSetups(loadSetups());
    if (value === name) onChange("");
  }

  const showSuggestions = showDropdown && (filtered.length > 0 || inputText.trim().length > 0);

  return (
    <div ref={containerRef} className="relative">
      {/* Selected tag */}
      {value && (
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f8fafc]/10 border border-[#f8fafc]/20 text-[13px] font-semibold text-[#f8fafc]">
            {value}
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[#475569] hover:text-[#f8fafc] transition-colors cursor-pointer ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Text input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={value ? "Change setup..." : "Type your setup name..."}
          className={cn(
            "w-full h-10 rounded-lg border bg-[#0f172a] px-3 pr-9 text-[13px] text-[#f8fafc] placeholder:text-[#334155]",
            "focus:outline-none focus:ring-1 transition-colors",
            showSuggestions
              ? "border-[#334155] ring-[#334155] rounded-b-none"
              : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]"
          )}
        />
        {inputText.trim() && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#475569] pointer-events-none">
            ↵
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showSuggestions && (
        <div className="absolute left-0 right-0 z-50 border border-[#334155] border-t-0 rounded-b-lg bg-[#0e1223] overflow-hidden shadow-xl shadow-black/40">
          {/* Suggestions from saved */}
          {filtered.map((s) => (
            <div
              key={s}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-[#0f172a] cursor-pointer group transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                selectSetup(s);
              }}
            >
              <span className="text-[13px] text-[#cbd5e1]">{s}</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDelete(s);
                }}
                className="opacity-0 group-hover:opacity-100 text-[#334155] hover:text-[#ef4444] transition-all cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* "Create" option for new name */}
          {inputText.trim() && !savedSetups.includes(inputText.trim()) && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 hover:bg-[#0f172a] cursor-pointer border-t border-[#0f172a] transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                const name = inputText.trim();
                saveSetup(name);
                setSavedSetups(loadSetups());
                selectSetup(name);
              }}
            >
              <Plus className="w-3.5 h-3.5 text-[#22c55e]" strokeWidth={2.5} />
              <span className="text-[13px] text-[#22c55e] font-semibold">
                Create &ldquo;{inputText.trim()}&rdquo;
              </span>
            </div>
          )}

          {/* Empty state hint */}
          {filtered.length === 0 && !inputText.trim() && savedSetups.length === 0 && (
            <div className="px-3 py-3 text-[12px] text-[#334155]">
              Type a setup name and press Enter to save it
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#334155] mt-1.5">
        Press <kbd className="px-1 py-0.5 rounded bg-[#0f172a] border border-[#1e293b] font-mono text-[10px] text-[#475569]">Enter</kbd> to save a new setup name for future use
      </p>
    </div>
  );
}
