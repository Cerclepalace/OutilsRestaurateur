import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { Price } from '@/components/ui/price';
import { Badge } from '@/components/ui/badge';
import { WishlistButton } from '@/features/wishlist/wishlist-button';
import type { ProductCard as ProductCardType } from '@/types/catalog';

/**
 * Product tile.
 *
 * A fixed 3:4 media box means the grid never shifts as images load. The second
 * photograph cross-fades in on hover — the one piece of motion the card allows
 * itself, because it shows the garment rather than decorating the page.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = '(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw',
}: {
  product: ProductCardType;
  priority?: boolean;
  sizes?: string;
}) {
  const [primary, secondary] = product.images;
  const soldOut = !product.in_stock;

  return (
    <article className="group relative flex flex-col">
      <Link href={`/product/${product.slug}`} className="flex flex-col gap-3">
        <div className="bobo-media">
          {primary ? (
            <>
              <Image
                src={primary.url}
                alt={primary.alt ?? product.name}
                fill
                sizes={sizes}
                priority={priority}
                className={cn(
                  'object-cover transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  secondary && 'group-hover:opacity-0',
                  soldOut && 'opacity-70',
                )}
              />

              {secondary ? (
                <Image
                  src={secondary.url}
                  alt=""
                  fill
                  sizes={sizes}
                  aria-hidden
                  className="object-cover opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <div className="grid h-full place-items-center bg-paper-warm">
              <span className="bobo-eyebrow text-ink-muted">{product.model_name ?? 'BOBO'}</span>
            </div>
          )}

          <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.is_one_of_a_kind ? <Badge tone="ink">Pièce unique</Badge> : null}
            {product.is_new && !product.is_one_of_a_kind ? (
              <Badge tone="outline" className="bg-paper">
                Nouveauté
              </Badge>
            ) : null}
            {soldOut ? <Badge tone="paper">Épuisé</Badge> : null}
          </div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-normal">{product.name}</h3>
            <Price
              cents={product.price_cents}
              compareAtCents={product.compare_at_price_cents}
              currency={product.currency}
              size="sm"
              className="mt-1 text-ink-soft"
            />
          </div>

          {product.colors.length > 1 ? (
            <ColorDots colors={product.colors} />
          ) : null}
        </div>
      </Link>

      <WishlistButton
        productId={product.id}
        productName={product.name}
        size="sm"
        className={cn(
          'absolute right-1.5 top-1.5 bg-paper/80 backdrop-blur-sm',
          // Always reachable on touch; revealed on hover on pointer devices.
          'lg:opacity-0 lg:transition-opacity lg:duration-300 lg:group-hover:opacity-100 lg:focus-visible:opacity-100',
        )}
      />
    </article>
  );
}

function ColorDots({ colors }: { colors: { name: string; hex: string | null }[] }) {
  const shown = colors.slice(0, 4);
  const rest = colors.length - shown.length;

  return (
    <span className="flex shrink-0 items-center gap-1 pt-1" aria-label={`${colors.length} coloris`}>
      {shown.map((color) => (
        <span
          key={color.name}
          title={color.name}
          className="size-2 rounded-full border border-line-strong"
          style={{ backgroundColor: color.hex ?? 'transparent' }}
        />
      ))}
      {rest > 0 ? <span className="text-[0.625rem] text-ink-muted">+{rest}</span> : null}
    </span>
  );
}
