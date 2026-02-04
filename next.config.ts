import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Explicitly set NEXTAUTH_URL for Vercel deployment
  ...(process.env.NEXTAUTH_URL ? {
    env: {
      NEXTAUTH_URL: String(process.env.NEXTAUTH_URL)
    }
  } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent.fxxl2-1.fna.fbcdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
  },
  serverExternalPackages: ['cloudinary'],

  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', 'lucide-react']
  }
};

export default nextConfig;
