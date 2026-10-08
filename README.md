# Eliott SNKRS — maquette du futur site

Site e-commerce d'Eliott SNKRS. Sans configuration, il tourne en **mode démo**
(stock, admin et paiement simulés dans le navigateur) ; une fois Supabase,
Stripe et PayPal branchés (voir plus bas), il vend pour de vrai.

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
| `/chaussures`, `/montres`, `/maroquinerie`, `/accessoires` | Catégories, avec leurs sous-catégories (`/chaussures/sneakers`, `/maroquinerie/sacs-a-main`…) |
| `/marques` | Toutes les marques en stock ; `/marques/?m=nike` : tous les articles d'une marque, par catégorie |
| `/catalogue` | Tout le stock, toutes catégories |
| `/produit/?p=<slug>` | Fiche article : galerie photo, pointures (chaussures) ou taille unique, caractéristiques |
| `/panier` | Panier (aussi disponible en tiroir depuis l'en-tête) |
| `/checkout` | Commande et paiement (Stripe ou PayPal), puis `/checkout/confirmation` |
| `/admin` | Espace admin : stock et commandes |

## Organisation du catalogue

Catégorie → sous-catégorie → articles → filtres. Tout est décrit dans
`data/taxonomy.ts` : catégories, sous-catégories, filtres principaux et filtres
avancés (« + Plus de filtres ») de chaque catégorie, couleurs proposées.

- Une sous-catégorie sans article n'apparaît nulle part (menu, pages, puces).
- Un filtre n'est proposé que s'il offre un vrai choix dans le rayon affiché.
- Les chaussures ont des pointures ; montres, maroquinerie et accessoires sont
  en taille unique (une pièce mise en vente).

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
- Une fois connecté, un bouton **« Ajouter un article »** apparaît dans l'en-tête :
  photos (glisser-déposer, la première est la principale), catégorie et type,
  nom, marque, prix, état (neuf ou occasion avec note /10), couleur, puis les
  champs propres à la catégorie : pointures, modèle et genre (chaussures) ;
  mouvement, boîtier, bracelet, matière (montres) ; taille et matière
  (maroquinerie) ; matière (accessoires).
- Stock : pour chaque pointure cochée, l'admin choisit son état (neuf ou
  occasion /10, propre à chaque pointure) et le nombre de paires ; « + état »
  ajoute la même pointure dans un autre état (ex. un 42 neuf et un 42 en 6/10).
  Pour une taille unique : l'état de l'article et la quantité.
- Sur chaque fiche, chaque carte et dans `/admin`, l'admin voit **« Modifier »**
  (même formulaire, pré-rempli : prix, stock, photos…) et **« Supprimer »**.

### Mode démo (par défaut)

Tant que la base n'est pas branchée, le site fonctionne en mode démo : l'admin
se connecte avec `admin@eliott-snkrs.fr` / `eliott-demo`, et les paires ajoutées
ou supprimées ne changent que dans son navigateur. Utile pour montrer le parcours.

### Brancher la vraie base de données (Supabase, offre gratuite)

1. Créer un compte et un projet sur https://supabase.com (région Europe).
2. **SQL Editor** → coller le contenu de `supabase/schema.sql` → **Run**
   (le script peut être relancé : sur une base existante, il ajoute les
   colonnes des catégories).
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

## Paiement (Stripe + PayPal)

Le client choisit **carte bancaire** (CB, Visa, Mastercard, Apple Pay, Google Pay
— page sécurisée Stripe) ou **PayPal**. Aucune donnée bancaire ne passe par le site.

Comment ça marche :

1. Au clic sur « Payer », la fonction `checkout` (Supabase) crée la commande avec
   les **prix lus dans la base** (jamais ceux envoyés par le navigateur) et
   **réserve les paires 30 minutes** : deux clients ne peuvent pas payer la même paire.
2. Le client est envoyé sur Stripe ou PayPal pour payer.
3. Au retour, la fonction `confirm-order` vérifie le paiement (et l'encaisse pour
   PayPal) ; Stripe confirme aussi de son côté via `stripe-webhook`. La commande
   passe en « payée », la paire disparaît du stock et le panier se vide.
4. Paiement abandonné ou annulé : la réservation est levée et les paires reviennent en vente.

Eliott retrouve les commandes payées (adresse, téléphone, pointure) dans
**/admin → Commandes** et les marque « expédiées ». Les remboursements se font
depuis le tableau de bord Stripe ou PayPal.

### Mise en route (à faire une fois, d'abord en mode test)

1. **Base** : SQL Editor de Supabase → coller `supabase/payments.sql` → **Run**
   (après `schema.sql`).
2. **Stripe** (https://dashboard.stripe.com, compte au nom d'Eliott : SIRET, IBAN) :
   - *Développeurs → Clés API* : copier la **clé secrète** (`sk_test_…` en mode test).
   - *Paramètres → Moyens de paiement* : activer Carte, Apple Pay, Google Pay.
   - *Développeurs → Webhooks → Ajouter un endpoint* :
     `https://<projet>.supabase.co/functions/v1/stripe-webhook`, événements
     `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`.
     Copier le **secret de signature** (`whsec_…`).
   - *Paramètres → E-mails clients* : activer les reçus de paiement.
3. **PayPal** (compte Business) : https://developer.paypal.com → *Apps & Credentials*
   → *Create App* (onglet **Sandbox** pour tester) → copier **Client ID** et **Secret**.
4. **Secrets des fonctions** : Supabase → *Edge Functions → Secrets* :

   | Nom | Valeur |
   | --- | --- |
   | `SITE_URL` | adresse du site, ex. `https://youcefml-byte.github.io/Eliott.SNKRS` |
   | `STRIPE_SECRET_KEY` | `sk_test_…` puis `sk_live_…` |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_…` |
   | `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` | identifiants de l'app PayPal |
   | `PAYPAL_ENV` | `sandbox` pour tester, `live` en production |
   | `ALLOWED_ORIGINS` | (optionnel) autres adresses autorisées, ex. `http://localhost:3000` |

5. **Déployer les fonctions** : sur GitHub, *Settings → Secrets and variables → Actions* :
   secret `SUPABASE_ACCESS_TOKEN` (supabase.com → Account → Access Tokens) et variable
   `SUPABASE_PROJECT_REF` (l'identifiant dans l'URL du projet), puis onglet *Actions →
   Deploy Supabase functions → Run workflow*. (Ou en local :
   `npx supabase functions deploy --project-ref <ref>`.)
6. **Activer le paiement sur le site** : variable GitHub `NEXT_PUBLIC_PAYMENTS_ENABLED` = `1`,
   puis relancer *Deploy to GitHub Pages*.
7. **Tester** : carte Stripe `4242 4242 4242 4242` (date future, CVC quelconque) et un
   compte acheteur PayPal *Sandbox*. Vérifier la commande dans /admin → Commandes.
8. **Passer en réel** : remplacer les clés par celles du mode live (Stripe `sk_live_…`
   + nouveau webhook live, app PayPal *Live* + `PAYPAL_ENV=live`).

L'argent arrive sur le compte Stripe (virement automatique vers l'IBAN) et sur le
solde PayPal (virement vers la banque). Frais indicatifs : Stripe ≈ 1,5 % + 0,25 €
par carte européenne, PayPal ≈ 2,9 % + 0,35 € — voir leurs grilles à jour.

> **Hébergement** : GitHub Pages n'est pas prévu pour une boutique commerciale.
> Avant d'ouvrir les ventes, publier le même dossier `out/` sur Netlify ou
> Cloudflare Pages (gratuits, avec nom de domaine), et mettre `SITE_URL` à jour.

### Tests des paiements

```bash
cd supabase/functions
deno test -A                 # tests unitaires (signature Stripe, montants PayPal…)
TEST_DATABASE_URL=postgres://postgres:pw@localhost:5432/test deno test -A
                             # + parcours complets sur un PostgreSQL local vide
```

Ils tournent aussi automatiquement sur GitHub avant chaque déploiement des fonctions.

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
   il n'utilise que du stockage strictement nécessaire (panier, session admin,
   commande en cours de paiement).

Ces textes sont des modèles sérieux mais ne remplacent pas la relecture d'un
professionnel du droit avant l'ouverture de la boutique.
