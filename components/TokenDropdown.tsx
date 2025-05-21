'use client';

import { useState, useEffect } from 'react';
import { Token } from '@/lib/tokens';

interface TokenDropdownProps {
  onSelect: (token: Token) => void;
  selectedToken?: Token;
}

export default function TokenDropdown({ onSelect, selectedToken }: TokenDropdownProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/tokens?limit=300');
        if (!response.ok) {
          throw new Error('Failed to fetch tokens');
        }
        const data = await response.json();
        setTokens(data);
      } catch (err) {
        console.error('Error loading tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tokens');
      } finally {
        setIsLoading(false);
      }
    };

    loadTokens();
  }, []);

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <div
        className="flex items-center justify-between p-2 border rounded-lg cursor-pointer bg-white dark:bg-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedToken ? (
          <div className="flex items-center space-x-2">
            {selectedToken.logo && (
              <img
                src={selectedToken.logo}
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="font-medium">{selectedToken.symbol}</span>
            <span className="text-gray-500 dark:text-gray-400">
              {selectedToken.name}
            </span>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">Select a token</span>
        )}
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search tokens..."
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto max-h-80">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading tokens...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No tokens found</div>
            ) : (
              filteredTokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    onSelect(token);
                    setIsOpen(false);
                  }}
                >
                  {token.logo && (
                    <img
                      src={token.logo}
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {token.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </div>
                    <div className={`text-sm ${token.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {token.change_24h >= 0 ? '+' : ''}{token.change_24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 