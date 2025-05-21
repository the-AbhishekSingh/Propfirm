import { NextRequest, NextResponse } from 'next/server';

// Configure route
export const runtime = 'edge'; // Use Edge Runtime
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to fetch with retry
async function fetchWithRetry(url: string, retries = 3, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        return response;
      }

      if (response.status === 429) {
        console.log(`Rate limited, attempt ${i + 1}/${retries}. Waiting ${delayMs}ms...`);
        await delay(delayMs);
        delayMs *= 2; // Exponential backoff
        continue;
      }

      throw new Error(`API request failed with status ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Request failed, attempt ${i + 1}/${retries}. Retrying...`);
      await delay(delayMs);
    }
  }
  throw new Error('Max retries reached');
}

// Server-side proxy for cryptocurrency data
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching top 300 tokens from CoinGecko...');
    
    const allTokens = [];
    const perPage = 100;
    const totalPages = 3; // To get 300 tokens
    
    // Fetch tokens in batches of 100
    for (let page = 1; page <= totalPages; page++) {
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`;
      console.log(`Request URL: ${url}`);
      
      const response = await fetchWithRetry(url);
      const data = await response.json();
      console.log(`Found ${data.length} tokens in page ${page}`);
      allTokens.push(...data);
      
      // Add a longer delay between requests to avoid rate limiting
      if (page < totalPages) {
        await delay(3000); // 3 second delay
      }
    }
    
    console.log(`Total tokens found: ${allTokens.length}`);
    
    // Map to our expected format
    const mappedTokens = allTokens.map((token: any) => ({
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