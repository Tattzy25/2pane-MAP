"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useShops } from '@/components/shop-context';

interface MapPanelProps {
    userLocation?: [number, number];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function MapPanel({ userLocation }: MapPanelProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

    const [lng, setLng] = useState(userLocation?.[0] ?? -118.2437);
    const [lat, setLat] = useState(userLocation?.[1] ?? 34.0522);
    
    const { shops, selectedShop, setSelectedShop, directions, fetchDirections, origin } = useShops();

    // Init map
    useEffect(() => {
        if (map.current || !mapContainer.current || !MAPBOX_TOKEN) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [lng, lat],
            zoom: 10,
            antialias: true,
        });
        map.current.on('load', () => map.current?.resize());
        map.current.on('move', () => {
            const c = map.current?.getCenter();
            if (c) { setLng(+c.lng.toFixed(4)); setLat(+c.lat.toFixed(4)); }
        });
        return () => { map.current?.remove(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update shop markers when shops change
    useEffect(() => {
        if (!map.current) return;
        markers.current.forEach(m => m.remove());
        markers.current = [];

        shops.forEach((shop) => {
            if (!shop.coordinates) return;

            // Tattoo studio marker using the GIF
            const el = document.createElement('div');
            el.style.cssText = `
                width:48px;height:48px;
                display:flex;align-items:center;justify-content:center;
                cursor:pointer;
                transition:transform 0.2s ease,filter 0.2s ease;
                filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
            `;
            
            // Use the tattoo-studio.gif
            el.innerHTML = `
                <img src="/tattoo-studio.gif" width="40" height="40" style="pointer-events:none;" />
            `;

            // Highlight selected shop
            const isSelected = selectedShop?.id === shop.id;
            if (isSelected) {
                el.style.transform = 'scale(1.2)';
                el.style.filter = 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.9))';
            }

            // Click to select and get directions - zoom to shop
            el.addEventListener('click', () => {
                if (selectedShop?.id === shop.id) {
                    setSelectedShop(null);
                } else {
                    setSelectedShop(shop);
                    // Zoom to the shop location
                    map.current?.flyTo({
                        center: shop.coordinates as [number, number],
                        zoom: 16,
                        duration: 1500,
                    });
                }
            });

            const marker = new mapboxgl.Marker(el)
                .setLngLat(shop.coordinates as [number, number])
                .addTo(map.current!);

            markers.current.push(marker);
        });

        // Fit bounds when shops list changes - always zoom to show all shops
        if (shops.length > 0 && map.current) {
            const bounds = new mapboxgl.LngLatBounds();
            shops.forEach(r => r.coordinates && bounds.extend(r.coordinates));
            if (origin) bounds.extend(origin);
            map.current.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 1200 });
        }
    }, [shops, selectedShop, setSelectedShop, origin]);

    // Add user location marker
    useEffect(() => {
        if (!map.current || !userLocation) return;
        
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
        }
        
        const el = document.createElement('div');
        el.style.cssText = `
            width:16px;height:16px;border-radius:50%;
            background:rgba(59, 130, 246, 0.9);
            border:3px solid rgba(255,255,255,0.9);
            box-shadow:0 0 20px rgba(59, 130, 246, 0.5);
            cursor:pointer;
        `;
        
        userMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat(userLocation)
            .addTo(map.current);
            
    }, [userLocation]);

    // Fetch directions when shop is selected
    useEffect(() => {
        if (!map.current) return;
        
        if (selectedShop && userLocation) {
            fetchDirections(userLocation, selectedShop.coordinates);
        }
    }, [selectedShop, userLocation, fetchDirections]);

    // Draw route on map when directions change
    useEffect(() => {
        if (!map.current) return;

        const routeLayerId = 'directions-route';
        const routeSourceId = 'directions-route-source';

        if (map.current.getLayer(routeLayerId)) {
            map.current.removeLayer(routeLayerId);
        }
        if (map.current.getSource(routeSourceId)) {
            map.current.removeSource(routeSourceId);
        }

        if (directions && directions.geometry) {
            map.current.addSource(routeSourceId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: directions.geometry.coordinates
                    }
                }
            });

            map.current.addLayer({
                id: routeLayerId,
                type: 'line',
                source: routeSourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#3b82f6',
                    'line-width': 5,
                    'line-opacity': 0.85
                }
            });

            if (directions.geometry.coordinates.length > 0) {
                const bounds = new mapboxgl.LngLatBounds();
                directions.geometry.coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
                map.current.fitBounds(bounds, { padding: 100, maxZoom: 15, duration: 800 });
            }
        }
    }, [directions]);

    if (!MAPBOX_TOKEN) {
        return (
            <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
                <p className="text-white text-lg font-semibold">Mapbox token required</p>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full bg-black overflow-hidden">
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

            <div className="absolute top-6 right-6 z-30 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-mono text-neutral-400 shadow-2xl">
                    <span className="text-neutral-600">COORD:</span> {lat}, {lng}
                </div>
            </div>
        </div>
    );
}