import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import type { HeroContent } from '@/services/cms';

/**
 * Full-bleed opening image.
 *
 * Sized to the viewport minus the header so the first scroll reveals the next
 * section rather than more empty image. A scrim only where the type sits, so
 * the photograph is not flattened by a full-frame overlay.
 */
export function HeroSection({ content, priority = true }: { content: HeroContent; priority?: boolean }) {
  const dark = content.theme === 'dark';

  return (
    <section
      className={cn(
        'relative flex min-h-[78svh] items-end overflow-hidden lg:min-h-[92svh]',
        dark ? 'text-paper' : 'text-ink',
      )}
    >
      {content.videoUrl ? (
        <video
          className="absolute inset-0 size-full object-cover"
          src={content.videoUrl}
          poster={content.posterUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : content.imageUrl ? (
        <Image
          src={content.imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-paper-warm" />
      )}

      {dark ? (
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/55 to-transparent"
          aria-hidden
        />
      ) : null}

      <div className="bobo-container relative w-full pb-14 pt-32 lg:pb-20">
        <div
          className={cn(
            'flex max-w-2xl flex-col gap-5',
            content.align === 'center' && 'mx-auto items-center text-center',
          )}
        >
          {content.eyebrow ? (
            <p className="bobo-eyebrow animate-fade-up opacity-90">{content.eyebrow}</p>
          ) : null}

          <h1
            className="bobo-display animate-fade-up text-display-xl"
            style={{ animationDelay: '80ms' }}
          >
            {content.title}
          </h1>

          {content.subtitle ? (
            <p
              className="animate-fade-up max-w-md text-base leading-relaxed opacity-90"
              style={{ animationDelay: '160ms' }}
            >
              {content.subtitle}
            </p>
          ) : null}

          {content.ctaLabel && content.ctaHref ? (
            <div
              className="animate-fade-up mt-3 flex flex-wrap gap-3"
              style={{ animationDelay: '240ms' }}
            >
              <Link
                href={content.ctaHref}
                className={cn('bobo-btn', dark ? 'bobo-btn-primary bg-paper text-ink' : 'bobo-btn-primary')}
              >
                {content.ctaLabel}
              </Link>

              {content.secondaryLabel && content.secondaryHref ? (
                <Link
                  href={content.secondaryHref}
                  className={cn(
                    'bobo-btn bobo-btn-outline',
                    dark && 'border-paper text-paper hover:bg-paper hover:text-ink',
                  )}
                >
                  {content.secondaryLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
