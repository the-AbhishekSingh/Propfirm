'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabase() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    try {
      setError(null);
      setResult(null);
      
      // Test simple query
      const { data, error } = await supabase.from('profiles').select('*').limit(5);
      
      if (error) {
        throw error;
      }
      
      setResult({
        success: true,
        data
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setResult({
        success: false,
        error: err
      });
    }
  };

  const createTable = async () => {
    try {
      setError(null);
      setResult(null);
      
      // Try to create the profiles table if it doesn't exist
      const { error } = await supabase.rpc('create_profiles_table');
      
      if (error) {
        // If RPC doesn't exist, we'll create the table directly with SQL
        await testConnection();
        setResult({
          message: "Please create your table manually using the SQL provided in README.md"
        });
        return;
      }
      
      setResult({
        success: true,
        message: "Profiles table created successfully"
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setResult({
        success: false,
        error: err
      });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="flex gap-4 mb-8">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={testConnection}
        >
          Test Connection
        </button>
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={createTable}
        >
          Create Profiles Table
        </button>
      </div>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-bold mb-2">Result:</h2>
          <pre className="overflow-auto p-2 bg-gray-800 text-green-300 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="text-lg font-bold mb-2">Supabase Setup Instructions</h2>
        <p className="mb-2">Make sure you have:</p>
        <ol className="list-decimal list-inside ml-4">
          <li className="mb-1">Created a Supabase project</li>
          <li className="mb-1">Set the correct NEXT_PUBLIC_SUPABASE_URL in .env.local</li>
          <li className="mb-1">Set the correct NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local</li>
          <li className="mb-1">Created the profiles table with the correct schema</li>
        </ol>
        <div className="mt-4 p-2 bg-gray-800 text-green-300 rounded overflow-auto">
          <pre>{`-- Create profiles table
CREATE TABLE profiles (
  id uuid NOT NULL PRIMARY KEY,
  wallet_address text UNIQUE NOT NULL,
  email text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their own profile" ON profiles
  FOR UPDATE USING (true);

-- Add required indexes
CREATE INDEX ON profiles (wallet_address);`}</pre>
        </div>
      </div>
    </div>
  );
} 