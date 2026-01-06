import { NextRequest, NextResponse } from 'next/server';

const SCRAPING_SERVICE_URL = 'http://207.231.111.110:3050/scrape';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!url.includes('booking.com')) {
      return NextResponse.json(
        { error: 'Invalid URL. Must be a Booking.com URL' },
        { status: 400 }
      );
    }

    // Proxy the request to the scraping service
    // Note: Scraping can take 30-60 seconds, so we use a longer timeout
    // Vercel function timeout is configured to 300 seconds (5 minutes) in vercel.json
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minutes timeout (less than Vercel's 5 min limit)
    
    try {
      const response = await fetch(SCRAPING_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Scraping service error: ${errorText}` },
          { status: response.status }
        );
      }

      const result = await response.json();
      
      // Log the response structure for debugging
      console.log('Scraping service response:', {
        hasSuccess: 'success' in result,
        hasData: 'data' in result,
        success: result.success,
        keys: Object.keys(result),
      });
      
      // The scraping service returns { success, message, data, timestamp }
      // Extract the data field and return it to match the client's expected format
      if (result.success && result.data) {
        return NextResponse.json(result.data);
      }
      
      // Handle error response from scraping service
      if (result.success === false) {
        return NextResponse.json(
          { error: result.message || result.error || 'Scraping failed' },
          { status: 500 }
        );
      }
      
      // If data exists at root level (fallback for different response formats)
      if (result.hotel_name || result.rooms) {
        return NextResponse.json(result);
      }
      
      // Fallback: return the result as-is if structure is unexpected
      console.warn('Unexpected response structure:', result);
      return NextResponse.json(result);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout. Scraping took too long (over 4 minutes). Please try again with a different URL.' },
          { status: 504 }
        );
      }
      // Handle network errors
      if (fetchError.message?.includes('fetch failed') || fetchError.code === 'ECONNREFUSED' || fetchError.code === 'ETIMEDOUT') {
        return NextResponse.json(
          { error: 'Unable to connect to scraping service. Please try again later.' },
          { status: 503 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Scraping proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scrape data' },
      { status: 500 }
    );
  }
}

