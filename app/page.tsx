"use client";

import { useEffect, useState } from "react";
import { MapPanel } from "@/components/MapPanel";
import { ShopCards } from "@/components/shop-cards";
import { ArtistCarousel } from "@/components/artist-carousel";
import { KbdInputGroup } from "@/components/artist-search";
import { ShopProvider, useShops } from "@/components/shop-context";
import { Loader2 } from "lucide-react";

// Default location (Los Angeles)
const DEFAULT_LOCATION: [number, number] = [-118.2437, 34.0522];

function HomeContent() {
  const { fetchShops, shops, isLoading, isInitialized } = useShops();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user's location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
          fetchShops(latitude, longitude, "tattoo");
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setLocationError("Unable to get your location. Using default location.");
          setUserLocation(DEFAULT_LOCATION);
          fetchShops(DEFAULT_LOCATION[1], DEFAULT_LOCATION[0], "tattoo");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    } else {
      setLocationError("Geolocation not supported. Using default location.");
      setUserLocation(DEFAULT_LOCATION);
      fetchShops(DEFAULT_LOCATION[1], DEFAULT_LOCATION[0], "tattoo");
    }
  }, [fetchShops]);

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Search Bar - Centered at top */}
      <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2">
        <KbdInputGroup />
      </div>

      {/* Location Error Banner */}
      {locationError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-zinc-800/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-400">
          {locationError}
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left Panel */}
        <div className="h-1/2 w-full flex flex-col overflow-hidden bg-[#000000] md:h-full md:w-1/2">
          <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-4">
            {isLoading && !shops.length ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : (
              <ShopCards />
            )}
          </div>
          <div className="flex-shrink-0 p-4 pt-0 pb-5">
            <ArtistCarousel />
          </div>
        </div>

        {/* Right Panel */}
        <div className="h-1/2 w-full md:h-full md:w-1/2">
          <MapPanel userLocation={userLocation ?? undefined} />
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ShopProvider>
      <HomeContent />
    </ShopProvider>
  );
}
