# Design system — BOBOCHIC

Tout tient dans `src/app/globals.css`, en tokens Tailwind v4. Aucune valeur
arbitraire dans les composants : si une mesure revient deux fois, elle devient
un token.

## Le principe

Le luxe vient de l'espace, de la typographie et du rythme. Pas de l'ombre, pas
du dégradé, pas de l'arrondi. Chaque fois qu'un effet a été envisagé, la
question posée était : *est-ce que ça montre le vêtement, ou est-ce que ça
décore la page ?*

## Couleur

| Token | Valeur | Usage |
| --- | --- | --- |
| `paper` | `#faf8f5` | Fond général — papier chaud, pas blanc |
| `paper-deep` | `#f2eee8` | Sections alternées, fonds d'images |
| `paper-warm` | `#ece6dd` | Bandeaux, vides |
| `ink` | `#16130f` | Texte principal, boutons |
| `ink-soft` | `#4a443c` | Texte courant |
| `ink-muted` | `#8a8278` | Métadonnées, compteurs |
| `line` | `#ded7cc` | Filets |
| `line-strong` | `#c4bcae` | Champs de formulaire |
| `clay` | `#9c4a29` | **Prix réduits uniquement** |
| `success` / `danger` | `#3f6b4b` / `#9b2c1f` | États de formulaire |

Le blanc pur écrase les tons naturels des tissus revalorisés ; le noir pur
durcit la page. D'où le papier et l'encre.

Le terracotta est emprunté à un coloris de la maison. Il est réservé aux prix
réduits et aux alertes de stock — un accent utilisé partout n'est plus un
accent, c'est du bruit.

Contraste : `ink` sur `paper` donne 15,8:1, `ink-soft` 8,9:1, `ink-muted` 4,6:1.
Tous au-dessus d'AA ; les deux premiers au-dessus d'AAA.

## Typographie

Deux familles, deux rôles.

**Cormorant Garamond** — titrage. Serif à forte modulation, d'esprit parisien.
Utilisée par `.bobo-display`, jamais en dessous de 1,3 rem.

**Jost** — interface. Géométrique, excellente en capitales interlettrées, lisible
à 11 px. Navigation, boutons, corps de texte.

Échelle fluide, pour qu'un titre ne casse jamais à 390 px :

| Token | `clamp()` |
| --- | --- |
| `display-xl` | `2.75rem → 6.5rem` |
| `display-lg` | `2.25rem → 4.25rem` |
| `display-md` | `1.75rem → 2.75rem` |
| `display-sm` | `1.375rem → 1.875rem` |

`.bobo-eyebrow` : 11 px, interlettrage 0,18 em, capitales. C'est le label de
toute l'interface — navigation, métadonnées, libellés de champ. Un seul style
pour un seul rôle.

## Rythme

| Token | Valeur |
| --- | --- |
| `spacing-section` | `clamp(4rem, 9vw, 8.5rem)` |
| `spacing-section-sm` | `clamp(2.5rem, 5vw, 4.5rem)` |
| `spacing-gutter` | `clamp(1rem, 4vw, 3.5rem)` |

`.bobo-container` porte la gouttière **une seule fois**. Aucun composant ne
redéfinit sa marge latérale : c'est ce qui garantit l'alignement vertical de
toutes les pages, et l'absence de débordement horizontal.

## Composants

### Boutons

Carrés, hauteur 3 rem, libellé en capitales 11 px interlettré 0,16 em.

- `.bobo-btn-primary` — encre pleine, s'inverse au survol
- `.bobo-btn-outline` — filet, se remplit au survol
- `.bobo-btn-ghost` — secondaire, 2,5 rem

Aucun rayon : le papier et le tissu n'ont pas de coins arrondis.

### Liens

`.bobo-link` trace son filet depuis la gauche en 450 ms. C'est l'interaction
signature du site. `.bobo-link-static` part souligné et s'efface — pour les liens
déjà visibles comme tels.

### Champs

Un filet de base, pas de boîte. Plus léger, et cohérent avec les filets
éditoriaux. Le focus passe le filet à l'encre ; `aria-invalid` le passe au rouge.

### Médias

`.bobo-media` fixe le ratio 3:4 de la photographie de mode. Toutes les images
produit passent par lui, donc **aucun décalage de mise en page** au chargement.

## Mouvement

Une seule courbe : `cubic-bezier(0.22, 1, 0.36, 1)`. Départ franc, arrivée
posée. Rien ne rebondit.

| Durée | Usage |
| --- | --- |
| 300–450 ms | Survols, filets |
| 500 ms | Tiroirs, surcouches |
| 700–900 ms | Fondus d'image, zooms lents |

`prefers-reduced-motion` est honoré globalement, une fois, dans `globals.css` —
pas composant par composant.

## Accessibilité

- Focus visible partout, uniquement au clavier (`:focus-visible`)
- Lien d'évitement en première tabulation
- Tiroirs et surcouches : `role="dialog"`, `aria-modal`, piège de focus,
  restitution du focus à la fermeture, Échap
- Zones tactiles de 44 px minimum sur mobile
- Les icônes seules portent un `aria-label` ; les décoratives sont `aria-hidden`
- `aria-live` sur les compteurs de résultats et les quantités de panier

## Pièges connus

**Les capitales CSS changent le nom accessible.** `.bobo-eyebrow` applique
`text-transform: uppercase`, et Chromium en tient compte dans le calcul du nom
accessible : un bouton « Taille » s'annonce « TAILLE ». Les sélecteurs de test
doivent donc être insensibles à la casse.

**Le tiroir et la page partagent des formulations.** « Votre panier est vide »
apparaît dans les deux. Cibler le rôle (`heading`) plutôt que le texte seul.
