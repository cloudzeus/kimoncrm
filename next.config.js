/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize production builds
  reactStrictMode: true,
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'recharts',
      'date-fns'
    ],
  },
  
  serverExternalPackages: ['@prisma/client', 'redis', 'bcryptjs'],
  
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
      },
      {
        protocol: 'https',
        hostname: 'kimoncrm.b-cdn.net',
        port: '',
        pathname: '/**',
      }
    ],
    // Optimize image loading
    formats: ['image/webp'],
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
    
    // Optimize build performance
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };
    
    return config;
  }
};

module.exports = nextConfig;

