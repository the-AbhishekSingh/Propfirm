import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper function to generate unique tokens
function generateUniqueTokens() {
  const baseTokens = new Set([
    // Top 25 by market cap from Mobula.io
    'btc', 'eth', 'xrp', 'mgc', 'bnb', 'sol', 'doge', 'ada', 'trx', 'steth',
    'wsteth', 'link', 'xlm', 'avax', 'zbu', 'hbar', 'shib', 'hype', 'ltc', 'ton',
    'usds', 'dot', 'btcb', 'xmr', 'pi',
    // Additional major tokens
    'usdt', 'usdc', 'busd', 'dai', 'tusd', 'usdp', 'gusd', 'frax', 'lusd', 'alusd',
    'mim', 'usdn', 'aave', 'uni', 'cake', 'sushi', 'comp', 'mkr', 'snx', 'yfi',
    'crv', 'bal', 'rune', '1inch', 'spell', 'ohm', 'klima', 'tomb', 'ice', 'matic',
    'near', 'atom', 'algo', 'icp', 'vet', 'mana', 'sand', 'ilv', 'ygg', 'alice',
    'tlm', 'chr', 'gala', 'enj', 'chz', 'axs', 'flow', 'rari', 'super', 'tvk',
    'dego', 'ocean', 'fet', 'agix', 'nmr', 'grt', 'band', 'api3', 'dia', 'nest',
    'ar', 'storj', 'sia', 'btt', 'sc', 'hot', 'one', 'iotx', 'ont', 'fil',
    'rally', 'fwb', 'whale', 'forever', 'friend', 'social', 'fan', 'creator', 'influence',
    'zec', 'scrt', 'rose', 'keep', 'oxt', 'trb', 'uma', 'rep', 'prom', 'ftt',
    'okb', 'ht', 'kcs', 'gt', 'leo', 'crypto', 'mx', 'qtum', 'ftm', 'waves',
    'neo', 'omg', 'zen', 'nano', 'rvn', 'theta', 'bat', 'dash', 'zil', 'etc',
    'bch', 'fil', 'xtz', 'eos', 'time', 'frax', 'lusd', 'alusd', 'mim', 'usdn'
  ]);

  return Array.from(baseTokens);
}

// Define token interface for type safety
interface MobulaToken {
  id?: string;
  name?: string;
  symbol?: string;
  price?: number;
  logo?: string;
  market_cap?: number;
  change_24h?: number;
  rank?: number;
  last_updated?: string;
  [key: string]: any;
}

// Server-side proxy for Mobula API to avoid CORS issues
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '300';
  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    // First, try to get data from all three Supabase tables if not forcing refresh
    if (!forceRefresh) {
      try {
        // Fetch from tokens table
        const { data: tokensData, error: tokensError } = await supabase
          .from('tokens')
          .select('*')
          .order('market_cap', { ascending: false })
          .limit(parseInt(limit));

        // Fetch from token_prices table
        const { data: pricesData, error: pricesError } = await supabase
          .from('token_prices')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(parseInt(limit));

        // Fetch from token_metadata table
        const { data: metadataData, error: metadataError } = await supabase
          .from('token_metadata')
          .select('*')
          .limit(parseInt(limit));

        // Log any errors
        if (tokensError) console.error('Error fetching from tokens table:', tokensError);
        if (pricesError) console.error('Error fetching from token_prices table:', pricesError);
        if (metadataError) console.error('Error fetching from token_metadata table:', metadataError);

        // If we have data from the tokens table, use it
        if (tokensData && tokensData.length > 0) {
          // Check if data is fresh (less than 5 minutes old)
          const oldestData = tokensData.reduce((oldest, current) => {
            const currentTime = new Date(current.last_updated).getTime();
            const oldestTime = new Date(oldest.last_updated).getTime();
            return currentTime < oldestTime ? current : oldest;
          });

          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (new Date(oldestData.last_updated) > fiveMinutesAgo) {
            console.log('Returning cached data from Supabase tokens table:', tokensData.length, 'tokens');
            
            // Merge with metadata if available
            if (metadataData && metadataData.length > 0) {
              const mergedData = tokensData.map(token => {
                const metadata = metadataData.find(m => m.symbol === token.symbol);
                return {
                  ...token,
                  ...metadata
                };
              });
              return NextResponse.json(mergedData);
            }
            
            return NextResponse.json(tokensData);
          } else {
            console.log('Cache expired, fetching fresh data');
          }
        } else {
          console.log('No cached data found in Supabase tables');
        }
      } catch (error) {
        console.error('Error accessing Supabase tables:', error);
      }
    }

    // If no cached data or force refresh, fetch from Mobula
    const apiKey = process.env.MOBULA_API_KEY;
    if (!apiKey) {
      console.error('MOBULA_API_KEY not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Fetch tokens using the helper function
    const { ok, data } = await fetchFromMobula(apiKey, parseInt(limit));
    
    if (!ok || !data) {
      console.error('Failed to fetch data from Mobula:', { ok, dataLength: data?.length });
      return NextResponse.json(
        { error: 'Failed to fetch token data' },
        { status: 500 }
      );
    }

    if (data.length === 0) {
      console.error('No tokens returned from Mobula');
      return NextResponse.json(
        { error: 'No tokens found' },
        { status: 404 }
      );
    }

    // Transform the data to match our interface
    const tokens = data.map((token: any) => ({
      id: token.id || token.symbol?.toLowerCase(),
      name: token.name || 'Unknown',
      symbol: token.symbol?.toUpperCase() || '???',
      price: token.price || 0,
      logo: token.logo || `/images/${token.symbol?.toLowerCase()}.png`,
      market_cap: token.market_cap || 0,
      change_24h: token.price_change_24h || 0,
      rank: token.rank || 999999,
      last_updated: new Date().toISOString()
    }));

    // Store in all three Supabase tables
    try {
      // Store in tokens table
      const { error: tokensError } = await supabase
        .from('tokens')
        .upsert(tokens, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      // Store in token_prices table
      const priceRecords = tokens.map(token => ({
        symbol: token.symbol,
        price: token.price,
        timestamp: new Date().toISOString()
      }));
      const { error: pricesError } = await supabase
        .from('token_prices')
        .insert(priceRecords);

      // Store in token_metadata table
      const metadataRecords = tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        logo: token.logo,
        rank: token.rank
      }));
      const { error: metadataError } = await supabase
        .from('token_metadata')
        .upsert(metadataRecords, {
          onConflict: 'symbol',
          ignoreDuplicates: false
        });

      if (tokensError) console.error('Error storing in tokens table:', tokensError);
      if (pricesError) console.error('Error storing in token_prices table:', pricesError);
      if (metadataError) console.error('Error storing in token_metadata table:', metadataError);

      console.log('Successfully stored data in Supabase tables');
    } catch (error) {
      console.error('Error in Supabase operations:', error);
    }

    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error in token fetching process:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to fetch from Mobula API
async function fetchFromMobula(apiKey: string, limit: number) {
  try {
    // Get unique tokens
    const uniqueTokens = generateUniqueTokens().slice(0, limit);
    console.log(`Fetching data for ${uniqueTokens.length} unique tokens`);
    
    // Process tokens in batches of 10 to avoid rate limiting
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < uniqueTokens.length; i += batchSize) {
      batches.push(uniqueTokens.slice(i, i + batchSize));
    }

    const allResults = [];
    for (const batch of batches) {
      const batchPromises = batch.map(async (symbol: string) => {
        try {
          // Try both lowercase and uppercase versions of the symbol
          const symbolsToTry = [symbol, symbol.toUpperCase()];
          let lastError = null;

          for (const symbolToTry of symbolsToTry) {
            try {
              console.log(`Fetching data for ${symbolToTry}`);
              const response = await fetch(`https://api.mobula.io/api/1/market/data?asset=${symbolToTry}`, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`
                },
                next: { revalidate: 300 }
              });

              if (!response.ok) {
                lastError = `${response.status} ${response.statusText}`;
                console.error(`Error fetching ${symbolToTry}:`, lastError);
                continue;
              }

              const data = await response.json();
              if (!data || !data.data) {
                lastError = 'Invalid data format';
                console.error(`Invalid data format for ${symbolToTry}:`, data);
                continue;
              }

              console.log(`Successfully fetched data for ${symbolToTry}`);
              return data.data;
            } catch (error) {
              lastError = error;
              console.error(`Error fetching ${symbolToTry}:`, error);
              continue;
            }
          }

          if (lastError) {
            console.error(`Failed to fetch data for ${symbol}: ${lastError}`);
          }
          return null;
        } catch (error) {
          console.error(`Error processing ${symbol}:`, error);
          return null;
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(result => result !== null);
      allResults.push(...validResults);

      // Add a small delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        console.log('Waiting 5 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Log progress
      console.log(`Processed batch ${batches.indexOf(batch) + 1}/${batches.length}, total tokens: ${allResults.length}`);
    }

    if (allResults.length === 0) {
      console.error('No valid token data received');
      return { ok: false, data: null, responseData: null };
    }
    
    console.log(`Successfully fetched data for ${allResults.length} tokens`);
    return { ok: true, data: allResults, responseData: null };
  } catch (error) {
    console.error('Error fetching from Mobula:', error);
    return { ok: false, data: null, responseData: null };
  }
} 