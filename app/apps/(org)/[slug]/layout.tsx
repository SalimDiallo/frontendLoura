"use client";

import { PropsWithChildren, useState, useEffect, useCallback } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/core/chat-sidebar";
import {
  Sparkles,
  Bell,
  Search,
  Command,
} from "lucide-react";
import { OrganisationSideBar } from "@/components/apps/orgs/org-sidebar";
import { PermissionProvider, OrgAccessGuard } from "@/components/apps/common";
import { ThemeToggle } from "@/components/ui";
import { QRScanFAB } from "@/components/apps/hr";
import { cn } from "@/lib/utils";
import { ArrowLeft, HelpCircle } from "lucide-react";

export default function OrganizationLayout({ children }: PropsWithChildren) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const slug = params.slug as string;
  const [chatOpen, setChatOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Raccourci global B pour retour en arrière
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignorer si on est dans un champ de saisie
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === "INPUT" || 
                         target.tagName === "TEXTAREA" || 
                         target.isContentEditable;
    
    if (isInputField) return;
    
    // B = Retour en arrière (navigation)
    if (e.key.toLowerCase() === "b" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      router.back();
    }
  }, [router]);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  if (!isMounted) {
    return null;
  }

  // Générer le titre de la page actuelle basé sur le pathname
  const getPageTitle = () => {
    const path = pathname.split("/").filter(Boolean);
    const lastSegment = path[path.length - 1];
    
    const titles: Record<string, string> = {
      dashboard: "Tableau de bord",
      hr: "Ressources Humaines",
      employees: "Employés",
      departments: "Départements",
      roles: "Rôles",
      payroll: "Paie",
      contracts: "Contrats",
      leaves: "Congés",
      attendance: "Pointage",
      compta: "Comptabilité",
      invoices: "Factures",
      payments: "Paiements",
      bank: "Banque",
      clients: "Clients",
      suppliers: "Fournisseurs",
      settings: "Paramètres",
    };

    return titles[lastSegment] || lastSegment?.charAt(0).toUpperCase() + lastSegment?.slice(1) || "Dashboard";
  };

  return (
    <OrgAccessGuard organizationSlug={slug}>
      <PermissionProvider organizationSlug={slug}>
        <SidebarProvider>
          <OrganisationSideBar />

          <SidebarInset className="bg-background">
            <header
              className={cn(
                "sticky top-0 z-40",
                "flex h-16 shrink-0 items-center gap-4",
                "px-4 sm:px-6",
                "bg-background/80 backdrop-blur-xl",
                "border-b border-border/40"
              )}
            >
              {/* Left section */}
              <div className="flex items-center gap-3">
                <SidebarTrigger className="size-9" />
                
                {/* Bouton retour */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="hidden sm:flex size-9 rounded-xl"
                  title="Retour (B)"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                
                {/* Separator */}
                <div className="hidden sm:block h-6 w-px bg-border/60" />
                
                {/* Page title */}
                <div className="hidden sm:block">
                  <h2 className="text-sm font-semibold text-foreground">
                    {getPageTitle()}
                  </h2>
                </div>
              </div>

              {/* Center section - Search (desktop) */}
              <div className="flex-1 flex justify-center">
                <button
                  className={cn(
                    "hidden md:flex items-center gap-3",
                    "w-full max-w-md",
                    "h-10 px-4",
                    "bg-muted/50 hover:bg-muted/80",
                    "border border-border/50 hover:border-border",
                    "rounded-xl",
                    "text-sm text-muted-foreground",
                    "transition-all duration-200",
                    "group"
                  )}
                >
                  <Search className="size-4 text-muted-foreground/70 group-hover:text-muted-foreground" />
                  <span className="flex-1 text-left">Rechercher...</span>
                  <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border/60 text-[10px] font-medium text-muted-foreground">
                    <Command className="size-3" />
                    <span>K</span>
                  </kbd>
                </button>
              </div>

              {/* Right section */}
              <div className="flex items-center gap-2">
                {/* Search button (mobile) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden size-9 rounded-xl"
                >
                  <Search className="size-4" />
                </Button>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative size-9 rounded-xl"
                >
                  <Bell className="size-4" />
                  {/* Notification badge */}
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
                </Button>

                {/* Theme toggle */}
                <ThemeToggle />

                {/* Separator */}
                <div className="h-6 w-px bg-border/60 mx-1" />

                {/* AI Assistant button */}
                <Button
                  variant={chatOpen ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChatOpen((prev) => !prev)}
                  className={cn(
                    "gap-2 h-9 px-3 rounded-xl transition-all duration-200",
                    chatOpen
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30"
                      : "hover:bg-accent"
                  )}
                  type="button"
                  aria-pressed={chatOpen}
                  aria-label={chatOpen ? "Fermer l'assistant IA" : "Ouvrir l'assistant IA"}
                >
                  <Sparkles
                    className={cn(
                      "size-4 transition-transform duration-300",
                      chatOpen && "rotate-12"
                    )}
                  />
                  <span className="hidden sm:inline text-sm font-medium">
                    {chatOpen ? "IA Active" : "Assistant"}
                  </span>
                  {chatOpen && (
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-white" />
                    </span>
                  )}
                </Button>
              </div>
            </header>

            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden">
              <main
                className={cn(
                  "flex-1 overflow-y-auto",
                  "p-4 sm:p-6 lg:p-8",
                  "bg-muted/30"
                )}
              >
                {/* Container avec max-width pour meilleure lisibilité */}
                <div className="mx-auto max-w-7xl">{children}</div>
              </main>

              <ChatSidebar open={chatOpen} onClose={() => setChatOpen(false)} />
            </div>

            {/* QR Scan Floating Action Button */}
            <QRScanFAB />
          </SidebarInset>
        </SidebarProvider>
      </PermissionProvider>
    </OrgAccessGuard>
  );
}