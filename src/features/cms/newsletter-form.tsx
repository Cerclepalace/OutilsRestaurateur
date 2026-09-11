'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  email: z.string().trim().email('Saisissez une adresse e-mail valide.'),
});

type Values = z.infer<typeof schema>;

/** Newsletter opt-in. Same component in the footer and in a CMS section. */
export function NewsletterForm({ source = 'footer' }: { source?: string }) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, source }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setServerError(body.error ?? "L'inscription n'a pas abouti.");
        return;
      }
      setDone(true);
    } catch {
      setServerError('Connexion impossible. Réessayez dans un instant.');
    }
  }

  if (done) {
    return (
      <p className="text-sm text-ink-soft" role="status">
        Merci. Vous recevrez nos prochaines collections en avant-première.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-sm">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor={`newsletter-${source}`} className="bobo-sr-only">
            Adresse e-mail
          </label>
          <input
            id={`newsletter-${source}`}
            type="email"
            autoComplete="email"
            placeholder="Votre adresse e-mail"
            className="bobo-field"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `newsletter-${source}-error` : undefined}
            {...register('email')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="pb-3 transition-opacity hover:opacity-60 disabled:opacity-40"
          aria-label="S'inscrire à la newsletter"
        >
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </div>

      {errors.email ? (
        <p id={`newsletter-${source}-error`} className="mt-2 text-xs text-danger" role="alert">
          {errors.email.message}
        </p>
      ) : null}

      {serverError ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {serverError}
        </p>
      ) : null}
    </form>
  );
}
