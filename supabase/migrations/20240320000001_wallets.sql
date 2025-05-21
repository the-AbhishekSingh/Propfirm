-- Create Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id TEXT PRIMARY KEY,
    address TEXT UNIQUE NOT NULL,
    balance DECIMAL(20,8) DEFAULT 0,
    chain TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_address ON public.wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_chain ON public.wallets(chain);
CREATE INDEX IF NOT EXISTS idx_wallets_type ON public.wallets(type);

-- Create trigger for updated_at
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 