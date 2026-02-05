
import Link from "next/link";
import { ArrowRight, FileText, FilePlus, FileSignature, CheckCircle, Receipt, ListChecks, MailOpen, FileEdit, Handshake, Ban } from "lucide-react";
import { JSX } from "react";

const toolIcons: Record<string, JSX.Element> = {
  "factures": <FileText className="size-7 text-primary" />,
  "devis": <FilePlus className="size-7 text-blue-600" />,
  "contrats": <FileSignature className="size-7 text-teal-600" />,
  "attestations de paiement": <CheckCircle className="size-7 text-green-600" />,
  "reçus": <Receipt className="size-7 text-amber-600" />,
  "bons de commande": <ListChecks className="size-7 text-pink-600" />,
  "lettres de relance": <MailOpen className="size-7 text-orange-500" />,
  "avenants": <FileEdit className="size-7 text-purple-600" />,
  "lettres d'engagement": <Handshake className="size-7 text-blue-500" />,
  "lettres de résiliation": <Ban className="size-7 text-red-600" />,
};

const tools = [
  {
    name: "factures",
    description: "Créez des factures professionnelles personnalisées.",
    href: "/tools/documents/generate/facture",
  },
  {
    name: "devis",
    description: "Générez facilement des devis détaillés pour vos clients.",
    href: "/tools/documents/generate/devis",
  },
  {
    name: "contrats",
    description: "Élaborez des modèles de contrats adaptés à vos besoins.",
    href: "/tools/documents/generate/contrat",
  },
  {
    name: "Générateur d'attestations de paiement",
    description: "Créez des attestations de paiement officielles.",
    href: "/tools/documents/generate/attestation-paiement",
  },
  {
    name: "reçus",
    description: "Obtenez des modèles de reçus pour vos transactions.",
    href: "/tools/documents/generate/recu",
  },
  {
    name: "bons de commande",
    description: "Rédigez facilement des bons de commande.",
    href: "/tools/documents/generate/bon-commande",
  },
  {
    name: "lettres de relance",
    description: "Préparez des lettres de relance pour paiements en retard.",
    href: "/tools/documents/generate/lettre-relance",
  },
  {
    name: "Générateur d'avenants",
    description: "Ajoutez des avenants à vos contrats existants.",
    href: "/tools/documents/generate/avenant",
  },
  {
    name: "lettres d'engagement",
    description: "Créez des lettres d'engagement pour vos partenaires ou employés.",
    href: "/tools/documents/generate/lettre-engagement",
  },
  {
    name: "lettres de résiliation",
    description: "Générez des lettres de résiliation de contrat rapidement.",
    href: "/tools/documents/generate/lettre-resiliation",
  },
];

export default function ToolsHome() {
  return (
    <div className="pt-10 max-w-3xl mx-auto">
      <div className="flex flex-col items-start mb-4 gap-1">
        <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <FileText className="inline-block size-8 text-primary" />
          Outils de génération de documents
        </h2>
        <p className="text-base text-muted-foreground mt-1 max-w-2xl">
          Générez vos documents administratifs et commerciaux en toute simplicité&nbsp;:
        </p>
      </div>
      <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, i) => (
          <li
            key={i}
            className="group bg-card hover:shadow-lg border border-border rounded-2xl px-6 py-5 flex items-center gap-4 transition-all duration-200 relative overflow-hidden"
            style={{
              boxShadow:
                "0 3px 16px 0 rgba(60,60,100,0.08), 0 1.5px 6px 0 rgba(0,0,0,0.02)",
            }}
          >
            <div className="flex items-center justify-center rounded-lg bg-muted w-14 h-14 shrink-0 group-hover:bg-primary/10 transition-colors duration-200">
              {toolIcons[tool.name] || (
                <FileText className="size-7 text-primary" />
              )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-semibold text-lg text-foreground">{tool.name}</span>
              <span className="text-sm text-muted-foreground mt-1">{tool.description}</span>
            </div>
            <Link href={tool.href} passHref legacyBehavior>
              <a
                className="ml-4 flex items-center gap-1 text-primary bg-primary/10 group-hover:bg-primary group-hover:text-white rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={`Accéder à ${tool.name}`}
              >
                <span className="hidden md:inline">Générer</span>
                <ArrowRight className="size-5 ml-1" strokeWidth={2.2} />
              </a>
            </Link>

            {/* Soft gradient hover effect accent (optional) */}
            <span
              className="absolute left-[-16%] top-[-25%] w-2/3 h-[200%] rounded-[50%] pointer-events-none opacity-0 group-hover:opacity-50 transition-all duration-300"
              style={{
                background:
                  i % 2 === 0
                    ? "radial-gradient(circle at 35% 60%,rgba(99,102,241,0.11) 0%,rgba(255,255,255,0.01) 100%)"
                    : "radial-gradient(circle at 70% 30%,rgba(96,165,250,0.13) 0%,rgba(255,255,255,0.01) 100%)",
              }}
              aria-hidden
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

