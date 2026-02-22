"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapPanelProps {
    results: any[];
    selectedShop: any | null;
    userLocation?: [number, number] | null;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function distanceMiles(a: [number, number], b: [number, number]): string {
    const R = 3958.8;
    const dLat = (b[1] - a[1]) * Math.PI / 180;
    const dLon = (b[0] - a[0]) * Math.PI / 180;
    const lat1 = a[1] * Math.PI / 180;
    const lat2 = b[1] * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return d < 0.1 ? `${(d * 5280).toFixed(0)} ft` : `${d.toFixed(1)} mi`;
}

function nameToGradient(name: string): [string, string] {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 40) % 360;
    return [`hsl(${h1},20%,14%)`, `hsl(${h2},16%,8%)`];
}

function starsHTML(rating: number | null): string {
    if (!rating) return '';
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let s = '';
    for (let i = 0; i < 5; i++) {
        if (i < full) s += '&#9733;';
        else if (i === full && half) s += '&frac12;';
        else s += '&#9734;';
    }
    return s;
}

function buildPopupHTML(opts: {
    c1: string; c2: string; category: string; index: number;
    name: string; stars: string; rating: number | null;
    address: string; dist: string | null;
}): string {
    const { c1, c2, category, index, name, stars, rating, address, dist } = opts;
    const starsRow = stars
        ? `<div style="font-size:11px;color:#f5a623;margin-bottom:6px;">${stars} <span style="color:rgba(255,255,255,0.3);font-size:10px;">${rating ? rating.toFixed(1) : ''}</span></div>`
        : '';
    const distRow = dist
        ? `<div style="display:flex;align-items:center;gap:5px;"><div style="width:6px;height:6px;border-radius:50%;background:rgba(96,165,250,0.8);"></div><span style="font-size:9.5px;font-weight:600;color:rgba(255,255,255,0.45);">${dist} away</span></div>`
        : '';
    const numPad = String(index + 1).padStart(2, '0');
    return [
        `<div style="width:260px;background:rgba(8,8,8,0.97);border:1px solid rgba(255,255,255,0.07);border-radius:18px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.9);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:white;">`,
        `<div style="height:88px;background:linear-gradient(135deg,${c1},${c2});position:relative;display:flex;align-items:center;justify-content:center;">`,
        `<span style="font-size:26px;opacity:0.12;user-select:none;">&#10022;</span>`,
        `<div style="position:absolute;top:8px;right:10px;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);padding:2px 8px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);">${category}</div>`,
        `<div style="position:absolute;top:8px;left:10px;font-size:8px;font-weight:700;font-family:monospace;color:rgba(255,255,255,0.25);background:rgba(0,0,0,0.4);padding:2px 6px;border-radius:5px;">${numPad}</div>`,
        `</div>`,
        `<div style="padding:13px 15px;">`,
        `<h3 style="margin:0 0 5px;font-size:13px;font-weight:500;color:rgba(255,255,255,0.95);line-height:1.35;">${name}</h3>`,
        starsRow,
        `<div style="height:1px;background:rgba(255,255,255,0.05);margin-bottom:9px;"></div>`,
        `<div style="font-size:10px;color:rgba(255,255,255,0.38);line-height:1.5;${dist ? 'margin-bottom:7px;' : ''}">${address}</div>`,
        distRow,
        `</div></div>`,
    ].join('');
}

export function MapPanel({ results, selectedShop, userLocation }: MapPanelProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const popups = useRef<mapboxgl.Popup[]>([]);
    const userMarker = useRef<mapboxgl.Marker | null>(null);
    // Ref so hover closures always read the latest userLocation without needing to re-create markers
    const userLocationRef = useRef<[number, number] | null>(null);

    const [lng, setLng] = useState(-118.2437);
    const [lat, setLat] = useState(34.0522);

    useEffect(() => {
        userLocationRef.current = userLocation ?? null;
    }, [userLocation]);

    // ── Init map ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (map.current || !mapContainer.current || !MAPBOX_TOKEN) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [lng, lat],
            zoom: 2,
            projection: 'globe',
            antialias: true,
        });
        map.current.on('load', () => map.current?.resize());
        map.current.on('style.load', () => {
            map.current?.setFog({
                color: 'rgb(10,10,10)',
                'high-color': 'rgb(20,20,20)',
                'horizon-blend': 0.02,
                'space-color': 'rgb(0,0,0)',
                'star-intensity': 0.6,
            });
        });
        map.current.on('move', () => {
            const c = map.current?.getCenter();
            if (c) { setLng(+c.lng.toFixed(4)); setLat(+c.lat.toFixed(4)); }
        });
        return () => { map.current?.remove(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Fly to user location + show blue dot ──────────────────────────────────
    useEffect(() => {
        if (!userLocation || !map.current) return;

        // Only fly to user on first detection (before any results arrive)
        if (!userMarker.current) {
            map.current.flyTo({ center: userLocation, zoom: 12, duration: 1800 });
        }

        // Place / replace user dot
        userMarker.current?.remove();
        const el = document.createElement('div');
        el.style.cssText = `
            width:12px;height:12px;border-radius:50%;
            background:rgba(96,165,250,0.9);
            border:2px solid white;
            box-shadow:0 0 0 4px rgba(96,165,250,0.25),0 2px 8px rgba(0,0,0,0.6);
        `;
        userMarker.current = new mapboxgl.Marker(el)
            .setLngLat(userLocation)
            .addTo(map.current);
    }, [userLocation]);

    // ── Update shop markers when results change ───────────────────────────────
    useEffect(() => {
        if (!map.current) return;
        markers.current.forEach(m => m.remove());
        popups.current.forEach(p => p.remove());
        markers.current = [];
        popups.current = [];

        results.forEach((shop, index) => {
            if (!shop.coordinates) return;

            const [c1, c2] = nameToGradient(shop.name);
            const category = shop.categories?.[0] || 'Tattoo Studio';
            const rating = shop.rating ?? null;
            const stars = starsHTML(rating);

            // Static dot marker
            const el = document.createElement('div');
            el.style.cssText = `
                width:14px;height:14px;border-radius:50%;
                background:rgba(255,255,255,0.08);
                border:1.5px solid rgba(255,255,255,0.5);
                box-shadow:0 2px 8px rgba(0,0,0,0.5);
                cursor:pointer;display:flex;align-items:center;justify-content:center;
                transition:transform 0.15s,border-color 0.15s,background 0.15s;
            `;
            const inner = document.createElement('div');
            inner.style.cssText = `width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.9);`;
            el.appendChild(inner);

            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.35)';
                el.style.borderColor = 'rgba(255,255,255,0.95)';
                el.style.background = 'rgba(255,255,255,0.18)';
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)';
                el.style.borderColor = 'rgba(255,255,255,0.5)';
                el.style.background = 'rgba(255,255,255,0.08)';
            });

            // Rich hover popup — reads userLocationRef at hover time so distance is always current
            const popup = new mapboxgl.Popup({
                offset: 18,
                closeButton: false,
                closeOnClick: false,
                maxWidth: '280px',
                className: 'cassini-tooltip',
            });

            el.addEventListener('mouseenter', () => {
                const dist = userLocationRef.current
                    ? distanceMiles(userLocationRef.current, shop.coordinates as [number, number])
                    : null;
                popup.setHTML(buildPopupHTML({
                    c1, c2, category, index,
                    name: shop.name,
                    stars,
                    rating,
                    address: shop.place_formatted || shop.address || '',
                    dist,
                }));
                if (map.current) popup.setLngLat(shop.coordinates as [number, number]).addTo(map.current);
            });
            el.addEventListener('mouseleave', () => popup.remove());

            const marker = new mapboxgl.Marker(el)
                .setLngLat(shop.coordinates as [number, number])
                .addTo(map.current!);

            markers.current.push(marker);
            popups.current.push(popup);
        });

        if (results.length > 0 && map.current) {
            const bounds = new mapboxgl.LngLatBounds();
            results.forEach(r => r.coordinates && bounds.extend(r.coordinates));
            map.current.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 1200 });
        }
    }, [results]);

    // ── Fly to selected shop ──────────────────────────────────────────────────
    useEffect(() => {
        if (selectedShop?.coordinates && map.current) {
            map.current.flyTo({ center: selectedShop.coordinates, zoom: 15, duration: 1400 });
        }
    }, [selectedShop]);

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

            <style>{`
                .cassini-tooltip .mapboxgl-popup-content {
                    background: transparent !important;
                    padding: 0 !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                }
                .cassini-tooltip .mapboxgl-popup-tip { display: none !important; }
            `}</style>
        </div>
    );
}
