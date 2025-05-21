import React, { useState, useEffect } from 'react';
import { Token } from '@/lib/tokens';

const TokenList: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change_24h'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching tokens...');
        const response = await fetch('/api/coinmarketcap');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch tokens');
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid data format received');
        }
        
        setTokens(data.data);
      } catch (err) {
        console.error('Error loading tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
    // Refresh every 5 minutes
    const interval = setInterval(loadTokens, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const sortedTokens = [...tokens].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'price':
        return ((a.price || 0) - (b.price || 0)) * multiplier;
      case 'change_24h':
        return ((a.change_24h || 0) - (b.change_24h || 0)) * multiplier;
      default:
        return ((a.rank || 0) - (b.rank || 0)) * multiplier;
    }
  });

  const handleSort = (column: 'rank' | 'price' | 'change_24h') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-700 rounded-lg mb-4"></div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-700 rounded-lg mb-2"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500 text-white p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No tokens found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-gray-700">
            <th className="p-4 cursor-pointer" onClick={() => handleSort('rank')}>
              Rank {sortBy === 'rank' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th className="p-4">Name</th>
            <th className="p-4 cursor-pointer" onClick={() => handleSort('price')}>
              Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th className="p-4 cursor-pointer" onClick={() => handleSort('change_24h')}>
              24h Change {sortBy === 'change_24h' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th className="p-4">Market Cap</th>
            <th className="p-4">Volume (24h)</th>
          </tr>
        </thead>
        <tbody>
          {sortedTokens.map((token) => (
            <tr key={token.id} className="border-b border-gray-700 hover:bg-gray-800">
              <td className="p-4">{token.rank || '-'}</td>
              <td className="p-4">
                <div className="flex items-center space-x-2">
                  {token.logo && (
                    <img
                      src={token.logo}
                      alt={token.name}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=random`;
                      }}
                    />
                  )}
                  <div>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-gray-400">{token.name}</div>
                  </div>
                </div>
              </td>
              <td className="p-4">${(token.price || 0).toFixed(2)}</td>
              <td className={`p-4 ${(token.change_24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(token.change_24h || 0).toFixed(2)}%
              </td>
              <td className="p-4">${((token.market_cap || 0) / 1e9).toFixed(2)}B</td>
              <td className="p-4">${((token.volume_24h || 0) / 1e9).toFixed(2)}B</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TokenList; 