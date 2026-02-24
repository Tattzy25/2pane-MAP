import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface LocationResult {
  id: string;
  name: string;
  place_formatted: string;
  mapbox_id: string;
  feature_type: string;
}

// Mapbox Search Box API for location suggestions
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
  }

  if (!query || !query.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const sessionToken = Date.now().toString();
    const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.suggestions && data.suggestions.length > 0) {
      const suggestions: LocationResult[] = data.suggestions
        .filter((s: any) => s.feature_type === 'place' || s.feature_type === 'postcode' || s.feature_type === 'locality')
        .map((s: any) => ({
          id: s.mapbox_id,
          name: s.name,
          place_formatted: s.place_formatted,
          mapbox_id: s.mapbox_id,
          feature_type: s.feature_type,
        }));

      return NextResponse.json({ suggestions });
    }

    return NextResponse.json({ suggestions: [] });
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json({ error: 'Location search failed' }, { status: 500 });
  }
}