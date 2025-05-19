'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TokenSelector from '@/components/TokenSelector';
import { Token, fetchTopTokens, updateTokenPrices, getTokensFromCache } from '@/lib/tokens';

// Live Dashboard with real-time token data from Mobula.io
export default function Dashboard() {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [topTokens, setTopTokens] = useState<Token[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [tokensPerPage, setTokensPerPage] = useState(25); // Show 25 tokens per page
  
  // Calculate pagination
  const totalPages = Math.ceil(topTokens.length / tokensPerPage);
  const startIndex = (page - 1) * tokensPerPage;
  const endIndex = startIndex + tokensPerPage;
  const displayedTokens = topTokens.slice(startIndex, endIndex);

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const changeTokensPerPage = (value: number) => {
    setTokensPerPage(value);
    setPage(1); // Reset to first page when changing items per page
  };

  // Fetch initial token data from Mobula.io
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Explicitly fetch 300 tokens from Mobula.io, making sure we're forcing the limit
        console.log("Fetching all 300 tokens from Mobula.io...");
        const tokens = await fetchTopTokens(300);
        console.log(`Received ${tokens.length} tokens from Mobula.io API`);
        
        if (tokens.length === 0) {
          throw new Error('No tokens received from API');
        }
        
        // Sort by market cap rank
        const sortedTokens = [...tokens].sort((a, b) => {
          return a.rank && b.rank ? a.rank - b.rank : 0;
        });
        
        setTopTokens(sortedTokens);
        setLastUpdated(new Date());
        
        if (sortedTokens.length > 0 && !selectedToken) {
          // Default to Bitcoin or first token
          const btc = sortedTokens.find(t => t.symbol === 'BTC') || sortedTokens[0];
          setSelectedToken(btc);
        }
      } catch (err) {
        console.error('Failed to load initial token data from Mobula.io:', err);
        setError(err instanceof Error ? err.message : 'Failed to load token data');
        
        // Try to load from cache as fallback
        const cachedTokens = getTokensFromCache();
        if (cachedTokens && cachedTokens.length > 0) {
          console.log('Using cached token data as fallback');
          setTopTokens(cachedTokens);
          setLastUpdated(new Date());
          if (!selectedToken) {
            const btc = cachedTokens.find((t: Token) => t.symbol === 'BTC') || cachedTokens[0];
            setSelectedToken(btc);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Function to manually refresh data
  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Clear any cached data from localStorage
      localStorage.removeItem('mobulaTokens');
      localStorage.removeItem('mobulaTokensTimestamp');
      
      // Fetch fresh data from Mobula.io
      const tokens = await fetchTopTokens(300);
      
      const sortedTokens = [...tokens].sort((a, b) => {
        return a.rank && b.rank ? a.rank - b.rank : 0;
      });
      
      setTopTokens(sortedTokens);
      setLastUpdated(new Date());
      setUpdateCounter(prev => prev + 1);
      
      // Update selected token if it exists
      if (selectedToken) {
        const updatedSelected = sortedTokens.find(t => t.id === selectedToken.id);
        if (updatedSelected) {
          setSelectedToken(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Failed to refresh token data from Mobula.io:', err);
      setError(`Failed to refresh data from Mobula.io: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time updates from Mobula.io
  useEffect(() => {
    // Skip if we don't have initial data yet
    if (topTokens.length === 0) return;

    // Update immediately once
    updateTokenPrices(topTokens).then(updatedTokens => {
      setTopTokens(updatedTokens);
      setLastUpdated(new Date());
      
      // Update selected token too if it exists
      if (selectedToken) {
        const updatedSelected = updatedTokens.find(t => t.id === selectedToken.id);
        if (updatedSelected) {
          setSelectedToken(updatedSelected);
        }
      }
    }).catch(error => {
      console.error("Initial price update from Mobula.io failed:", error);
    });

    // Then set up interval for updates
    const updateInterval = setInterval(async () => {
      try {
        // Update prices for tokens we have from Mobula.io
        console.log("Updating token prices from Mobula.io...");
        const updatedTokens = await updateTokenPrices(topTokens);
        console.log(`Updated prices for ${updatedTokens.length} tokens from Mobula.io`);
        
        setTopTokens(updatedTokens);
        setLastUpdated(new Date());
        setUpdateCounter(prev => prev + 1);
        
        // Update selected token too if it exists
        if (selectedToken) {
          const updatedSelected = updatedTokens.find(t => t.id === selectedToken.id);
          if (updatedSelected) {
            setSelectedToken(updatedSelected);
          }
        }
      } catch (err) {
        console.error('Failed to update token prices from Mobula.io:', err);
      }
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(updateInterval);
  }, [topTokens, selectedToken]);

  const handleTokenSelect = useCallback((token: Token) => {
    setSelectedToken(token);
    setIsLoading(false);
    console.log('Selected token:', token);
  }, []);

  // Format price with appropriate color based on price change
  const PriceDisplay = ({ token }: { token: Token }) => {
    const hasChanged = token.previousPrice !== undefined && token.price !== token.previousPrice;
    const increasing = hasChanged && (token.price > (token.previousPrice || 0));
    const decreasing = hasChanged && (token.price < (token.previousPrice || 0));
    
    return (
      <div className={`
        relative
        ${hasChanged ? 'font-semibold' : ''}
        ${increasing ? 'text-green-500' : ''}
        ${decreasing ? 'text-red-500' : ''}
      `}>
        ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
        {hasChanged && (
          <span className={`
            absolute -right-4 animate-pulse
            ${increasing ? 'text-green-600' : ''}
            ${decreasing ? 'text-red-600' : ''}
          `}>
            {increasing ? '↑' : '↓'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold">Mobula.io Cryptocurrency Dashboard</h1>
          
          <div className="flex items-center mt-2 md:mt-0">
            {lastUpdated && (
              <div className="text-sm text-gray-500 mr-3">
                Last updated: {lastUpdated.toLocaleTimeString()} 
                <span className="ml-2 text-xs text-gray-400">
                  (Updates every 10s · #{updateCounter})
                </span>
              </div>
            )}
            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className={`px-3 py-1 rounded-md text-white bg-blue-600 hover:bg-blue-700 flex items-center ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 text-sm p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}
        
        {isLoading && topTokens.length === 0 ? (
          <div className="mb-6 text-center p-8 bg-white shadow-md rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p className="mt-4 text-xl font-medium text-blue-600">Fetching tokens from Mobula.io...</p>
            <p className="mt-2 text-gray-500">Loading the top 300 cryptocurrency tokens...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p>View and select from the top {topTokens.length} cryptocurrencies by market cap from Mobula.io with real-time price updates</p>
            </div>
        
            {/* Token Selector */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select a Token</h2>
              
              <div className="max-w-md mb-6">
                <TokenSelector 
                  onSelect={handleTokenSelect} 
                  className="w-full" 
                />
                <p className="mt-2 text-xs text-gray-500">
                  Click to select from top {topTokens.length} tokens by market cap from Mobula.io - prices update in real-time
                </p>
              </div>
              
              {selectedToken && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h3 className="font-medium mb-4 flex justify-between items-center">
                    <span>Selected Token Details (Mobula.io)</span>
                    {selectedToken.lastUpdated && (
                      <span className="text-xs text-gray-500">
                        Updated: {new Date(selectedToken.lastUpdated).toLocaleTimeString()}
                      </span>
                    )}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Name:</div>
                    <div>{selectedToken.name}</div>
                    <div className="text-gray-500">Symbol:</div>
                    <div>{selectedToken.symbol}</div>
                    <div className="text-gray-500">Price:</div>
                    <PriceDisplay token={selectedToken} />
                    <div className="text-gray-500">Market Cap:</div>
                    <div>${selectedToken.market_cap.toLocaleString()}</div>
                    <div className="text-gray-500">Rank:</div>
                    <div>#{selectedToken.rank}</div>
                    <div className="text-gray-500">24h Change:</div>
                    <div className={selectedToken.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {selectedToken.change_24h >= 0 ? '+' : ''}{selectedToken.change_24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Top Tokens Table */}
            {topTokens.length > 0 && (
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top {topTokens.length} Cryptocurrencies (Mobula.io)</h2>
                
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Data source: Mobula.io API · Total tokens: {topTokens.length}
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-500">Show:</label>
                      <select 
                        value={tokensPerPage}
                        onChange={(e) => changeTokensPerPage(Number(e.target.value))}
                        className="border rounded py-1 px-2 text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Rank
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Token
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Price (USD)
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            24h %
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Market Cap
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {displayedTokens.map((token) => (
                          <tr 
                            key={token.id} 
                            className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedToken?.id === token.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            onClick={() => handleTokenSelect(token)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{token.rank}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {token.logo ? (
                                  <img
                                    src={token.logo}
                                    alt={token.symbol}
                                    className="h-6 w-6 rounded-full mr-2"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
                                    }}
                                  />
                                ) : (
                                  <div className="h-6 w-6 rounded-full mr-2 bg-gray-200 flex items-center justify-center text-xs">
                                    {token.symbol[0]}
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">{token.symbol}</div>
                                  <div className="text-xs text-gray-500">{token.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <PriceDisplay token={token} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={token.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {token.change_24h >= 0 ? '+' : ''}{token.change_24h.toFixed(2)}%
                              </span>
                              {token.lastUpdated && Date.now() - token.lastUpdated < 20000 && (
                                <span className="ml-2 h-2 w-2 bg-blue-500 rounded-full inline-block animate-pulse" 
                                      title="Recently updated"></span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                              ${token.market_cap.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {startIndex + 1} to {Math.min(endIndex, topTokens.length)} of {topTokens.length} tokens
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={prevPage}
                        disabled={page === 1}
                        className={`px-3 py-1 border rounded ${page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </span>
                      <button 
                        onClick={nextPage}
                        disabled={page === totalPages}
                        className={`px-3 py-1 border rounded ${page === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 