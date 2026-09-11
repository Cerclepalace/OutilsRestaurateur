'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/client';

/**
 * Sign in / create an account.
 *
 * One component for both modes: the fields differ by two, and keeping them
 * together means the error handling, the redirect and the guest-list merge
 * cannot drift apart.
 */

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.'),
  password: z.string().min(8, 'Au moins 8 caractères.'),
});

const signUpSchema = signInSchema.extend({
  first_name: z.string().trim().min(1, 'Prénom requis.'),
  last_name: z.string().trim().min(1, 'Nom requis.'),
  accepts_marketing: z.boolean().optional(),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/account';

  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  const isSignUp = mode === 'sign-up';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : (signInSchema as unknown as typeof signUpSchema)),
  });

  async function onSubmit(values: SignUpValues | SignInValues) {
    setServerError(null);
    const supabase = createClient();

    if (isSignUp) {
      const signUpValues = values as SignUpValues;
      const { data, error } = await supabase.auth.signUp({
        email: signUpValues.email,
        password: signUpValues.password,
        options: {
          data: {
            first_name: signUpValues.first_name,
            last_name: signUpValues.last_name,
            accepts_marketing: signUpValues.accepts_marketing ?? false,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setServerError(translate(error.message));
        return;
      }

      // Projects with e-mail confirmation on return a user with no session.
      if (!data.session) {
        setPendingConfirmation(true);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setServerError(translate(error.message));
        return;
      }
    }

    router.push(next);
    router.refresh();
  }

  if (pendingConfirmation) {
    return (
      <p className="text-sm leading-relaxed text-ink-soft" role="status">
        Un e-mail de confirmation vient de vous être envoyé. Ouvrez-le pour activer votre compte,
        puis revenez vous connecter.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {isSignUp ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="bobo-label">Prénom</span>
            <input
              autoComplete="given-name"
              className="bobo-field"
              aria-invalid={Boolean(errors.first_name)}
              {...register('first_name')}
            />
            {errors.first_name ? (
              <span className="mt-1 block text-xs text-danger" role="alert">
                {errors.first_name.message}
              </span>
            ) : null}
          </label>

          <label>
            <span className="bobo-label">Nom</span>
            <input
              autoComplete="family-name"
              className="bobo-field"
              aria-invalid={Boolean(errors.last_name)}
              {...register('last_name')}
            />
            {errors.last_name ? (
              <span className="mt-1 block text-xs text-danger" role="alert">
                {errors.last_name.message}
              </span>
            ) : null}
          </label>
        </div>
      ) : null}

      <label>
        <span className="bobo-label">E-mail</span>
        <input
          type="email"
          autoComplete="email"
          className="bobo-field"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? (
          <span className="mt-1 block text-xs text-danger" role="alert">
            {errors.email.message}
          </span>
        ) : null}
      </label>

      <label>
        <span className="bobo-label">Mot de passe</span>
        <input
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          className="bobo-field"
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? (
          <span className="mt-1 block text-xs text-danger" role="alert">
            {errors.password.message}
          </span>
        ) : null}
      </label>

      {isSignUp ? (
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="mt-1 accent-[var(--color-ink)]"
            {...register('accepts_marketing')}
          />
          <span>Je souhaite recevoir Le Journal et les avant-premières.</span>
        </label>
      ) : null}

      {serverError ? (
        <p className="border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger" role="alert">
          {serverError}
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="bobo-btn bobo-btn-primary mt-2">
        {isSubmitting ? 'Un instant…' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
      </button>

      <div className="flex flex-col gap-2 text-sm text-ink-soft">
        {isSignUp ? (
          <Link href="/account/login" className="bobo-link self-start">
            J&apos;ai déjà un compte
          </Link>
        ) : (
          <>
            <Link href="/account/register" className="bobo-link self-start">
              Créer un compte
            </Link>
            <Link href="/account/forgot-password" className="bobo-link self-start">
              Mot de passe oublié
            </Link>
          </>
        )}
      </div>
    </form>
  );
}

/** Supabase returns English strings; the storefront speaks French. */
function translate(message: string) {
  if (/invalid login credentials/i.test(message)) return 'E-mail ou mot de passe incorrect.';
  if (/already registered/i.test(message)) return 'Un compte existe déjà avec cette adresse.';
  if (/email rate limit/i.test(message)) return 'Trop de tentatives. Réessayez dans un instant.';
  if (/password should be at least/i.test(message)) return 'Mot de passe trop court.';
  return "La connexion n'a pas pu aboutir. Réessayez dans un instant.";
}
