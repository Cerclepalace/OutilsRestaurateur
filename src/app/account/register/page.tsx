import { Suspense } from 'react';
import type { Metadata } from 'next';

import { AuthForm } from '@/features/account/auth-form';

export const metadata: Metadata = {
  title: 'Créer un compte',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="bobo-container-tight pb-section pt-16 lg:pt-24">
      <h1 className="bobo-display mb-3 text-display-md">Créer un compte</h1>
      <p className="mb-8 text-ink-soft">
        Retrouvez vos commandes et votre liste de souhaits sur tous vos appareils.
      </p>
      <Suspense fallback={null}>
        <AuthForm mode="sign-up" />
      </Suspense>
    </div>
  );
}
