import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface ShopResult {
  id: string;
  name: string;
  address: string;
  place_formatted: string;
  coordinates: [number, number];
  phone?: string;
  categories: string[];
  distance?: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const query = searchParams.get('q');

  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
  }

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  try {
    // Search for tattoo shops using Mapbox Search Box API
    const searchTerm = query || 'tattoo shop';
    // Proximity format: longitude,latitude (ip or coordinates)
    const proximity = `${lng},${lat}`;
    const sessionToken = Date.now().toString();
    
    // Use poi_category for more accurate results
    const searchUrl = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(searchTerm)}&proximity=${proximity}&limit=10&poi_category=tattoo_parlour&access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}`;
    
    console.log('Search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    console.log('Search results:', searchData);

    if (!searchData.suggestions || searchData.suggestions.length === 0) {
      // Fallback: try without poi_category filter
      const fallbackUrl = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(searchTerm)}&proximity=${proximity}&limit=10&access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();
      
      if (!fallbackData.suggestions || fallbackData.suggestions.length === 0) {
        return NextResponse.json({ shops: [] });
      }
      
      searchData.suggestions = fallbackData.suggestions;
    }

    // Get detailed info for each suggestion using retrieve endpoint
    const shops: (ShopResult | null)[] = await Promise.all(
      searchData.suggestions.slice(0, 10).map(async (suggestion: any) => {
        const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}`;
        
        try {
          const retrieveResponse = await fetch(retrieveUrl);
          const retrieveData = await retrieveResponse.json();
          
          if (retrieveData.features && retrieveData.features[0]) {
            const feature = retrieveData.features[0];
            const coords: [number, number] = feature.geometry.coordinates;
            
            // Calculate distance using Haversine formula
            const distance = calculateDistance(
              parseFloat(lat),
              parseFloat(lng),
              coords[1],
              coords[0]
            );

            return {
              id: feature.properties.mapbox_id || suggestion.mapbox_id,
              name: feature.properties.name || suggestion.name,
              address: feature.properties.address || '',
              place_formatted: feature.properties.place_formatted || '',
              coordinates: coords,
              phone: feature.properties.tel || undefined,
              categories: feature.properties.poi_category || ['Tattoo Studio'],
              distance: Math.round(distance * 10) / 10,
            };
          }
          
          return null;
        } catch (err) {
          console.error('Retrieve error:', err);
          return null;
        }
      })
    );

    // Filter out nulls and sort by distance
    const validShops = shops.filter((shop): shop is ShopResult => shop !== null).sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ shops: validShops });
  } catch (error) {
    console.error('Shop search error:', error);
    return NextResponse.json({ error: 'Failed to search shops' }, { status: 500 });
  }
}

// Haversine formula for distance calculation (returns miles)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}