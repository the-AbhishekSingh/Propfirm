'use client';

import { useState } from 'react';
import TokenDropdown from '@/components/TokenDropdown';
import { Token } from '@/lib/tokens';

export default function TestPage() {
  const [selectedToken, setSelectedToken] = useState<Token | undefined>();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-md mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Token Dropdown Test
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Token
              </label>
              <TokenDropdown
                selectedToken={selectedToken}
                onSelect={setSelectedToken}
              />
            </div>

            {selectedToken && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Selected Token Details
                </h2>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedToken.name}</p>
                  <p><span className="font-medium">Symbol:</span> {selectedToken.symbol}</p>
                  <p><span className="font-medium">Price:</span> ${selectedToken.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                  <p><span className="font-medium">24h Change:</span> 
                    <span className={selectedToken.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {selectedToken.change_24h >= 0 ? '+' : ''}{selectedToken.change_24h.toFixed(2)}%
                    </span>
                  </p>
                  <p><span className="font-medium">Market Cap:</span> ${selectedToken.market_cap.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 