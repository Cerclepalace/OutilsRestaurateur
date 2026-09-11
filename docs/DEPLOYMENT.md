# Déploiement

Vercel pour l'application, Supabase pour la base, Stripe pour le paiement.

## 1. Supabase

1. Créer un projet — région **eu-west-3 (Paris)** pour la latence et le RGPD.
2. Appliquer les migrations dans l'ordre :

   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```

   Sans la CLI, coller chaque fichier de `supabase/migrations/` dans l'éditeur
   SQL, dans l'ordre numérique.

3. Amorcer le catalogue :

   ```bash
   SUPABASE_SERVICE_ROLE_KEY=... npm run seed
   # ou : npm run seed:sql  puis coller le résultat
   ```

4. Créer un bucket de stockage **public** nommé `media`, pour les photographies.

5. Se nommer administrateur, après avoir créé son compte sur le site :

   ```sql
   update public.profiles set role = 'admin' where email = 'vous@exemple.com';
   ```

### Authentification

Dans *Authentication → URL Configuration* :

- **Site URL** : `https://votre-domaine.com`
- **Redirect URLs** : `https://votre-domaine.com/auth/callback`,
  `https://votre-domaine.com/account/reset-password`

## 2. Stripe

1. Récupérer les clés dans *Developers → API keys*.
2. Créer un endpoint webhook vers
   `https://votre-domaine.com/api/stripe/webhook`, abonné à :
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `checkout.session.async_payment_failed`
3. Copier le secret de signature (`whsec_…`).

Sans ces clés, le paiement est **désactivé proprement** : `/api/checkout` répond
503 et le tunnel affiche « Paiement non activé ». Rien n'est simulé.

## 3. Vercel

Importer le dépôt, puis déclarer les variables d'environnement :

| Variable | Portée | Note |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Navigateur | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Navigateur | Protégée par RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **Serveur** | Contourne RLS. Jamais `NEXT_PUBLIC_` |
| `STRIPE_SECRET_KEY` | **Serveur** | |
| `STRIPE_WEBHOOK_SECRET` | **Serveur** | |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Navigateur | |
| `NEXT_PUBLIC_SITE_URL` | Les deux | Origine absolue, sans barre finale |

`NEXT_PUBLIC_SITE_URL` sert aux URLs canoniques, au sitemap et aux redirections
Stripe : une valeur erronée renvoie le client au mauvais endroit après paiement.

## 4. Images

`next.config.ts` n'autorise aucun domaine distant par défaut. Pour servir les
photographies depuis Supabase Storage, ajouter :

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '<ref>.supabase.co', pathname: '/storage/v1/object/public/**' },
  ],
}
```

## 5. Vérification

```bash
npm run verify      # typecheck + lint + tests unitaires + build
npm run test:e2e    # parcours de bout en bout
```

Puis, sur l'environnement déployé :

- [ ] L'accueil affiche la capsule à la une
- [ ] Un filtre de taille change le nombre de pièces et survit au rechargement
- [ ] Une fiche produit affiche prix, tailles et stock réel
- [ ] L'ajout au panier ouvre le tiroir et persiste après rechargement
- [ ] Le paiement redirige vers Stripe, et la commande passe à `paid` après le webhook
- [ ] `/admin` refuse un compte non administrateur
- [ ] `/sitemap.xml` et `/robots.txt` répondent

## Après la première commande

Vérifier dans Supabase que `inventory.quantity` a bien diminué et que
`inventory_movements` porte une ligne `sold`. Si la commande reste `pending`,
le webhook n'arrive pas : contrôler l'URL de l'endpoint et le secret de
signature.
