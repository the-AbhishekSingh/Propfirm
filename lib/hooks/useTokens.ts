import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export function useTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tokens from Binance API
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (!response.ok) {
          throw new Error('Failed to fetch tokens');
        }

        const data = await response.json();
        
        // Filter and format the data
        const formattedTokens = data
          .filter((token: any) => token.symbol.endsWith('USDT'))
          .map((token: any) => ({
            id: token.symbol,
            symbol: token.symbol,
            name: token.symbol.replace('USDT', ''),
            price: parseFloat(token.lastPrice),
            change24h: parseFloat(token.priceChangePercent)
          }))
          .sort((a: Token, b: Token) => b.price - a.price);

        setTokens(formattedTokens);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchTokens, 30000);

    return () => clearInterval(interval);
  }, []);

  return { tokens, loading, error };
} 