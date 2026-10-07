import type { Metadata } from "next";
import Link from "next/link";

import { Fill, LegalPage, Section } from "@/components/legal/legal-page";
import { LEGAL } from "@/data/legal";
import { SHIPPING, SITE } from "@/data/site";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Conditions générales de vente" };

export default function Page() {
  return (
    <LegalPage
      title="Conditions générales de vente"
      intro={
        <>
          Les présentes conditions s&apos;appliquent à toute commande passée sur le site {LEGAL.brand} par un
          consommateur. Elles sont acceptées au moment de la commande.
        </>
      }
    >
      <Section title="1. Vendeur">
        <p>
          <Fill value={LEGAL.ownerName} label="nom ou dénomination" /> — {LEGAL.brand}, SIRET{" "}
          <Fill value={LEGAL.siret} label="SIRET" />, <Fill value={LEGAL.address} label="adresse" />, e-mail{" "}
          <Fill value={LEGAL.email} label="e-mail" />. Plus de détails dans les{" "}
          <Link href="/mentions-legales">mentions légales</Link>.
        </p>
      </Section>

      <Section title="2. Produits">
        <p>
          {LEGAL.brand} vend des sneakers, des articles de maroquinerie et des accessoires (dont des montres)
          authentiques, neufs ou d&apos;occasion. Chaque article d&apos;occasion est nettoyé, inspecté et noté sur 10 ;
          sa note et ses éventuels défauts sont indiqués sur la fiche produit. Les photos sont celles de l&apos;article
          ou d&apos;un article strictement identique. Les quantités étant souvent limitées à une pièce par modèle et
          par taille, les offres sont valables dans la limite des stocks disponibles.
        </p>
      </Section>

      <Section title="3. Prix">
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises
          {LEGAL.vatExempt ? " (TVA non applicable, article 293 B du Code général des impôts)" : ""}, hors frais de
          livraison. Les frais de livraison sont affichés avant la validation de la commande ; la livraison est
          offerte dès {formatPrice(SITE.freeShippingFrom)} d&apos;achat, hors envoi express.
        </p>
      </Section>

      <Section title="4. Commande et paiement">
        <p>
          Le paiement s&apos;effectue en ligne, au comptant, par carte bancaire (CB, Visa, Mastercard), Apple Pay
          ou Google Pay via Stripe, ou par PayPal. La saisie des données bancaires a lieu sur les pages sécurisées
          de ces prestataires ; {LEGAL.brand} n&apos;a jamais accès aux numéros de carte.
        </p>
        <p>
          Chaque article étant une pièce unique, les articles d&apos;une commande sont réservés pendant 30 minutes le
          temps du paiement. Passé ce délai sans paiement, la réservation est annulée et les articles sont remis en
          vente. La commande est ferme dès la confirmation du paiement, affichée à l&apos;écran ; les reçus de
          paiement sont envoyés par e-mail par Stripe ou PayPal.
        </p>
      </Section>

      <Section title="5. Livraison" id="livraison">
        <ul>
          {SHIPPING.map((s) => (
            <li key={s.id}>
              {s.label} — {s.detail} — {formatPrice(s.price)}
            </li>
          ))}
        </ul>
        <p>
          Les articles sont expédiés sous 48 heures ouvrées après le paiement, dans un emballage protégé avec suivi.
          En cas de retard de plus de 30 jours, vous pouvez annuler la commande et être remboursé.
        </p>
      </Section>

      <Section title="6. Droit de rétractation (14 jours)" id="retours">
        <p>
          Vous disposez de 14 jours à compter de la réception de votre commande pour vous rétracter, sans avoir à
          justifier de motif (articles L221-18 et suivants du Code de la consommation). Ce droit s&apos;applique à
          tous les articles, neufs comme d&apos;occasion.
        </p>
        <p>
          Pour l&apos;exercer, envoyez une déclaration claire (par exemple le modèle ci-dessous) à{" "}
          <Fill value={LEGAL.email} label="e-mail" />, puis renvoyez l&apos;article dans les 14 jours suivant votre
          déclaration, dans l&apos;état où vous l&apos;avez reçu, avec sa boîte et ses accessoires. Les frais de retour sont à votre
          charge. Le remboursement, frais de livraison initiaux inclus (sur la base du mode standard), intervient sous
          14 jours après réception de l&apos;article, avec le même moyen de paiement.
        </p>
        <p className="rounded-md border border-line bg-surface p-4 text-sm">
          <strong>Modèle de formulaire de rétractation</strong>
          <br />À l&apos;attention de <Fill value={LEGAL.ownerName} label="nom" /> ({LEGAL.brand}),{" "}
          <Fill value={LEGAL.address} label="adresse" />, <Fill value={LEGAL.email} label="e-mail" /> :
          <br />
          Je vous notifie par la présente ma rétractation du contrat portant sur la vente de l&apos;article ci-dessous :
          [modèle, taille ou pointure] — commandée le [date] / reçue le [date] — nom : [votre nom] — adresse : [votre adresse] —
          date : [date].
        </p>
      </Section>

      <Section title="7. Garanties légales">
        <p>
          Tous les articles bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la
          consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil). Pour un article
          d&apos;occasion, l&apos;état décrit sur la fiche produit (note et défauts signalés) fait partie des
          caractéristiques convenues.
        </p>
      </Section>

      <Section title="8. Authenticité" id="authenticite">
        <p>
          Chaque article est contrôlé avant l&apos;envoi. S&apos;il s&apos;avérait non authentique, il serait
          repris et intégralement remboursé, frais de retour inclus.
        </p>
      </Section>

      <Section title="9. Données personnelles">
        <p>
          Les données nécessaires à la commande sont traitées selon la{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </Section>

      <Section title="10. Réclamations et médiation">
        <p>
          Pour toute réclamation, contactez d&apos;abord <Fill value={LEGAL.email} label="e-mail" />. À défaut de
          solution, vous pouvez recourir gratuitement au médiateur de la consommation :{" "}
          <Fill value={LEGAL.mediatorName} label="nom du médiateur" />
          {LEGAL.mediatorWebsite && (
            <>
              {" "}
              (
              <a href={LEGAL.mediatorWebsite} target="_blank" rel="noopener noreferrer">
                {LEGAL.mediatorWebsite.replace("https://", "")}
              </a>
              )
            </>
          )}
          .
        </p>
        <p>Les présentes conditions sont soumises au droit français.</p>
      </Section>
    </LegalPage>
  );
}
