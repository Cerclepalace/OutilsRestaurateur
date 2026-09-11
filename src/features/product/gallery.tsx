'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';
import type { ProductImage } from '@/types/catalog';

/**
 * Product gallery.
 *
 * Desktop: a stacked column of full-width plates — the way a lookbook reads —
 * with thumbnails pinned alongside. Mobile: a snap-scrolling track with dots,
 * which is what a thumb expects.
 *
 * Clicking any plate opens a full-screen viewer.
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(zoomed);

  useEffect(() => {
    if (!zoomed) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setZoomed(false);
      if (event.key === 'ArrowRight') setActive((i) => Math.min(i + 1, images.length - 1));
      if (event.key === 'ArrowLeft') setActive((i) => Math.max(i - 1, 0));
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [zoomed, images.length]);

  if (images.length === 0) {
    return <div className="bobo-media w-full bg-paper-warm" aria-hidden />;
  }

  return (
    <>
      {/* Mobile: swipeable track */}
      <div className="lg:hidden">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-1 overflow-x-auto"
          onScroll={(event) => {
            const el = event.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
          aria-label={`Photographies de ${productName}`}
        >
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => {
                setActive(index);
                setZoomed(true);
              }}
              className="relative aspect-[3/4] w-full shrink-0 snap-center bg-paper-deep"
            >
              <Image
                src={image.url}
                alt={image.alt ?? `${productName} — vue ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {images.length > 1 ? (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((image, index) => (
              <span
                key={image.url}
                className={cn(
                  'h-px w-6 transition-colors',
                  index === active ? 'bg-ink' : 'bg-line-strong',
                )}
                aria-hidden
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop: thumbnails + stacked plates */}
      <div className="hidden gap-4 lg:flex">
        {images.length > 1 ? (
          <div className="flex w-16 shrink-0 flex-col gap-2">
            {images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => {
                  document
                    .getElementById(`plate-${index}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setActive(index);
                }}
                aria-label={`Voir la vue ${index + 1}`}
                aria-current={index === active}
                className={cn(
                  'relative aspect-[3/4] overflow-hidden bg-paper-deep transition-opacity',
                  index === active ? 'opacity-100' : 'opacity-50 hover:opacity-80',
                )}
              >
                <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {images.map((image, index) => (
            <button
              key={image.url}
              id={`plate-${index}`}
              type="button"
              onClick={() => {
                setActive(index);
                setZoomed(true);
              }}
              className="group relative aspect-[3/4] w-full cursor-zoom-in bg-paper-deep"
            >
              <Image
                src={image.url}
                alt={image.alt ?? `${productName} — vue ${index + 1}`}
                fill
                priority={index === 0}
                sizes="(max-width: 1280px) 50vw, 45vw"
                className="object-cover"
              />
              <span className="absolute bottom-4 right-4 grid size-9 place-items-center bg-paper/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <ZoomIn className="size-4" aria-hidden />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Full-screen viewer */}
      {zoomed ? (
        <div
          role="dialog"
          aria-modal
          aria-label={`${productName} en plein écran`}
          className="fixed inset-0 z-[60] flex flex-col bg-paper"
        >
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="bobo-eyebrow">
              {active + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setZoomed(false)}
              className="-m-2 p-2"
              aria-label="Fermer"
              autoFocus
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <Image
              src={images[active].url}
              alt={images[active].alt ?? productName}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {images.length > 1 ? (
            <div className="flex justify-center gap-2 border-t border-line px-6 py-4">
              {images.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Vue ${index + 1}`}
                  aria-current={index === active}
                  className={cn(
                    'relative aspect-[3/4] w-12 overflow-hidden bg-paper-deep transition-opacity',
                    index === active ? 'opacity-100' : 'opacity-40 hover:opacity-70',
                  )}
                >
                  <Image src={image.url} alt="" fill sizes="48px" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
