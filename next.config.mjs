import withPWA from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações gerais do Next.js
  experimental: {
    optimizePackageImports: ['react-icons']
  },
  
  // Expor variáveis de ambiente para o cliente
  env: {
    LEAGUE_ID_REDRAFT: process.env.LEAGUE_ID_REDRAFT,
    LEAGUE_ID_DYNASTY: process.env.LEAGUE_ID_DYNASTY,
    LEAGUE_ID_REDRAFT_2022: process.env.LEAGUE_ID_REDRAFT_2022,
    LEAGUE_ID_REDRAFT_2023: process.env.LEAGUE_ID_REDRAFT_2023,
    LEAGUE_ID_REDRAFT_2024: process.env.LEAGUE_ID_REDRAFT_2024,
    LEAGUE_ID_DYNASTY_2024: process.env.LEAGUE_ID_DYNASTY_2024,
  },
  
  // Headers para melhor performance
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};

// Configuração do PWA - Simplificada e compatível com Next.js 14
const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  fallbacks: {
    document: '/offline.html'
  }
};

export default withPWA(pwaConfig)(nextConfig);