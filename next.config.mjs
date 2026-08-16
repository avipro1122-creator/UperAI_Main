/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['node-appwrite'],
    optimizePackageImports: ['lucide-react', 'firebase', 'firebase-admin'],
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://www.googletagmanager.com https://pagead2.googlesyndication.com;
      style-src 'self' 'unsafe-inline' https://accounts.google.com;
      img-src 'self' data: blob: https://*.googleusercontent.com https://i.ytimg.com https://img.youtube.com https://api.dicebear.com https://consent.cookiebot.com https://consentcdn.cookiebot.com https://images.unsplash.com;
      font-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'self';
      frame-src 'self' https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://player.vimeo.com https://www.instagram.com https://consent.cookiebot.com https://googleads.g.doubleclick.net;
      connect-src 'self' https://accounts.google.com https://identitytoolkit.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com https://sgp.cloud.appwrite.io https://*.cloud.appwrite.io https://consent.cookiebot.com https://consentcdn.cookiebot.com https://www.googletagmanager.com https://www.google-analytics.com;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: cspHeader,
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
