/**
 * Header and footer navigation.
 *
 * Structure taken from the public BOBO PARIS site. Because this lives in the
 * database, merchandising can add a column or reorder entries from /admin
 * without a deploy.
 */
export const headerNavigation = [
  {
    label: 'Boutique',
    href: '/boutique',
    children: [
      { label: 'Toute la boutique', href: '/boutique', column: 'Explorer' },
      { label: 'Nouveautés', href: '/boutique?is_new=1', column: 'Explorer' },
      { label: 'Promotions', href: '/boutique?on_sale=1', column: 'Explorer' },
      { label: 'Pièces uniques', href: '/archives', column: 'Explorer' },
    ],
  },
  {
    label: 'Femme',
    href: '/femme',
    image: '/media/editorial/femme.webp',
    children: [
      { label: 'Tout le vestiaire', href: '/femme', column: 'Catégories' },
      { label: 'Manteaux & Vestes', href: '/femme/manteaux-et-vestes', column: 'Catégories' },
      { label: 'Chemises', href: '/femme/chemises', column: 'Catégories' },
      { label: 'Robes', href: '/femme/robes', column: 'Catégories' },
      { label: 'Combinaisons', href: '/femme/combinaisons', column: 'Catégories' },
      { label: 'Gilets', href: '/femme/gilets', column: 'Catégories' },
      { label: 'Bas', href: '/femme/bas', column: 'Catégories' },
      { label: 'Les Jours Chauds', href: '/collections/les-jours-chauds', column: 'Collections' },
      { label: "L'Héritage Bleu", href: '/collections/l-heritage-bleu', column: 'Collections' },
      { label: 'Late For Work', href: '/collections/late-for-work', column: 'Collections' },
    ],
  },
  {
    label: 'Homme',
    href: '/homme',
    image: '/media/editorial/homme.webp',
    children: [
      { label: 'Tout le vestiaire', href: '/homme', column: 'Catégories' },
      { label: 'Manteaux & Vestes', href: '/homme/manteaux-et-vestes-homme', column: 'Catégories' },
      { label: 'Chemises', href: '/homme/chemises-homme', column: 'Catégories' },
      { label: 'Gilets', href: '/homme/gilets-homme', column: 'Catégories' },
      { label: 'Late For Work', href: '/collections/late-for-work', column: 'Collections' },
      { label: "L'Héritage Bleu", href: '/collections/l-heritage-bleu', column: 'Collections' },
    ],
  },
  {
    label: 'Collections',
    href: '/collections',
    children: [
      { label: 'Toutes les collections', href: '/collections', column: 'Capsules' },
      { label: 'Les Jours Chauds', href: '/collections/les-jours-chauds', column: 'Capsules' },
      { label: 'Late For Work', href: '/collections/late-for-work', column: 'Capsules' },
      { label: "L'Héritage Bleu", href: '/collections/l-heritage-bleu', column: 'Capsules' },
      { label: "Équinoxe d'Automne", href: '/collections/equinoxe-d-automne', column: 'Capsules' },
      { label: "L'Échappée Belle à Casablanca", href: '/collections/l-echappee-belle-a-casablanca', column: 'Capsules' },
    ],
  },
  { label: 'Le Studio', href: '/studio', children: [] },
  { label: 'Archives', href: '/archives', children: [] },
];

export const footerNavigation = [
  {
    label: 'La maison',
    children: [
      { label: 'Qui sommes-nous', href: '/qui-sommes-nous' },
      { label: 'Nos engagements', href: '/engagements' },
      { label: 'Le Studio', href: '/studio' },
      { label: 'Archives', href: '/archives' },
      { label: 'Le Journal', href: '/journal' },
    ],
  },
  {
    label: 'Boutique',
    children: [
      { label: 'Femme', href: '/femme' },
      { label: 'Homme', href: '/homme' },
      { label: 'Collections', href: '/collections' },
      { label: 'Nouveautés', href: '/boutique?is_new=1' },
      { label: 'Promotions', href: '/boutique?on_sale=1' },
    ],
  },
  {
    label: 'Aide',
    children: [
      { label: 'Mon compte', href: '/account' },
      { label: 'Suivre ma commande', href: '/order/track' },
      { label: 'Liste de souhaits', href: '/wishlist' },
      { label: 'Livraison & retours', href: '/livraison-et-retours' },
      { label: 'Guide des tailles', href: '/guide-des-tailles' },
    ],
  },
];
