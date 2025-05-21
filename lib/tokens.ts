// Types for token data
export interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  logo: string;
  market_cap: number;
  change_24h: number;
  volume_24h: number;
  rank: number;
  lastUpdated: number;
  // Additional data
  high_24h: number;
  low_24h: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
}

// Function to store token data in localStorage
export function storeTokensInCache(tokens: Token[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tokens', JSON.stringify(tokens));
      localStorage.setItem('tokensTimestamp', Date.now().toString());
      console.log(`Stored ${tokens.length} tokens in localStorage cache`);
    } catch (err) {
      console.error('Error storing tokens in localStorage:', err);
    }
  }
}

// Function to get tokens from localStorage
export function getTokensFromCache(): Token[] | null {
  if (typeof window !== 'undefined') {
    try {
      const tokensJson = localStorage.getItem('tokens');
      if (tokensJson) {
        const tokens = JSON.parse(tokensJson) as Token[];
        const timestamp = parseInt(localStorage.getItem('tokensTimestamp') || '0', 10);
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (now - timestamp <= maxAge) {
          console.log(`Using ${tokens.length} tokens from cache (less than 5 minutes old)`);
          return tokens;
        } else {
          console.log('Cached tokens are too old, fetching fresh data');
          return null;
        }
      }
    } catch (err) {
      console.error('Error getting tokens from localStorage:', err);
    }
  }
  return null;
}

// Function to fetch top tokens from Mobula.io
export async function fetchTopTokens(limit: number = 100): Promise<Token[]> {
  const apiKey = process.env.MOBULA_API_KEY;
  const apiUrl = process.env.MOBULA_API_URL?.replace('/api/1', '') || 'https://api.mobula.io';

  // Debug logging
  console.log('Environment check:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length,
    apiUrl,
    envKeys: Object.keys(process.env).filter(key => key.includes('MOBULA'))
  });

  if (!apiKey) {
    console.error('MOBULA_API_KEY is not configured');
    throw new Error('API key not configured');
  }

  try {
    console.log(`Fetching top ${limit} tokens from Mobula.io...`);
    
    // Use the correct API endpoint with query parameters
    const params = new URLSearchParams({
      blockchain: ['ethereum', 'bsc'].join(','), // Query multiple blockchains
      limit: limit.toString()
    });
    
    const url = `${apiUrl}/api/1/market/data?${params.toString()}`;
    console.log('Request URL:', url);
    console.log('Using API Key:', apiKey.substring(0, 5) + '...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Unexpected response type:', contentType);
      console.error('Response body:', text);
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    const data = await response.json();
    
    if (!data || !data.data) {
      console.error('Invalid API response format:', data);
      throw new Error('Invalid API response format');
    }

    console.log(`Received data from Mobula.io API`);
    const tokens = [data.data].map(token => ({
      id: token.id?.toString() || token.symbol?.toLowerCase(),
      name: token.name || 'Unknown',
      symbol: token.symbol || '???',
      price: token.price || 0,
      logo: token.logo || `/images/${token.symbol?.toLowerCase() || 'unknown'}.png`,
      market_cap: token.market_cap || 0,
      change_24h: token.price_change_24h || 0,
      rank: token.rank || 999999,
      lastUpdated: Date.now(),
      high_24h: token.high_24h || 0,
      low_24h: token.low_24h || 0,
      ath: token.ath || 0,
      ath_change_percentage: token.ath_change_percentage || 0,
      ath_date: token.ath_date || '',
      atl: token.atl || 0,
      atl_change_percentage: token.atl_change_percentage || 0,
      atl_date: token.atl_date || '',
      circulating_supply: token.circulating_supply || 0,
      total_supply: token.total_supply || null,
      max_supply: token.max_supply || null
    }));

    // Cache the tokens
    storeTokensInCache(tokens);
    return tokens;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    // Try to get cached data as fallback
    const cachedTokens = getTokensFromCache();
    if (cachedTokens && cachedTokens.length > 0) {
      console.log('Using cached tokens as fallback');
      return cachedTokens;
    }
    throw error;
  }
}

// Function to update token prices in real-time from Mobula
export async function updateTokenPrices(tokens: Token[]): Promise<Token[]> {
  try {
    if (tokens.length === 0) return tokens;
    
    // For better performance, prioritize top tokens
    // Get the top 75 tokens by rank or market cap
    const topTokensToUpdate = [...tokens]
      .sort((a, b) => a.rank && b.rank ? a.rank - b.rank : 0)
      .slice(0, 75);
    
    console.log(`Updating prices for top ${topTokensToUpdate.length} tokens from Mobula.io`);
    
    // Try Mobula API via server-side proxy
    try {
      // Get symbols for Mobula API
      const symbols = topTokensToUpdate.map(token => token.symbol).join(',');
      
      const proxyUrl = `/api/token-prices?symbols=${encodeURIComponent(symbols)}`;
      const proxyResponse = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        
        if (data && Array.isArray(data.data)) {
          console.log(`Received updated price data for ${data.data.length} tokens from Mobula API`);
          
          // Create a map for quick lookup during update (using symbol as key)
          const updatedDataMap = new Map();
          data.data.forEach((item: any) => {
            if (item && item.symbol) {
              updatedDataMap.set(item.symbol.toUpperCase(), item);
            }
          });
          
          // Update token prices
          const now = Date.now();
          const updatedTokens = tokens.map(token => {
            // Fast lookup by symbol
            const updatedData = updatedDataMap.get(token.symbol.toUpperCase());
            
            if (updatedData) {
              const newPrice = updatedData.price || token.price;
              const priceChanged = token.price !== newPrice;
              
              return {
                ...token,
                price: newPrice,
                change_24h: updatedData.change_24h || token.change_24h,
                lastUpdated: now
              };
            }
            return token;
          });
          
          return updatedTokens;
        }
      }
    } catch (mobulaError) {
      console.error('Error updating prices via Mobula API:', mobulaError);
    }
    
    // If API fails, return original tokens
    console.log('Mobula price update failed, returning original tokens');
    return tokens;
  } catch (error) {
    console.error('Error updating token prices:', error);
    return tokens; // Return original tokens if update fails
  }
}

// Function to fetch tokens from Mobula.io
export async function fetchTokens(limit: number = 100): Promise<Token[]> {
  const apiKey = process.env.MOBULA_API_KEY;
  const apiUrl = process.env.MOBULA_API_URL || 'https://api.mobula.io';

  if (!apiKey) {
    console.error('MOBULA_API_KEY is not configured');
    throw new Error('API key not configured');
  }

  try {
    console.log(`Fetching ${limit} tokens from Mobula.io...`);
    const url = `${apiUrl}/api/1/market/list?limit=${limit}`;
    console.log('Request URL:', url);
    console.log('Using API Key:', apiKey.substring(0, 5) + '...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Unexpected response type:', contentType);
      console.error('Response body:', text);
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      console.error('Invalid API response format:', data);
      throw new Error('Invalid API response format');
    }

    console.log(`Received ${data.length} tokens from Mobula.io API`);
    const tokens = data.map(token => ({
      id: token.id || token.symbol?.toLowerCase(),
      name: token.name || 'Unknown',
      symbol: token.symbol || '???',
      price: token.price || 0,
      logo: token.logo || `/images/${token.symbol?.toLowerCase() || 'unknown'}.png`,
      market_cap: token.market_cap || 0,
      change_24h: token.change_24h || 0,
      rank: token.rank || 999999,
      lastUpdated: Date.now(),
      high_24h: token.high_24h || 0,
      low_24h: token.low_24h || 0,
      ath: token.ath || 0,
      ath_change_percentage: token.ath_change_percentage || 0,
      ath_date: token.ath_date || '',
      atl: token.atl || 0,
      atl_change_percentage: token.atl_change_percentage || 0,
      atl_date: token.atl_date || '',
      circulating_supply: token.circulating_supply || 0,
      total_supply: token.total_supply || null,
      max_supply: token.max_supply || null
    }));

    // Cache the tokens
    storeTokensInCache(tokens);
    return tokens;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    // Try to get cached data as fallback
    const cachedTokens = getTokensFromCache();
    if (cachedTokens && cachedTokens.length > 0) {
      console.log('Using cached tokens as fallback');
      return cachedTokens;
    }
    throw error;
  }
} 