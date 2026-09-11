# Architecture

## Le principe

**Le navigateur exprime une intention, la base décide.**

Le panier stocke des identifiants de déclinaison et des quantités. Jamais un
prix. Chaque total affiché revient de `price_cart`, chaque commande passe par
`create_order`. Un `localStorage` trafiqué ne peut donc acheter que de vrais
produits au vrai prix.

C'est la contrainte qui structure tout le reste.

## Couches

```
  app/          routes — Server Components par défaut
  features/     UI par domaine (catalogue, panier, compte, admin, cms)
  components/   primitives partagées (ui/, layout/)
  services/     accès données — 'server-only', jamais importé par un composant client
  lib/          supabase, env, validation, formatage
  types/        types générés depuis la base + types de domaine
  data/seed/    le catalogue, en clair
  supabase/     migrations SQL, numérotées et rejouables
```

Règle de dépendance : `app → features → components → lib`. Les `services`
n'importent jamais de composant ; les composants n'importent jamais `services/admin`.

## Les quatre clients Supabase

Un fichier par usage, pour qu'il soit impossible d'en choisir un par accident.

| Fichier | Qui il est | Où |
| --- | --- | --- |
| `lib/supabase/public.ts` | Anonyme, sans cookie | Lectures catalogue et contenu. Ne touchant pas `cookies()`, il laisse les pages statiquement rendables |
| `lib/supabase/server.ts` | L'utilisateur de la requête | Tout ce qui dépend de la session : compte, commandes, admin |
| `lib/supabase/client.ts` | L'utilisateur, dans le navigateur | Auth uniquement |
| `lib/supabase/admin.ts` | Service role, **contourne RLS** | Un seul appelant : le webhook Stripe, qui n'a pas de session |

`admin.ts` importe `server-only` : l'inclure dans un composant est une erreur de
compilation, pas une fuite en production.

## Ce que fait la base, et pourquoi

Cinq opérations vivent en SQL plutôt qu'en TypeScript :

| Fonction | Raison |
| --- | --- |
| `catalog_search` | Filtrer 144 déclinaisons et compter les facettes en JS supposerait de charger tout le catalogue à chaque requête. Postgres a les index |
| `price_cart` | Un seul endroit calcule l'argent. Le panier, le tiroir et le paiement affichent forcément la même chose |
| `create_order` | Re-tarification, réservation du stock et écriture de la commande dans une seule transaction. Si une ligne manque, rien n'est écrit |
| `mark_order_paid` | Idempotent : Stripe réessaie, la commande ne se règle qu'une fois |
| `merge_cart` / `merge_wishlist` | La fusion à la connexion doit survivre à un double appel |

## Concurrence sur le stock

Deux clients visent la dernière pièce. `reserve_variant` fait :

```sql
update public.inventory
   set reserved = reserved + :quantity
 where variant_id = :id
   and quantity - reserved >= :quantity;
```

Le verrou de ligne sérialise les deux transactions. La seconde voit la valeur
mise à jour, sa clause `where` ne matche plus, `row_count` vaut 0,
`create_order` lève `out_of_stock` et l'ensemble est annulé.

Cycle de vie d'une commande :

```
  create_order      réservé   +N   →  commande "pending"
  mark_order_paid   vendu     -N   →  commande "paid"    (webhook)
  release_order     libéré    -N   →  commande "cancelled" (expiration / échec)
```

`inventory_movements` garde la trace de chaque mouvement : un écart de stock
s'explique après coup.

## Panier invité

Il n'existe pas de table pour le panier invité, et c'est délibéré. Un visiteur
anonyme n'a **aucun droit d'écriture** sur les tables de commerce. Son panier
vit dans `localStorage`, il est re-tarifé côté serveur à chaque affichage, et
fusionné dans son panier serveur à la connexion.

Moins de surface d'attaque, pas de table de sessions à purger.

## Rendu

| Type | Routes | Pourquoi |
| --- | --- | --- |
| Statique / ISR | `/`, pages éditoriales, `/collections`, fiches produit | Contenu marchand : `revalidate` de 2 à 10 minutes |
| Dynamique | `/boutique`, `/femme`, `/homme`, `/search` | Dépendent des filtres de l'URL |
| Dynamique (session) | `/account/*`, `/admin/*`, `/cart`, `/checkout` | Personnel par définition |

`proxy.ts` (ex-`middleware`, renommé en Next 16) rafraîchit le cookie de session
et redirige les visiteurs anonymes hors de `/account` et `/admin`. Ce n'est pas
la frontière de sécurité — RLS l'est — c'est une porte plutôt qu'une pièce vide.

## Conventions

- **L'argent est un entier de centimes.** Jamais un flottant. La conversion en
  texte n'existe que dans `lib/format.ts`
- **L'URL est l'état.** Une vue catalogue tient entièrement dans sa query string
- **Zod aux frontières.** Chaque route API et chaque server action valide avant
  de toucher aux données
- **Rien n'est simulé.** Si Stripe n'est pas configuré, `/api/checkout` répond
  503 avec un message clair et l'interface le dit. Elle ne feint pas une
  commande
