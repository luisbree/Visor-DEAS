
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const geoServerCapsUrl = searchParams.get('url');

  if (!geoServerCapsUrl) {
    return NextResponse.json({ error: 'GeoServer GetCapabilities URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(geoServerCapsUrl, {
      headers: {
        'Accept': 'application/xml, text/xml', // Be explicit about accepted content types
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GeoServer proxy error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json({ error: `Error from GeoServer: ${response.status} ${response.statusText}`, details: errorText }, { status: response.status });
    }

    const xmlText = await response.text();
    // It's better to send XML as text/xml
    return new NextResponse(xmlText, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error: any) {
    console.error('GeoServer proxy fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch from GeoServer via proxy', details: error.message || String(error) }, { status: 500 });
  }
}
