import type { Metadata } from "next";
import Link from "next/link";

import { Fill, LegalPage, Section } from "@/components/legal/legal-page";
import { LEGAL } from "@/data/legal";
import { SITE } from "@/data/site";

export const metadata: Metadata = { title: "Mentions légales" };

export default function Page() {
  return (
    <LegalPage
      title="Mentions légales"
      intro="Informations prévues par l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)."
    >
      <Section title="Éditeur du site">
        <ul>
          <li>
            Nom commercial : <strong>{LEGAL.brand}</strong>
          </li>
          <li>
            Exploitant : <Fill value={LEGAL.ownerName} label="nom et prénom ou dénomination sociale" />
          </li>
          <li>
            Statut : <Fill value={LEGAL.legalForm} label="forme juridique" />
          </li>
          <li>
            SIRET : <Fill value={LEGAL.siret} label="numéro SIRET" />
          </li>
          {LEGAL.rcs && <li>Immatriculation : {LEGAL.rcs}</li>}
          <li>
            TVA :{" "}
            {LEGAL.vatExempt ? (
              "TVA non applicable, article 293 B du Code général des impôts"
            ) : (
              <Fill value={LEGAL.vatNumber} label="numéro de TVA intracommunautaire" />
            )}
          </li>
          <li>
            Adresse : <Fill value={LEGAL.address} label="adresse" />
          </li>
          <li>
            E-mail : <Fill value={LEGAL.email} label="e-mail de contact" />
          </li>
          <li>
            Téléphone : <Fill value={LEGAL.phone} label="téléphone" />
          </li>
          <li>
            Directeur de la publication : <Fill value={LEGAL.publicationDirector} label="nom" />
          </li>
        </ul>
      </Section>

      <Section title="Hébergement">
        <p>
          Le site est hébergé par <strong>{LEGAL.host.name}</strong>, {LEGAL.host.address} —{" "}
          <a href={LEGAL.host.website} target="_blank" rel="noopener noreferrer">
            {LEGAL.host.website.replace("https://", "")}
          </a>
          .
        </p>
        <p>
          Le stock et les photos des articles sont enregistrés dans une base de données Supabase, hébergée dans
          l&apos;Union européenne.
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          Les textes, la mise en page, le logo et les photographies propres à {LEGAL.brand} sont protégés. Toute
          reproduction sans autorisation écrite est interdite.
        </p>
        <p>
          Les noms et logos de marques et de modèles cités (Nike, Jordan, New Balance, Asics, Off-White, Prada, Maison
          Margiela, Louis Vuitton, Gucci, Supreme, etc.) appartiennent à leurs propriétaires respectifs. {LEGAL.brand} est un revendeur indépendant d&apos;articles
          authentiques : il n&apos;est ni affilié à ces marques, ni sponsorisé ou approuvé par elles.
        </p>
      </Section>

      <Section title="Données personnelles et cookies">
        <p>
          Le traitement de vos données et l&apos;usage du stockage dans votre navigateur sont décrits dans la{" "}
          <Link href="/confidentialite">politique de confidentialité et cookies</Link>.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Pour toute question : <Fill value={LEGAL.email} label="e-mail de contact" />, ou en message privé sur
          Instagram{" "}
          <a href={SITE.instagramUrl} target="_blank" rel="noopener noreferrer">
            @{SITE.instagram}
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
