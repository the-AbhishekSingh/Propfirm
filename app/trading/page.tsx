'use client';

import React, { useState } from 'react';
import TradingPanel from '@/components/TradingPanel';
import TokenList from '@/components/TokenList';

const TradingPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');

  const popularPairs = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'ADAUSDT',
    'DOGEUSDT',
    'XRPUSDT',
    'DOTUSDT',
    'UNIUSDT'
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Trading</h1>
      
      {/* Token List */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Market Overview</h2>
        <TokenList />
      </div>

      {/* Symbol Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Trading Pair</label>
        <div className="flex flex-wrap gap-2">
          {popularPairs.map((symbol) => (
            <button
              key={symbol}
              onClick={() => setSelectedSymbol(symbol)}
              className={`px-4 py-2 rounded ${
                selectedSymbol === symbol
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Trading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TradingPanel symbol={selectedSymbol} />
        </div>
        
        {/* Order History */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Order History</h2>
          <div className="space-y-2">
            {/* Add order history component here */}
            <p className="text-gray-400">Order history will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingPage; 