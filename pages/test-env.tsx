'use client';

import { useEffect } from 'react';

export default function TestEnvironment() {
  useEffect(() => {
    console.log('Environment variables:');
    console.log('NEXT_PUBLIC_CROSSMINT_CLIENT_KEY:', process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_KEY);
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <p>Check your browser console to see if environment variables are loaded correctly.</p>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <p><strong>NEXT_PUBLIC_CROSSMINT_CLIENT_KEY:</strong> {process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_KEY || 'Not set'}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'Not set'}</p>
      </div>
    </div>
  );
} 