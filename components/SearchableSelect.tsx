import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchText?: string;
}

export function findOrderedMatches(
  haystackLower: string,
  tokens: string[],
): Array<[number, number]> | null {
  const ranges: Array<[number, number]> = [];
  let fromIndex = 0;
  for (const token of tokens) {
    const idx = haystackLower.indexOf(token, fromIndex);
    if (idx === -1) return null;
    ranges.push([idx, idx + token.length]);
    fromIndex = idx + token.length;
  }
  return ranges;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlights any occurrence of any token in `text`, independent of order.
 * Useful when a match is confirmed elsewhere (e.g. across combined fields)
 * and this is only rendering the highlight for one of those fields.
 */
export function highlightAnyToken(text: string, tokens: string[]): React.ReactNode {
  const cleanTokens = tokens.filter(Boolean);
  if (cleanTokens.length === 0) return text;
  const regex = new RegExp(`(${cleanTokens.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(regex);
  const lowerTokens = cleanTokens.map((t) => t.toLowerCase());
  return parts.map((part, index) =>
    lowerTokens.includes(part.toLowerCase()) ? (
      <mark key={index} className="bg-primary/30 text-inherit rounded-sm">
        {part}
      </mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
  );
}

function highlightLabel(label: string, tokens: string[]): React.ReactNode {
  if (tokens.length === 0) return label;
  const ranges = findOrderedMatches(label.toLowerCase(), tokens);
  if (!ranges) return label;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], index) => {
    if (start > cursor) {
      nodes.push(
        <React.Fragment key={`text-${index}`}>
          {label.slice(cursor, start)}
        </React.Fragment>,
      );
    }
    nodes.push(
      <mark key={`match-${index}`} className="bg-primary/30 text-inherit rounded-sm">
        {label.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < label.length) {
    nodes.push(<React.Fragment key="text-tail">{label.slice(cursor)}</React.Fragment>);
  }
  return nodes;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccione una opción",
  emptyMessage = "Sin resultados",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tokens = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  );

  const filteredOptions = useMemo(() => {
    if (tokens.length === 0) return options;
    return options.filter((option) => {
      const haystack = (option.searchText ?? option.label).toLowerCase();
      return findOrderedMatches(haystack, tokens) !== null;
    });
  }, [options, tokens]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? query : selectedOption?.label ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery("");
          }}
          placeholder={placeholder}
          className="w-full pl-4 pr-16 py-3 bg-input-background border-b-2 border-border
                     focus:border-primary rounded-t transition-colors outline-none"
        />
        <Search
          size={16}
          className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <ChevronDown
          size={20}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-surface border border-border rounded shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setQuery("");
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors ${
                  option.value === value ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                {highlightLabel(option.label, tokens)}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
