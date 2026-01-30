"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { organizationService } from "@/lib/services/core";
import type { Organization } from "@/lib/types/core";
import { API_CONFIG } from "@/lib/api/config";
import {
  Users,
  Package,
  BarChart3,
  Receipt,
  Settings,
  ArrowRight,
  Calendar,
  Loader2,
} from "lucide-react";

const quickLinks = [
  {
    title: "Ressources Humaines",
    description: "Gérer les employés et la paie",
    href: "/hr",
    icon: Users,
  },
  {
    title: "Inventaire",
    description: "Stocks et mouvements",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Rapports",
    description: "Analyses et statistiques",
    href: "/inventory/reports",
    icon: BarChart3,
  },
  {
    title: "Documents",
    description: "Devis et factures",
    href: "/inventory/documents",
    icon: Receipt,
  },
];

export default function OrganizationDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Bonjour");
  const [currentTime, setCurrentTime] = useState("");

  // Load organization data
  useEffect(() => {
    const loadOrg = async () => {
      try {
        const org = await organizationService.getBySlug(slug);
        setOrganization(org);
      } catch (err) {
        console.error("Error loading organization:", err);
      } finally {
        setLoading(false);
      }
    };
    loadOrg();
  }, [slug]);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting("Bonjour");
      else if (hour >= 12 && hour < 18) setGreeting("Bon après-midi");
      else setGreeting("Bonsoir");
    };

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }));
    };

    updateGreeting();
    updateTime();
    const interval = setInterval(() => {
      updateGreeting();
      updateTime();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatOrgName = (name: string) => {
    return name
      .replace(/-/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const orgName = organization?.name || formatOrgName(slug);
  const logoUrl = organization?.logo 
    ? (organization.logo.startsWith('http') ? organization.logo : `${API_CONFIG.baseURL}/media/${organization.logo}`)
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
      {/* Hero Section */}
      <div className="text-center mb-12">
        {/* Logo */}
        <div className="mx-auto mb-8">
          <div className="w-48 h-48 mx-auto rounded-2xl border border-border bg-background flex items-center justify-center overflow-hidden">
            {loading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt={orgName}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <span className="text-5xl font-medium text-foreground">
                {orgName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Organization name */}
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          {orgName}
        </h1>

        {/* Greeting */}
        <p className="text-lg text-muted-foreground mb-1">
          {greeting}
        </p>

        {/* Date */}
        <p className="text-sm text-muted-foreground capitalize flex items-center justify-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {currentTime}
        </p>
      </div>

      {/* Quick links */}
      <div className="w-full max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-4">
          Accès rapide
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link 
              key={link.title} 
              href={`/apps/${slug}${link.href}`}
              className="group"
            >
              <Card className="p-4 h-full border hover:border-primary/50 transition-colors bg-card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <link.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground mb-0.5 group-hover:text-primary transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10">
        <Link href={`/apps/${slug}/dashboard/settings`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
            <Settings className="h-4 w-4" />
            Paramètres
          </Button>
        </Link>
      </div>
    </div>
  );
}
