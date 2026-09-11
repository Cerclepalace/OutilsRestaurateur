import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bobo-container-tight flex flex-col items-center gap-6 py-section text-center">
      <p className="bobo-eyebrow text-ink-muted">Erreur 404</p>
      <h1 className="bobo-display text-display-lg">Cette page n&apos;existe pas</h1>
      <p className="max-w-prose text-ink-soft">
        La pièce que vous cherchez a peut-être été vendue : nos séries sont très limitées et ne sont
        pas rééditées.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href="/boutique" className="bobo-btn bobo-btn-primary">
          Voir la boutique
        </Link>
        <Link href="/collections" className="bobo-btn bobo-btn-outline">
          Les collections
        </Link>
      </div>
    </div>
  );
}
