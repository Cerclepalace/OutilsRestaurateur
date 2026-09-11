'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    label: 'Commerce',
    links: [
      { href: '/admin', label: 'Tableau de bord' },
      { href: '/admin/orders', label: 'Commandes' },
      { href: '/admin/customers', label: 'Clients' },
    ],
  },
  {
    label: 'Catalogue',
    links: [
      { href: '/admin/products', label: 'Produits' },
      { href: '/admin/inventory', label: 'Stock' },
      { href: '/admin/categories', label: 'Catégories' },
      { href: '/admin/collections', label: 'Collections' },
    ],
  },
  {
    label: 'Contenu',
    links: [
      { href: '/admin/pages', label: 'Pages' },
      { href: '/admin/newsletter', label: 'Newsletter' },
      { href: '/admin/settings', label: 'Réglages' },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Administration" className="lg:w-44 lg:shrink-0">
      <div className="flex gap-8 overflow-x-auto pb-3 lg:flex-col lg:gap-7 lg:pb-0">
        {SECTIONS.map((section) => (
          <div key={section.label} className="shrink-0">
            <p className="bobo-eyebrow mb-3 text-ink-muted">{section.label}</p>
            <ul className="flex gap-4 lg:flex-col lg:gap-2">
              {section.links.map((link) => {
                const active =
                  link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'whitespace-nowrap text-sm transition-colors',
                        active ? 'text-ink' : 'text-ink-soft hover:text-ink',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <Link href="/" className="bobo-link mt-8 hidden text-xs text-ink-muted lg:inline-block">
        Voir la boutique
      </Link>
    </nav>
  );
}
