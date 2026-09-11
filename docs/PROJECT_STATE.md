# État réel du projet

> Audit daté du **11 septembre 2026**. Chaque ligne s'appuie sur une commande
> réellement exécutée ou une requête réellement jouée, jamais sur le rapport
> d'une phase précédente. Les commandes sont reproductibles : elles sont citées
> en fin de document.

## Tableau de bord

| Domaine | État réel | Fonctionnel | Incomplet | Bug | À faire |
| --- | --- | :---: | :---: | :---: | :---: |
| Repository | 38 routes de page, 9 routes d'API, 8 services, 15 migrations, 2 commits sur `claude/vigilant-dirac-wdbx4s` | ✅ | — | — | — |
| Next.js | 16.3.4 / React 19.2.8. Aucun `middleware.ts`, `proxy.ts` en place, `params`/`searchParams` attendus partout, `PageProps`/`LayoutProps` sur 21 fichiers | ✅ | — | — | — |
| Supabase | Projet `mcjihpyomcnutwsgfslz`, `eu-west-3`. Schéma cloud identique au schéma local : les 18 corps de fonctions métier ont un hash identique | ✅ | — | — | — |
| Database | 29 tables, 19 contraintes `CHECK` sur l'argent et le stock, 14 colonnes `_cents` en `integer`, **0** colonne monétaire non entière | ✅ | — | — | — |
| RLS | Activée sur **29/29** tables, 53 politiques. Suite de 10 assertions jouée sous `anon` et `authenticated` réels | ✅ | — | — | — |
| Auth | Inscription, connexion, déconnexion, réinitialisation, sessions rafraîchies par `proxy.ts`, `/account` et `/admin` redirigent les anonymes | ✅ | — | — | Auth non exerçable hors ligne (voir *Limites*) |
| Catalogue | 25 produits, 144 déclinaisons, 78 images, 9 collections, 14 catégories. Facettes, tri, pagination, filtres conservés dans l'URL | ✅ | — | — | — |
| Pricing | `price_cart` seule autorité. Prix client ignoré, quantité plafonnée, variante inconnue rejetée — prouvé par 12 tests HTTP | ✅ | — | — | — |
| Stock | Réservation atomique par `UPDATE ... WHERE quantity - reserved >= n`. `reserved <= quantity` rend la survente structurellement impossible | ✅ | — | — | — |
| Cart | Ne stocke que `{variant_id, quantity}`. Tous les montants recalculés côté base | ✅ | — | — | — |
| Checkout | Commande créée avant la session de paiement, stock réservé dans la même transaction | ✅ | — | — | — |
| Stripe | Intégration réelle écrite ; **aucune clé fournie** dans cet environnement. Sans clé : erreur propre, jamais de paiement simulé | — | ⚠️ | — | Fournir `STRIPE_SECRET_KEY`, la clé publiable et `STRIPE_WEBHOOK_SECRET` |
| CMS | 7 pages éditoriales, sections typées, navigation et réglages en base | ✅ | — | — | — |
| Admin | Produits, déclinaisons, stock, commandes, clients, collections, catégories, pages, réglages, newsletter — sur les vraies données | ✅ | — | — | Upload d'images, remboursements (P5) |
| SEO | `sitemap.xml`, `robots.txt`, `generateMetadata` sur 6 routes, JSON-LD `Product`/`Offer`/`BreadcrumbList`, `/search` en `noindex` | ✅ | — | — | — |
| Performance | 25 fiches produit en SSG. **Mesuré : la page d'accueil exécute 362 Ko gzip de JS**, dont tout `@supabase/supabase-js` | — | ⚠️ | — | Sortir le client Supabase du bundle initial |
| Accessibility | Lien d'évitement, focus clavier, rôles ARIA, pas de débordement horizontal de 390 à 1920 px — vérifié par tests | ✅ | — | — | Audit lecteur d'écran non fait |
| Tests | 35 unitaires, 66 E2E (2 navigateurs), 10 assertions SQL de sécurité, 2 scénarios de concurrence | ✅ | — | — | — |

Légende : ✅ vérifié par une exécution · ⚠️ écrit mais non exerçable ici · — sans objet.

## Ce que la phase 2 a réellement corrigé

### P0 — Élévation de privilèges (faille réelle)

Un client authentifié pouvait se promouvoir administrateur :

```sql
update public.profiles set role = 'admin' where id = auth.uid();
```

RLS filtre des **lignes**, pas des **colonnes** : la politique « un client modifie
son propre profil » autorisait donc aussi la modification de sa propre colonne
`role`. Corrigé par `0014_profile_role_guard` en deux couches indépendantes —
droits au niveau colonne (`grant update (first_name, last_name, phone,
accepts_marketing)`) et déclencheur `guard_profile_role`. Vérifié en cloud :
`authenticated` ne détient plus l'`UPDATE` que sur ces quatre colonnes.

### P0 — Un panier vide était facturé

`price_cart` calculait la livraison avant de vérifier qu'il y avait quelque
chose à livrer. Un panier ne contenant que des lignes indisponibles — ou une
charge utile trafiquée nommant une variante inexistante — revenait avec
`subtotal 0, shipping 690, total 690`. L'écran masquait le résumé, donc rien
n'apparaissait dans l'interface, mais l'API l'affirmait. Corrigé par
`0015_empty_cart_costs_nothing`. Vérifié en cloud sur trois formes d'entrée
(variante inconnue, tableau vide, charge nulle) : `0 / 0 / 0 / 0`.

### Un bandeau qui pouvait mentir

Le seuil de franco de port était lu en base par le panier et le paiement, mais
**écrit en dur** dans la fiche produit (« offerte dès 200 € ») et dans le texte
du bandeau d'annonce. Un changement de seuil depuis `/admin/settings` laissait
donc deux surfaces annoncer un seuil que le paiement ne pratiquait plus — une
promesse commerciale non tenue, pas un détail cosmétique. La fiche produit lit
désormais `getFreeShippingThreshold()`, et le bandeau accepte le jeton
`{seuil_franco}`, remplacé au rendu par la valeur réellement appliquée. Le
libellé reste entièrement éditable par le marchand.

Vérifié de bout en bout : seuil passé à 249 € en base → les deux surfaces
affichent 249 € ; seuil remis à 200 € → les deux affichent 200 €.

### Un test qui échouait sans que le produit soit en cause

`getByText(/rien pour l'instant/i)` tombait par intermittence. Diagnostic réel :
pendant le streaming, React tient une seconde copie du balisage dans un nœud
`[hidden]`. Le localisateur en résolvait donc **deux**, ce qui déclenche le mode
strict de Playwright — un échec immédiat, sans nouvelle tentative. Les sous-arbres
`[hidden]` étant hors de l'arbre d'accessibilité, `getByRole` n'en voit jamais
qu'un seul. Mesuré : `getByText` → 2 occurrences, `getByRole` → 0 ou 1, jamais 2.

### Deux défauts de documentation corrigés

`src/lib/supabase/admin.ts` affirmait « exactement un appelant » alors qu'il en a
deux. `describeOrder` recalculait son propre formatage monétaire au lieu
d'utiliser `formatPrice`, produisant « 219,00 € » là où le reste du site écrit
« 219 € ».

## Ce qui n'est pas — et ne peut pas être — terminé ici

| Sujet | Pourquoi | Ce qu'il faut |
| --- | --- | --- |
| Paiement Stripe de bout en bout | Aucune clé Stripe n'existe dans cet environnement | Les trois clés Stripe. Le code refuse proprement sans elles, et ne simule jamais un paiement |
| Parcours d'authentification en E2E | Le bac de test local n'embarque pas GoTrue ; l'egress du conteneur bloque `*.supabase.co` | Exécuter la suite E2E contre le vrai projet Supabase |
| Photographies définitives | Les visuels du site officiel ne sont pas redistribuables | Les fichiers fournis par la marque. Les images actuelles sont des placeholders explicitement identifiés comme tels |
| Seuil de franco « officiel » | La source publique en publie **trois** valeurs contradictoires (200 €, 150 €, 300 €) | Un arbitrage commercial. En attendant, la valeur vit en base et toutes les surfaces la citent |

## Limites du banc d'essai local

L'egress du conteneur bloque `*.supabase.co` (403 sur le CONNECT). Les suites
tournent donc contre un PostgreSQL 16 et un PostgREST 12.2.3 réels, chargés du
même schéma, avec les mêmes rôles (`anon`, `authenticated`, `service_role`). Ce
n'est pas une simulation : ce sont les vrais moteurs. Ce qu'ils n'apportent pas,
c'est GoTrue — d'où l'absence de tests E2E d'authentification.

L'équivalence des deux bases est vérifiée, pas supposée : les corps des 18
fonctions métier sont hachés en SHA-256 après normalisation des commentaires et
des espaces, et comparés. Ils sont identiques.

## Reproduire l'audit

```bash
npm run typecheck        # 0 erreur
npm run lint             # 0 erreur
npm test                 # 35 tests
npm run build            # 25 fiches produit en SSG
npm run test:e2e         # 65 passés, 1 ignoré volontairement (clavier sur mobile)

DATABASE_URL=postgres://… npm run test:db     # 10 assertions de sécurité
DATABASE_URL=postgres://… npm run test:race   # 2 scénarios de concurrence
```

`test:db` s'exécute sous les rôles `anon` et `authenticated` réels : le lancer en
superutilisateur contournerait RLS et ne prouverait rien. La suite se termine
toujours par `rollback` et ne laisse aucune trace.
