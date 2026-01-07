/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/smart-shopping-list' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/smart-shopping-list/' : '',
  turbopack: {},
};

module.exports = nextConfig;
