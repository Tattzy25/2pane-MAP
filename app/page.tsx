"use client";

import { useState } from "react";
import { SearchPanel } from "@/components/SearchPanel";
import { MapPanel } from "@/components/MapPanel";

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-black selection:bg-white selection:text-black">
      <aside className="w-1/2 h-full z-20 border-r border-neutral-800">
        <SearchPanel
          onResultsUpdate={setResults}
          onSelectShop={setSelectedShop}
          onLocationDetected={setUserLocation}
        />
      </aside>

      <section className="w-1/2 h-full relative z-10">
        <MapPanel
          results={results}
          selectedShop={selectedShop}
          userLocation={userLocation}
        />
      </section>
    </main>
  );
}