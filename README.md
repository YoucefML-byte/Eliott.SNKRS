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

## Espace admin (ajouter / retirer des paires)

- Page de connexion : `/admin` (non référencée, à garder en favori).
- Une fois connecté, un bouton **« Ajouter une paire »** apparaît dans l'en-tête :
  photos (glisser-déposer, la première est la principale), nom, marque, coloris,
  prix, état (neuf ou occasion avec note /10), pointures et description.
- Sur chaque fiche produit, l'admin voit un bouton **« Supprimer la paire »**.

### Mode démo (par défaut)

Tant que la base n'est pas branchée, le site fonctionne en mode démo : l'admin
se connecte avec `admin@eliott-snkrs.fr` / `eliott-demo`, et les paires ajoutées
ou supprimées ne changent que dans son navigateur. Utile pour montrer le parcours.

### Brancher la vraie base de données (Supabase, offre gratuite)

1. Créer un compte et un projet sur https://supabase.com (région Europe).
2. **SQL Editor** → coller le contenu de `supabase/schema.sql` → **Run**.
3. (Optionnel) importer les paires de la maquette : coller `supabase/seed.sql` → **Run**.
4. **Authentication → Users → Add user** : créer le compte d'Eliott (e-mail + mot de passe).
5. Le déclarer admin dans le SQL Editor :
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'eliott@exemple.fr';
   ```
6. **Authentication → Sign In / Providers** : désactiver « Allow new users to sign up »
   (personne d'autre ne pourra créer de compte).
7. **Project Settings → API** : copier la *Project URL* et la clé *anon public*.
8. Sur GitHub : **Settings → Secrets and variables → Actions → Variables** →
   ajouter `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   puis relancer le déploiement (onglet Actions → Deploy to GitHub Pages → Run workflow).

La clé *anon* est publique par nature : la sécurité est assurée par les règles
de la base (`supabase/schema.sql`) — tout le monde peut lire le stock, seul un
compte présent dans la table `admins` peut ajouter ou supprimer des paires et des photos.

En local : copier `.env.example` en `.env.local` et y mettre les mêmes valeurs.

## RGPD et informations légales

Pages incluses, accessibles depuis le bas de chaque page :
`/mentions-legales`, `/confidentialite` (données personnelles et cookies), `/cgv`.

Avant la mise en ligne réelle, à faire par Eliott :

1. Compléter `data/legal.ts` (nom, statut, SIRET, adresse, e-mail, téléphone,
   médiateur de la consommation). Tant qu'un champ est vide, il s'affiche en
   surbrillance « [À compléter : …] » sur le site.
2. Choisir un **médiateur de la consommation** (obligatoire pour vendre aux
   particuliers) — liste sur https://www.economie.gouv.fr/mediation-conso
3. Créer le projet Supabase en **région Europe** et accepter son DPA.
4. Tenir à jour le registre `docs/rgpd/registre-des-traitements.md`.
5. Si un outil de statistiques ou de publicité est ajouté un jour : il faudra un
   bandeau de consentement (« Refuser » aussi visible qu'« Accepter ») et mettre à
   jour la politique de confidentialité. Aujourd'hui le site n'en a pas besoin :
   il n'utilise que du stockage strictement nécessaire (panier, session admin).

Ces textes sont des modèles sérieux mais ne remplacent pas la relecture d'un
professionnel du droit avant l'ouverture de la boutique.
