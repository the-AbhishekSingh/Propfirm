import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper to combine Tailwind CSS classes conditionally
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Truncate wallet address for display
export function truncateAddress(address: string | null | undefined): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format date for display
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
}

// Get chain name from chain ID
export function getChainName(chainId: string | null | undefined): string {
  if (!chainId) return 'Unknown Chain';
  
  const chains: Record<string, string> = {
    'ethereum': 'Ethereum',
    'polygon': 'Polygon',
    'solana': 'Solana',
    'avalanche': 'Avalanche',
    'base': 'Base',
    'optimism': 'Optimism'
  };
  
  return chains[chainId.toLowerCase()] || chainId;
} 