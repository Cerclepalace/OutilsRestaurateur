/**
 * CMS pages.
 *
 * The homepage is assembled from typed sections, each editable from
 * /admin/pages. Brand copy marked CONFIRMED is quoted from boboparis.com; the
 * rest is seed copy for this build.
 */

const CONFIRMED_BRAND =
  "Bobo Paris est une marque écoresponsable fondée à Paris en 2021, qui réinvente des essentiels revisités avec originalité. Inspirée du vintage et du workwear, chaque pièce combine une esthétique moderne avec les codes du passé.";

const CONFIRMED_SOURCING =
  "Confectionnée à partir de stocks dormants de maisons de luxe et de vêtements de seconde main, la marque présente des collections capsules en éditions limitées et des pièces uniques.";

const CONFIRMED_SIGNATURE =
  "Avec des coupes sobres, des volumes oversize et des jeux de matières, Bobo Paris crée un vestiaire fonctionnel, responsable et confortable, porté par une élégance discrète et une créativité affirmée.";

export const pages = [
  {
    slug: 'home',
    title: 'BOBO PARIS',
    subtitle: 'Créer. Porter. Recommencer.',
    seoTitle: 'BOBO PARIS — Mode upcyclée, pièces uniques et collections capsules',
    seoDescription:
      "Marque écoresponsable fondée à Paris en 2021. Pièces uniques et collections capsules confectionnées à partir de stocks dormants de maisons de luxe et de vêtements de seconde main.",
    sections: [
      {
        kind: 'hero',
        content: {
          eyebrow: 'Collection capsule',
          title: 'Les Jours Chauds',
          subtitle: 'Des matières déjà vécues, retaillées pour la saison qui commence.',
          imageUrl: '/media/editorial/hero.webp',
          ctaLabel: 'Découvrir la collection',
          ctaHref: '/collections/les-jours-chauds',
          secondaryLabel: 'Toute la boutique',
          secondaryHref: '/boutique',
          align: 'left',
          theme: 'dark',
        },
      },
      {
        kind: 'collection_grid',
        content: {
          title: 'Les capsules',
          subtitle: 'Produites en éditions limitées, jusqu’à épuisement.',
          slugs: ['les-jours-chauds', 'late-for-work', 'l-heritage-bleu'],
          limit: 3,
        },
      },
      {
        kind: 'product_grid',
        content: {
          title: 'Nouveautés',
          subtitle: 'Les dernières pièces sorties de l’atelier.',
          isNew: true,
          sort: 'newest',
          limit: 4,
          ctaLabel: 'Voir toutes les nouveautés',
          ctaHref: '/boutique?is_new=1',
        },
      },
      {
        kind: 'image_text',
        content: {
          eyebrow: 'Le Studio',
          title: 'Rien ne se crée, tout se transforme',
          body:
            "Nos pièces uniques sont entièrement fabriquées à Paris. Chaque panneau de tissu est choisi un par un, dans des stocks dormants ou des vêtements de seconde main, puis assemblé à la main.",
          imageUrl: '/media/editorial/atelier.webp',
          imageAlt: "L'atelier BOBO PARIS",
          ctaLabel: 'Entrer dans le Studio',
          ctaHref: '/studio',
          reverse: false,
        },
      },
      {
        kind: 'product_grid',
        content: {
          title: 'Best sellers',
          subtitle: 'Les pièces qui reviennent saison après saison.',
          sort: 'featured',
          limit: 4,
          ctaLabel: 'Toute la boutique',
          ctaHref: '/boutique',
        },
      },
      {
        kind: 'manifesto',
        content: {
          eyebrow: 'Notre objectif',
          title: 'Produire moins, mais mieux',
          paragraphs: [
            "Bobo Paris imagine une mode durable avec une grande exigence des matières, de la logistique et des ateliers de confection.",
            "Notre mission est de ne rien produire à partir de zéro : toutes les pièces que nous développons sont fabriquées avec des matériaux issus de la revalorisation textile.",
          ],
          ctaLabel: 'Nos engagements',
          ctaHref: '/engagements',
        },
      },
      {
        kind: 'editorial',
        content: {
          eyebrow: 'Lookbook',
          title: 'Le vestiaire',
          items: [
            { imageUrl: '/media/editorial/femme.webp', caption: 'Femme', href: '/femme' },
            { imageUrl: '/media/editorial/homme.webp', caption: 'Homme', href: '/homme' },
            { imageUrl: '/media/editorial/upcycling.webp', caption: 'Upcycling', href: '/engagements' },
          ],
        },
      },
      { kind: 'commitments', content: { title: 'Nos engagements', items: [] } },
      {
        kind: 'newsletter',
        content: {
          title: 'Le Journal',
          body: 'Les nouvelles collections, les pièces uniques et les coulisses de l’atelier, une fois par mois.',
        },
      },
    ],
  },

  {
    slug: 'qui-sommes-nous',
    title: 'Qui sommes-nous',
    subtitle: 'Paris, 2021',
    seoDescription: CONFIRMED_BRAND,
    sections: [
      {
        kind: 'image_text',
        content: {
          eyebrow: 'La marque',
          title: 'Créer. Porter. Recommencer.',
          body: `${CONFIRMED_BRAND}\n\n${CONFIRMED_SOURCING}\n\n${CONFIRMED_SIGNATURE}`,
          imageUrl: '/media/editorial/manifeste.webp',
          imageAlt: 'BOBO PARIS',
          reverse: false,
        },
      },
      {
        kind: 'rich_text',
        content: {
          title: "S'habiller en Bobo Paris",
          paragraphs: [
            "S'habiller en Bobo Paris, c'est affirmer sa singularité avec style, sans compromis entre créativité, confort et engagement.",
            'Nos coupes sont larges et non genrées : une même chemise trouve sa place dans un vestiaire féminin comme masculin.',
          ],
        },
      },
      { kind: 'commitments', content: { title: 'Nos engagements', items: [] } },
    ],
  },

  {
    slug: 'engagements',
    title: 'Nos engagements',
    subtitle: "La mode aujourd'hui, pour demain",
    seoDescription:
      "Upcycling, matières revalorisées, fabrication en France et au Maroc : les engagements de BOBO PARIS.",
    sections: [
      {
        kind: 'manifesto',
        content: {
          eyebrow: 'Notre objectif',
          title: "Produire moins mais mieux, pour que la mode reste un plaisir responsable",
          paragraphs: [
            "Bobo Paris imagine une mode durable avec une grande exigence des matières, de la logistique et des ateliers de confection. C'est pourquoi la marque veille à la transparence la plus grande, à chaque réalisation.",
          ],
        },
      },
      {
        kind: 'image_text',
        content: {
          eyebrow: "L'upcycling",
          title: 'Ne rien produire à partir de zéro',
          body:
            "Nous sommes convaincus que l'upcycling est une façon plus durable de consommer la mode. Toutes les pièces que nous développons sont fabriquées avec des matériaux 100 % recyclés.\n\nNotre monde regorge de choses que nous avons produites dans le passé : nous avons juste besoin de les transformer avec notre créativité.",
          imageUrl: '/media/editorial/upcycling.webp',
          imageAlt: 'Matières revalorisées',
          reverse: true,
        },
      },
      {
        kind: 'rich_text',
        content: {
          title: 'Fabrication',
          paragraphs: [
            "Nous accordons une grande importance au savoir-faire français, en concevant et produisant la majorité de nos créations dans notre atelier parisien.",
            "Toutes nos pièces uniques sont entièrement fabriquées à Paris. L'origine de production est précisée sur chaque fiche produit.",
            "Nous produisons également une partie de nos pièces au Maroc, dans un atelier familial à Casablanca.",
            "Nos emballages sont en carton recyclé et recyclable.",
          ],
        },
      },
      { kind: 'commitments', content: { title: 'En pratique', items: [] } },
    ],
  },

  {
    slug: 'studio',
    title: 'Le Studio',
    subtitle: 'Pièces uniques, assemblées à la main',
    seoDescription:
      "Le Studio BOBO PARIS : pièces uniques entièrement fabriquées à Paris, assemblées panneau par panneau.",
    sections: [
      {
        kind: 'image_text',
        content: {
          eyebrow: 'Atelier parisien',
          title: 'Une pièce, un exemplaire',
          body:
            "Les pièces du Studio ne sont jamais rééditées. Chaque chemise patchwork, chaque pantalon assemblé naît d'un lot de tissus qui n'existera plus une fois épuisé.\n\nLes panneaux, les délavages et les surpiqûres ne se répètent pas d'un exemplaire à l'autre.",
          imageUrl: '/media/editorial/studio.webp',
          imageAlt: 'Le Studio BOBO PARIS',
          ctaLabel: 'Voir les pièces uniques',
          ctaHref: '/archives',
          reverse: false,
        },
      },
      {
        kind: 'product_grid',
        content: { title: 'Au Studio', sort: 'newest', limit: 4, ctaLabel: 'Toute la boutique', ctaHref: '/boutique' },
      },
    ],
  },

  {
    slug: 'journal',
    title: 'Le Journal',
    subtitle: "Les coulisses de l'atelier",
    seoDescription: "Le Journal BOBO PARIS : collections, matières et coulisses de l'atelier.",
    sections: [
      {
        kind: 'editorial',
        content: {
          eyebrow: 'En ce moment',
          title: "Ce qui se passe à l'atelier",
          items: [
            { imageUrl: '/media/editorial/atelier.webp', caption: "L'atelier", href: '/studio' },
            { imageUrl: '/media/editorial/upcycling.webp', caption: 'Les matières', href: '/engagements' },
            { imageUrl: '/media/editorial/manifeste.webp', caption: 'Le manifeste', href: '/qui-sommes-nous' },
          ],
        },
      },
      {
        kind: 'newsletter',
        content: {
          title: 'Recevoir le Journal',
          body: 'Une fois par mois, les nouvelles pièces et les histoires qui vont avec.',
        },
      },
    ],
  },

  {
    slug: 'livraison-et-retours',
    title: 'Livraison & retours',
    subtitle: 'Expédition depuis Paris',
    seoDescription: 'Délais, tarifs et conditions de retour des commandes BOBO PARIS.',
    sections: [
      {
        kind: 'rich_text',
        content: {
          title: 'Livraison',
          paragraphs: [
            "Les commandes sont préparées dans notre atelier parisien sous 1 à 2 jours ouvrés.",
            "France métropolitaine : 2 à 4 jours ouvrés, offerte dès 200 € d'achat.",
            "Union européenne : 3 à 6 jours ouvrés, offerte dès 350 € d'achat.",
            "International : 5 à 10 jours ouvrés. Les droits de douane éventuels restent à la charge du destinataire.",
          ],
        },
      },
      {
        kind: 'rich_text',
        content: {
          title: 'Retours',
          paragraphs: [
            "Vous disposez de 14 jours à compter de la réception pour nous retourner une pièce non portée, dans son emballage d'origine.",
            "Les pièces uniques du Studio sont également reprises dans ce délai.",
            "Les frais de retour restent à votre charge, sauf erreur de notre part.",
          ],
        },
      },
    ],
  },

  {
    slug: 'guide-des-tailles',
    title: 'Guide des tailles',
    subtitle: 'Volumes amples et non genrés',
    seoDescription: 'Comment choisir sa taille chez BOBO PARIS : mesures, coupes et conseils.',
    sections: [
      {
        kind: 'rich_text',
        content: {
          title: 'Comment choisir',
          paragraphs: [
            "Nos pièces sont conçues à partir de vêtements masculins de seconde main : les coupes sont donc naturellement amples et conviennent aussi bien aux femmes qu'aux hommes.",
            "En cas d'hésitation entre deux tailles, prenez la plus petite : le volume est déjà généreux.",
            "Un tableau de mesures précis est affiché sur chaque fiche produit, sous l'onglet « Taille ».",
          ],
        },
      },
    ],
  },
];
