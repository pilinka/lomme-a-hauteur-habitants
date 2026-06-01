export const lommeCenter = [50.6418, 3.0118];

export const lommeBounds = [
  [50.6205, 2.974],
  [50.6635, 3.054],
];

// Zones approximatives pour la maquette.
// À remplacer par le GeoJSON officiel dataMEL / Mairie de Lille pour une version de production.
export const quartiersBounds = {
  "Toute la ville": lommeBounds,
  Bourg: [
    [50.631, 3.004],
    [50.646, 3.026],
  ],
  Délivrance: [
    [50.638, 2.986],
    [50.656, 3.013],
  ],
  Marais: [
    [50.645, 3.019],
    [50.662, 3.049],
  ],
  Mitterie: [
    [50.624, 2.982],
    [50.638, 3.01],
  ],
  "Mont-à-Camp": [
    [50.622, 3.016],
    [50.638, 3.046],
  ],
};

export const quartiersGeoJson = {
  type: "FeatureCollection",
  features: Object.entries(quartiersBounds)
    .filter(([name]) => name !== "Toute la ville")
    .map(([name, bounds]) => {
      const [[south, west], [north, east]] = bounds;
      return {
        type: "Feature",
        properties: { quartier: name, source: "maquette approximative" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ]],
        },
      };
    }),
};

export const typeIcon = {
  Photo: "📷",
  Souvenir: "🕰️",
  "Lieu aimé": "❤️",
  "Lieu évité": "⚠️",
  "Idée d’aménagement": "🌱",
  "Dessin d’enfant": "🎨",
  Poème: "✍️",
  "Phrase d’enfant": "💬",
  Association: "🤝",
  Événement: "📅",
  Culture: "🎭",
  Sport: "🏃",
  Solidarité: "🤲",
  Jeunesse: "🧒",
  Nature: "🌳",
  Ressource: "🏛️",
};

export const emotionIcon = {
  joie: "😊",
  calme: "😌",
  peur: "😟",
  tristesse: "😢",
  colère: "😡",
  attachement: "❤️",
  curiosité: "👀",
};

export const initialContributions = [
  {
    id: "regard-1",
    layer: "regards",
    title: "Le square où l’on respire",
    quartier: "Bourg",
    type: "Lieu aimé",
    emotion: "calme",
    description: "Un petit espace agréable où les familles s’arrêtent après l’école. Les habitants aimeraient plus de bancs et d’ombre.",
    author: "Habitant",
    media: "📷 Photo fictive",
    position: [50.6388, 3.0148],
    status: "publié",
  },
  {
    id: "regard-2",
    layer: "regards",
    title: "Rue trop sombre le soir",
    quartier: "Délivrance",
    type: "Lieu évité",
    emotion: "peur",
    description: "Le passage est pratique, mais plusieurs habitants disent l’éviter après la tombée de la nuit.",
    author: "Habitante",
    media: "📷 Photo fictive",
    position: [50.646, 3.0005],
    status: "publié",
  },
  {
    id: "enfant-1",
    layer: "enfants",
    title: "Ma rue avec des arbres",
    quartier: "Mitterie",
    type: "Dessin d’enfant",
    emotion: "joie",
    description: "Un enfant imagine une rue avec moins de voitures, plus d’arbres et des couleurs sur les murs.",
    author: "Enfant accompagné",
    media: "🎨 Dessin fictif",
    position: [50.6318, 2.9958],
    status: "publié",
  },
  {
    id: "regard-3",
    layer: "regards",
    title: "Souvenir d’un ancien commerce",
    quartier: "Marais",
    type: "Souvenir",
    emotion: "attachement",
    description: "Un habitant raconte un commerce disparu qui servait de lieu de rencontre dans le quartier.",
    author: "Habitant",
    media: "📝 Témoignage",
    position: [50.6534, 3.031],
    status: "publié",
  },
  {
    id: "idee-1",
    layer: "idees",
    title: "Besoin de végétalisation",
    quartier: "Mont-à-Camp",
    type: "Idée d’aménagement",
    emotion: "calme",
    description: "Des habitants aimeraient des arbres, des assises et un peu d’ombre sur ce trajet quotidien.",
    author: "Association",
    media: "🌳 Proposition",
    position: [50.6296, 3.034],
    status: "publié",
  },
  {
    id: "idee-2",
    layer: "idees",
    title: "Circulation rapide près d’une école",
    quartier: "Bourg",
    type: "Idée d’aménagement",
    emotion: "peur",
    description: "Des familles demandent un cheminement plus lisible et plus sûr autour d’une école.",
    author: "Parent",
    media: "⚠️ Signalement sensible",
    position: [50.6364, 3.0212],
    status: "publié",
  },
];

export const initialVieLocale = [
  {
    id: "vl-1",
    layer: "vie-locale",
    title: "Exemple d’association de quartier",
    quartier: "Délivrance",
    type: "Association",
    category: "Vie de quartier",
    description: "Fiche exemple à remplacer par une donnée issue de l’annuaire municipal des associations.",
    place: "Adresse à compléter",
    schedule: "Horaires à compléter",
    source: "Annuaire des associations — à importer",
    position: [50.6476, 3.0042],
  },
  {
    id: "vl-2",
    layer: "vie-locale",
    title: "Exemple d’événement culturel",
    quartier: "Marais",
    type: "Événement",
    category: "Culture",
    description: "Fiche exemple à remplacer par une entrée de l’agenda culturel ou municipal.",
    place: "Lieu à compléter",
    date: "Date à compléter",
    schedule: "Horaire à compléter",
    source: "Agenda municipal — à importer",
    position: [50.6522, 3.0385],
  },
  {
    id: "vl-3",
    layer: "vie-locale",
    title: "Exemple d’activité sportive",
    quartier: "Mont-à-Camp",
    type: "Sport",
    category: "Sport",
    description: "Fiche exemple pour montrer comment une activité locale peut devenir un lieu vécu.",
    place: "Équipement à compléter",
    schedule: "Selon programmation",
    source: "Agenda sportif — à importer",
    position: [50.6279, 3.0281],
  },
  {
    id: "vl-4",
    layer: "vie-locale",
    title: "Exemple d’atelier jeunesse",
    quartier: "Bourg",
    type: "Jeunesse",
    category: "Jeunesse",
    description: "Atelier, animation ou lieu ressource à compléter depuis les données de la ville.",
    place: "Lieu à compléter",
    schedule: "Date à compléter",
    source: "Agenda / annuaire — à importer",
    position: [50.6404, 3.0195],
  },
];
