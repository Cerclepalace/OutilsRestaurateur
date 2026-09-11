'use client';

import { useActionState } from 'react';

import { updateProfile, signOut, type ActionResult } from '@/features/account/actions';
import type { Profile } from '@/types/catalog';

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updateProfile,
    null,
  );

  return (
    <div className="flex flex-col gap-10">
      <form action={action} className="flex max-w-lg flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="bobo-label">Prénom</span>
            <input
              name="first_name"
              defaultValue={profile.first_name ?? ''}
              autoComplete="given-name"
              className="bobo-field"
            />
          </label>

          <label>
            <span className="bobo-label">Nom</span>
            <input
              name="last_name"
              defaultValue={profile.last_name ?? ''}
              autoComplete="family-name"
              className="bobo-field"
            />
          </label>
        </div>

        <label>
          <span className="bobo-label">E-mail</span>
          <input value={profile.email} disabled className="bobo-field opacity-60" />
          <span className="mt-1 block text-xs text-ink-muted">
            Pour changer d&apos;adresse, écrivez-nous.
          </span>
        </label>

        <label>
          <span className="bobo-label">Téléphone</span>
          <input
            name="phone"
            defaultValue={profile.phone ?? ''}
            autoComplete="tel"
            className="bobo-field"
          />
        </label>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="accepts_marketing"
            defaultChecked={profile.accepts_marketing}
            className="mt-1 accent-[var(--color-ink)]"
          />
          <span>Recevoir Le Journal et les avant-premières.</span>
        </label>

        {state?.ok ? (
          <p className="text-xs text-success" role="status">
            Profil enregistré.
          </p>
        ) : null}
        {state && !state.ok ? (
          <p className="text-xs text-danger" role="alert">
            {state.message}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="bobo-btn bobo-btn-primary self-start">
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      <form action={signOut} className="border-t border-line pt-8">
        <button type="submit" className="bobo-btn bobo-btn-ghost">
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
