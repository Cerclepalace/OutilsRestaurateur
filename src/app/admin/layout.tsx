import { redirect } from 'next/navigation';
import Link from 'next/link';

import { isAdmin, getProfile } from '@/services/account';
import { AdminNav } from '@/features/admin/admin-nav';

export const metadata = { robots: { index: false, follow: false } };

/**
 * Admin shell.
 *
 * The proxy already sends anonymous visitors to the login page; this second
 * check is for a signed-in *customer* who types /admin. The database refuses
 * them regardless — this just gives them a door instead of an empty room.
 */
export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const [profile, admin] = await Promise.all([getProfile(), isAdmin()]);

  if (!profile) redirect('/account/login?next=/admin');

  if (!admin) {
    return (
      <div className="bobo-container-tight py-section text-center">
        <h1 className="bobo-display text-display-md">Accès réservé</h1>
        <p className="mt-4 text-ink-soft">
          Votre compte n&apos;a pas les droits d&apos;administration.
        </p>
        <Link href="/" className="bobo-btn bobo-btn-outline mt-8">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="bobo-container pb-section pt-10">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-5">
        <h1 className="bobo-display text-display-sm">Administration</h1>
        <p className="text-xs text-ink-muted">
          {profile.email} · {profile.role}
        </p>
      </header>

      <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
        <AdminNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
