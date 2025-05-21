'use client';

import React, { useState } from 'react';
import { useCrossmint } from './CrossmintProvider';
import { cn, truncateAddress } from '@/lib/utils';

export default function ConnectWalletButton() {
  const { wallet, isLoading, error, connect, disconnect } = useCrossmint();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Connecting...
        </div>
        <button
          disabled
          className={cn(
            "inline-flex items-center justify-center px-4 py-2 border border-transparent",
            "text-sm font-medium rounded-md shadow-sm text-white bg-indigo-400",
            "opacity-50 cursor-not-allowed"
          )}
        >
          Please wait...
        </button>
      </div>
    );
  }

  if (isDisconnecting) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Disconnecting...
        </div>
        <button
          disabled
          className={cn(
            "inline-flex items-center justify-center px-4 py-2 border border-transparent",
            "text-sm font-medium rounded-md shadow-sm text-white bg-red-400",
            "opacity-50 cursor-not-allowed"
          )}
        >
          Please wait...
        </button>
      </div>
    );
  }

  return (
    <div>
      {wallet ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Connected: {truncateAddress(wallet)}
          </p>
          <button
            onClick={handleDisconnect}
            className={cn(
              "inline-flex items-center justify-center px-4 py-2 border border-transparent",
              "text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            )}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center justify-center px-4 py-2 border border-transparent",
            "text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Connect with Passkey
        </button>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
} 