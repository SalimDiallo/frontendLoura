"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Cette page redirige vers la page de paie principale avec l'onglet avances sélectionné
 * Le système de gestion des avances a été simplifié et intégré à la page principale
 */
export default function PayrollAdvancesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    // Redirection vers la page principale de paie
    router.replace(`/apps/${slug}/hr/payroll`);
  }, [slug, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="text-lg">Redirection...</div>
      </div>
    </div>
  );
}
