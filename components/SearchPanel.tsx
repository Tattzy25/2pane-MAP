"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Globe } from "lucide-react";

interface SearchPanelProps {
    onSelectShop: (shop: any) => void;
    onResultsUpdate: (results: any[]) => void;
    onLocationDetected?: (coords: [number, number]) => void;
}

// Always keep results in tattoo context
function buildQuery(raw: string) {
    const q = raw.trim().toLowerCase();
    const hasTattoo = q.includes("tattoo") || q.includes("ink") || q.includes("piercing") || q.includes("artist");
    return hasTattoo ? raw.trim() : `${raw.trim()} tattoo`;
}

export function SearchPanel({ onSelectShop, onResultsUpdate, onLocationDetected }: SearchPanelProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const sessionToken = useRef(
        typeof crypto !== "undefined" ? crypto.randomUUID() : "session-default"
    );

    const search = useCallback(async (searchQuery: string, coords?: [number, number]) => {
        setLoading(true);
        try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            const proximity = coords ? `&proximity=${coords[0]},${coords[1]}` : '';
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?types=poi&limit=10&language=en${proximity}&access_token=${token}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                const formatted = data.features.map((f: any) => {
                    const ctx = f.context || [];
                    const place = ctx.find((c: any) => c.id?.startsWith('place'))?.text || '';
                    const region = ctx.find((c: any) => c.id?.startsWith('region'))?.text || '';
                    const country = ctx.find((c: any) => c.id?.startsWith('country'))?.text || '';
                    const placeFormatted = [place, region, country].filter(Boolean).join(', ') || f.place_name;
                    const rawCats: string = f.properties?.category || '';
                    const categories = rawCats ? rawCats.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
                    return {
                        id: f.id,
                        name: f.text,
                        address: f.place_name,
                        coordinates: f.geometry.coordinates,
                        place_formatted: placeFormatted,
                        phone: null,
                        website: f.properties?.website || null,
                        categories,
                        rating: null,
                    };
                });
                setResults(formatted);
                onResultsUpdate(formatted);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    }, [onResultsUpdate]);

    // Auto-load nearby tattoo studios on mount via geolocation
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
                    onLocationDetected?.(coords);
                    search("tattoo studio", coords);
                },
                () => {
                    search("tattoo studio");
                }
            );
        } else {
            search("tattoo studio");
        }
    }, [search, onLocationDetected]);

    // Debounced query search — always locked to tattoo context
    useEffect(() => {
        if (!query) return;
        const t = setTimeout(() => {
            if (query.length > 2) search(buildQuery(query));
        }, 500);
        return () => clearTimeout(t);
    }, [query, search]);

    return (
        <div className="flex flex-col h-full bg-[#050505] text-white border-r border-white/5 overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-8 pb-5 bg-gradient-to-b from-white/[0.06] to-transparent border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/30">Discovery Engine</span>
                </div>
                <h1 className="text-2xl font-light tracking-tight text-white/90 mb-4">
                    Find Your <span className="font-serif italic text-white">Ink</span>
                </h1>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="City, style, artist name..."
                        className="pl-11 bg-white/[0.04] border-white/8 text-white placeholder:text-white/20 focus:ring-1 focus-visible:ring-white/15 h-12 rounded-xl text-sm transition-all"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" style={{ height: 220 }} />
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {results.map((shop, index) => (
                            <PortraitCard
                                key={`${shop.id}-${index}`}
                                shop={shop}
                                index={index}
                                onClick={() => onSelectShop(shop)}
                            />
                        ))}
                    </div>
                ) : query.length > 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/8 flex items-center justify-center">
                            <Search className="h-4 w-4 text-white/20" />
                        </div>
                        <p className="text-white/40 text-sm">No results found</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// Deterministic gradient from shop name — gives each card a unique feel
function nameToGradient(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${h1},18%,10%) 0%, hsl(${h2},14%,7%) 100%)`;
}

function PortraitCard({ shop, index, onClick }: { shop: any; index: number; onClick: () => void }) {
    const category = shop.categories?.[0] || "Tattoo Studio";
    const gradient = nameToGradient(shop.name);

    return (
        <div
            onClick={onClick}
            className="group relative rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 active:scale-[0.97] flex flex-col"
            style={{ minHeight: 220 }}
        >
            {/* Photo area */}
            <div
                className="relative flex-shrink-0"
                style={{ height: 90, background: gradient }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl opacity-20 select-none">✦</span>
                </div>
                {/* Index badge */}
                <div className="absolute top-2.5 left-2.5">
                    <span className="text-[8px] font-mono font-bold text-white/30 bg-black/40 px-1.5 py-0.5 rounded-md">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                </div>
                {/* Category badge */}
                <div className="absolute top-2.5 right-2.5">
                    <span className="text-[7.5px] font-semibold uppercase tracking-wide text-white/45 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 truncate max-w-[90px] inline-block">
                        {category}
                    </span>
                </div>
            </div>

            {/* Info area */}
            <div className="flex flex-col flex-1 p-3.5 bg-white/[0.02] group-hover:bg-white/[0.04] transition-colors">
                <h3 className="text-[12.5px] font-medium text-white/85 group-hover:text-white transition-colors leading-snug line-clamp-2 mb-auto">
                    {shop.name}
                </h3>

                <div className="mt-3 pt-2.5 border-t border-white/5">
                    <div className="flex items-start gap-1.5">
                        <MapPin className="h-2.5 w-2.5 text-white/20 flex-shrink-0 mt-0.5" />
                        <span className="text-[9.5px] text-white/30 leading-tight line-clamp-2">
                            {shop.place_formatted}
                        </span>
                    </div>
                    {shop.website && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <Globe className="h-2.5 w-2.5 text-white/15 flex-shrink-0" />
                            <span className="text-[9px] text-white/20">Website available</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
