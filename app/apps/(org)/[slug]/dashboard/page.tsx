"use client";

import { API_CONFIG } from "@/lib/api/config";
import { organizationService } from "@/lib/services/core";
import type { Organization } from "@/lib/types/core";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Fonctions améliorées pour afficher l'heure précise + salutation dynamique
function getCreativeDateTimeInfo() {
  const now = new Date();

  // Formatage amélioré de la date, ex : "Mardi 2 avril 2024"
  const prettyDate = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Affichage de l'heure avec secondes "14:37:05"
  const time = now
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // Affichage de l'heure à la fois en numérique et en version parlée
  // (ex : "quatorze heures trente-sept" pour "14:37")
  function timeToText(date: Date) {
    const heures = date.getHours();
    const minutes = date.getMinutes();
    // Cartographie des valeurs de base, simplifiée
    const nums = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    function numToWord(n: number) {
      if (n < 20) return nums[n];
      if (n < 60) {
        const dizaine = ["", "", "vingt", "trente", "quarante", "cinquante"];
        let word = dizaine[Math.floor(n/10)];
        if (n % 10 === 1 && n < 60) return word + "-et-une";
        if (n % 10 !== 0) word += "-" + nums[n%10];
        return word;
      }
      return n;
    }
    return `${numToWord(heures)} heure${heures > 1 ? "s" : ""} ${minutes > 0 ? (minutes < 10 ? "zéro-" : "") + numToWord(minutes) + "" : ""}`.trim();
  }
  const timeSpoken = timeToText(now);

  // Salutation dynamique selon le moment de la journée, perfectionnée
  const hour = now.getHours();
  let greeting = "";
  if (hour < 6) greeting = "Bonne nuit";
  else if (hour < 12) greeting = "Bonjour";
  else if (hour < 18) greeting = "Bon après-midi";
  else if (hour < 22) greeting = "Bonsoir";
  else greeting = "Bonne nuit";

  // Ex : "Bonjour, il est 14:37:05 (quatorze heures trente-sept) – Mardi 2 avril 2024"
  return {
    prettyDate,
    time,
    timeSpoken,
    greeting,
    full: `${greeting}, il est ${time} (${timeSpoken}) – ${prettyDate}`,
  };
}

export default function OrganizationDashboardPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateTimeInfo, setDateTimeInfo] = useState(getCreativeDateTimeInfo());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Mettre à jour l'heure créative chaque seconde pour plus de fraîcheur
    const updateTime = () => setDateTimeInfo(getCreativeDateTimeInfo());
    updateTime();
    intervalRef.current = setInterval(updateTime, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    organizationService.getBySlug(slug as string)
      .then(setOrganization)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const formatOrgName = (name: string) =>
    name.replace(/-/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/(^|\s)\S/g, (l) => l.toUpperCase());
  const orgName = organization?.name || formatOrgName(slug as string);
  const logoUrl = organization?.logo
    ? organization.logo.startsWith("http")
      ? organization.logo
      : `${API_CONFIG.baseURL}/media/${organization.logo}`
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8 flex flex-col items-center justify-center bg-background">
      <div className="max-w-lg w-full flex flex-col items-center gap-6">
        {/* Agrandir le logo */}
        <div className="w-40 h-40 rounded-2xl border bg-background flex items-center justify-center overflow-hidden shadow-sm">
          {loading ? (
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
          ) : logoUrl ? (
            <img src={logoUrl} alt={orgName} className="w-full h-full object-contain p-3" />
          ) : (
            <span className="text-4xl font-semibold text-muted-foreground">
              {orgName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-semibold">{orgName}</h1>

        {/* Heure créative améliorée + salutation */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-mono tabular-nums">{dateTimeInfo.time}</span>
            <span className="text-xs text-muted-foreground ml-2 italic hidden md:inline">
              ({dateTimeInfo.timeSpoken})
            </span>
          </div>
          <div className="text-muted-foreground text-xs flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{dateTimeInfo.prettyDate}</span>
          </div>
          <div className="text-primary font-medium text-base">{dateTimeInfo.greeting} 👋</div>
        </div>

        <div className="bg-card border p-5 rounded-lg text-center w-full shadow-none">
          <p className="text-base text-muted-foreground">
            Accédez à la gestion de votre organisation ou à ses paramètres.
          </p>
        </div>
        {/* <Link href={`/apps/${slug}/dashboard/settings`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings className="h-4 w-4" />
            Paramètres
          </Button>
        </Link> */}
      </div>
    </div>
  );
}
