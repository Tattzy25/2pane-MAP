"use client";

import { useShops, type Shop } from '@/components/shop-context';
import { Scroller } from '@/components/ui/scroller';
import { Navigation, Phone, MapPin, Loader2, X, Clock, Route } from 'lucide-react';

function formatDistance(meters: number): string {
  const miles = meters * 0.000621371;
  return `${miles.toFixed(1)} mi`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function ShopCard({ 
  shop, 
  index, 
  isSelected,
  showDistance,
  onSelect 
}: { 
  shop: Shop; 
  index: number;
  isSelected: boolean;
  showDistance?: boolean;
  onSelect: () => void;
}) {
  // Generate gradient colors based on shop name
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  
  const hash = hashCode(shop.name);
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40) % 360;
  const gradientFrom = `hsl(${hue1}, 20%, 14%)`;
  const gradientTo = `hsl(${hue2}, 16%, 8%)`;
  
  const numPad = String(index + 1).padStart(2, '0');
  const category = shop.categories?.[0] || 'Tattoo Studio';
  
  // Generate placeholder image URL based on shop name
  const placeholderUrl = `https://placehold.co/200x200/1a1a1a/ffffff/png?text=${encodeURIComponent(shop.name.substring(0, 2).toUpperCase())}`;

  return (
    <div
      data-slot="shop-card"
      onClick={onSelect}
      className={`
        group relative flex flex-row gap-4 rounded-xl p-3 sm:p-4 cursor-pointer
        transition-all duration-200 border border-transparent
        ${isSelected 
          ? 'bg-zinc-800/90 border-white/20 shadow-lg shadow-black/50' 
          : 'bg-zinc-900/80 hover:bg-zinc-800/70 hover:border-white/5'
        }
      `}
    >
      {/* Left: Index number */}
      <div className="flex flex-col items-center justify-center w-8 flex-shrink-0">
        <span className="text-xs font-mono text-zinc-600 group-hover:text-zinc-500 transition-colors">
          {numPad}
        </span>
      </div>
      
      {/* Square Image */}
      <div 
        className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
      >
        <img
          src={placeholderUrl}
          alt={shop.name}
          className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute top-1 right-1 text-[7px] font-bold uppercase tracking-wider text-white/50 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
          {category}
        </div>
      </div>
      
      {/* Info */}
      <div className="flex flex-1 flex-col justify-center gap-1 min-w-0">
        <h3 className="text-sm font-semibold text-white sm:text-base truncate group-hover:text-white/90">
          {shop.name}
        </h3>
        
        {/* Distance or Rating */}
        {showDistance && shop.distance !== undefined ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <MapPin className="h-3 w-3" />
            <span>{shop.distance.toFixed(1)} mi away</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-400"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-xs text-yellow-400">4.{Math.floor(Math.random() * 3) + 6}</span>
          </div>
        )}
        
        {/* Phone */}
        {shop.phone && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Phone className="h-3 w-3" />
            <span className="truncate">{shop.phone}</span>
          </div>
        )}
        
        {/* Address */}
        <p className="text-xs text-zinc-500 sm:text-sm truncate">
          {shop.place_formatted || shop.address}
        </p>
      </div>
      
      {/* Directions Button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-lg">
          <Navigation className="h-3 w-3" />
          <span>Go</span>
        </div>
      </div>
      
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
      )}
    </div>
  );
}

export function ShopCards() {
  const { 
    shops, 
    selectedShop, 
    setSelectedShop, 
    directions, 
    isLoading,
    isInitialized,
    clearDirections 
  } = useShops();

  // Show loading spinner during initial load
  if (!isInitialized || (isLoading && shops.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  // Only show "no shops" message after initialization with empty results
  if (isInitialized && shops.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-zinc-500 text-center">
          No tattoo shops found. Try a different search.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Directions Header - shown when route is active */}
      {directions && selectedShop && (
        <div className="flex-shrink-0 p-3 mb-2 bg-zinc-800/80 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Route to {selectedShop.name}</span>
            </div>
            <button
              onClick={clearDirections}
              className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
              aria-label="Clear directions"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>{formatDistance(directions.distance)}</span>
            <span>•</span>
            <span>{formatDuration(directions.duration)}</span>
          </div>
        </div>
      )}
      
      {/* Shop Cards */}
      <Scroller className="flex-1 flex flex-col gap-2 p-1" hideScrollbar>
        {shops.map((shop, index) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            index={index}
            isSelected={selectedShop?.id === shop.id}
            showDistance={true}
            onSelect={() => setSelectedShop(selectedShop?.id === shop.id ? null : shop)}
          />
        ))}
      </Scroller>
    </div>
  );
}