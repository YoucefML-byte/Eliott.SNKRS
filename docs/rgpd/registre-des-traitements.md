# Registre des activités de traitement — Eliott SNKRS

Document interne exigé par l'article 30 du RGPD (à tenir à jour, à présenter
à la CNIL en cas de contrôle). Modèle simplifié inspiré de celui de la CNIL :
https://www.cnil.fr/fr/RGDP-le-registre-des-activites-de-traitement

**Responsable du traitement** : [nom / dénomination], [adresse], [e-mail]
**Dernière mise à jour** : 6 octobre 2026

| Traitement | Finalité | Personnes concernées | Données | Destinataires | Hors UE | Durée | Sécurité |
|---|---|---|---|---|---|---|---|
| Gestion des commandes | Vendre, livrer, service après-vente | Clients | Identité, e-mail, téléphone, adresse, commande (table `orders` Supabase) | Transporteur, Stripe ou PayPal | Non (sauf hébergeur) | Relation commerciale + 3 ans | Accès admin protégé, HTTPS |
| Facturation | Obligations comptables | Clients | Identité, adresse, achats, montants | Comptable | Non | 10 ans | Sauvegardes, accès restreint |
| Paiement | Encaisser, lutter contre la fraude | Clients | Données de paiement (chez Stripe / PayPal), référence de transaction | Stripe Payments Europe (IE), PayPal Europe (LU) | Possible (clauses types des prestataires) | Selon prestataire | PCI-DSS (prestataire) |
| Contacts clients | Répondre aux questions | Prospects, clients | Identité, messages | Meta (si Instagram) | Oui (Meta) | 3 ans après le dernier échange | — |
| Gestion du stock / admin | Mettre en ligne les paires | Administrateur | E-mail, mot de passe (haché) | Supabase | Non (région UE) | Durée du compte | Mot de passe fort, inscriptions désactivées, règles RLS |
| Hébergement du site | Afficher le site | Visiteurs | Adresse IP, journaux techniques | GitHub (Pages) | Oui (États-Unis, DPF + clauses types) | Selon GitHub | HTTPS |

## Sous-traitants à vérifier

- [ ] GitHub — conditions et DPA : https://github.com/customer-terms
- [ ] Supabase — projet créé en **région Europe**, DPA à accepter dans le tableau de bord
- [ ] Stripe — DPA inclus dans les conditions : https://stripe.com/fr/legal/dpa
- [ ] PayPal — conditions et politique de confidentialité : https://www.paypal.com/fr/legalhub/home
- [ ] Transporteurs utilisés

## En cas de violation de données

Notifier la CNIL dans les **72 heures** si la violation présente un risque pour
les personnes (https://notifications.cnil.fr), et informer les personnes
concernées si le risque est élevé. Consigner chaque incident ici :

| Date | Nature | Données touchées | Mesures prises | Notifiée à la CNIL ? |
|---|---|---|---|---|
|  |  |  |  |  |
