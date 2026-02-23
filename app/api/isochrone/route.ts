import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lng = searchParams.get('lng');
  const lat = searchParams.get('lat');
  const minutes = searchParams.get('minutes') || '5,10,15';

  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
  }

  if (!lng || !lat) {
    return NextResponse.json({ error: 'lng and lat required' }, { status: 400 });
  }

  try {
    // Mapbox Isochrone API
    const profile = 'mapbox/driving';
    const coordinates = `${lng},${lat}`;
    const colors = '6706ce,04e813,4286f4'; // purple, green, blue
    
    const isochroneUrl = `https://api.mapbox.com/isochrone/v1/${profile}/${coordinates}?contours_minutes=${minutes}&contours_colors=${colors}&polygons=true&denoise=0.5&access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(isochroneUrl);
    const data = await response.json();

    if (data.message) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Isochrone error:', error);
    return NextResponse.json({ error: 'Failed to fetch isochrones' }, { status: 500 });
  }
}