"use client";

import { FaIcon } from "@/components/FaIcon";
import { fetchPermissionSuggestions } from "@/lib/api/permissions";
import type { PermissionSuggestion } from "@/lib/types/permission";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  onPickSuggestion?: (item: PermissionSuggestion) => void;
  placeholder?: string;
  name?: string;
  debounceMs?: number;
  minChars?: number;
  limit?: number;
  inputClassName?: string;
};

export function PermissionSearchSuggestInput({
  value,
  onChange,
  onPickSuggestion,
  placeholder = "Gõ mã, tên hoặc mô tả…",
  name = "q",
  debounceMs = 280,
  minChars = 1,
  limit = 8,
  inputClassName = "lte-input w-full pl-10",
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [items, setItems] = useState<PermissionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [emptyForQuery, setEmptyForQuery] = useState<string | null>(null);

  const clearBlurTimer = () => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  };

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setHighlight(-1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const q = value.trim();

    if (q.length < minChars) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset gợi ý khi xóa từ khóa
      setItems([]);
      setPanelOpen(false);
      setLoading(false);
      setEmptyForQuery(null);
      return () => {
        cancelled = true;
      };
    }

    setEmptyForQuery(null);

    const timer = setTimeout(() => {
      void (async () => {
        if (focusRef.current) {
          setPanelOpen(true);
        }
        setLoading(true);
        try {
          const data = await fetchPermissionSuggestions(q, limit);
          if (cancelled) return;
          setItems(data);
          setEmptyForQuery(data.length === 0 ? q : null);
          if (focusRef.current) {
            setPanelOpen(true);
            setHighlight(-1);
          }
        } catch {
          if (cancelled) return;
          setItems([]);
          setEmptyForQuery(null);
          setPanelOpen(false);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, debounceMs, minChars, limit]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        closePanel();
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [closePanel]);

  function handleFocus() {
    clearBlurTimer();
    focusRef.current = true;
    const fq = value.trim();
    if (fq.length >= minChars) {
      setPanelOpen(true);
    }
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => {
      focusRef.current = false;
      closePanel();
    }, 160);
  }

  function pick(item: PermissionSuggestion) {
    clearBlurTimer();
    focusRef.current = false;
    closePanel();
    onPickSuggestion?.(item);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!panelOpen || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? items.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlight >= 0 && items[highlight]) {
      e.preventDefault();
      pick(items[highlight]);
    } else if (e.key === "Escape") {
      closePanel();
    }
  }

  const q = value.trim();
  const showPanel = panelOpen && q.length >= minChars;

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <FaIcon
        icon="fa-solid fa-magnifying-glass"
        className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[#adb5bd]"
      />
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={showPanel ? listId : undefined}
        aria-autocomplete="list"
        aria-label="Từ khóa tìm kiếm quyền"
      />

      {showPanel && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-xl border border-[#e3e8ec] bg-white py-1 shadow-lg ring-1 ring-black/5"
        >
          {loading && (
            <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#6c757d]">
              <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-[#3c8dbc]" />
              Đang tìm gợi ý…
            </li>
          )}
          {!loading &&
            items.length > 0 &&
            items.map((item, idx) => (
              <li key={item.id} role="option" aria-selected={highlight === idx}>
                <button
                  type="button"
                  className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition-colors ${
                    highlight === idx
                      ? "bg-[#3c8dbc]/12 text-[#2c3e50]"
                      : "text-[#495057] hover:bg-[#f8fafc]"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => pick(item)}
                >
                  <span className="font-mono text-xs text-[#3c8dbc]">{item.permissionCode}</span>
                  <span className="font-medium">{item.permissionName}</span>
                </button>
              </li>
            ))}
          {!loading && items.length === 0 && emptyForQuery === q && (
            <li className="px-3 py-2.5 text-sm text-[#6c757d]">Không có gợi ý phù hợp</li>
          )}
        </ul>
      )}
    </div>
  );
}
