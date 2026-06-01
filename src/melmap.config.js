// Configuration prête pour les fonds MELMAP / dataMEL publics.
// Le flux Raster_HD référencé par data.gouv peut demander des identifiants selon les couches.
// Renseigne `layers` et passe `enabled: true` uniquement après vérification de la couche WMS autorisée.

export const melmapWmsLayers = [
  {
    id: "mel-orthophoto-hd",
    name: "Orthophoto HD MEL — à configurer",
    enabled: false,
    url: "https://mel-geoserver.lillemetropole.fr/geoserver/Raster_HD/wms",
    layers: "",
    format: "image/png",
    transparent: false,
    attribution: "Métropole Européenne de Lille / dataMEL",
  },
];
