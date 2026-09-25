import type { NextConfig } from "next";

function resolveNextAuthUrl(): string {
  const vercelHost = process.env.VERCEL_URL?.trim();
  const candidates = [
    process.env.NEXTAUTH_URL?.trim(),
    vercelHost ? `https://${vercelHost.replace(/^https?:\/\//i, '')}` : undefined,
    'http://localhost:3000',
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate.includes('://') ? candidate : `https://${candidate}`);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.toString().replace(/\/$/, '');
      }
    } catch {
      // Ignore empty or malformed values and try the next safe fallback.
    }
  }

  return 'http://localhost:3000';
}

// pdfkit (usado por @react-pdf/renderer) carga sus fuentes estándar con un
// require dinámico que el file-tracer de Vercel no sigue — sin esto, la ruta
// de PDF funciona en local pero tira MODULE_NOT_FOUND en producción.
function pdfkitFontIncludes(): string[] {
  const path = require('path');
  try {
    // pdfkit no expone './package.json' en su campo "exports" — hay que resolver
    // el entry point ('js/pdfkit.js') y subir dos niveles hasta la raíz del paquete.
    const entry = require.resolve('pdfkit');
    const pdfkitDir = path.dirname(path.dirname(entry));
    // outputFileTracingIncludes espera rutas relativas al directorio de la app
    // (donde vive este next.config.ts) — una ruta absoluta se concatena mal y
    // Vercel arma un path corrupto (…/apps/dashboard/vercel/path0/…) al desplegar.
    const relativeDir = path.relative(process.cwd(), pdfkitDir);
    return [path.join(relativeDir, 'js/standard-fonts/**/*')];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // NextAuth parses this during module initialization. An empty Vercel
  // environment variable otherwise makes static prerendering throw Invalid URL.
  env: {
    NEXTAUTH_URL: resolveNextAuthUrl(),
  },
  outputFileTracingIncludes: {
    '/api/quotes/[id]/document.pdf': pdfkitFontIncludes(),
  },
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
