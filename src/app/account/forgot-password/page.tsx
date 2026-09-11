import type { Metadata } from 'next';

import { ForgotPasswordForm } from '@/features/account/password-forms';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="bobo-container-tight pb-section pt-16 lg:pt-24">
      <h1 className="bobo-display mb-3 text-display-md">Mot de passe oublié</h1>
      <p className="mb-8 text-ink-soft">
        Saisissez votre adresse e-mail : nous vous enverrons un lien de réinitialisation.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
