import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Webpack: watchOptions para evitar rebuilds infinitos ──────────────
  webpack: (config, { dev }) => {
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@splinetool/react-spline$': path.resolve(__dirname, '../../node_modules/@splinetool/react-spline/dist/react-spline.js'),
    };
    if (dev) {
      config.watchOptions = {
        // Ignorar directorios que no son código fuente
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/logs/**',
          '**/auth_info/**',
          '**/.wwebjs_cache/**',
          '**/data/**',
          '**/*.log',
        ],
        // Agregar pequeño delay para no disparar rebuild con cada byte
        aggregateTimeout: 300,
        poll: false,
      };
    }
    return config;
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://apis.google.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https://*.supabase.co https://*.spline.design;
      media-src 'self' blob: data: https://*.supabase.co https://*.spline.design;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' wss://*.supabase.co https://*.supabase.co https://*.vercel.app https://*.vapi.ai wss://*.vapi.ai https://*.daily.co wss://*.daily.co https://*.spline.design;
      worker-src 'self' blob:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  serverExternalPackages: ['@splinetool/react-spline', '@splinetool/runtime'],
};

export default nextConfig;
