# Audit des références

Réalisé en septembre 2026, avant toute ligne de code. Trois sections : ce que fait
BOBO PARIS aujourd'hui, ce que Zara fait mieux, et ce que nous en retenons.

Une convention de lecture, appliquée partout dans ce dépôt :

| Marqueur | Sens |
| --- | --- |
| **FAIT CONFIRMÉ** | Lu directement sur la source publique, en septembre 2026 |
| **HYPOTHÈSE** | Déduction raisonnable, non vérifiée |
| **À VÉRIFIER** | Information contradictoire ou manquante |
| **DÉCISION** | Choix de conception assumé pour ce projet |

---

## 1. BOBO PARIS — l'existant

### Identité de marque — FAIT CONFIRMÉ

Repris mot pour mot du site :

> « Bobo Paris est une marque écoresponsable fondée à Paris en 2021, qui réinvente
> des essentiels revisités avec originalité. Inspirée du vintage et du workwear,
> chaque pièce combine une esthétique moderne avec les codes du passé. »

> « Confectionnée à partir de stocks dormants de maisons de luxe et de vêtements
> de seconde main, la marque présente des collections capsules en éditions
> limitées et des pièces uniques. »

Signature : **Créer. Porter. Recommencer.**

### Architecture actuelle — FAIT CONFIRMÉ

- Navigation : Boutique · Femme · Homme · Collections · Le Studio · Archives ·
  Nos Engagements · Qui sommes-nous
- Neuf collections capsules publiées : Les Jours Chauds, Late For Work,
  L'Héritage Bleu, Équinoxe d'Automne, Songe d'Été, L'Échappée Belle à
  Casablanca, Jardin d'Été, Back to School, Mix and Match
- Catégories produit observées : chemises, robes, gilets, manteaux & vestes,
  combinaisons, bas, sacs, chapeaux
- Tailles : XS, S, M, L, XL — et taille unique pour les accessoires
- Filtres existants : taille, prix, couleur, catégorie (Disponible, Nouveautés,
  Out of stock, Promotions)
- Coloris nommés : Beige, Bleu, Bordeaux, Lilas, Marron, Noir, Rayé, Taupe,
  Terracotta, Vert, Multicolore, Vert clair

### Engagements — FAIT CONFIRMÉ

- Matières 100 % issues de la revalorisation textile, notamment via Nona Source
  (plateforme lancée par LVMH)
- Emballages en carton recyclé et recyclable, étiquettes OEKO-TEX Standard 100
- Ateliers en France et au Maroc ; les pièces uniques sont fabriquées à Paris
- Paiement : CB, Visa, Mastercard, Alma x2 et x3

### Ce qui ne va pas — et que nous corrigeons

**1. Les seuils de livraison offerte se contredisent. — À VÉRIFIER**

Trois chiffres différents cohabitent sur le site public :

| Emplacement | Règle annoncée |
| --- | --- |
| Bandeau d'accueil | France métropolitaine dès **200 €**, international dès **350 €** |
| Bloc fiche produit | Livraison offerte à partir de **150 €** |
| Autre bloc « Nos engagements » | France/Belgique/Luxembourg, Europe dès **300 €** |

Un client qui compare deux pages du même site obtient deux promesses
différentes. C'est un risque commercial et juridique, pas un détail
d'affichage.

**DÉCISION.** Aucun seuil n'est écrit dans le code. Les trois modes de
livraison vivent dans la table `shipping_methods` et se modifient depuis
`/admin/settings`. Nous amorçons avec les valeurs du bandeau d'accueil
(200 € / 350 €), les plus visibles, à corriger par la marque.

**2. Pas de compte client complet.** Suivi de commande, carnet d'adresses et
liste de souhaits persistante sont absents ou partiels.

**3. Rareté annoncée mais non montrée.** « Édition très limitée jusqu'à
épuisement » est écrit dans un chapô ; le stock réel n'apparaît nulle part sur
la fiche produit.

---

## 2. Zara — ce qui mérite d'être repris

Nous n'avons repris **aucun** code, visuel, texte ni élément d'identité. Ce qui
suit relève de principes d'ergonomie marchande, non protégeables.

| Principe observé | Pourquoi c'est efficace | Notre application |
| --- | --- | --- |
| Filtres à compteurs | Le client ne clique jamais vers un résultat vide | `catalog_search` renvoie les facettes avec la page, comptées sur l'ensemble filtré |
| Grille dense, marges minces | Le vêtement occupe l'écran, pas le châssis | 2 colonnes mobile, 4 desktop, gouttières de 12 à 24 px |
| Second visuel au survol | Voir la coupe de dos sans ouvrir la fiche | Fondu enchaîné sur `ProductCard`, seule animation de la carte |
| Fiche produit en colonne fixe | Le prix et l'ajout restent visibles pendant que la galerie défile | Panneau `sticky` à partir de `lg` |
| Recherche en surcouche | Aucune perte de contexte | Panneau plein largeur, résultats instantanés débouncés |
| Tri natif | Le contrôle que chaque téléphone sait afficher | `<select>` natif, pas de menu maison |
| État dans l'URL | Un filtre survit au rechargement et au partage | Toute la vue tient dans la query string |

**Ce que nous ne reprenons pas :** la densité promotionnelle, les bandeaux
multiples, le rythme de nouveautés hebdomadaire. BOBO PARIS vend 25 pièces en
séries de 2 à 10 exemplaires. Copier la logique de volume de Zara détruirait la
proposition de valeur.

---

## 3. BOBOCHIC — la synthèse retenue

**DÉCISION.** Le principe directeur : *l'efficacité marchande de Zara, appliquée
à une maison qui vend la rareté.*

### Ce que nous gardons de BOBO PARIS

L'univers. Le vocabulaire (capsule, pièce unique, atelier, upcycling). Le
prénom donné à chaque modèle — Camille, Gauthier, Jeanne, Adam. Les collections
comme unité narrative. La fabrication comme argument, affichée sur chaque fiche.

### Ce que nous prenons de la grande distribution mode

La vitesse. Les facettes comptées. L'URL comme état. Le panier qui ne ment
jamais sur la disponibilité. Le tunnel d'achat en une page.

### Ce que nous ajoutons

| Apport | Raison |
| --- | --- |
| Stock réel affiché | « Il ne reste que 2 pièces » transforme une contrainte de production en argument de vente |
| Réservation à la commande | Deux clients ne peuvent pas acheter la dernière pièce |
| Règles commerciales en base | Les seuils de livraison cessent de se contredire |
| Badge « Pièce unique » | La rareté devient visible dans la grille, pas seulement dans un texte |
| Page Archives | Les pièces uniques ont leur vitrine |

### Direction artistique

| Axe | Choix | Pourquoi |
| --- | --- | --- |
| Fond | Papier chaud `#faf8f5` | Le blanc pur écrase les tons naturels des tissus revalorisés |
| Encre | `#16130f` | Contraste AAA sans dureté |
| Accent | Terracotta `#9c4a29` | Emprunté au coloris maison ; réservé aux prix réduits, donc jamais du bruit |
| Titrage | Cormorant Garamond | Serif éditorial parisien, forte différence de graisse |
| Interface | Jost | Géométrique, lisible en capitales interlettrées |
| Angles | Aucun arrondi | Le papier et le tissu n'ont pas de coins arrondis |
| Ombres | Aucune | La hiérarchie vient de l'espace et du filet, pas de l'élévation |
| Mouvement | 350 à 900 ms, `cubic-bezier(0.22, 1, 0.36, 1)` | Rien ne rebondit |

---

## 4. Sources

Consultées en septembre 2026 :

- `boboparis.com` — accueil, `/collections`, `/collections/all`,
  `/collections/homme`, `/pages/nos-engagements`, fiches produit
- `zara.com/fr` — principes d'ergonomie uniquement

Les prix, noms de modèles, coloris et engagements repris dans
`data/seed/products.mjs` proviennent de ces pages. Les produits dont le prix
n'a pas pu être vérifié sont **absents du seed** plutôt qu'inventés.
