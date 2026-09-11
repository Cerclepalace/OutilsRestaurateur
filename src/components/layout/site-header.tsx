'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, ShoppingBag, User, Heart } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/logo';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { MegaMenu } from '@/components/layout/mega-menu';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { useStore, useCartCount } from '@/features/cart/store-provider';
import type { NavNode } from '@/services/navigation';
import type { Announcement } from '@/services/settings';

/**
 * Site header.
 *
 * Transparent over a hero, solid everywhere else and once scrolled — the
 * pattern that lets a full-bleed campaign image breathe without losing the
 * navigation. The menu contents come from the database.
 */
export function SiteHeader({
  navigation,
  announcement,
}: {
  navigation: NavNode[];
  announcement: Announcement | null;
}) {
  const pathname = usePathname();
  const { openOverlay, wishlist } = useStore();
  const cartCount = useCartCount();

  // Panel state is tied to the current route: navigating closes whatever is
  // open. Adjusting during render (rather than in an effect) is React's own
  // pattern for state derived from a changing prop, and avoids a frame where a
  // menu is still open over the new page.
  const [panels, setPanels] = useState({
    path: pathname,
    openMenuId: null as string | null,
    mobileOpen: false,
  });

  if (panels.path !== pathname) {
    setPanels({ path: pathname, openMenuId: null, mobileOpen: false });
  }

  const { openMenuId, mobileOpen } = panels;
  const setOpenMenuId = (id: string | null) =>
    setPanels((current) => ({ ...current, openMenuId: id }));
  const setMobileOpen = (open: boolean) =>
    setPanels((current) => ({ ...current, mobileOpen: open }));

  // Scroll position is browser state, read directly rather than mirrored into
  // React state by an effect that fires on mount.
  const scrolled = useSyncExternalStore(subscribeToScroll, isScrolled, () => false);

  // Only the homepage and collection pages open on a full-bleed image.
  const overlaysHero = pathname === '/' || /^\/collections\/[^/]+$/.test(pathname);
  const transparent = overlaysHero && !scrolled && !openMenuId;

  return (
    <>
      {announcement ? <AnnouncementBar announcement={announcement} /> : null}

      <header
        onMouseLeave={() => setOpenMenuId(null)}
        data-transparent={transparent}
        className={cn(
          'sticky top-0 z-40 transition-colors duration-500',
          transparent
            ? 'bg-transparent text-paper'
            : 'border-b border-line bg-paper/95 text-ink backdrop-blur-sm',
        )}
      >
        {/* Over a full-bleed image the header has no background of its own, so a
            short scrim keeps white navigation legible whatever the photograph
            does at the top of the frame. */}
        {transparent ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/45 to-transparent"
            aria-hidden
          />
        ) : null}

        <div className="bobo-container relative">
          <div
            className={cn(
              'grid grid-cols-[1fr_auto_1fr] items-center gap-4 transition-[height] duration-500',
              scrolled ? 'h-16' : 'h-[var(--header-height)]',
            )}
          >
            {/* Left: primary navigation (desktop) / menu button (mobile) */}
            <nav aria-label="Navigation principale" className="hidden lg:block">
              <ul className="flex items-center gap-7">
                {navigation.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      item={item}
                      isOpen={openMenuId === item.id}
                      onOpen={() => setOpenMenuId(item.children.length > 0 ? item.id : null)}
                    />
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-m-2 justify-self-start p-2 lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="size-5" aria-hidden />
            </button>

            {/* Centre: wordmark */}
            <Logo compact={scrolled} className="justify-self-center" />

            {/* Right: utilities */}
            <div className="flex items-center justify-end gap-1 sm:gap-2">
              {/* A real link, upgraded to the overlay once hydrated: the control
                  works before JavaScript arrives and without it entirely. */}
              <Link
                href="/search"
                onClick={(event) => {
                  event.preventDefault();
                  openOverlay('search');
                }}
                className="-m-2 p-2 transition-opacity hover:opacity-60"
                aria-label="Rechercher"
              >
                <Search className="size-5" aria-hidden />
              </Link>

              <Link
                href="/account"
                className="-m-2 hidden p-2 transition-opacity hover:opacity-60 sm:block"
                aria-label="Mon compte"
              >
                <User className="size-5" aria-hidden />
              </Link>

              <Link
                href="/wishlist"
                className="-m-2 hidden p-2 transition-opacity hover:opacity-60 sm:block"
                aria-label={`Liste de souhaits${wishlist.length > 0 ? ` (${wishlist.length})` : ''}`}
              >
                <span className="relative block">
                  <Heart className="size-5" aria-hidden />
                  {wishlist.length > 0 ? <Dot /> : null}
                </span>
              </Link>

              <Link
                href="/cart"
                onClick={(event) => {
                  event.preventDefault();
                  openOverlay('cart');
                }}
                className="-m-2 p-2 transition-opacity hover:opacity-60"
                aria-label={`Panier${cartCount > 0 ? ` (${cartCount} article${cartCount > 1 ? 's' : ''})` : ''}`}
              >
                <span className="relative block">
                  <ShoppingBag className="size-5" aria-hidden />
                  {cartCount > 0 ? (
                    <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-ink px-1 text-center text-[0.625rem] leading-4 text-paper data-[transparent=true]:bg-paper data-[transparent=true]:text-ink">
                      {cartCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            </div>
          </div>
        </div>

        <MegaMenu
          items={navigation}
          openId={openMenuId}
          onClose={() => setOpenMenuId(null)}
        />
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navigation={navigation}
      />
    </>
  );
}

function NavLink({
  item,
  isOpen,
  onOpen,
}: {
  item: NavNode;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const className = cn(
    'bobo-eyebrow bobo-link py-2',
    isOpen && 'after:origin-left after:scale-x-100',
  );

  // Hovering opens the panel; focusing does too, so keyboard users get the
  // same menu without needing a pointer.
  const handlers = {
    onMouseEnter: onOpen,
    onFocus: onOpen,
  };

  return item.href ? (
    <Link href={item.href} className={className} {...handlers}>
      {item.label}
    </Link>
  ) : (
    <button type="button" className={className} aria-expanded={isOpen} {...handlers}>
      {item.label}
    </button>
  );
}

const SCROLL_THRESHOLD = 24;

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}

function isScrolled() {
  return window.scrollY > SCROLL_THRESHOLD;
}

function Dot() {
  return (
    <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-clay" aria-hidden />
  );
}
