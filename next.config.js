/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    MOBULA_API_KEY: process.env.MOBULA_API_KEY,
    MOBULA_API_URL: process.env.MOBULA_API_URL || 'https://api.mobula.io',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.coingecko.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'api.mobula.io',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '**.coinmarketcap.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'mobula.mypinata.cloud',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '**.mobula.io',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '**.pinata.cloud',
        pathname: '**',
      }
    ],
    unoptimized: true,
    domains: ['assets.coingecko.com', 'cryptologos.cc', 's2.coinmarketcap.com', 'raw.githubusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
