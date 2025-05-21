import { createCrossmint } from '@crossmint/common-sdk-base';

// Get environment variables with fallbacks for development
const CROSSMINT_API_KEY = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY;
const CROSSMINT_PROJECT_ID = process.env.NEXT_PUBLIC_CROSSMINT_PROJECT_ID;

// Only throw error in production
if (process.env.NODE_ENV === 'production' && (!CROSSMINT_API_KEY || !CROSSMINT_PROJECT_ID)) {
  throw new Error('Crossmint API key and Project ID are required in production');
}

// Validate API key format
if (CROSSMINT_API_KEY && !CROSSMINT_API_KEY.startsWith('ck_') && !CROSSMINT_API_KEY.startsWith('sk_')) {
  throw new Error('Invalid Crossmint API key format. Must start with "ck_" or "sk_"');
}

export const crossmintConfig = {
  apiKey: CROSSMINT_API_KEY || 'ck_test_key',
  projectId: CROSSMINT_PROJECT_ID || 'test_project',
  chain: 'ethereum',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
  auth: {
    type: 'web3',
    options: {
      chain: 'ethereum',
      provider: 'metamask'
    }
  }
};

export const crossmintClient = createCrossmint({
  apiKey: crossmintConfig.apiKey,
  chain: crossmintConfig.chain,
  environment: crossmintConfig.environment
}); 