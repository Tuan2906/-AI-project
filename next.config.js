/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Tắt Strict Mode
  // cho nay dinh tuyen api trong thu muc backend bat ky 
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/backend/api/:path*',
      },
      {
        source: '/:path*',
        destination: '/frontend/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
