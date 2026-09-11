import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';

import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { StoreProvider } from '@/features/cart/store-provider';
import { CartDrawer } from '@/features/cart/cart-drawer';
import { SearchOverlay } from '@/features/search/search-overlay';
import { getHeaderNavigation, getFooterNavigation } from '@/services/navigation';
import { getAnnouncement } from '@/services/settings';
import { siteConfig } from '@/config/site';
import { clientEnv } from '@/lib/env';

import './globals.css';

const display = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

const sans = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#faf8f5',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // Navigation and the announcement bar are merchandising data, so they are
  // fetched here once and shared by every route.
  const [navigation, footerNavigation, announcement] = await Promise.all([
    getHeaderNavigation(),
    getFooterNavigation(),
    getAnnouncement(),
  ]);

  return (
    <html lang="fr" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <a
            href="#contenu"
            className="bobo-sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
          >
            Aller au contenu
          </a>

          <SiteHeader navigation={navigation} announcement={announcement} />

          <main id="contenu" className="flex-1">
            {children}
          </main>

          <SiteFooter navigation={footerNavigation} />

          <CartDrawer />
          <SearchOverlay />
        </StoreProvider>
      </body>
    </html>
  );
}
