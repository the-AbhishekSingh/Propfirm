-- Create Tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tokens (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(20,8) DEFAULT 0,
    change_24h DECIMAL(20,8) DEFAULT 0,
    market_cap DECIMAL(20,8) DEFAULT 0,
    volume_24h DECIMAL(20,8) DEFAULT 0,
    rank INTEGER DEFAULT 999999,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_tokens_symbol;
DROP INDEX IF EXISTS idx_tokens_rank;
DROP INDEX IF EXISTS idx_tokens_market_cap;

-- Create indexes
CREATE INDEX idx_tokens_symbol ON public.tokens(symbol);
CREATE INDEX idx_tokens_rank ON public.tokens(rank);
CREATE INDEX idx_tokens_market_cap ON public.tokens(market_cap);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_tokens_updated_at ON public.tokens;

-- Create trigger for updated_at
CREATE TRIGGER update_tokens_updated_at
    BEFORE UPDATE ON public.tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read tokens" ON public.tokens;
DROP POLICY IF EXISTS "Anyone can insert tokens" ON public.tokens;
DROP POLICY IF EXISTS "Anyone can update tokens" ON public.tokens;

-- Create policies
CREATE POLICY "Anyone can read tokens" ON public.tokens
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert tokens" ON public.tokens
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update tokens" ON public.tokens
    FOR UPDATE USING (true); 