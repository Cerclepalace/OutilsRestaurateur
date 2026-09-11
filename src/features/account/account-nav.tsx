'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { signOut } from '@/features/account/actions';

const LINKS = [
  { href: '/account', label: 'Aperçu' },
  { href: '/account/orders', label: 'Commandes' },
  { href: '/account/addresses', label: 'Adresses' },
  { href: '/account/profile', label: 'Profil' },
  { href: '/wishlist', label: 'Liste de souhaits' },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mon compte" className="lg:w-48 lg:shrink-0">
      <ul className="flex gap-5 overflow-x-auto border-b border-line pb-3 lg:flex-col lg:gap-3 lg:border-0 lg:pb-0">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'bobo-eyebrow whitespace-nowrap transition-colors',
                  active ? 'text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={signOut} className="mt-6 hidden lg:block">
        <button type="submit" className="bobo-eyebrow text-ink-muted transition-colors hover:text-ink">
          Se déconnecter
        </button>
      </form>
    </nav>
  );
}
