import { Token } from './tokens';

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

// Function to fetch top tokens from our API
export async function fetchTopTokens(limit: number = 300): Promise<Token[]> {
  try {
    console.log(`Fetching top ${limit} tokens from API...`);
    
    const response = await fetch('/api/coinmarketcap', {
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
    
    if (!data || !data.data || !Array.isArray(data.data)) {
      console.error('Invalid API response format:', data);
      throw new Error('Invalid API response format');
    }
    
    console.log(`Received ${data.data.length} tokens from API`);
    
    // Cache the tokens
    storeTokensInCache(data.data);
    return data.data;
    
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

// Function to update token prices in real-time
export async function updateTokenPrices(tokens: Token[]): Promise<Token[]> {
  try {
    if (tokens.length === 0) return tokens;
    
    // Fetch fresh data from our API
    const freshTokens = await fetchTopTokens();
    
    // Create a map for quick lookup
    const tokenMap = new Map(freshTokens.map(token => [token.symbol, token]));
    
    // Update prices while preserving other data
    const updatedTokens = tokens.map(token => {
      const freshData = tokenMap.get(token.symbol);
      if (freshData) {
        return {
          ...token,
          price: freshData.price,
          change_24h: freshData.change_24h,
          market_cap: freshData.market_cap,
          volume_24h: freshData.volume_24h,
          lastUpdated: Date.now()
        };
      }
      return token;
    });
    
    return updatedTokens;
  } catch (error) {
    console.error('Error updating token prices:', error);
    return tokens; // Return original tokens if update fails
  }
} 