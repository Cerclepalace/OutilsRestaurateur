import type { Metadata } from 'next';

import { ResetPasswordForm } from '@/features/account/password-forms';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="bobo-container-tight pb-section pt-16 lg:pt-24">
      <h1 className="bobo-display mb-8 text-display-md">Nouveau mot de passe</h1>
      <ResetPasswordForm />
    </div>
  );
}
