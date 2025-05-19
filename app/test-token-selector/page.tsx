'use client';

import React, { useState } from 'react';
import TokenSelector from '@/components/TokenSelector';
import { Token } from '@/lib/tokens';

export default function TestTokenSelector() {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    console.log('Selected token:', token);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">TokenSelector Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl mb-4">Token Selector Component</h2>
        
        <div className="mb-6">
          <TokenSelector onSelect={handleTokenSelect} className="w-64" />
        </div>
        
        {selectedToken && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-medium mb-2">Selected Token:</h3>
            <pre className="bg-gray-200 p-4 rounded overflow-auto">
              {JSON.stringify(selectedToken, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 