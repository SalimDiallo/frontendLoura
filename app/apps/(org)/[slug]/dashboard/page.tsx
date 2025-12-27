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
  Sparkles,
  Calendar,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickLinks = [
  {
    title: "Ressources Humaines",
    description: "Gérer les employés et la paie",
    href: "/hr",
    icon: Users,
    color: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    title: "Inventaire",
    description: "Stocks et mouvements",
    href: "/inventory",
    icon: Package,
    color: "bg-emerald-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  {
    title: "Rapports",
    description: "Analyses et statistiques",
    href: "/inventory/reports",
    icon: BarChart3,
    color: "bg-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-500/10",
  },
  {
    title: "Documents",
    description: "Devis et factures",
    href: "/inventory/documents",
    icon: Receipt,
    color: "bg-orange-500",
    bgLight: "bg-orange-50 dark:bg-orange-500/10",
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
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo */}
        <div className="relative mx-auto mb-8">
          {/* Decorative circles */}
          <div className="absolute inset-0 -m-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-primary/5 to-transparent animate-pulse" style={{ animationDuration: "3s" }} />
          </div>
          <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-xl" />
          
          {/* Logo container */}
          <div className="relative w-40 h-40 mx-auto rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/30 flex items-center justify-center transform hover:scale-105 transition-transform duration-300 overflow-hidden">
            {loading ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt={orgName}
                className="absolute inset-0 w-full h-full object-contain p-4"
              />
            ) : (
              <span className="text-6xl font-bold text-white tracking-tight">
                {orgName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Organization name */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
          {orgName}
        </h1>

        {/* Greeting */}
        <div className="flex items-center justify-center gap-2 text-xl text-muted-foreground mb-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <span>{greeting} !</span>
        </div>

        {/* Date */}
        <p className="text-sm text-muted-foreground/70 capitalize flex items-center justify-center gap-2">
          <Calendar className="h-4 w-4" />
          {currentTime}
        </p>
      </div>

      {/* Quick links */}
      <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <p className="text-center text-sm text-muted-foreground mb-6">
          Accès rapide
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <Link 
              key={link.title} 
              href={`/apps/${slug}${link.href}`}
              className="group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card className="p-5 h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  link.bgLight
                )}>
                  <link.icon className={cn("h-6 w-6", link.color.replace("bg-", "text-"))} />
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {link.description}
                </p>
                <div className="flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Accéder
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center animate-in fade-in duration-700 delay-300">
        <Link href={`/apps/${slug}/dashboard/settings`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </Link>
      </div>
    </div>
  );
}
