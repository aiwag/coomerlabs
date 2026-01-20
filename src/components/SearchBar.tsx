import React, { useState } from "react";
import { Search, X, Filter, ChevronDown, Clock } from "lucide-react";
import { useAdvancedSearch } from "../hooks/useAdvancedSearch";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search videos...",
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = query.trim();
    if (searchQuery) {
      onSearch?.(searchQuery);
      setQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-5 w-5 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full py-3 pr-4 pl-10 text-white placeholder:text-white/40 liquid-input"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 p-2 text-white/40 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!query.trim()}
          className="flex items-center gap-2 px-6 py-3 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 liquid-button"
        >
          <Search size={16} />
          <span className="text-sm font-medium">Search</span>
        </button>
      </form>
    </div>
  );
};
