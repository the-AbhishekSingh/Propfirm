'use client';

import { CrossmintProvider as SDKCrossmintProvider } from '@crossmint/client-sdk-react-ui';
import { CrossmintProvider } from './CrossmintProvider';

const CROSSMINT_API_KEY = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY;

if (!CROSSMINT_API_KEY) {
  console.error('Crossmint API key is not set. Please add NEXT_PUBLIC_CROSSMINT_API_KEY to your .env.local file');
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SDKCrossmintProvider
      apiKey={CROSSMINT_API_KEY || ''}
    >
      <CrossmintProvider>
        {children}
      </CrossmintProvider>
    </SDKCrossmintProvider>
  );
} 