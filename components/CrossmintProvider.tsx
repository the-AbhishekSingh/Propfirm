'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useCrossmint as useSDKCrossmint } from '@crossmint/client-sdk-react-ui';
import { CrossmintWallets } from '@crossmint/wallets-sdk';

interface CrossmintContextType {
  wallet: string | null;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const CrossmintContext = createContext<CrossmintContextType>({
  wallet: null,
  isLoading: false,
  error: null,
  connect: async () => {},
  disconnect: async () => {}
});

export function useCrossmint() {
  return useContext(CrossmintContext);
}

export function CrossmintProvider({ children }: { children: React.ReactNode }) {
  const { crossmint } = useSDKCrossmint();
  const [wallet, setWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing wallet in localStorage
    const storedWallet = localStorage.getItem('crossmint_wallet');
    if (storedWallet) {
      try {
        const walletInfo = JSON.parse(storedWallet);
        setWallet(walletInfo.address);
      } catch (err) {
        console.error('Error parsing stored wallet:', err);
        localStorage.removeItem('crossmint_wallet');
      }
    }
  }, []);

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!crossmint) {
        throw new Error('Crossmint SDK not initialized');
      }

      const walletsClient = CrossmintWallets.from(crossmint);
      
      // First try to get existing wallet
      let wallet;
      try {
        const storedWallet = localStorage.getItem('crossmint_wallet');
        if (storedWallet) {
          const walletInfo = JSON.parse(storedWallet);
          wallet = await walletsClient.getWallet(walletInfo.address, 'evm-smart-wallet', {
            adminSigner: {
              type: 'evm-passkey',
              name: 'My Passkey',
              signingCallback: async (challenge) => {
                const challengeBuffer = new Uint8Array(Buffer.from(challenge, 'base64'));
                const credential = await navigator.credentials.create({
                  publicKey: {
                    challenge: challengeBuffer,
                    rp: {
                      name: 'Crossmint',
                      id: window.location.hostname
                    },
                    user: {
                      id: new Uint8Array(32),
                      name: 'user',
                      displayName: 'User'
                    },
                    pubKeyCredParams: [
                      { type: 'public-key', alg: -7 }, // ES256
                      { type: 'public-key', alg: -257 } // RS256
                    ],
                    timeout: 60000,
                    attestation: 'direct'
                  }
                });

                if (!credential || !(credential instanceof PublicKeyCredential)) {
                  throw new Error('Failed to create credential');
                }

                const response = credential.response as AuthenticatorAttestationResponse;
                const clientDataJSON = response.clientDataJSON;
                const attestationObject = response.attestationObject;

                return {
                  signature: `0x${Buffer.from(attestationObject).toString('hex')}`,
                  metadata: {
                    authenticatorData: `0x${Buffer.from(response.getAuthenticatorData()).toString('hex')}`,
                    challengeIndex: 23,
                    clientDataJSON: Buffer.from(clientDataJSON).toString('base64'),
                    typeIndex: 0,
                    userVerificationRequired: true
                  }
                };
              }
            }
          });
        }
      } catch (err) {
        console.log('No existing wallet found, creating new one');
      }

      // If no existing wallet, create new one
      if (!wallet) {
        wallet = await walletsClient.getOrCreateWallet('evm-smart-wallet', {
          adminSigner: {
            type: 'evm-passkey',
            name: 'My Passkey',
            signingCallback: async (challenge) => {
              const challengeBuffer = new Uint8Array(Buffer.from(challenge, 'base64'));
              const credential = await navigator.credentials.create({
                publicKey: {
                  challenge: challengeBuffer,
                  rp: {
                    name: 'Crossmint',
                    id: window.location.hostname
                  },
                  user: {
                    id: new Uint8Array(32),
                    name: 'user',
                    displayName: 'User'
                  },
                  pubKeyCredParams: [
                    { type: 'public-key', alg: -7 }, // ES256
                    { type: 'public-key', alg: -257 } // RS256
                  ],
                  timeout: 60000,
                  attestation: 'direct'
                }
              });

              if (!credential || !(credential instanceof PublicKeyCredential)) {
                throw new Error('Failed to create credential');
              }

              const response = credential.response as AuthenticatorAttestationResponse;
              const clientDataJSON = response.clientDataJSON;
              const attestationObject = response.attestationObject;

              return {
                signature: `0x${Buffer.from(attestationObject).toString('hex')}`,
                metadata: {
                  authenticatorData: `0x${Buffer.from(response.getAuthenticatorData()).toString('hex')}`,
                  challengeIndex: 23,
                  clientDataJSON: Buffer.from(clientDataJSON).toString('base64'),
                  typeIndex: 0,
                  userVerificationRequired: true
                }
              };
            }
          }
        });
      }

      if (!wallet) {
        throw new Error('Failed to create wallet');
      }

      // Store wallet info
      const walletInfo = {
        address: wallet.address,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('crossmint_wallet', JSON.stringify(walletInfo));
      setWallet(wallet.address);
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      localStorage.removeItem('crossmint_wallet');
      setWallet(null);
    } catch (err) {
      console.error('Wallet disconnection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CrossmintContext.Provider value={{ wallet, isLoading, error, connect, disconnect }}>
      {children}
    </CrossmintContext.Provider>
  );
} 