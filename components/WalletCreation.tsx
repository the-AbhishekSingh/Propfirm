import React, { useState } from 'react';
import { createWallet } from '@/lib/wallet';

interface WalletCreationProps {
  onWalletCreated: (address: string) => void;
}

const WalletCreation: React.FC<WalletCreationProps> = ({ onWalletCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    try {
      setIsCreating(true);
      setError(null);

      const wallet = await createWallet();
      
      if (!wallet) {
        throw new Error('Failed to create wallet');
      }

      onWalletCreated(wallet.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
      console.error('Wallet creation error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Create Wallet</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500 text-white rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleCreateWallet}
        disabled={isCreating}
        className={`w-full py-3 px-4 rounded-lg font-medium ${
          isCreating
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isCreating ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Creating Wallet...
          </div>
        ) : (
          'Create New Wallet'
        )}
      </button>

      <p className="mt-4 text-sm text-gray-400">
        By creating a wallet, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default WalletCreation; 