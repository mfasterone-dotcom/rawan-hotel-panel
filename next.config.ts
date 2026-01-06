import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  images:{
    remotePatterns:[
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'ruwago-hotel-api.alsalhani.com'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5158',
        pathname: '/uploads/**',
      }
    ]
  },
  reactCompiler: false,
};

export default withNextIntl(nextConfig);
