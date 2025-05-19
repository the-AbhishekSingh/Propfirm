import { NextResponse } from 'next/server';

// Server-side proxy for Mobula API price updates to avoid CORS issues
export async function GET(request: Request) {
  try {
    // Extract symbols from the query string
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols');
    
    if (!symbols) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbols' },
        { status: 400 }
      );
    }
    
    console.log(`Server-side proxy: Fetching price updates for ${symbols.split(',').length} tokens`);
    
    // Your Mobula API key
    const MOBULA_API_KEY = "998d885d-fdce-479d-bb61-56d5d24d8763";
    
    const response = await fetch(`https://api.mobula.io/api/1/market/multi?assets=${symbols}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOBULA_API_KEY}`
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Proxy error for token prices: ${response.status} ${response.statusText}. Details: ${errorText}`);
      return NextResponse.json(
        { 
          error: `Failed to fetch price data: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.data)) {
      console.error('Server proxy: Invalid price update API response format:', data);
      return NextResponse.json(
        { error: 'Invalid API response format for price updates', data },
        { status: 500 }
      );
    }
    
    console.log(`Server proxy: Successfully fetched price updates for ${data.data.length} tokens`);
    
    // Return the data from the Mobula API
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server proxy error for token prices:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch price data from API',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 