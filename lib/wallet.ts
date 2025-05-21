import { supabase } from './supabase';
import { CrossmintWallets } from '@crossmint/wallets-sdk';
import { crossmintClient } from './crossmint';

const walletsClient = CrossmintWallets.from(crossmintClient);

export interface Wallet {
  id: string;
  address: string;
  balance: number;
  created_at: string;
  chain: string;
  type: string;
}

export async function createWallet(): Promise<Wallet | null> {
  try {
    // Create wallet using Crossmint client
    const wallet = await walletsClient.getOrCreateWallet('evm-smart-wallet', {
      adminSigner: {
        type: 'evm-passkey',
        name: 'My Passkey'
      }
    });

    if (!wallet) {
      throw new Error('Failed to create wallet');
    }
    
    // Create wallet in Supabase
    const { data: walletData, error } = await supabase
      .from('wallets')
      .insert({
        address: wallet.address,
        balance: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving wallet to database:', error);
      throw new Error('Failed to save wallet');
    }

    return walletData;
  } catch (error) {
    console.error('Wallet creation error:', error);
    return null;
  }
}

export async function getWallet(address: string): Promise<Wallet | null> {
  try {
    // First try to get from Crossmint
    const wallet = await walletsClient.getWallet(address, 'evm-smart-wallet', {
      adminSigner: {
        type: 'evm-passkey',
        name: 'My Passkey'
      }
    });

    if (!wallet) {
      // If not found in Crossmint, try to get from our database
      const { data, error } = await supabase
        .from('wallets')
        .select()
        .eq('address', address)
        .single();

      if (error) {
        console.error('Error fetching wallet from database:', error);
        return null;
      }

      return data;
    }
    
    // Update our database with latest Crossmint data
    const { data: walletData, error } = await supabase
      .from('wallets')
      .upsert({
        address: wallet.address,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating wallet in database:', error);
      return null;
    }

    return walletData;
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }
}

export async function updateWalletBalance(address: string, balance: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wallets')
      .update({ 
        balance,
        updated_at: new Date().toISOString()
      })
      .eq('address', address);

    if (error) {
      console.error('Error updating wallet balance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    return false;
  }
} 