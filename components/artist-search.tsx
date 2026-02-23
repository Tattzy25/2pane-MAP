"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { SearchIcon } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useShops } from "@/components/shop-context";
import { AddressAutofill } from "@mapbox/search-js-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function KbdInputGroup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMac, setIsMac] = useState(false);
  const { fetchShops, origin } = useShops();

  // Detect if Mac for keyboard shortcut display
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Handle search when user selects an address from autofill
  const handleRetrieve = useCallback((feature: any) => {
    if (feature && feature.geometry && feature.geometry.coordinates) {
      const [lng, lat] = feature.geometry.coordinates;
      // Search for tattoo shops near the selected location
      fetchShops(lat, lng, searchQuery.trim() || "tattoo");
    }
  }, [searchQuery, fetchShops]);

  // Handle manual search with Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Use origin if available, otherwise use default LA location
      if (origin) {
        fetchShops(origin[1], origin[0], searchQuery.trim() || "tattoo");
      } else {
        // Default to LA coordinates
        fetchShops(34.0522, -118.2437, searchQuery.trim() || "tattoo");
      }
    }
  };

  // Keyboard shortcut (Cmd/Ctrl + K) to focus search
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
    <div className="flex w-full max-w-xl flex-col gap-6">
      <InputGroup className="h-12 bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm">
        <InputGroupAddon className="text-zinc-400">
          <SearchIcon className="h-5 w-5" />
        </InputGroupAddon>
        <AddressAutofill
          accessToken={MAPBOX_TOKEN}
          onRetrieve={(e) => handleRetrieve(e)}
          options={{
            countries: ['US'],
            language: 'en',
          }}
        >
          <InputGroupInput 
            placeholder="Search location or tattoo shops..." 
            className="text-base text-white placeholder:text-zinc-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="address-line1"
          />
        </AddressAutofill>
        <InputGroupAddon align="inline-end" className="text-zinc-500">
          <Kbd className="text-zinc-400 bg-zinc-800 border-zinc-700">{isMac ? '⌘' : 'Ctrl'}</Kbd>
          <Kbd className="text-zinc-400 bg-zinc-800 border-zinc-700">K</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}