/**
 * Category tree.
 *
 * Mirrors the public BOBO PARIS navigation (Femme / Homme, then garment type).
 * Slugs are the URLs the storefront exposes: /femme/manteaux-et-vestes.
 */
export const categories = [
  { slug: 'femme', name: 'Femme', audience: 'femme', position: 1, parent: null },
  { slug: 'homme', name: 'Homme', audience: 'homme', position: 2, parent: null },
  { slug: 'accessoires', name: 'Accessoires', audience: null, position: 3, parent: null },

  { slug: 'manteaux-et-vestes', name: 'Manteaux & Vestes', audience: 'femme', position: 1, parent: 'femme' },
  { slug: 'chemises', name: 'Chemises', audience: 'femme', position: 2, parent: 'femme' },
  { slug: 'robes', name: 'Robes', audience: 'femme', position: 3, parent: 'femme' },
  { slug: 'combinaisons', name: 'Combinaisons', audience: 'femme', position: 4, parent: 'femme' },
  { slug: 'gilets', name: 'Gilets', audience: 'femme', position: 5, parent: 'femme' },
  { slug: 'bas', name: 'Bas', audience: 'femme', position: 6, parent: 'femme' },

  { slug: 'manteaux-et-vestes-homme', name: 'Manteaux & Vestes', audience: 'homme', position: 1, parent: 'homme' },
  { slug: 'chemises-homme', name: 'Chemises', audience: 'homme', position: 2, parent: 'homme' },
  { slug: 'gilets-homme', name: 'Gilets', audience: 'homme', position: 3, parent: 'homme' },

  { slug: 'sacs', name: 'Sacs', audience: null, position: 1, parent: 'accessoires' },
  { slug: 'chapeaux', name: 'Chapeaux', audience: null, position: 2, parent: 'accessoires' },
];
