import type { NextConfig } from 'next';

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    // Product photography lives in Supabase Storage. The bucket host is derived
    // from the configured project rather than hardcoded, so a new project needs
    // no code change.
    remotePatterns: supabaseHost
      ? [
          {
            protocol: 'https',
            hostname: supabaseHost,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
    // Fashion imagery is tall; these are the widths the grid and the product
    // gallery actually request.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 640, 828, 1080, 1280, 1440, 1920, 2560],
    imageSizes: [48, 64, 96, 128, 160, 224, 320],
  },

  // Type errors always fail the build. Linting is a separate step in Next 16
  // (`npm run lint`), and `npm run verify` runs both before a release.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
