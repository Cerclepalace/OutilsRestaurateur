import type { Metadata } from 'next';

import { getProfile } from '@/services/account';
import { ProfileForm } from '@/features/account/profile-form';

export const metadata: Metadata = {
  title: 'Mon profil',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) return null;
  return <ProfileForm profile={profile} />;
}
