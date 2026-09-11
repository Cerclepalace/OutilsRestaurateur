import { ProductCard } from '@/features/catalog/product-card';
import { cn } from '@/lib/utils';
import type { ProductCard as ProductCardType } from '@/types/catalog';

/**
 * The catalogue grid. Two columns on a phone (fashion shoppers scan in pairs),
 * up to four on a wide screen.
 */
export function ProductGrid({
  products,
  columns = 4,
  priorityCount = 4,
  className,
}: {
  products: ProductCardType[];
  columns?: 3 | 4;
  priorityCount?: number;
  className?: string;
}) {
  const sizes =
    columns === 3
      ? '(max-width: 768px) 50vw, 33vw'
      : '(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw';

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-10 lg:gap-x-6 lg:gap-y-14',
        columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4',
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          sizes={sizes}
          // Only the first row is eager: everything else is below the fold.
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
