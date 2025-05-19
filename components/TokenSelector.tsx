'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchTopTokens, Token } from '@/lib/tokens';
import Image from 'next/image';

interface TokenSelectorProps {
  onSelect: (token: Token) => void;
  className?: string;
}

// Move TokenIcon outside of the component to avoid hooks issues
const TokenIcon = ({ token }: { token: Token }) => {
  if (!token.logo) {
    return (
      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
        {token.symbol[0]}
      </div>
    );
  }
  
  return (
    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
      <img 
        src={token.logo} 
        alt={token.symbol}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          // Replace with first letter of symbol
          target.style.display = 'none';
          target.parentElement!.innerHTML = token.symbol[0];
        }}
      />
    </div>
  );
};

export default function TokenSelector({ onSelect, className = '' }: TokenSelectorProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch tokens on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadTokens = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching tokens from API...');
        const data = await fetchTopTokens(300);
        
        if (!isMounted) return;
        
        console.log('Tokens fetched successfully:', data.length);
        
        if (data.length === 0) {
          setError('No tokens returned from API');
          return;
        }
        
        // Sort tokens by market cap
        const sortedTokens = [...data].sort((a, b) => {
          if (a.market_cap !== b.market_cap) {
            return b.market_cap - a.market_cap;
          }
          return (a.rank || 0) - (b.rank || 0);
        });
        
        setTokens(sortedTokens);
        
        // Set default selected token to Bitcoin if available
        const btc = sortedTokens.find(token => token.symbol === 'BTC');
        if (btc) {
          setSelectedToken(btc);
          onSelect(btc);
          console.log('Selected BTC as default');
        } else if (sortedTokens.length > 0) {
          setSelectedToken(sortedTokens[0]);
          onSelect(sortedTokens[0]);
          console.log('Selected first token as default:', sortedTokens[0].symbol);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load tokens:', error);
        setError('Failed to load tokens. Please try again later.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTokens();
    
    return () => {
      isMounted = false;
    };
  }, [onSelect]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter tokens based on search query
  const filteredTokens = searchQuery
    ? tokens.filter(token => 
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tokens;

  // Get token count info
  const totalTokenCount = tokens.length;
  const filteredTokenCount = filteredTokens.length;
  const isFiltering = searchQuery.length > 0;

  // Handle token selection
  const handleSelectToken = useCallback((token: Token) => {
    setSelectedToken(token);
    setIsOpen(false);
    onSelect(token);
    console.log('Selected token:', token);
  }, [onSelect]);

  // Format price with appropriate decimals
  const formatPrice = useCallback((price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.0001) return price.toFixed(4);
    return price.toFixed(8);
  }, []);

  // Handle dropdown toggle
  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Handle search query change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected token display */}
      <div
        onClick={toggleDropdown}
        className="flex items-center gap-2 p-2 border rounded-md cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        {selectedToken ? (
          <>
            <TokenIcon token={selectedToken} />
            <div className="font-medium">{selectedToken.symbol}</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
            </svg>
          </>
        ) : (
          isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <div className="text-gray-500">Select Token</div>
          )
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Error state */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-center">
              {error}
            </div>
          )}

          {/* Tokens list */}
          <div className="py-1">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
                <div className="text-sm text-gray-500">Loading tokens...</div>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="p-3 text-center text-gray-500">No tokens found</div>
            ) : (
              <>
                <div className="p-2 bg-gray-100 dark:bg-gray-700 text-xs text-center">
                  {isFiltering 
                    ? `Showing ${filteredTokenCount} of ${totalTokenCount} tokens matching "${searchQuery}"`
                    : `Showing all ${totalTokenCount} tokens from Mobula.io`
                  }
                </div>
                {filteredTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleSelectToken(token)}
                  >
                    <div className="flex items-center gap-2">
                      <TokenIcon token={token} />
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-gray-500">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div>${formatPrice(token.price)}</div>
                      <div className={`text-xs ${token.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {token.change_24h >= 0 ? '+' : ''}{token.change_24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 