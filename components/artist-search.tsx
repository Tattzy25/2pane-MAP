"use client";

import { useState, useEffect } from "react";
import { useShops } from "@/components/shop-context";
import { SearchIcon, Loader2 } from "lucide-react";

export function KbdInputGroup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMac, setIsMac] = useState(false);
  const { fetchShops, origin, isLoading, setOrigin } = useShops();

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const handleSearch = () => {
    if (origin) {
      fetchShops(origin[1], origin[0], searchQuery.trim() || "tattoo");
    } else {
      fetchShops(34.0522, -118.2437, searchQuery.trim() || "tattoo");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        input?.focus();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMac]);

  return (
    <div className="flex w-full max-w-sm items-center gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search tattoo shops..."
          className="h-12 w-full rounded-l-xl bg-zinc-900/80 border border-zinc-700/50 border-r-0 px-4 pr-20 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-zinc-500 text-xs pointer-events-none">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">{isMac ? '⌘' : 'Ctrl'}</kbd>
          <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">K</kbd>
        </div>
      </div>
      <button
        onClick={handleSearch}
        disabled={isLoading}
        className="h-12 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-r-xl font-medium transition-colors flex items-center gap-2"
        aria-label="Search"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <SearchIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}