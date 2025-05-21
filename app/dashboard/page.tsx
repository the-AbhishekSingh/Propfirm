'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCrossmint } from '@/components/CrossmintProvider';

export default function DashboardPage() {
  const router = useRouter();
  const { wallet, isLoading, error, disconnect } = useCrossmint();

  useEffect(() => {
    if (!isLoading && !wallet) {
      router.push('/auth');
    }
  }, [wallet, isLoading, router]);

  const handleDisconnect = async () => {
    await disconnect();
    router.push('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Disconnect
            </button>
          </div>

          {error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          ) : wallet ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Wallet Information</h2>
                <dl className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-gray-50 px-4 py-5 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900 break-all">{wallet}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
} 