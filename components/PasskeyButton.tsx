'use client';

import React, { useState } from 'react';
import { useCrossmint } from '@crossmint/client-sdk-react-ui';
import { CrossmintWallets } from '@crossmint/wallets-sdk';

export function PasskeyButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { crossmint } = useCrossmint();

  const handleCreatePasskey = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create wallet with passkey
      const walletsClient = CrossmintWallets.from(crossmint);
      const wallet = await walletsClient.getOrCreateWallet('evm-smart-wallet', {
        adminSigner: {
          type: 'evm-passkey',
          name: 'My Passkey'
        }
      });

      if (!wallet) {
        throw new Error('Failed to create wallet');
      }

      console.log('Wallet created:', wallet);
    } catch (err) {
      console.error('Passkey creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create passkey');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCreatePasskey}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Creating Passkey...' : 'Create Passkey'}
      </button>
      {error && (
        <p className="mt-2 text-red-500">{error}</p>
      )}
    </div>
  );
} 