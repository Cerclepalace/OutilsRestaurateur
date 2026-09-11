import { cn } from '@/lib/utils';

type Tone = 'ink' | 'paper' | 'clay' | 'outline';

const tones: Record<Tone, string> = {
  ink: 'bg-ink text-paper',
  paper: 'bg-paper text-ink',
  clay: 'bg-clay text-paper',
  outline: 'border border-ink text-ink',
};

/** Small uppercase marker: Nouveauté, Pièce unique, -30 %. */
export function Badge({
  children,
  tone = 'ink',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'bobo-eyebrow inline-flex items-center px-2 py-1 leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
