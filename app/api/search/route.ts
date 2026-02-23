import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface SearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  place_formatted: string;
  categories: string[];
}

// Mapbox Search API for POI category search
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const lon = searchParams.get('lon');
  const lat = searchParams.get('lat');
  const limit = searchParams.get('limit') || '15';

  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
  }

  try {
    // Build proximity parameter if coordinates provided
    const proximity = lon && lat ? `&proximity=${lon},${lat}` : '';
    
    let url: string;
    
    if (query && query.trim()) {
      // Search with query + tattoo
      const searchTerm = `${query} tattoo`;
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchTerm)}.json?types=poi&limit=${limit}&language=en${proximity}&access_token=${MAPBOX_TOKEN}`;
    } else {
      // Default search for tattoo shops
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/tattoo.json?types=poi&limit=${limit}&language=en${proximity}&access_token=${MAPBOX_TOKEN}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const results: SearchResult[] = data.features.map((f: any) => {
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
          coordinates: f.geometry.coordinates as [number, number],
          place_formatted: placeFormatted,
          categories,
        };
      });

      return NextResponse.json({ results });
    }

    return NextResponse.json({ results: [] });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}