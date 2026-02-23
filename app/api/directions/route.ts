import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
  }

  if (!origin || !destination) {
    return NextResponse.json({ error: 'origin and destination required' }, { status: 400 });
  }

  try {
    // Mapbox Directions API v5
    // Format: /directions/v5/{profile}/{coordinates}
    const profile = 'mapbox/driving';
    const coordinates = `${origin};${destination}`;
    
    const directionsUrl = `https://api.mapbox.com/directions/v5/${profile}/${coordinates}?alternatives=true&annotations=distance%2Cspeed%2Cduration%2Ccongestion%2Cmaxspeed%2Ccongestion_numeric%2Cclosure&banner_instructions=true&exclude=ferry%2Ccash_only_tolls&geometries=geojson&language=en&overview=full&roundabout_exits=true&steps=true&voice_instructions=true&voice_units=imperial&access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(directionsUrl);
    const data = await response.json();

    if (data.code !== 'Ok') {
      return NextResponse.json({ error: data.message || 'Failed to get directions' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Directions error:', error);
    return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 500 });
  }
}