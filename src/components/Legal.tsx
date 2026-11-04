"use client";

import { useI18n } from "@/lib/i18n";

export default function TermsPage({ kind }: { kind: "terms" | "privacy" }) {
  const { t } = useI18n();
  const title = kind === "terms" ? "Conditions générales d'utilisation" : "Politique de confidentialité";
  const sections = kind === "terms"
    ? [
        ["1. Nature du projet", "Saga Africa est une plateforme de démonstration, fan et éducative. Elle reproduit l'esprit de plateformes de lecture et de création de mangas/webtoons, sans affiliation avec les sites cités en référence."],
        ["2. Comptes", "Vous êtes responsable de la confidentialité de votre mot de passe. Les comptes de démonstration utilisent le mot de passe « demo »."],
        ["3. Contenus", "Les séries, synopsis et textes sont fictifs et créés pour la démonstration. Le contenu est la propriété de ses auteurs respectifs."],
        ["4. Avertissements", "Certaines séries sont signalées PEGI. Continuer la lecture implique d'accepter ces avertissements."],
        ["5. Limitation", "Le service peut être interrompu sans préavis. Aucune donnée n'est garantie persistante."],
      ]
    : [
        ["1. Données collectées", "Nous stockons localement (base SQLite de démonstration) : adresse e-mail, pseudonyme, hash de mot de passe, commentaires, likes et abonnements."],
        ["2. Cookies", "Un cookie de session est utilisé pour rester connecté sur cet appareil."],
        ["3. Partage", "Aucune donnée n'est transmise à des tiers ni utilisée à des fins commerciales."],
        ["4. Suppression", "Contactez l'équipe de démonstration pour supprimer votre compte (pratique simulée)."],
        ["5. Local", "Toutes les données vivent sur le serveur local ou le déploiement de démonstration."],
      ];
  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1 className="title-lg">{title}</h1>
      {sections.map(([h, p]) => (
        <div key={h} style={{ marginTop: 20 }}>
          <h4 className="title-md" style={{ fontSize: 17 }}>{h}</h4>
          <p className="muted">{p}</p>
        </div>
      ))}
    </div>
  );
}
