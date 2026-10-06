// Informations légales d'Eliott SNKRS, reprises dans les mentions légales,
// la politique de confidentialité et les CGV. Les champs vides s'affichent
// sur le site comme « [À compléter : …] » jusqu'à ce qu'ils soient remplis.

export const LEGAL = {
  updatedAt: "6 octobre 2026",

  // Éditeur du site
  brand: "Eliott SNKRS",
  ownerName: "", // nom et prénom de l'entrepreneur, ou dénomination sociale
  legalForm: "", // ex. « Entrepreneur individuel (micro-entreprise) » ou « SAS au capital de … € »
  siret: "",
  rcs: "", // ex. « RCS Paris 123 456 789 » (si société) — sinon laisser vide
  vatNumber: "", // n° de TVA intracommunautaire, ou vide si franchise en base
  vatExempt: true, // micro-entreprise en franchise de TVA : « TVA non applicable, art. 293 B du CGI »
  address: "",
  email: "", // adresse de contact (commandes, données personnelles)
  phone: "",
  publicationDirector: "", // en général la même personne que l'exploitant

  // Médiateur de la consommation (obligatoire pour la vente aux particuliers)
  mediatorName: "",
  mediatorWebsite: "",

  // Hébergement du site
  host: {
    name: "GitHub, Inc. (GitHub Pages)",
    address: "88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis",
    website: "https://github.com",
  },
};

export const CNIL = {
  website: "https://www.cnil.fr",
  complaint: "https://www.cnil.fr/fr/plaintes",
  address: "3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07",
};
