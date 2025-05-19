import { createClient } from '@supabase/supabase-js';

// Helper function to generate UUIDs with fallback for older browsers
function generateUUID(): string {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Log environment variables for debugging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log to console for debugging
console.log('Supabase configuration:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'Not set', 
  hasAnonKey: !!supabaseAnonKey
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id?: string;
  wallet_address: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
};

export async function saveUserProfile(walletAddress: string, email?: string) {
  try {
    if (!walletAddress) {
      console.error('Cannot save profile: wallet address is required');
      return null;
    }

    // Always include an ID when creating the profile data
    const id = generateUUID();
    
    const profileData: UserProfile = {
      id: id,  // Add ID field explicitly
      wallet_address: walletAddress, 
      email: email,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString() // Add creation date too
    };

    // Create a fallback profile with the same data
    const fallbackProfile: UserProfile = { ...profileData };

    // Try to save to Supabase
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select();

    if (error) {
      console.error('Error saving user profile:', error);
      
      // If we have authentication issues, return a temp profile object
      // This allows the app to continue working even if Supabase is not set up
      if (error.code === '401' || error.message.includes('Unauthorized')) {
        console.warn('Auth error with Supabase - using local profile instead');
        return fallbackProfile;
      }
      
      return null;
    }
    
    return data?.[0] || fallbackProfile;
  } catch (err) {
    console.error('Exception saving user profile:', err);
    return null;
  }
}

export async function getUserProfile(walletAddress: string) {
  try {
    if (!walletAddress) {
      console.error('Cannot get profile: wallet address is required');
      return null;
    }

    // Don't use .single() to avoid the error when no profile is found
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('wallet_address', walletAddress);

    if (error) {
      console.error('Error fetching user profile:', error);
      
      // If we have authentication issues, create a temporary profile
      if (error.code === '401' || error.message.includes('Unauthorized')) {
        console.warn('Auth error with Supabase - creating temporary profile');
        
        // Return a temporary profile that can be used by the app
        return {
          id: generateUUID(),
          wallet_address: walletAddress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      return null;
    }

    // Return the first profile or null if none found
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Exception fetching user profile:', err);
    return null;
  }
} 