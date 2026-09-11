# STATE.md — source de vérité du repo

> Dernière mise à jour : **11 septembre 2026**, session `quirky-edison-ktslxg`.
> Règle : une ligne n'entre ici que si la commande a été jouée dans la session
> qui l'écrit. Tout le reste va dans « fait mais NON vérifié ».

---

## 🔴 BLOCAGE AMONT — à arbitrer avant toute ligne de code

Le dépôt s'appelle **OutilsRestaurateur**. Son contenu est **BOBO PARIS**, une
plateforme e-commerce de mode (25 produits, 144 déclinaisons, tailles, panier,
Stripe). `package.json` → `"name": "boboparis"`.

Mesuré : `grep -riE "restaur" src/ docs/ README.md` → **0 occurrence**.

Il n'existe donc, dans ce repo, **aucun code, aucun schéma et aucune spec** liés
à l'outil restaurateur qui est le projet prioritaire. Deux lectures possibles,
et elles n'appellent pas le même travail :

1. Ce repo est un **autre projet** (client ou antérieur) et l'outil restaurateur
   vit ailleurs → il ne faut rien développer ici.
2. Ce repo est destiné à **accueillir** l'outil restaurateur et le e-commerce
   n'est qu'un point de départ → il faut décider ce qu'on garde du socle
   (auth, RLS, admin, migrations) et ce qu'on jette.

**Tant que ce point n'est pas tranché, toute feature développée ici est du
travail potentiellement jeté.** Aucune tâche produit n'a été lancée dans cette
session pour cette raison.

---

## Fait ET vérifié — dans cette session

Commandes réellement jouées sur `claude/quirky-edison-ktslxg` @ `ffa467d`,
arbre propre.

| Commande | Résultat |
| --- | --- |
| `npm ci` | OK (node_modules était vide au démarrage) |
| `npm run lint` | **0 erreur** |
| `npm test` | **35 passed / 5 fichiers**, 2,9 s |
| `npm run build` | **OK** — SSG confirmée sur `/product/[slug]`, `/femme/[category]`, `/homme/[category]` |
| `npm run typecheck` | **0 erreur — mais uniquement APRÈS un build** (voir piège ci-dessous) |
| structure | 38 `page.tsx`, 9 `route.ts`, 15 migrations — conforme à `docs/PROJECT_STATE.md` |

### ⚠️ Piège à connaître avant de perdre 20 minutes

Sur un clone frais, `npm run typecheck` **échoue** avec 8 erreurs
`TS2304: Cannot find name 'PageProps' / 'LayoutProps'`.

Ce n'est pas un bug du code. `tsconfig.json` inclut `.next/types/**/*.ts`, où
Next.js 16 **génère** ces types globaux ; ce répertoire est gitignoré.

➡️ **Ordre obligatoire : `npm run build` PUIS `npm run typecheck`.**
`npm run verify` enchaîne typecheck → lint → test → build : il échoue donc sur
un clone frais, par ordre des étapes, pas par défaut du code. (Voir BACKLOG.)

### Environnement

`.env.local` a été créé localement depuis `.env.example` pour permettre le
build. Il est gitignoré, non commité. Le build passe avec ces valeurs
placeholder — il ne prouve donc **pas** la connectivité Supabase réelle.

---

## Fait mais NON vérifié ici

Repris de `docs/PROJECT_STATE.md` (audit du 11 sept. 2026). Ces lignes n'ont
**pas** été rejouées dans cette session — traiter comme « à re-prouver ».

- `npm run test:e2e` → 65 passés / 1 ignoré. *Navigateurs Playwright non installés ici.*
- `npm run test:db` → 10 assertions de sécurité RLS. *Nécessite `DATABASE_URL`.*
- `npm run test:race` → 2 scénarios de concurrence. *Idem.*
- RLS active sur 29/29 tables, 53 politiques.
- Équivalence schéma cloud / local (hash SHA-256 des 18 fonctions métier).
- Correctifs P0 phase 2 : `0014_profile_role_guard` (élévation de privilèges),
  `0015_empty_cart_costs_nothing` (panier vide facturé 6,90 €).

### Bloqué par l'extérieur — ne pas retenter sans les fournir

| Sujet | Ce qui manque |
| --- | --- |
| Paiement Stripe bout en bout | `STRIPE_SECRET_KEY`, clé publiable, `STRIPE_WEBHOOK_SECRET`. Le code échoue proprement sans elles et ne simule jamais un paiement. |
| E2E d'authentification | Egress conteneur bloque `*.supabase.co` (403 sur CONNECT) ; le banc local n'embarque pas GoTrue. |
| Photos définitives | Fichiers marque. Les visuels actuels sont des placeholders assumés. |
| Seuil de franco « officiel » | Arbitrage commercial (3 valeurs publiques contradictoires : 200 / 150 / 300 €). La valeur vit en base, toutes les surfaces la citent. |

---

## Prochaine action

**Étape 0 — arbitrage fondateur, bloquante :** trancher le blocage amont
ci-dessus. Aucune des tâches ci-dessous n'a de sens si ce repo n'est pas le bon
projet.

**Si et seulement si on continue BOBO PARIS**, la tâche en tête est la seule
⚠️ actionnable sans dépendance externe :

> **Sortir `@supabase/supabase-js` du bundle initial.**
> Mesure de l'audit (à re-mesurer avant de toucher quoi que ce soit) : la page
> d'accueil exécute **362 Ko gzip de JS**, dont l'intégralité du client Supabase.

Fichiers exacts à ouvrir :
- `src/lib/supabase/client.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- puis `grep -rl "@supabase/supabase-js\|supabase/client" src/components src/app`

Comment vérifier : `npm run build` et comparer le « First Load JS » de `/` avant
et après. Cible à fixer avant de commencer, pas après.

---

## BACKLOG — découvert, non traité

- `npm run verify` est inutilisable sur un clone frais : il lance `typecheck`
  avant `build`, or les types de routes n'existent qu'après build. Réordonner en
  `build && typecheck && lint && test`, ou committer un `.d.ts` de secours.
- `docs/PROJECT_STATE.md` référence la branche `claude/vigilant-dirac-wdbx4s` et
  « 2 commits » ; la branche réelle est `claude/quirky-edison-ktslxg` et il y a
  3 commits. Document désynchronisé.
- Upload d'images et remboursements côté admin : écrits nulle part, notés « P5 ».
- Audit lecteur d'écran jamais fait (le reste de l'a11y est testé).
- Avertissement vitest : jsdom recréé 5 fois (76 % du temps de suite).
  `pool: 'vmThreads'` ou `isolate: false` diviserait la durée. Cosmétique.
