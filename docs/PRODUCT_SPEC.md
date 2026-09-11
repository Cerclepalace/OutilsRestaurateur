# Spécification produit

## Ce que vend BOBO PARIS, et ce que ça impose

25 modèles. 144 déclinaisons. Des séries de 1 à 10 exemplaires. Une pièce
unique qui n'existe qu'en un exemplaire, taille M.

Ce n'est pas un catalogue de fast fashion en réduction. C'est un commerce dont
la rareté est le produit — et cela change trois choses par rapport à une
boutique en ligne ordinaire :

1. **Le stock doit être visible.** « Il ne reste que 2 pièces » n'est pas une
   tactique de pression, c'est une information vraie qui justifie le prix.
2. **La concurrence sur le dernier exemplaire est un cas courant, pas un cas
   limite.** Deux clients qui achètent simultanément la même pièce doit être
   géré au niveau de la base, pas espéré.
3. **Une rupture est définitive.** Les messages de vide doivent le dire :
   « cette capsule est épuisée, les pièces ne seront pas rééditées ».

## Parcours

### Découvrir

| Route | Rôle |
| --- | --- |
| `/` | Accueil éditorial, sections pilotées par le CMS |
| `/boutique` | Tout le catalogue, filtres et tri |
| `/femme`, `/homme` | Vestiaires ; les pièces unisexes apparaissent dans les deux |
| `/femme/[cat]`, `/homme/[cat]` | Catégorie, avec fil d'Ariane |
| `/collections`, `/collections/[slug]` | Capsules, chacune avec son récit |
| `/archives` | Pièces uniques |
| `/search` | Résultats ; surcouche instantanée depuis le header |

### Choisir

`/product/[slug]` — galerie, coloris, tailles, stock réel, guide des tailles,
composition, fabrication et origine, recommandations.

Deux règles de conception :

- Une taille en rupture reste **visible et barrée**. Masquer la ligne ferait
  croire qu'elle n'a jamais existé ; la barrer dit la vérité.
- Une pièce en taille unique est **présélectionnée**. Un sac ne demande pas de
  choisir entre une seule option.

### Acheter

`/cart` → `/checkout` → Stripe → `/order/success`

Le tunnel tient en une page à quatre étapes révélées. Un panier de mode fait
deux ou trois lignes ; un assistant multi-pages y perd des clients.

À la validation :

1. `create_order` re-tarifie le panier depuis la base
2. réserve le stock, ligne par ligne
3. écrit la commande — le tout dans une seule transaction

Si une ligne manque, rien n'est écrit et le client voit quelle pièce vient de
partir. Le stock n'est décrémenté qu'au paiement confirmé, par le webhook.

### Revenir

`/account` (aperçu), `/account/orders`, `/account/addresses`,
`/account/profile`, `/wishlist`, `/order/track` pour les invités.

Le panier et la liste de souhaits d'un visiteur non connecté sont fusionnés
dans son compte à la connexion, une seule fois, de façon idempotente.

## Administration

`/admin` — tableau de bord, commandes, clients, produits, stock, catégories,
collections, pages, newsletter, réglages.

L'écran de réglages mérite une mention : **les seuils de livraison offerte s'y
modifient**. C'est la réponse directe à la contradiction relevée dans l'audit
(200 € / 150 € / 300 € selon la page du site actuel). Aucun seuil n'est écrit
dans le code.

## Décisions

| Date | Décision | Raison | Statut |
| --- | --- | --- | --- |
| 2026-09 | Prix en centimes entiers | Les flottants dérivent d'un centime | 🟢 VALIDÉ |
| 2026-09 | Tarification serveur uniquement | Le navigateur ne doit jamais fixer un prix | 🟢 VALIDÉ |
| 2026-09 | Panier invité en `localStorage`, pas en base | Un anonyme n'a alors aucun droit d'écriture | 🟢 VALIDÉ |
| 2026-09 | Réservation à la commande, décrément au paiement | Empêche la double vente sans bloquer le stock indéfiniment | 🟢 VALIDÉ |
| 2026-09 | Seuils de livraison en base | Le site actuel affiche trois chiffres contradictoires | 🟢 VALIDÉ |
| 2026-09 | Facettes calculées côté base | Filtrer en JS supposerait de charger tout le catalogue | 🟢 VALIDÉ |
| 2026-09 | Seuil France à 200 € | Valeur du bandeau d'accueil, la plus visible | 🟠 À VÉRIFIER par la marque |
| 2026-09 | Produits sans prix vérifié exclus du seed | Ne pas inventer de prix | 🟢 VALIDÉ |
| 2026-09 | Visuels de remplacement en aplats éditoriaux | Ne pas réutiliser les photographies de la marque | 🟡 TEMPORAIRE |
| 2026-09 | Avis produits : schéma prêt, aucune donnée | Un avis fabriqué est un mensonge au client | 🟢 VALIDÉ |
| 2026-09 | Paiement désactivé sans clés Stripe | Mieux vaut un refus clair qu'une fausse confirmation | 🟢 VALIDÉ |

## Ce qui n'est pas fait

Énoncé franchement, pour que personne ne le découvre en production :

- **Envoi d'e-mails.** Aucune confirmation de commande n'est expédiée. Il faut
  brancher un service transactionnel sur le webhook Stripe.
- **Alma (paiement en plusieurs fois).** Affiché par la marque aujourd'hui, non
  intégré ici. Stripe seul est branché.
- **Remboursements depuis l'admin.** Le statut se change à la main ; aucun appel
  à l'API de remboursement Stripe.
- **Avis clients.** Les tables et les politiques existent, l'interface non.
- **Multi-devise.** Le schéma porte une colonne `currency`, tout est en EUR.
- **Upload d'images dans l'admin.** Les images se référencent par URL ; le
  fichier doit être déposé dans Supabase Storage au préalable.
- **Photographies réelles.** Les visuels livrés sont des aplats éditoriaux
  générés, clairement identifiables comme tels.
