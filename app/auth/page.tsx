'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCrossmint } from '@/components/CrossmintProvider';
import Navbar from '@/components/Navbar';

export default function AuthPage() {
  const router = useRouter();
  const { connect, isLoading, error } = useCrossmint();

  const handleConnect = async () => {
    try {
      await connect();
      router.push('/dashboard');
    } catch (err) {
      console.error('Wallet connection error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <div className="flex flex-col items-center justify-center pt-20">
        <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Welcome
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Connect your wallet to access your dashboard
            </p>
          </div>
          
          <div className="mt-8 space-y-6">
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Connect with Passkey'}
            </button>
            
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 