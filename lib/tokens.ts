// Types for token data
export interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  logo: string;
  market_cap: number;
  change_24h: number;
  rank?: number;
  previousPrice?: number; // Track previous price for animation
  lastUpdated?: number;   // Timestamp of last update
}

// Function to store token data in localStorage
export function storeTokensInCache(tokens: Token[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mobulaTokens', JSON.stringify(tokens));
      localStorage.setItem('mobulaTokensTimestamp', Date.now().toString());
      console.log(`Stored ${tokens.length} tokens from Mobula in localStorage cache`);
    } catch (err) {
      console.error('Error storing Mobula tokens in localStorage:', err);
    }
  }
}

// Function to get tokens from localStorage
export function getTokensFromCache(): Token[] | null {
  if (typeof window !== 'undefined') {
    try {
      const tokensJson = localStorage.getItem('mobulaTokens');
      if (tokensJson) {
        const tokens = JSON.parse(tokensJson) as Token[];
        const timestamp = parseInt(localStorage.getItem('mobulaTokensTimestamp') || '0', 10);
        const now = Date.now();
        const maxAge = 2 * 60 * 60 * 1000; // 2 hours (ensure frequent updates)
        
        if (now - timestamp <= maxAge) {
          console.log(`Using ${tokens.length} tokens from Mobula cache (less than 2 hours old)`);
          return tokens.map(token => ({
            ...token,
            previousPrice: token.price,
            lastUpdated: Date.now()
          }));
        } else {
          console.log('Cached tokens are too old, fetching fresh data from Mobula');
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
export async function fetchTopTokens(limit = 300): Promise<Token[]> {
  try {
    console.log(`Fetching top ${limit} tokens from Mobula.io...`);

    // Try server-side proxy first
    try {
      console.log('Fetching tokens from server-side proxy...');
      const proxyResponse = await fetch('/api/coinmarketcap', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        console.log('API response received:', {
          status: proxyResponse.status,
          hasData: !!data,
          dataLength: data?.data?.length || 0,
          sampleData: data?.data?.slice(0, 1)
        });
        
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          // Transform data to match our Token interface
          const tokens: Token[] = data.data.map((item: any, index: number) => {
            // Validate required fields
            if (!item.name || !item.symbol) {
              console.warn(`Skipping invalid token at index ${index}:`, item);
              return null;
            }

            // Clean and validate data
            const name = item.name.trim();
            const symbol = item.symbol.trim().toUpperCase();
            
            // Ensure we have valid numeric values
            const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
            const market_cap = typeof item.market_cap === 'number' && !isNaN(item.market_cap) ? item.market_cap : 0;
            const change_24h = typeof item.change_24h === 'number' && !isNaN(item.change_24h) ? item.change_24h : 0;
            
            return {
              id: item.id || `mobula-${index}`,
              name,
              symbol,
              price,
              logo: item.logo || '',
              market_cap,
              change_24h,
              rank: item.rank || index + 1,
              lastUpdated: Date.now()
            };
          }).filter((token: Token | null): token is Token => token !== null);
          
          // Sort by market cap
          const sortedTokens = tokens.sort((a, b) => {
            if (a.market_cap !== b.market_cap) {
              return b.market_cap - a.market_cap;
            }
            return (a.rank || 0) - (b.rank || 0);
          });
          
          // Save to localStorage as cache
          storeTokensInCache(sortedTokens);
          
          console.log(`Successfully processed ${sortedTokens.length} tokens`);
          return sortedTokens;
        }
      }
      console.log("Initial Mobula API request didn't return enough data, trying direct API...");
    } catch (proxyError) {
      console.error("Mobula proxy error:", proxyError);
    }
    
    // If proxy failed, try direct API call as fallback
    console.log("Trying direct Mobula API access...");
    try {
      const MOBULA_API_KEY = process.env.MOBULA_API_KEY;
      if (!MOBULA_API_KEY) {
        throw new Error('MOBULA_API_KEY environment variable is not set');
      }
      
      // Try direct API call with the correct endpoint
      const directResponse = await fetch(`https://api.mobula.io/api/1/market/list?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MOBULA_API_KEY}`
        },
        next: { revalidate: 0 },
      });
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          console.log(`Got ${data.data.length} tokens directly from Mobula API`);
          
          // Transform data to match our Token interface
          const tokens: Token[] = data.data.map((item: any, index: number) => {
            // Validate required fields
            if (!item.name || !item.symbol) {
              console.warn(`Skipping invalid token at index ${index}:`, item);
              return null;
            }

            // Clean and validate data
            const name = item.name.trim();
            const symbol = item.symbol.trim().toUpperCase();
            
            // Ensure we have valid numeric values
            const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
            const market_cap = typeof item.market_cap === 'number' && !isNaN(item.market_cap) ? item.market_cap : 0;
            const change_24h = typeof item.change_24h === 'number' && !isNaN(item.change_24h) ? item.change_24h : 0;
            
            return {
              id: item.id || `mobula-${index}`,
              name,
              symbol,
              price,
              logo: item.logo || '',
              market_cap,
              change_24h,
              rank: item.rank || index + 1,
              lastUpdated: Date.now()
            };
          }).filter((token: Token | null): token is Token => token !== null);
          
          // Sort by market cap
          const sortedTokens = tokens.sort((a, b) => {
            if (a.market_cap !== b.market_cap) {
              return b.market_cap - a.market_cap;
            }
            return (a.rank || 0) - (b.rank || 0);
          });
          
          // Cache the tokens
          storeTokensInCache(sortedTokens);
          
          return sortedTokens;
        }
      }
    } catch (directError) {
      console.error("Direct Mobula API error:", directError);
    }
    
    // If all API attempts failed, check cache
    console.log("All Mobula API attempts failed, checking localStorage cache...");
    const cachedTokens = getTokensFromCache();
    if (cachedTokens && cachedTokens.length > 0) {
      return cachedTokens;
    }

    // All attempts failed
    console.error("All Mobula API attempts failed and no cache available");
    throw new Error("Failed to fetch token data from Mobula.io");
  } catch (error) {
    console.error('Error fetching top tokens from Mobula:', error);
    
    // Last resort - check for any cached data regardless of age
    if (typeof window !== 'undefined') {
      try {
        const tokensJson = localStorage.getItem('mobulaTokens');
        if (tokensJson) {
          console.log('Using expired Mobula cache data as last resort');
          const tokens = JSON.parse(tokensJson) as Token[];
          return tokens.map(token => ({
            ...token,
            lastUpdated: Date.now()
          }));
        }
      } catch (e) {
        console.error('Failed to load expired Mobula cache:', e);
      }
    }
    
    throw error; // Re-throw to let the UI handle it
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
                previousPrice: priceChanged ? token.price : token.previousPrice,
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