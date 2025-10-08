/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'redis'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.kolleris.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'graph.microsoft.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ]
  },
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil'
    });
    
    // Fix for Redis node:crypto issue
    if (isServer) {
      config.externals.push('redis');
    }
    
    return config;
  }
};

module.exports = nextConfig;

