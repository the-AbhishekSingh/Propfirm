import { NextRequest, NextResponse } from 'next/server';

// Mobula API settings
const MOBULA_API_URL = process.env.MOBULA_API_URL || 'https://api.mobula.io/api/1';
const MOBULA_API_KEY = process.env.MOBULA_API_KEY;

if (!MOBULA_API_KEY) {
  throw new Error('MOBULA_API_KEY environment variable is not set');
}

// Configure route
export const runtime = 'edge'; // Use Edge Runtime
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server-side proxy for Mobula.io crypto data
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching top 300 tokens from Mobula.io...');
    
    // Use the correct endpoint for cryptocurrency data
    const url = `${MOBULA_API_URL}/market/list?limit=300`;
    console.log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOBULA_API_KEY}`
      },
      cache: 'no-store'
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} ${response.statusText}. Details: ${errorText}`);
      return NextResponse.json(
        { 
          error: `Failed to fetch from Mobula.io API: ${response.statusText}`,
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }
    
    const responseData = await response.json();
    console.log('API Response:', JSON.stringify(responseData, null, 2));
    
    // Check if we have the expected data structure
    if (!responseData || typeof responseData !== 'object') {
      console.error('Invalid API response format');
      return NextResponse.json(
        { error: 'Invalid API response format' },
        { status: 500 }
      );
    }

    // The tokens should be in the response data directly
    const tokens = Array.isArray(responseData) ? responseData : responseData.data || [];
    
    if (!Array.isArray(tokens) || tokens.length === 0) {
      console.error('No tokens found in response');
      return NextResponse.json(
        { error: 'No tokens found in API response' },
        { status: 500 }
      );
    }

    console.log(`Found ${tokens.length} tokens in response`);
    
    // Map to our expected format and ensure we have exactly 300 tokens
    const mappedTokens = tokens
      .slice(0, 300)
      .map((token: any, index: number) => {
        // Validate and clean token data
        const name = token.name && typeof token.name === 'string' ? token.name.trim() : '';
        const symbol = token.symbol && typeof token.symbol === 'string' ? token.symbol.trim().toUpperCase() : '';
        
        // Skip invalid tokens
        if (!name || !symbol) {
          console.warn(`Skipping invalid token at index ${index}:`, token);
          return null;
        }

        // Ensure we have valid numeric values
        const price = typeof token.price === 'number' && !isNaN(token.price) ? token.price : 0;
        const market_cap = typeof token.market_cap === 'number' && !isNaN(token.market_cap) ? token.market_cap : 0;
        const change_24h = typeof token.change_24h === 'number' && !isNaN(token.change_24h) ? token.change_24h : 0;

        return {
          id: token.id || `mobula-${index}`,
          name: name,
          symbol: symbol,
          price: price,
          logo: token.logo || '',
          market_cap: market_cap,
          change_24h: change_24h,
          rank: index + 1,
          lastUpdated: Date.now()
        };
      })
      .filter((token): token is NonNullable<typeof token> => token !== null) // Remove null tokens
      .sort((a, b) => {
        // First sort by market cap
        if (a.market_cap !== b.market_cap) {
          return b.market_cap - a.market_cap;
        }
        // If market caps are equal, sort by rank
        return (a.rank || 0) - (b.rank || 0);
      });
    
    console.log(`Successfully mapped ${mappedTokens.length} tokens`);
    
    if (mappedTokens.length === 0) {
      return NextResponse.json(
        { error: 'No valid tokens found after mapping' },
        { status: 500 }
      );
    }
    
    // Return the data
    return NextResponse.json({
      data: mappedTokens,
      source: 'Mobula.io API',
      count: mappedTokens.length
    });
    
  } catch (error) {
    console.error('API error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch from Mobula.io API', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 