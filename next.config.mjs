/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better error handling
  experimental: {
    // Enable error overlay in production for debugging
    errorOverlay: true,
  },
  
  // Optimize for production
  swcMinify: true,
  
  // Handle environment variables safely
  env: {
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  },
  
  // Webpack configuration for better error handling
  webpack: (config, { isServer }) => {
    // Handle client-side only modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Headers for better security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

export default nextConfig