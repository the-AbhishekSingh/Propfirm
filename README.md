# Next.js with Crossmint Authentication and Supabase

This is a Next.js application that demonstrates how to integrate Crossmint for web3 authentication and Supabase for user data storage.

## Features

- Next.js 14 with App Router
- Tailwind CSS for styling
- Crossmint Authentication for crypto wallet connection
- Supabase for storing user data
- Authentication flow with protected routes

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Crossmint account and project

### Environment Setup

Create a `.env.local` file in the root of the project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_CROSSMINT_PROJECT_ID=your-crossmint-project-id
NEXT_PUBLIC_CROSSMINT_CLIENT_ID=your-crossmint-client-id
```

### Supabase Setup

1. Create a new Supabase project
2. Create a table called `profiles` with the following schema:

```sql
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  wallet_address text unique not null,
  email text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policies
create policy "Anyone can read profiles" on profiles
  for select using (true);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Add required indexes
create index on profiles (wallet_address);
```


### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

## Learn More

- [Crossmint Documentation](https://docs.crossmint.com/wallets/quickstarts/client-side-wallets)
- [Supabase Documentation](https://supabase.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

This project is MIT licensed.
