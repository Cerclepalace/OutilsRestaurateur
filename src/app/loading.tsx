import { ProductGridSkeleton } from '@/components/ui/skeleton';

/** Shown while a route segment streams in. Matches the catalogue's geometry. */
export default function Loading() {
  return (
    <div className="bobo-container pb-section pt-12 lg:pt-16">
      <div className="bobo-skeleton mb-10 h-12 w-64" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
