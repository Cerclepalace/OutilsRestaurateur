/**
 * BOBO PARIS catalogue seed.
 *
 * PROVENANCE — read before changing anything here.
 *
 *   CONFIRMED (read from boboparis.com in September 2026):
 *     - product names and model names
 *     - prices and struck-through "compare at" prices, in cents
 *     - colourway names and the size runs offered (XS–XL, TU)
 *     - the opening line of each description
 *     - brand-level facts: 100 % revalorised textile, small series,
 *       workshops in Paris and Casablanca
 *
 *   SEED COPY (written for this build, replace from /admin/products):
 *     - the second half of each description
 *     - composition, care guide, size guides
 *     - colour hex values (display swatches only)
 *
 *   PLACEHOLDER (not real data):
 *     - `stock` — nominal opening quantities so the shop is operable.
 *       Replace with the real inventory before going live.
 *
 * Products whose price could not be verified are deliberately absent rather
 * than invented.
 */
import { COLORS } from './colors.mjs';

const CARE =
  "Lavage à 30 °C sur l'envers, cycle délicat. Séchage à l'air libre. Repassage doux. Pas de sèche-linge : la matière étant déjà revalorisée, elle mérite d'être ménagée.";

const COMPOSITION_COTTON = 'Tissu 100 % issu de la revalorisation textile. Base coton.';
const COMPOSITION_DENIM = 'Denim 100 % issu de la revalorisation textile.';
const COMPOSITION_WOOL = 'Tissu 100 % issu de la revalorisation textile. Base laine.';

const PARIS = 'Confectionné dans notre atelier parisien, en très petite série.';
const CASABLANCA =
  "Confectionné à Casablanca, dans un atelier familial à taille humaine, en très petite série.";

/** Standard shirt/jacket grading used across the catalogue. */
const SIZE_GUIDE_TOPS = {
  unit: 'cm',
  columns: ['XS', 'S', 'M', 'L', 'XL'],
  rows: [
    { label: 'Épaules', values: [40, 42, 44, 46, 48] },
    { label: 'Poitrine', values: [92, 98, 104, 110, 116] },
    { label: 'Longueur dos', values: [64, 66, 68, 70, 72] },
  ],
  note: "Nos volumes sont amples et non genrés. En cas d'hésitation entre deux tailles, prenez la plus petite.",
};

const SIZE_GUIDE_BOTTOMS = {
  unit: 'cm',
  columns: ['XS', 'S', 'M', 'L', 'XL'],
  rows: [
    { label: 'Taille', values: [64, 68, 72, 76, 80] },
    { label: 'Hanches', values: [90, 94, 98, 102, 106] },
    { label: 'Entrejambe', values: [76, 77, 78, 79, 80] },
  ],
  note: 'Coupe montante. Mesures prises à plat, doublées.',
};

const APPAREL = ['XS', 'S', 'M', 'L'];
const APPAREL_XL = ['XS', 'S', 'M', 'L', 'XL'];
const ONE_SIZE = ['TU'];

const c = (name) => ({ name, hex: COLORS[name] ?? '#c9c1b4' });

export const products = [
  // ---------------------------------------------------------------- Vestes
  {
    slug: 'veste-col-montant-camille',
    name: 'Veste col montant - Camille',
    modelName: 'Camille',
    audience: 'femme',
    category: 'manteaux-et-vestes',
    collections: ['les-jours-chauds', 'late-for-work'],
    isNew: true,
    priceCents: 21900,
    compareAtPriceCents: null,
    description:
      "La veste à col montant Camille est la 1ère pièce issue d'une collaboration entre BOBO PARIS et l'atelier. Un col qui se porte relevé ou ouvert, des épaules nettes et un volume droit qui se superpose sur une chemise comme sur une robe.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL,
    colors: [c('Beige')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 4,
  },
  {
    slug: 'veste-en-jean-gauthier',
    name: 'Veste en jean - Gauthier',
    modelName: 'Gauthier',
    audience: 'unisexe',
    category: 'manteaux-et-vestes-homme',
    collections: ['l-heritage-bleu', 'late-for-work'],
    priceCents: 19900,
    compareAtPriceCents: 21900,
    description:
      "Fabriquée à Casablanca dans un atelier à taille humaine, la veste Gauthier reprend la coupe trucker classique dans un denim déjà vécu. Boutonnage métal, poches poitrine, volume légèrement oversize.",
    composition: COMPOSITION_DENIM,
    manufacturing: CASABLANCA,
    originCountry: 'Maroc',
    sizes: APPAREL_XL,
    colors: [c('Bleu'), c('Lilas'), c('Marron')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 3,
  },
  {
    slug: 'blouson-court-adam',
    name: 'Blouson court - Adam',
    modelName: 'Adam',
    audience: 'unisexe',
    category: 'manteaux-et-vestes-homme',
    collections: ['equinoxe-d-automne', 'late-for-work'],
    isNew: true,
    priceCents: 26900,
    compareAtPriceCents: 32900,
    description:
      "Le blouson Adam est un blouson court inspiré des barn jackets américains. Coupe raccourcie, poches plaquées, col chemise. Il se ferme jusqu'en haut ou s'ouvre sur une maille.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL_XL,
    colors: [c('Noir'), c('Vert')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 3,
  },
  {
    slug: 'blouson-adam',
    name: 'Blouson - Adam',
    modelName: 'Adam',
    audience: 'unisexe',
    category: 'manteaux-et-vestes-homme',
    collections: ['equinoxe-d-automne'],
    priceCents: 24500,
    compareAtPriceCents: 32900,
    description:
      "Le blouson Adam est un blouson court inspiré des barn jackets américains, ici décliné dans cinq tissus récupérés. Chaque coloris est produit en quantité très limitée.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL_XL,
    colors: [c('Marron'), c('Vert'), c('Taupe'), c('Bordeaux'), c('Terracotta')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 2,
  },

  // -------------------------------------------------------------- Chemises
  {
    slug: 'chemise-unisexe-noa',
    name: 'Chemise bicolore unisexe - Noa',
    modelName: 'Noa',
    audience: 'unisexe',
    category: 'chemises-homme',
    collections: ['late-for-work', 'jardin-d-ete'],
    isNew: true,
    priceCents: 13000,
    compareAtPriceCents: null,
    description:
      "La chemise à manches courtes unisexe Noa s'inspire de l'univers utilitaire, avec ses multiples poches plaquées et son assemblage bicolore. Deux tissus, une seule pièce.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL_XL,
    colors: [c('Vert clair')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 5,
  },
  {
    slug: 'chemise-col-montant-aya',
    name: 'Chemise col montant - Aya',
    modelName: 'Aya',
    audience: 'femme',
    category: 'chemises',
    collections: ['les-jours-chauds'],
    priceCents: 11000,
    compareAtPriceCents: 13000,
    description:
      "Dotée d'un col montant qui se porte aussi bien relevé qu'ouvert, la chemise Aya joue sur un volume ample et des manches longues légèrement blousantes.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL,
    colors: [c('Bleu'), c('Blanc')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 4,
  },
  {
    slug: 'chemise-2-en-1-bleue-andrea',
    name: 'Chemise 2 en 1 bleue - Andréa',
    modelName: 'Andréa',
    audience: 'femme',
    category: 'chemises',
    collections: ['mix-and-match', 'l-heritage-bleu'],
    priceCents: 11000,
    compareAtPriceCents: 14000,
    description:
      "Andréa, c'est la chemise qui s'adapte à vous. Bicolore et réversible dans son intention, elle se porte fermée en chemise ou ouverte en surchemise légère.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL,
    colors: [c('Bleu')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 3,
  },

  // ----------------------------------------------------------------- Robes
  {
    slug: 'robe-a-nouer-jaune-jeanne',
    name: 'Robe à nouer jaune - Jeanne',
    modelName: 'Jeanne',
    audience: 'femme',
    category: 'robes',
    collections: ['les-jours-chauds', 'songe-d-ete'],
    isNew: true,
    priceCents: 16900,
    compareAtPriceCents: null,
    description:
      "Véritable pièce de l'été, la robe à nouer Jeanne revisite la robe chemise dans une version à ceinture nouée. Le lien se serre à la taille ou se laisse tomber pour un volume droit.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL,
    colors: [c('Jaune')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 3,
  },
  {
    slug: 'robe-a-nouer-bleue-jeanne',
    name: 'Robe à nouer et à rayures bleues - Jeanne',
    modelName: 'Jeanne',
    audience: 'femme',
    category: 'robes',
    collections: ['les-jours-chauds', 'jardin-d-ete'],
    isNew: true,
    priceCents: 16900,
    compareAtPriceCents: null,
    description:
      "Véritable pièce de l'été, la robe à nouer Jeanne revisite la robe chemise dans une version rayée. La rayure bleue provient d'un tissu de chemiserie remis en circulation.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL,
    colors: [c('Bleu')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 3,
  },
  {
    slug: 'robe-en-denim-chloe',
    name: 'Robe en denim - Chloé',
    modelName: 'Chloé',
    audience: 'femme',
    category: 'robes',
    collections: ['l-heritage-bleu'],
    priceCents: 13900,
    compareAtPriceCents: 15900,
    description:
      "Notre toute première robe en denim Bobo Paris. Cette robe chasuble se porte seule en été ou sur un col roulé quand la saison tourne.",
    composition: COMPOSITION_DENIM,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL,
    colors: [c('Bleu')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 2,
  },
  {
    slug: 'robe-en-velours-cotele-kina',
    name: 'Robe en velours côtelé - Kina',
    modelName: 'Kina',
    audience: 'femme',
    category: 'robes',
    collections: ['equinoxe-d-automne'],
    priceCents: 11900,
    compareAtPriceCents: 16500,
    description:
      "Notre toute première robe en velours côtelé Bobo Paris. Cette robe chasuble tombe droit, avec deux poches profondes et des bretelles réglables.",
    composition: 'Velours côtelé 100 % issu de la revalorisation textile.',
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL,
    colors: [c('Marron')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 2,
  },

  // ---------------------------------------------------------- Combinaisons
  {
    slug: 'combinaison-claudia',
    name: 'Combinaison - Claudia',
    modelName: 'Claudia',
    audience: 'femme',
    category: 'combinaisons',
    collections: ['late-for-work'],
    priceCents: 32000,
    compareAtPriceCents: null,
    description:
      "Combinaison Claudia à inspiration trench. Coupe légèrement ample et jambe évasée. Ceinture à nouer, col tailleur, poches passepoilées.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL,
    colors: [c('Beige')],
    sizeGuide: SIZE_GUIDE_BOTTOMS,
    stock: 2,
  },

  // ---------------------------------------------------------------- Gilets
  {
    slug: 'gilet-a-rayures-colette',
    name: 'Gilet à rayures - Colette',
    modelName: 'Colette',
    audience: 'femme',
    category: 'gilets',
    collections: ['jardin-d-ete', 'late-for-work'],
    isNew: true,
    priceCents: 13500,
    compareAtPriceCents: null,
    description:
      "Le gilet Colette à rayures rouges et blanches s'inspire de l'univers utilitaire, réinterprété dans une coupe courte et boutonnée. Il se porte sur une chemise ou à même la peau.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL,
    colors: [c('Rayé')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 4,
  },
  {
    slug: 'gilet-denim-unisexe',
    name: 'Gilet denim unisexe',
    modelName: 'Denim',
    audience: 'unisexe',
    category: 'gilets-homme',
    collections: ['l-heritage-bleu'],
    priceCents: 7500,
    compareAtPriceCents: 13500,
    description:
      "Gilet long qui ira aussi bien aux femmes qu'aux hommes. Tissu recyclé, coupe droite sans manches, se superpose sur une chemise comme sur un pull fin.",
    composition: COMPOSITION_DENIM,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL_XL,
    colors: [c('Beige'), c('Vert'), c('Lilas')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 4,
  },
  {
    slug: 'gilet-en-laine-unisexe-ezra',
    name: 'Gilet en laine unisexe - Ezra',
    modelName: 'Ezra',
    audience: 'unisexe',
    category: 'gilets-homme',
    collections: ['equinoxe-d-automne'],
    priceCents: 7500,
    compareAtPriceCents: 13500,
    description:
      "Gilet long qui ira aussi bien aux femmes qu'aux hommes. Tissu recyclé en base laine, chaud sans être épais.",
    composition: COMPOSITION_WOOL,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL_XL,
    colors: [c('Taupe')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 3,
  },
  {
    slug: 'gilet-en-tweed-unisexe-oliver',
    name: 'Gilet en tweed unisexe - Oliver',
    modelName: 'Oliver',
    audience: 'unisexe',
    category: 'gilets-homme',
    collections: ['equinoxe-d-automne'],
    priceCents: 8000,
    compareAtPriceCents: 13500,
    description:
      "Gilet long qui ira aussi bien aux femmes qu'aux hommes. Tissu recyclé en tweed, chiné, avec une tenue franche.",
    composition: 'Tweed 100 % issu de la revalorisation textile.',
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL_XL,
    colors: [c('Marron')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 3,
  },
  {
    slug: 'gilet-en-velours-cotele-bobby',
    name: 'Gilet en velours côtelé - Bobby',
    modelName: 'Bobby',
    audience: 'unisexe',
    category: 'gilets-homme',
    collections: ['equinoxe-d-automne'],
    priceCents: 7500,
    compareAtPriceCents: 14500,
    description:
      "Gilet long qui ira aussi bien aux femmes qu'aux hommes. Tissu upcyclé en velours côtelé, côtes larges.",
    composition: 'Velours côtelé 100 % issu de la revalorisation textile.',
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL_XL,
    colors: [c('Bordeaux')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 3,
  },
  {
    slug: 'gilet-gueliz',
    name: 'Gilet sans manches - Guéliz',
    modelName: 'Guéliz',
    audience: 'femme',
    category: 'gilets',
    collections: ['l-echappee-belle-a-casablanca'],
    priceCents: 9900,
    compareAtPriceCents: 14900,
    description:
      "Le gilet Guéliz s'inspire du vestiaire masculin, revisité dans une coupe sans manches et un boutonnage haut. Porté ouvert, il structure une silhouette fluide.",
    composition: COMPOSITION_COTTON,
    manufacturing: CASABLANCA,
    originCountry: 'Maroc',
    sizes: APPAREL,
    colors: [c('Terracotta')],
    sizeGuide: SIZE_GUIDE_TOPS,
    stock: 3,
  },

  // ------------------------------------------------------------------- Bas
  {
    slug: 'pantalon-bourgogne',
    name: 'Pantalon - Bourgogne',
    modelName: 'Bourgogne',
    audience: 'femme',
    category: 'bas',
    collections: ['l-heritage-bleu', 'back-to-school'],
    priceCents: 15500,
    compareAtPriceCents: null,
    description:
      "Le jean Bourgogne revisite le denim classique avec une touche moderne et une coupe droite légèrement montante. Cinq poches, ourlet brut.",
    composition: COMPOSITION_DENIM,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: APPAREL_XL,
    colors: [c('Bordeaux')],
    sizeGuide: SIZE_GUIDE_BOTTOMS,
    stock: 3,
  },
  {
    slug: 'pantalon-patchwork-sacha',
    name: 'Pantalon patchwork - Sacha',
    modelName: 'Sacha',
    audience: 'unisexe',
    category: 'bas',
    collections: ['l-heritage-bleu'],
    isOneOfAKind: true,
    priceCents: 36900,
    compareAtPriceCents: null,
    description:
      "Le jean Sacha revisite le denim avec une coupe droite moderne, assemblée à la main à partir de plusieurs jeans. Chaque pièce est unique : les panneaux, les délavages et les surpiqûres ne se répètent jamais.",
    composition: COMPOSITION_DENIM,
    manufacturing:
      "Pièce unique, entièrement assemblée à la main dans notre atelier parisien.",
    originCountry: 'France',
    sizes: ['M'],
    colors: [c('Multicolore')],
    sizeGuide: SIZE_GUIDE_BOTTOMS,
    stock: 1,
  },

  // ----------------------------------------------------------- Accessoires
  {
    slug: 'bob-oasis',
    name: 'Bob - Oasis',
    modelName: 'Oasis',
    audience: 'unisexe',
    category: 'chapeaux',
    collections: ['les-jours-chauds', 'l-echappee-belle-a-casablanca'],
    priceCents: 2900,
    compareAtPriceCents: 4900,
    description:
      "Bob bicolore Oasis. Le bob est unisexe, il ira aussi bien aux hommes qu'aux femmes. Bord souple, deux tissus assemblés.",
    composition: COMPOSITION_COTTON,
    manufacturing: CASABLANCA,
    originCountry: 'Maroc',
    sizes: ONE_SIZE,
    colors: [c('Bleu'), c('Marron'), c('Lilas')],
    sizeGuide: null,
    stock: 8,
  },
  {
    slug: 'sac-bobo-paris',
    name: 'Sac - Bobo',
    modelName: 'Bobo',
    audience: 'unisexe',
    category: 'sacs',
    collections: ['les-jours-chauds'],
    priceCents: 3900,
    compareAtPriceCents: 4900,
    description:
      "Nos sacs super pratiques pour un look décontracté. Ils sont faits en chutes de tissu de nos collections : le sac naît de ce que la coupe laisse derrière elle.",
    composition: 'Chutes de tissu de nos collections, 100 % revalorisées.',
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: ONE_SIZE,
    colors: [c('Lilas'), c('Vert clair')],
    sizeGuide: null,
    stock: 10,
  },
  {
    slug: 'sac-a-nouer-a-rayures-sasha',
    name: 'Sac à nouer à rayures - Sasha',
    modelName: 'Sasha',
    audience: 'unisexe',
    category: 'sacs',
    collections: ['jardin-d-ete'],
    isNew: true,
    priceCents: 9000,
    compareAtPriceCents: null,
    description:
      "Le sac Sasha, proposé en taille unique avec une bandoulière à nouer, offre plusieurs façons de se porter : à l'épaule, en bandoulière courte, ou à la main.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: ONE_SIZE,
    colors: [c('Rayé')],
    sizeGuide: null,
    stock: 6,
  },
  {
    slug: 'sasha-sac-a-nouer-a-rayures-bleues',
    name: 'Sac à nouer à rayures bleues - Sasha',
    modelName: 'Sasha',
    audience: 'unisexe',
    category: 'sacs',
    collections: ['jardin-d-ete', 'l-heritage-bleu'],
    isNew: true,
    priceCents: 9000,
    compareAtPriceCents: null,
    description:
      "Le sac Sasha en rayures bleues, taille unique, bandoulière à nouer. Plusieurs longueurs de port selon le nœud.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: ONE_SIZE,
    colors: [c('Bleu')],
    sizeGuide: null,
    stock: 6,
  },
  {
    slug: 'sac-a-nouer-bicolore-sasha',
    name: 'Sac à nouer bicolore - Sasha',
    modelName: 'Sasha',
    audience: 'unisexe',
    category: 'sacs',
    collections: ['jardin-d-ete', 'mix-and-match'],
    isNew: true,
    priceCents: 9000,
    compareAtPriceCents: null,
    description:
      "Le sac Sasha bicolore, taille unique, bandoulière à nouer. Deux tissus assemblés, jamais tout à fait les mêmes d'un exemplaire à l'autre.",
    composition: COMPOSITION_COTTON,
    manufacturing: PARIS,
    originCountry: 'France',
    sizes: ONE_SIZE,
    colors: [c('Vert'), c('Beige')],
    sizeGuide: null,
    stock: 6,
  },
].map((product, index) => ({
  careGuide: CARE,
  isNew: false,
  isOneOfAKind: false,
  position: index + 1,
  ...product,
}));

/** Expands colours × sizes into the sellable variants, with stable SKUs. */
export function expandVariants(product) {
  const prefix = product.slug
    .split('-')
    .map((part) => part.slice(0, 3).toUpperCase())
    .join('')
    .slice(0, 9);

  const variants = [];
  let position = 0;

  for (const color of product.colors) {
    for (const size of product.sizes) {
      variants.push({
        sku: `${prefix}-${slugToken(color.name)}-${size}`,
        size,
        colorName: color.name,
        colorHex: color.hex,
        position: position++,
        stock: product.stock,
      });
    }
  }

  return variants;
}

function slugToken(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}
