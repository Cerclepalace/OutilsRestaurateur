import { Suspense } from 'react';
import type { Metadata } from 'next';

import { AuthForm } from '@/features/account/auth-form';

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="bobo-container-tight pb-section pt-16 lg:pt-24">
      <h1 className="bobo-display mb-8 text-display-md">Connexion</h1>
      <Suspense fallback={null}>
        <AuthForm mode="sign-in" />
      </Suspense>
    </div>
  );
}
