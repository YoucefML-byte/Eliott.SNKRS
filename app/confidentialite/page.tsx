import type { Metadata } from "next";
import Link from "next/link";

import { Fill, LegalPage, Section, Table } from "@/components/legal/legal-page";
import { CNIL, LEGAL } from "@/data/legal";

export const metadata: Metadata = { title: "Confidentialité et cookies" };

export default function Page() {
  return (
    <LegalPage
      title="Confidentialité et cookies"
      intro={
        <>
          Cette page explique quelles données {LEGAL.brand} collecte, pourquoi, combien de temps elles sont gardées
          et comment exercer vos droits, conformément au Règlement général sur la protection des données (RGPD) et à
          la loi Informatique et Libertés. En résumé : nous collectons uniquement ce qui sert à traiter votre
          commande, nous ne vendons aucune donnée et le site n&apos;utilise ni outil de mesure d&apos;audience ni
          publicité.
        </>
      }
    >
      <Section title="1. Responsable du traitement">
        <p>
          <Fill value={LEGAL.ownerName} label="nom ou dénomination" /> ({LEGAL.brand}),{" "}
          <Fill value={LEGAL.address} label="adresse" /> — contact :{" "}
          <Fill value={LEGAL.email} label="e-mail de contact" />.
        </p>
      </Section>

      <Section title="2. Données collectées et finalités">
        <Table
          head={["Pourquoi", "Quelles données", "Base légale", "Durée de conservation"]}
          rows={[
            [
              "Traiter et livrer votre commande, service après-vente",
              "Nom, prénom, e-mail, téléphone, adresse de livraison, contenu de la commande",
              "Exécution du contrat (art. 6.1.b RGPD)",
              "Pendant la relation commerciale, puis 3 ans après la dernière commande",
            ],
            [
              "Facturation et comptabilité",
              "Identité, adresse, montant et détail des achats",
              "Obligation légale (art. 6.1.c RGPD)",
              "10 ans (article L123-22 du Code de commerce)",
            ],
            [
              "Paiement",
              "Données de paiement, saisies et traitées directement chez Stripe ou PayPal (le numéro de carte ne nous est jamais transmis) ; nous conservons seulement la référence de la transaction",
              "Exécution du contrat ; lutte contre la fraude (intérêt légitime)",
              "Référence de transaction : 10 ans avec la facture ; données bancaires : selon Stripe ou PayPal",
            ],
            [
              "Répondre à vos questions (e-mail, Instagram)",
              "Identité, coordonnées, contenu des échanges",
              "Intérêt légitime (art. 6.1.f RGPD)",
              "3 ans après le dernier échange",
            ],
            [
              "Sécurité du site et gestion du stock",
              "Adresse IP et journaux techniques de l'hébergeur ; e-mail du compte administrateur",
              "Intérêt légitime (sécurité)",
              "Durée limitée fixée par l'hébergeur ; durée du compte pour l'administrateur",
            ],
          ]}
        />
        <p>
          Les champs obligatoires du formulaire de commande sont signalés. Sans eux, la commande ne peut pas être
          livrée. Aucune décision automatisée ni aucun profilage n&apos;est réalisé à partir de vos données.
        </p>
        <p>
          Nous n&apos;envoyons pas de newsletter. Si cela change, elle ne vous sera envoyée qu&apos;avec votre
          accord explicite, retirable à tout moment.
        </p>
      </Section>

      <Section title="3. Qui reçoit vos données">
        <p>Vos données ne sont ni vendues ni louées. Elles sont transmises uniquement aux prestataires nécessaires :</p>
        <ul>
          <li>
            <strong>Hébergement du site</strong> : GitHub, Inc. (États-Unis).
          </li>
          <li>
            <strong>Base de données</strong> : Supabase (serveurs situés dans l&apos;Union européenne).
          </li>
          <li>
            <strong>Paiement par carte, Apple Pay ou Google Pay</strong> : Stripe Payments Europe Ltd (Irlande),
            certifié PCI-DSS, qui reçoit votre e-mail et le montant de la commande.
          </li>
          <li>
            <strong>Paiement PayPal</strong> : PayPal (Europe) S.à r.l. et Cie, S.C.A. (Luxembourg), qui reçoit
            votre nom, votre e-mail, votre adresse de livraison et le détail de la commande. PayPal traite aussi
            ces données pour son propre compte (lutte contre la fraude, obligations bancaires) selon sa propre
            politique de confidentialité.
          </li>
          <li>
            <strong>Livraison</strong> : le transporteur choisi à la commande (Colissimo, Mondial Relay ou
            Chronopost), qui reçoit votre nom, votre adresse et votre téléphone.
          </li>
        </ul>
        <p>
          Si vous nous contactez sur Instagram, vos échanges sont aussi soumis à la politique de confidentialité de
          Meta, qui agit alors en tant que responsable de traitement distinct.
        </p>
      </Section>

      <Section title="4. Transferts hors de l'Union européenne">
        <p>
          L&apos;hébergeur du site, GitHub, est établi aux États-Unis. Les transferts vers ce prestataire sont
          encadrés par le cadre de protection des données UE–États-Unis (Data Privacy Framework) et par les clauses
          contractuelles types de la Commission européenne.
        </p>
      </Section>

      <Section title="5. Cookies et stockage dans votre navigateur" id="cookies">
        <p>Le site n&apos;utilise aucun cookie publicitaire, aucun outil de mesure d&apos;audience et aucun bouton de réseau social intégré. Les polices sont hébergées sur le site lui-même, sans appel à Google Fonts.</p>
        <p>Seules les informations strictement nécessaires au fonctionnement du site sont enregistrées dans votre navigateur :</p>
        <ul>
          <li>
            <strong>Votre panier</strong> (articles et tailles choisis), pour le retrouver d&apos;une page à
            l&apos;autre.
          </li>
          <li>
            <strong>Le récapitulatif de votre dernière commande</strong>, effacé à la fermeture de l&apos;onglet.
          </li>
          <li>
            <strong>La commande en cours de paiement</strong> (son identifiant et les coordonnées saisies, effacées à
            la fermeture de l&apos;onglet), pour libérer les articles réservés et vous éviter de tout ressaisir si vous
            revenez depuis Stripe ou PayPal.
          </li>
          <li>
            <strong>La session de l&apos;administrateur</strong>, uniquement pour la personne qui gère le stock.
          </li>
        </ul>
        <p>
          Conformément à l&apos;article 82 de la loi Informatique et Libertés et aux lignes directrices de la CNIL,
          ces éléments sont dispensés de consentement : c&apos;est pourquoi le site n&apos;affiche pas de bandeau
          cookies. Vous pouvez les effacer à tout moment depuis les réglages de votre navigateur (le panier sera alors
          vidé).
        </p>
      </Section>

      <Section title="6. Sécurité">
        <p>
          Le site est servi exclusivement en HTTPS. La gestion du stock est réservée à un compte administrateur
          protégé par mot de passe, et les règles de la base de données interdisent toute modification par un autre
          compte. Les paiements sont confiés à Stripe et PayPal : la saisie de la carte se fait sur leurs pages
          sécurisées et aucune donnée bancaire n&apos;est stockée par {LEGAL.brand}.
        </p>
      </Section>

      <Section title="7. Vos droits">
        <p>Vous disposez des droits suivants sur vos données :</p>
        <ul>
          <li>accès, rectification et effacement ;</li>
          <li>limitation du traitement et opposition ;</li>
          <li>portabilité de vos données ;</li>
          <li>définition de directives sur le sort de vos données après votre décès.</li>
        </ul>
        <p>
          Pour les exercer, écrivez à <Fill value={LEGAL.email} label="e-mail de contact" /> en précisant votre
          demande. Nous répondons dans un délai d&apos;un mois. Une pièce d&apos;identité ne pourra être demandée
          qu&apos;en cas de doute raisonnable sur votre identité.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL :{" "}
          <a href={CNIL.complaint} target="_blank" rel="noopener noreferrer">
            cnil.fr/fr/plaintes
          </a>{" "}
          ou par courrier, {CNIL.address}.
        </p>
      </Section>

      <Section title="8. Modifications">
        <p>
          Cette politique peut évoluer, par exemple à l&apos;ajout d&apos;un nouveau service. La date de dernière mise
          à jour figure en haut de la page. Voir aussi les <Link href="/mentions-legales">mentions légales</Link> et
          les <Link href="/cgv">conditions générales de vente</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
