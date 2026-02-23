"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Shop {
  id: string;
  name: string;
  address: string;
  place_formatted: string;
  coordinates: [number, number];
  phone?: string;
  categories: string[];
  distance?: number;
}

export interface DirectionsRoute {
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  distance: number; // meters
  duration: number; // seconds
  legs: any[];
}

interface ShopContextType {
  shops: Shop[];
  setShops: (shops: Shop[]) => void;
  selectedShop: Shop | null;
  setSelectedShop: (shop: Shop | null) => void;
  directions: DirectionsRoute | null;
  setDirections: (directions: DirectionsRoute | null) => void;
  origin: [number, number] | null;
  setOrigin: (origin: [number, number] | null) => void;
  destination: [number, number] | null;
  setDestination: (destination: [number, number] | null) => void;
  isLoading: boolean;
  isInitialized: boolean;
  isLoadingDirections: boolean;
  fetchShops: (lat: number, lng: number, query?: string) => Promise<void>;
  fetchDirections: (origin: [number, number], destination: [number, number]) => Promise<void>;
  clearDirections: () => void;
}

const ShopContext = createContext<ShopContextType | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [directions, setDirections] = useState<DirectionsRoute | null>(null);
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);

  const fetchShops = useCallback(async (lat: number, lng: number, query?: string) => {
    setIsLoading(true);
    try {
      const url = `/api/shops?lat=${lat}&lng=${lng}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.shops) {
        setShops(data.shops);
      }
      setOrigin([lng, lat]);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const fetchDirections = useCallback(async (originCoords: [number, number], destinationCoords: [number, number]) => {
    setIsLoadingDirections(true);
    try {
      const url = `/api/directions?origin=${originCoords[0]},${originCoords[1]}&destination=${destinationCoords[0]},${destinationCoords[1]}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes[0]) {
        setDirections(data.routes[0]);
        setOrigin(originCoords);
        setDestination(destinationCoords);
      }
    } catch (error) {
      console.error('Failed to fetch directions:', error);
    } finally {
      setIsLoadingDirections(false);
    }
  }, []);

  const clearDirections = useCallback(() => {
    setDirections(null);
    setOrigin(null);
    setDestination(null);
    setSelectedShop(null);
  }, []);

  return (
    <ShopContext.Provider
      value={{
        shops,
        setShops,
        selectedShop,
        setSelectedShop,
        directions,
        setDirections,
        origin,
        setOrigin,
        destination,
        setDestination,
        isLoading,
        isInitialized,
        isLoadingDirections,
        fetchShops,
        fetchDirections,
        clearDirections,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShops() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShops must be used within a ShopProvider');
  }
  return context;
}