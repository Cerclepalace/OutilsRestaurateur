# Base de données

PostgreSQL 17 sur Supabase. 29 tables, RLS sur toutes, argent en centiemes entiers.

## Migrations

Numérotées et rejouables — chaque fichier peut être appliqué deux fois sans
dommage (`create ... if not exists`, `drop policy if exists`, `on conflict`).

| Fichier | Contenu |
| --- | --- |
| `0001_foundation` | Extensions, enums, `touch_updated_at`, normalisation de texte |
| `0002_identity` | `profiles` (miroir de `auth.users`), `addresses`, `is_admin()` |
| `0003_catalog` | Catégories, collections, produits, déclinaisons, stock, médias |
| `0004_commerce` | Wishlist, panier, livraison, remises, commandes, paiements |
| `0005_content` | Pages CMS, sections, navigation, réglages, newsletter, points de vente |
| `0006_rls` | Politiques de sécurité au niveau ligne |
| `0007_functions` | `price_cart`, `validate_discount_code` |
| `0008_order_functions` | `create_order`, `mark_order_paid`, `release_order`, fusions |
| `0009_catalog_search` | Recherche à facettes, suggestions, tableau de bord admin |
| `0010_security_hardening` | Extensions hors de `public`, `search_path` figé, droits retirés |
| `0011_grants` | Droits explicites par rôle (portabilité hors Supabase hébergé) |
| `0012_fix_is_admin_grant` | Correctif : `anon` doit pouvoir exécuter `is_admin()` |
| `0013_cart_line_image` | Correctif : vignette du panier pour toutes les tailles d'un coloris |
| `0014_profile_role_guard` | **Sécurité** : un client ne peut plus se promouvoir administrateur |
| `0015_empty_cart_costs_nothing` | Correctif : un panier sans ligne achetable ne facture plus la livraison |

### Application

```bash
supabase db push                       # avec la CLI Supabase liée au projet
# ou, fichier par fichier :
psql "$DATABASE_URL" -f supabase/migrations/0001_foundation.sql
```

## Modèle

```
profiles ──< addresses
    │
    ├──< wishlists ──< wishlist_items >── products
    ├──< carts ──< cart_items >── product_variants
    └──< orders ──< order_items
                └──< payments

categories ──< categories (auto-référence)
    └──< products ──< product_variants ──1:1── inventory
                 │                    └──< inventory_movements
                 ├──< product_images
                 ├──< product_videos
                 └──< product_recommendations

collections ──< collection_products >── products
pages ──< page_sections
navigation_items ──< navigation_items (auto-référence)
settings · shipping_methods · discounts ──< discount_codes
newsletter_subscribers · stores · reviews
```

### Décisions structurantes

**L'argent est un `integer` de centimes.** `21900` vaut 219 €. Aucun flottant
n'entre dans un calcul de prix.

**Le stock est une table à part.** `inventory` est en 1:1 avec
`product_variants`, avec `quantity` et `reserved`. Le disponible est
`quantity - reserved` — jamais une colonne dénormalisée qui pourrait dériver.
Un trigger crée la ligne d'inventaire à chaque nouvelle déclinaison : une
variante sans stock traçable ne peut pas exister.

**Les commandes figent tout.** `order_items` copie le nom, le SKU, l'image, le
slug et le prix. Renommer un produit six mois plus tard ne réécrit pas
l'historique. L'adresse est stockée en `jsonb` pour la même raison.

**Suppression douce.** `deleted_at` sur `products`, `categories`, `collections` :
une pièce vendue disparaît de la boutique sans casser les commandes passées.

**Les sections CMS sont typées.** `page_sections.kind` est un enum, `content`
est du `jsonb` validé par Zod à la lecture. Une section malformée est ignorée
avec un avertissement serveur plutôt que de faire tomber la page.

## Sécurité

### Posture

Tout est fermé par défaut. Le lecteur anonyme voit le catalogue publié et le
contenu publié. Tout ce qui appartient à un client n'est visible que par lui.
Tout ce qui touche à l'argent ou au stock passe par une fonction
`SECURITY DEFINER`.

```sql
-- Lecture publique : seulement ce qui est publié
create policy products_public_read on public.products
  for select using (status = 'active' and deleted_at is null);

-- Données client : strictement les siennes
create policy orders_select_own on public.orders
  for select using (profile_id = auth.uid() or public.is_admin());
```

### RLS filtre des lignes, pas des colonnes

C'est la nuance qui a produit la seule faille réelle de ce projet. La politique
« un client modifie son propre profil » dit *quelle ligne* il peut écrire, pas
*quelles colonnes*. Un client authentifié pouvait donc écrire la sienne :

```sql
update public.profiles set role = 'admin' where id = auth.uid();
```

La ligne lui appartient : RLS l'autorise. Deux couches indépendantes ferment la
porte, parce qu'une seule est une ligne de défense unique :

```sql
-- 1. Droits au niveau colonne : `role` n'est tout simplement plus accessible.
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone, accepts_marketing)
  on public.profiles to authenticated;

-- 2. Déclencheur : même si un droit était re-accordé par erreur, l'écriture
--    d'un changement de rôle par `anon` ou `authenticated` lève une exception.
create trigger profiles_guard_role
  before update of role on public.profiles
  for each row execute function public.guard_profile_role();
```

Les rôles se changent avec le `service_role` ou directement en SQL. La migration
est `0014`, et l'assertion 3 de `tests/db/security.sql` la vérifie sous un vrai
rôle `authenticated`.

### Ce qui n'est pas lisible publiquement

Les **codes de réduction**. `discounts` et `discount_codes` n'ont aucune
politique de lecture publique : un code ne peut être testé qu'à travers
`validate_discount_code`, donc pas énuméré.

### Droits d'exécution

| Fonction | anon | authenticated | service_role |
| --- | --- | --- | --- |
| `catalog_search`, `search_suggestions`, `price_cart` | ✅ | ✅ | ✅ |
| `validate_discount_code`, `create_order`, `lookup_order` | ✅ | ✅ | ✅ |
| `is_admin` | ✅ ¹ | ✅ | ✅ |
| `merge_cart`, `merge_wishlist`, `admin_dashboard` | ❌ | ✅ | ✅ |
| `reserve_variant` | ❌ | ❌ | ❌ ² |
| `mark_order_paid`, `release_order` | ❌ | ❌ | ✅ |

¹ Indispensable : les politiques RLS d'administration appellent `is_admin()`, et
Postgres évalue toutes les politiques permissives d'un rôle. Sans ce droit,
**toute lecture anonyme échoue** avec `permission denied for function is_admin`.
La fonction ne révèle rien : pour un anonyme, `auth.uid()` est nul, la réponse
est toujours `false`. Le correctif est la migration `0012`.

² Appelée uniquement depuis `create_order`, qui est `SECURITY DEFINER`.

### Nommer un administrateur

```sql
update public.profiles set role = 'admin' where email = 'vous@exemple.com';
```

Rôles : `customer` (défaut), `staff`, `admin`. `is_admin()` renvoie vrai pour
les deux derniers.

## Recherche

`catalog_search(jsonb)` renvoie la page **et** ses facettes en un aller-retour.

Chaque facette est comptée en ignorant sa propre dimension : filtrer par taille
ne vide pas la liste des tailles. C'est ce qu'attend un client, et c'est la
raison pour laquelle ce calcul ne peut pas être fait avec un simple `count`
sur le résultat final.

La recherche textuelle est insensible aux accents et à la casse, via un index
GIN trigramme sur `normalize_text(nom || modèle || description)`. « veste »,
« Veste » et « vêste » donnent le même résultat.

## Réamorçage

```bash
npm run seed        # via SUPABASE_SERVICE_ROLE_KEY
npm run seed:sql    # imprime le SQL, à coller dans l'éditeur SQL
```

Le seed est idempotent : chaque instruction fait un `upsert` sur une clé
naturelle (slug, sku, code). Il ne supprime jamais un produit, et n'écrase le
stock que s'il vaut encore zéro — une correction d'inventaire faite depuis
l'admin survit à un réamorçage.
