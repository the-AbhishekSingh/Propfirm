'use client';

import React, { useState, useEffect } from 'react';
import { Token } from '@/lib/tokens';
import { fetchTopTokens } from '@/lib/token-service';

interface TokenSelectorProps {
  onSelect?: (token: Token) => void;
  selectedToken?: Token | null;
  className?: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ onSelect, selectedToken: initialSelectedToken, className = '' }) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(initialSelectedToken || null);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTopTokens();
        setTokens(data);
      } catch (err) {
        console.error('Failed to load tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tokens');
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, []);

  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (token: Token) => {
    setSelectedToken(token);
    if (onSelect) {
      onSelect(token);
    }
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="animate-pulse bg-gray-700 h-10 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="bg-red-500 text-white p-2 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
      >
        {selectedToken ? (
          <div className="flex items-center space-x-2">
            {selectedToken.logo && (
              <img
                src={selectedToken.logo}
                alt={selectedToken.name}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${selectedToken.symbol}&background=random`;
                }}
              />
            )}
            <span>{selectedToken.symbol}</span>
          </div>
        ) : (
          <span className="text-gray-400">Select a token</span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-gray-800 rounded-lg shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredTokens.map((token) => (
              <button
                key={token.id}
                onClick={() => handleSelect(token)}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-700 transition-colors"
              >
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
                    <div className="text-left">{token.symbol}</div>
                    <div className="text-sm text-gray-400">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div>${(token.price || 0).toFixed(2)}</div>
                  <div className={`text-sm ${(token.change_24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(token.change_24h || 0).toFixed(2)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSelector; 