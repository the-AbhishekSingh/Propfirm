import { NextRequest, NextResponse } from 'next/server';

// Configure route
export const runtime = 'edge'; // Use Edge Runtime
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server-side proxy for cryptocurrency data
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching top tokens from CoinGecko...');
    
    // Use the markets endpoint to get top tokens by market cap
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h';
    console.log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, response.statusText);
      console.error('Details:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Received data for ${data.length} tokens`);
    
    // Map to our expected format
    const mappedTokens = data.map((token: any) => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol.toUpperCase(),
      price: token.current_price,
      logo: token.image,
      market_cap: token.market_cap,
      change_24h: token.price_change_percentage_24h,
      volume_24h: token.total_volume,
      rank: token.market_cap_rank,
      lastUpdated: Date.now()
    }));
    
    console.log(`Successfully mapped ${mappedTokens.length} tokens`);
    
    // Return the data
    return NextResponse.json({
      data: mappedTokens,
      source: 'CoinGecko API',
      count: mappedTokens.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('API error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch from CoinGecko API', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 