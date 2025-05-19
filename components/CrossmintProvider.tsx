'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { CrossmintProvider as CrossmintSDKProvider, CrossmintAuthProvider as CrossmintAuth, useAuth, useWallet } from '@crossmint/client-sdk-react-ui';
import { saveUserProfile, getUserProfile, UserProfile } from '@/lib/supabase';

type CrossmintContextType = {
  walletAddress: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  userProfile: UserProfile | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const CrossmintContext = createContext<CrossmintContextType | null>(null);

export const useCrossmint = () => {
  const context = useContext(CrossmintContext);
  if (!context) {
    throw new Error('useCrossmint must be used within a CrossmintProvider');
  }
  return context;
};

type CrossmintProviderProps = {
  children: ReactNode;
};

export function CrossmintAuthProvider({ children }: CrossmintProviderProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectedAddress, setLastConnectedAddress] = useState<string | null>(null);

  // Check all possible environment variable names that might be used
  const clientKey = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_KEY || 
                    process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_ID ||
                    process.env.NEXT_PUBLIC_CROSSMINT_API_KEY;
  
  console.log("Environment variable check:", {
    NEXT_PUBLIC_CROSSMINT_CLIENT_KEY: process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_KEY,
    NEXT_PUBLIC_CROSSMINT_CLIENT_ID: process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_ID,
    NEXT_PUBLIC_CROSSMINT_API_KEY: process.env.NEXT_PUBLIC_CROSSMINT_API_KEY,
    clientKey
  });

  if (!clientKey) {
    console.error('Crossmint environment variables not set. Please set one of: NEXT_PUBLIC_CROSSMINT_CLIENT_KEY, NEXT_PUBLIC_CROSSMINT_CLIENT_ID, or NEXT_PUBLIC_CROSSMINT_API_KEY');
    // Return children so the app still renders even without Crossmint integration
    return <>{children}</>;
  }

  const CrossmintProviderWrapper = () => {
    const auth = useAuth();
    const { wallet, getOrCreateWallet, clearWallet, status } = useWallet();
    
    const walletAddress = wallet?.address || null;
    const isConnected = !!walletAddress && auth.status === 'logged-in';
    const isConnecting = status === 'in-progress' || auth.status === 'in-progress'; 

    // Handle authentication status changes - use useCallback for event handler functions
    useEffect(() => {
      let mounted = true;
      
      const setupWallet = async () => {
        if (auth.status === 'logged-in' && auth.jwt && !wallet && connectionAttempts < 3) {
          // Try to get or create wallet when authenticated
          console.log('Authenticated, attempting to get wallet...');
          try {
            await getOrCreateWallet({
              type: "evm-smart-wallet",
              args: {
                chain: "polygon" // You can change this to the blockchain you want to use
              }
            });
          } catch (err) {
            console.error('Error getting/creating wallet:', err);
          }
          
          if (mounted) {
            setConnectionAttempts(prev => prev + 1);
          }
        }
      };
      
      setupWallet();
      
      if (auth.status === 'logged-out' && mounted) {
        // Reset connection attempts when logged out
        setConnectionAttempts(0);
        setUserProfile(null);
      }
      
      return () => {
        mounted = false;
      };
    }, [auth.status, auth.jwt, wallet, getOrCreateWallet, connectionAttempts]);

    // Store wallet address when connected to prevent connection cycles
    useEffect(() => {
      let mounted = true;
      
      if (walletAddress && walletAddress !== lastConnectedAddress) {
        setLastConnectedAddress(walletAddress);
        console.log('Wallet connected:', walletAddress);
        
        // When wallet address changes, fetch user profile
        const fetchUserProfile = async () => {
          try {
            const profile = await getUserProfile(walletAddress);
            if (!mounted) return;
            
            if (profile) {
              setUserProfile(profile);
              console.log('User profile loaded:', profile.id);
            } else {
              console.log('Creating new user profile...');
              const newProfile = await saveUserProfile(walletAddress);
              if (!mounted) return;
              
              if (newProfile) {
                setUserProfile(newProfile);
                console.log('New user profile created:', newProfile.id);
              }
            }
          } catch (err) {
            console.error('Error handling user profile:', err);
          }
        };
        
        fetchUserProfile();
      } else if (!walletAddress && lastConnectedAddress) {
        // Only clear last address if we're definitely disconnected
        if (auth.status === 'logged-out' && mounted) {
          setLastConnectedAddress(null);
          console.log('Wallet disconnected');
        }
      }
      
      return () => {
        mounted = false;
      };
    }, [walletAddress, lastConnectedAddress, auth.status]);

    // Connect and disconnect functions with error handling - use useCallback
    const connect = useCallback(async () => {
      try {
        console.log('Attempting to connect wallet...');
        setConnectionAttempts(0); // Reset connection attempts
        await auth.login();
      } catch (err) {
        console.error('Failed to connect wallet:', err);
      }
    }, [auth]);

    const disconnect = useCallback(async () => {
      try {
        console.log('Disconnecting wallet...');
        setLastConnectedAddress(null);
        setUserProfile(null);
        clearWallet();
        await auth.logout();
      } catch (err) {
        console.error('Failed to disconnect wallet:', err);
      }
    }, [auth, clearWallet]);

    const contextValue = useMemo(() => ({
      walletAddress,
      isConnected,
      isConnecting,
      userProfile,
      connect,
      disconnect
    }), [walletAddress, isConnected, isConnecting, userProfile, connect, disconnect]);

    return (
      <CrossmintContext.Provider value={contextValue}>
        {children}
      </CrossmintContext.Provider>
    );
  };

  try {
    return (
      <CrossmintSDKProvider apiKey={clientKey}>
        <CrossmintAuth
          embeddedWallets={{
            type: "evm-smart-wallet",
            createOnLogin: "all-users"
          }}
        >
          <CrossmintProviderWrapper />
        </CrossmintAuth>
      </CrossmintSDKProvider>
    );
  } catch (error) {
    console.error("Error initializing Crossmint providers:", error);
    return <>{children}</>;
  }
} 