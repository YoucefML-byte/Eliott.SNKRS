# Eliott SNKRS — maquette du futur site

Maquette frontend du futur site e-commerce d'Eliott SNKRS, destinée à être
présentée au client. Tout est simulé : pas de base de données, pas de paiement,
pas de comptes. Le panier est gardé dans le navigateur.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Pages

| Adresse | Contenu |
| --- | --- |
| `/` | Accueil : animation d'ouverture, nouveautés, collabs, marques, guide Neuf / Occasion |
| `/catalogue` | Stock avec recherche, filtres (marque, pointure, état, prix) et tri |
| `/produit/[slug]` | Fiche produit : galerie photo, pointures avec l'état de chaque paire |
| `/panier` | Panier (aussi disponible en tiroir depuis l'en-tête) |
| `/checkout` | Commande fictive, puis `/checkout/confirmation` |

## Modifier le contenu

- **Produits** : `data/products.ts` (nom, marque, prix, pointures, état, description).
- **Photos** : `public/products/<slug>/1.webp … 5.webp`
  (profil, vue latérale, avant, arrière, semelle).
- **Marques** : `data/brands.ts`.
- **Textes du site, livraison, collabs** : `data/site.ts`.
- **Couleurs et polices** : `app/globals.css`.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS v4, structure shadcn/ui
(`components/ui`), animations avec `motion`.
