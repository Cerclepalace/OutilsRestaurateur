import Link from 'next/link';

import { Logo } from '@/components/layout/logo';
import { InstagramIcon } from '@/components/ui/icons';
import { NewsletterForm } from '@/features/cms/newsletter-form';
import { siteConfig } from '@/config/site';
import type { NavNode } from '@/services/navigation';

/**
 * Footer. Columns are database-driven like the header, so a new legal page or
 * help link does not need a deploy.
 */
export function SiteFooter({ navigation }: { navigation: NavNode[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-section border-t border-line bg-paper-deep">
      <div className="bobo-container py-section-sm">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          {/* Brand + newsletter */}
          <div className="flex flex-col gap-6">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
              {siteConfig.description}
            </p>

            <div className="mt-2">
              <p className="bobo-eyebrow mb-3">Le Journal</p>
              <NewsletterForm source="footer" />
            </div>

            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              <InstagramIcon className="size-4" />
              <span className="bobo-link">Instagram</span>
            </a>
          </div>

          {/* Link columns */}
          <nav aria-label="Navigation de pied de page">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {navigation.map((column) => (
                <div key={column.id}>
                  <p className="bobo-eyebrow mb-4 text-ink-muted">{column.label}</p>
                  <ul className="flex flex-col gap-2.5">
                    {column.children.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href ?? '#'}
                          className="bobo-link text-sm text-ink-soft transition-colors hover:text-ink"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            © {year} {siteConfig.legalName}. Tous droits réservés.
          </p>
          <p className="text-xs text-ink-muted">
            Pièces uniques et collections capsules — Paris &amp; Casablanca
          </p>
        </div>
      </div>
    </footer>
  );
}
