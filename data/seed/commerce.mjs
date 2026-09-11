/**
 * Commercial rules.
 *
 * CONFIRMED from boboparis.com (September 2026) — and note the discrepancy:
 * the homepage states free shipping in metropolitan France from 200 €, and
 * international from 350 €; a product page states 150 €; a third block states
 * France/Belgium/Luxembourg plus Europe from 300 €. The three do not agree.
 *
 * We seed the homepage figures because they are the most prominent, and every
 * threshold lives in the database precisely so the real numbers can be set
 * from /admin/settings without touching code.
 */
export const shippingMethods = [
  {
    code: 'fr-standard',
    name: 'France métropolitaine',
    description: 'Colissimo suivi, remis en 2 à 4 jours ouvrés.',
    countryCodes: ['FR'],
    priceCents: 690,
    freeAboveCents: 20000,
    minDays: 2,
    maxDays: 4,
    position: 1,
  },
  {
    code: 'eu-standard',
    name: 'Union européenne',
    description: 'Livraison suivie en 3 à 6 jours ouvrés.',
    countryCodes: ['BE', 'LU', 'DE', 'ES', 'IT', 'NL', 'PT'],
    priceCents: 1200,
    freeAboveCents: 35000,
    minDays: 3,
    maxDays: 6,
    position: 2,
  },
  {
    code: 'world-standard',
    name: 'International',
    description: 'Livraison suivie en 5 à 10 jours ouvrés. Droits de douane à votre charge.',
    countryCodes: [],
    priceCents: 2400,
    freeAboveCents: 35000,
    minDays: 5,
    maxDays: 10,
    position: 3,
  },
];

/**
 * Seed discount. Inactive on purpose: a live code is a commercial decision,
 * not something a seed script should make. Activate it from /admin.
 */
export const discounts = [
  {
    name: 'Bienvenue — 10 %',
    kind: 'percentage',
    value: 10,
    minSubtotalCents: 10000,
    isActive: false,
    codes: ['BIENVENUE10'],
  },
];

/** Confirmed from boboparis.com: the five commitments shown on the homepage. */
export const settings = [
  {
    key: 'announcement',
    description:
      'Bandeau haut de page. Mettre enabled à false pour le masquer. ' +
      "Le jeton {seuil_franco} est remplacé par le seuil de franco réellement appliqué, " +
      'pour que le bandeau ne puisse pas annoncer un seuil que le paiement ne pratique pas.',
    value: {
      enabled: true,
      message: "Livraison offerte dès {seuil_franco} d'achat en France métropolitaine",
      href: '/engagements',
    },
  },
  {
    key: 'commitments',
    description: 'Bloc « Nos engagements », repris de la page d\'accueil BOBO PARIS.',
    value: [
      {
        title: 'Livraison offerte',
        body: "En France métropolitaine dès 200 € d'achat. À l'international à partir de 350 € d'achat.",
      },
      {
        title: 'Packagings recyclés',
        body: 'Tous nos packagings sont recyclés, recyclables et fabriqués en France.',
      },
      {
        title: 'Matières recyclées',
        body: "Nos tissus sont issus de la revalorisation textile. Toutes nos pièces sont conçues à partir de matières déjà existantes.",
      },
      {
        title: 'Fabrication éthique',
        body: 'Collections produites en petites séries dans des ateliers audités en France et au Maroc.',
      },
      {
        title: 'Paiement sécurisé',
        body: 'Carte bancaire, Visa, Mastercard.',
      },
    ],
  },
  {
    key: 'contact',
    description: 'Coordonnées affichées sur les pages de service.',
    value: {
      email: 'contact@boboparis.com',
      city: 'Paris',
      country: 'France',
    },
  },
];
