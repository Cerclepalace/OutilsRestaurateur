# BOBO PARIS

Plateforme e-commerce pour BOBO PARIS — marque parisienne d'upcycling fondée en
2021, qui produit des collections capsules en éditions limitées et des pièces
uniques.

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase · Stripe

---

## Le principe

**Le navigateur exprime une intention, la base décide.**

Le panier ne stocke que des identifiants de déclinaison et des quantités —
jamais un prix. Chaque total revient de la base, chaque commande réserve son
stock dans la même transaction qui l'écrit. Deux clients ne peuvent pas acheter
la dernière pièce.

C'est la contrainte principale d'une maison qui vend en séries de 2 à 10
exemplaires, et c'est elle qui a dicté l'architecture.

## Démarrer

```bash
npm install
cp .env.example .env.local     # puis remplir
npm run dev
```

### Variables d'environnement

| Variable | Portée | Requise |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Navigateur | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Navigateur | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Les deux | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur | Webhook Stripe et seed |
| `STRIPE_SECRET_KEY` | Serveur | Paiement |
| `STRIPE_WEBHOOK_SECRET` | Serveur | Paiement |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Navigateur | Paiement |

Sans les clés Stripe, la boutique fonctionne entièrement et le paiement est
**désactivé proprement** : l'API répond 503 et le tunnel l'affiche. Rien n'est
simulé.

### Base de données

```bash
supabase link --project-ref <ref>
supabase db push                       # applique supabase/migrations/
SUPABASE_SERVICE_ROLE_KEY=... npm run seed
```

Sans la CLI : `npm run seed:sql` imprime le SQL, à coller dans l'éditeur
Supabase. Le seed est idempotent et n'écrase jamais un stock corrigé à la main.

Se nommer administrateur, après avoir créé son compte :

```sql
update public.profiles set role = 'admin' where email = 'vous@exemple.com';
```

## Commandes

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `start` | Build et service de production |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Parcours de bout en bout (Playwright) |
| `npm run verify` | typecheck + lint + tests + build |
| `npm run seed` | Amorce le catalogue |
| `npm run placeholders` | Régénère les visuels de remplacement |

## Structure

```
src/app/         routes (App Router)
src/features/    UI par domaine — catalogue, panier, compte, admin, cms
src/components/  primitives partagées
src/services/    accès données, 'server-only'
src/lib/         supabase, env, validation, formatage
data/seed/       le catalogue, en clair
supabase/        migrations SQL
docs/            audit, spécification, design system, architecture, base, déploiement
```

## Ce qui est livré

**Boutique** — accueil éditorial piloté par CMS, catalogue à facettes
(taille, couleur, prix, disponibilité, promotions, nouveautés), collections
capsules, fiche produit avec galerie plein écran et stock réel, recherche
instantanée, liste de souhaits, panier, tunnel d'achat Stripe.

**Compte** — inscription, connexion, mot de passe oublié, profil, carnet
d'adresses, historique de commandes. Suivi de commande pour les invités.

**Administration** — tableau de bord, commandes, clients, produits et
déclinaisons, stock, catégories, collections, pages, newsletter, et **réglages
commerciaux** (les seuils de livraison offerte y sont modifiables).

**Fondations** — 29 tables, RLS sur toutes, recherche à facettes en SQL,
réservation de stock protégée contre les accès concurrents, SEO
(sitemap, robots, Product et BreadcrumbList en JSON-LD), 29 tests unitaires,
42 tests de bout en bout sur desktop et mobile.

## Deux choses à savoir

**Les seuils de livraison du site actuel se contredisent.** 200 €, 150 € et
300 € selon la page consultée. Aucun seuil n'est écrit dans le code : les trois
modes de livraison vivent en base et se modifient depuis `/admin/settings`. Les
valeurs amorcées sont celles du bandeau d'accueil, à confirmer par la marque.

**Les visuels sont des aplats éditoriaux générés.** Pas des photographies. Ce
sont des plaques de couleur tissée portant le nom du modèle — lisibles comme
des nuanciers, jamais confondables avec une vraie prise de vue. Elles se
remplacent en déposant les photographies dans Supabase Storage et en
référençant leur URL depuis `/admin/products`.

## Documentation

| Document | Contenu |
| --- | --- |
| [`docs/REFERENCE_AUDIT.md`](docs/REFERENCE_AUDIT.md) | Audit BOBO PARIS et Zara, et ce qu'on en retient |
| [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) | Parcours, décisions, et ce qui n'est pas fait |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Tokens, composants, accessibilité |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Couches, clients Supabase, concurrence |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Schéma, RLS, fonctions, droits |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Vercel, Supabase, Stripe, vérification |
