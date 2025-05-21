'use client';

import TokenList from '@/components/TokenList';

export default function TokensPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Top 300 Cryptocurrencies</h1>
      <TokenList />
    </div>
  );
} 