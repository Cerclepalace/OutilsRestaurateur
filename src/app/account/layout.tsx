import { AccountNav } from '@/features/account/account-nav';
import { getProfile } from '@/services/account';

/**
 * Shell for the signed-in account area.
 *
 * The auth pages render without it — they are reached by anonymous visitors,
 * and a sidebar of account links would be noise there.
 */
export default async function AccountLayout({ children }: LayoutProps<'/account'>) {
  const profile = await getProfile();

  // Anonymous visitors on /account/login and friends: no chrome.
  if (!profile) return <>{children}</>;

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');

  return (
    <div className="bobo-container pb-section pt-12 lg:pt-16">
      <header className="mb-10 flex flex-col gap-2">
        <p className="bobo-eyebrow text-ink-muted">Mon compte</p>
        <h1 className="bobo-display text-display-md">{name || profile.email}</h1>
      </header>

      <div className="flex flex-col gap-10 lg:flex-row lg:gap-20">
        <AccountNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
