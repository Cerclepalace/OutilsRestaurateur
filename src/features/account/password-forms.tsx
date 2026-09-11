'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/client';

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.'),
});

/** Sends the reset link. Always reports success, so the form cannot be used to
 *  discover which addresses have an account. */
export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) });

  if (sent) {
    return (
      <p className="text-sm leading-relaxed text-ink-soft" role="status">
        Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans
        quelques instants.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        const supabase = createClient();
        await supabase.auth.resetPasswordForEmail(values.email, {
          redirectTo: `${window.location.origin}/account/reset-password`,
        });
        setSent(true);
      })}
      noValidate
      className="flex flex-col gap-5"
    >
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

      <button type="submit" disabled={isSubmitting} className="bobo-btn bobo-btn-primary mt-2">
        {isSubmitting ? 'Envoi…' : 'Recevoir le lien'}
      </button>
    </form>
  );
}

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Au moins 8 caractères.'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['confirm'],
  });

/** Sets the new password. Reached through the link Supabase e-mails, which
 *  establishes a recovery session before this page renders. */
export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) });

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        setServerError(null);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password: values.password });

        if (error) {
          setServerError(
            'Le lien de réinitialisation a expiré. Demandez-en un nouveau.',
          );
          return;
        }

        router.push('/account');
        router.refresh();
      })}
      noValidate
      className="flex flex-col gap-5"
    >
      <label>
        <span className="bobo-label">Nouveau mot de passe</span>
        <input
          type="password"
          autoComplete="new-password"
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

      <label>
        <span className="bobo-label">Confirmation</span>
        <input
          type="password"
          autoComplete="new-password"
          className="bobo-field"
          aria-invalid={Boolean(errors.confirm)}
          {...register('confirm')}
        />
        {errors.confirm ? (
          <span className="mt-1 block text-xs text-danger" role="alert">
            {errors.confirm.message}
          </span>
        ) : null}
      </label>

      {serverError ? (
        <p className="border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger" role="alert">
          {serverError}
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="bobo-btn bobo-btn-primary mt-2">
        {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
