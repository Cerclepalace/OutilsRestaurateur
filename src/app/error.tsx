'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Route-level error boundary.
 *
 * Shows a calm page rather than a stack trace, and offers a retry — most
 * failures here are a momentary database hiccup.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[route error]', error);
  }, [error]);

  return (
    <div className="bobo-container-tight flex flex-col items-center gap-6 py-section text-center">
      <p className="bobo-eyebrow text-ink-muted">Une erreur est survenue</p>
      <h1 className="bobo-display text-display-md">Quelque chose s&apos;est mal passé</h1>
      <p className="max-w-prose text-ink-soft">
        Réessayez dans un instant. Si le problème persiste, écrivez-nous.
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="bobo-btn bobo-btn-primary">
          Réessayer
        </button>
        <Link href="/" className="bobo-btn bobo-btn-outline">
          Retour à l&apos;accueil
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-ink-muted">Référence : {error.digest}</p>
      ) : null}
    </div>
  );
}
