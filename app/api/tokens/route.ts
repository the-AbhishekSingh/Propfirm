import { NextResponse } from 'next/server';

// Define token interface for type safety
interface MobulaToken {
  id?: string;
  name?: string;
  symbol?: string;
  price?: number;
  logo?: string;
  market_cap?: number;
  change_24h?: number;
  [key: string]: any; // For other properties we might not know
}

// Server-side proxy for Mobula API to avoid CORS issues
export async function GET() {
  try {
    console.log('Server-side proxy: Fetching tokens from Mobula API');
    
    // Your Mobula API key
    const MOBULA_API_KEY = "998d885d-fdce-479d-bb61-56d5d24d8763";
    
    // First try to fetch with default parameters
    let response = await fetchFromMobula(MOBULA_API_KEY);
    
    // If first try failed or returned less than expected data, retry with different parameters
    if (!response.ok || !response.data || response.data.length < 250) {
      console.log('First fetch attempt failed or returned incomplete data, retrying with different parameters...');
      response = await fetchFromMobula(MOBULA_API_KEY, 'circulating_supply');
    }
    
    // If still failed, retry with another sorting parameter
    if (!response.ok || !response.data || response.data.length < 250) {
      console.log('Second fetch attempt failed or returned incomplete data, retrying with different parameters...');
      response = await fetchFromMobula(MOBULA_API_KEY, 'volume');
    }
    
    // If we have data, return it
    if (response.ok && response.data && response.data.length > 0) {
      console.log(`Server-side proxy: Successfully fetched ${response.data.length} tokens from Mobula API`);
      
      // Enhance the data if needed
      const enhancedData = {
        ...response.responseData,
        data: response.data.map((item: MobulaToken, index: number) => ({
          ...item,
          id: item.id || item.symbol || `mobula-${index}`,
          name: item.name || item.symbol || `Unknown Token ${index + 1}`,
          symbol: item.symbol || '???',
          logo: item.logo || '',
          market_cap: item.market_cap || 0,
          change_24h: item.change_24h || 0,
          rank: index + 1
        }))
      };
      
      return NextResponse.json(enhancedData);
    }
    
    // If all retries failed, return error
    console.error('All attempts to fetch from Mobula API failed');
    return NextResponse.json(
      { error: 'Failed to fetch token data from Mobula API after multiple attempts' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Server proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token data from Mobula API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper function to fetch from Mobula API with different parameters
async function fetchFromMobula(apiKey: string, orderBy: string = 'market_cap') {
  try {
    // Fetch with a high limit to ensure we get as many tokens as possible
    const response = await fetch(`https://api.mobula.io/api/1/market/list?limit=400&order=${orderBy}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mobula API error: ${response.status} ${response.statusText}. Details: ${errorText}`);
      return { ok: false, data: null, responseData: null };
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.data) || data.data.length === 0) {
      console.error('Invalid API response format from Mobula:', data);
      return { ok: false, data: null, responseData: null };
    }
    
    console.log(`Fetched ${data.data.length} tokens from Mobula API with order=${orderBy}`);
    
    // Log detailed information about the first few tokens to debug structure
    console.log('First 3 tokens data structure:', JSON.stringify(data.data.slice(0, 3), null, 2));
    
    return { ok: true, data: data.data, responseData: data };
  } catch (error) {
    console.error(`Error fetching from Mobula with order=${orderBy}:`, error);
    return { ok: false, data: null, responseData: null };
  }
} 