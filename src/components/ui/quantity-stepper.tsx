'use client';

import { Minus, Plus } from 'lucide-react';

/** Minus / value / plus. Capped by real availability, never by a magic number. */
export function QuantityStepper({
  value,
  onChange,
  max = 20,
  label = 'Quantité',
  compact = false,
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  label?: string;
  compact?: boolean;
}) {
  const size = compact ? 'size-8' : 'size-10';

  return (
    <div className="inline-flex items-center border border-line">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        className={`${size} grid place-items-center transition-opacity disabled:opacity-30`}
        aria-label={`Diminuer la quantité (${label})`}
      >
        <Minus className="size-3.5" aria-hidden />
      </button>

      <span
        className={`${compact ? 'min-w-8 text-xs' : 'min-w-10 text-sm'} text-center tabular-nums`}
        aria-live="polite"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className={`${size} grid place-items-center transition-opacity disabled:opacity-30`}
        aria-label={`Augmenter la quantité (${label})`}
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
