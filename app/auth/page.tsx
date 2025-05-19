'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { useCrossmint } from '@/components/CrossmintProvider';
import Navbar from '@/components/Navbar';

export default function AuthPage() {
  const { isConnected, userProfile } = useCrossmint();
  const router = useRouter();
  
  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isConnected && userProfile) {
      router.push('/dashboard');
    }
  }, [isConnected, userProfile, router]);

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
            <div className="flex items-center justify-center">
              <ConnectWalletButton />
            </div>
            
            <div className="text-sm text-center">
              <p className="text-gray-500 dark:text-gray-400">
                By connecting, you agree to our terms of service
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 