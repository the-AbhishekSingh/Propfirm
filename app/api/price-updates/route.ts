import { NextResponse } from 'next/server';

// Mobula API settings
const MOBULA_API_URL = 'https://api.mobula.io/api/1';
const MOBULA_API_KEY = "998d885d-fdce-479d-bb61-56d5d24d8763";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    
    if (!ids) {
      return NextResponse.json(
        { error: 'Missing required parameter: ids' },
        { status: 400 }
      );
    }
    
    const idList = ids.split(',');
    console.log(`Fetching price updates for ${idList.length} tokens from Mobula.io`);
    
    // Mobula.io's API can also benefit from chunking for large requests
    const MAX_TOKENS_PER_REQUEST = 50;
    const tokenChunks = [];
    
    // Split the tokens into chunks of MAX_TOKENS_PER_REQUEST
    for (let i = 0; i < idList.length; i += MAX_TOKENS_PER_REQUEST) {
      tokenChunks.push(idList.slice(i, i + MAX_TOKENS_PER_REQUEST));
    }
    
    console.log(`Split into ${tokenChunks.length} chunks for Mobula.io API requests`);
    
    // Array to collect all token data
    let allTokens: any[] = [];
    
    // Process each chunk sequentially to avoid rate limits
    for (let i = 0; i < tokenChunks.length; i++) {
      const chunk = tokenChunks[i];
      const chunkIds = chunk.join(',');
      console.log(`Processing chunk ${i + 1} with ${chunk.length} tokens`);
      
      // Try different endpoint strategies for Mobula.io
      try {
        // First attempt - use multi endpoint that accepts multiple tokens
        console.log(`Fetching token data using Mobula.io multi endpoint...`);
        const multiResponse = await fetch(`${MOBULA_API_URL}/market/multi?assets=${chunkIds}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MOBULA_API_KEY}`
          },
          cache: 'no-store'
        });
        
        if (multiResponse.ok) {
          const data = await multiResponse.json();
          if (data && Array.isArray(data.data) && data.data.length > 0) {
            console.log(`Chunk ${i + 1} returned ${data.data.length} tokens from Mobula.io`);
            allTokens = [...allTokens, ...data.data];
            continue; // Skip the alternative methods if successful
          }
        }
        
        // Alternative - use market/list and filter the results
        console.log(`Retrying with market/list endpoint...`);
        const listResponse = await fetch(`${MOBULA_API_URL}/market/list?limit=400&order=market_cap`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MOBULA_API_KEY}`
          },
          cache: 'no-store'
        });
        
        if (listResponse.ok) {
          const data = await listResponse.json();
          if (data && Array.isArray(data.data) && data.data.length > 0) {
            // Filter to only include the tokens in our chunk
            const idSet = new Set(chunk);
            const filteredTokens = data.data.filter((token: any) => idSet.has(token.id));
            
            console.log(`Found ${filteredTokens.length} matching tokens from list endpoint`);
            allTokens = [...allTokens, ...filteredTokens];
          }
        }
      } catch (error) {
        console.error(`Error fetching chunk ${i + 1}:`, error);
      }
      
      // Add a small delay between chunks to avoid rate limiting
      if (i < tokenChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    if (allTokens.length === 0) {
      console.error('No price data received from Mobula.io API');
      return NextResponse.json(
        { error: 'Failed to fetch price updates from Mobula.io API' },
        { status: 500 }
      );
    }
    
    console.log(`Received price updates for ${allTokens.length} tokens total from Mobula.io`);
    
    // Format the data to match our application's expected structure
    const formattedTokens = allTokens.map((token, index) => ({
      id: token.id || `mobula-${index}`,
      name: token.name || token.symbol || `Mobula Token ${index + 1}`,
      symbol: token.symbol?.toUpperCase() || '???',
      price: typeof token.price === 'number' ? token.price : 0,
      logo: token.logo || '',
      market_cap: typeof token.market_cap === 'number' ? token.market_cap : 0,
      change_24h: typeof token.change_24h === 'number' ? token.change_24h : 0,
      rank: token.rank || index + 1,
      volume_24h: token.volume_24h || 0
    }));
    
    // Return in the format our app expects
    return NextResponse.json({
      data: formattedTokens,
      source: 'Mobula.io API'
    });
  } catch (error) {
    console.error('Mobula.io price update endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch price updates from Mobula.io',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 