"use client";

import { Can, usePermissionContext } from "@/components/apps/common";
import { Button, Card } from "@/components/ui";
import { API_CONFIG } from "@/lib/api/config";
import { useModules } from "@/lib/contexts";
import { organizationService } from "@/lib/services/core";
import type { Organization } from "@/lib/types/core";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import {
  ArrowRight,
  Building2,
  Calendar,
  Loader2,
  Settings,
} from "lucide-react";
import {
  HiOutlineArchiveBox,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineBriefcase,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineIdentification,
  HiOutlineReceiptPercent,
  HiOutlineShoppingCart,
  HiOutlineSquares2X2,
  HiOutlineTag,
  HiOutlineTruck,
  HiOutlineUsers,
} from "react-icons/hi2";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Types
interface DashboardSection {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  module?: string;
}

interface DashboardModule {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: DashboardSection[];
  module?: string;
}

export default function OrganizationDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();
  const { isModuleActive, loading: modulesLoading } = useModules();
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
      setCurrentTime(
        now.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
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
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const orgName = organization?.name || formatOrgName(slug);
  const logoUrl = organization?.logo
    ? organization.logo.startsWith("http")
      ? organization.logo
      : `${API_CONFIG.baseURL}/media/${organization.logo}`
    : null;

  // Définition des modules et leurs sections
  const allModules: DashboardModule[] = useMemo(
    () => [
      // MODULE RH
      {
        title: "Ressources Humaines",
        icon: HiOutlineUsers,
        module: "hr",
        sections: [
          {
            title: "Vue d'ensemble RH",
            description: "Tableau de bord et statistiques RH",
            href: `/apps/${slug}/hr`,
            icon: HiOutlineSquares2X2,
            anyPermissions: [
              COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
              COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS,
            ],
            module: "hr.employees",
          },
          {
            title: "Départements & Postes",
            description: "Gestion des départements et postes",
            href: `/apps/${slug}/hr/departments`,
            icon: Building2,
            anyPermissions: [
              COMMON_PERMISSIONS.HR.VIEW_DEPARTMENTS,
              COMMON_PERMISSIONS.HR.VIEW_POSITIONS,
            ],
            module: "hr.employees",
          },
          {
            title: "Employés",
            description: "Gestion des employés",
            href: `/apps/${slug}/hr/employees`,
            icon: HiOutlineUsers,
            permission: COMMON_PERMISSIONS.HR.VIEW_EMPLOYEES,
            module: "hr.employees",
          },
          {
            title: "Rôles & Permissions",
            description: "Gestion des rôles et permissions",
            href: `/apps/${slug}/hr/roles`,
            icon: HiOutlineBriefcase,
            permission: COMMON_PERMISSIONS.HR.VIEW_ROLES,
            module: "hr.permissions",
          },
          {
            title: "Paie",
            description: "Gestion de la paie",
            href: `/apps/${slug}/hr/payroll`,
            icon: HiOutlineDocumentCurrencyDollar,
            module: "hr.payroll",
          },
          {
            title: "Contrats",
            description: "Gestion des contrats",
            href: `/apps/${slug}/hr/contracts`,
            icon: HiOutlineIdentification,
            permission: COMMON_PERMISSIONS.HR.VIEW_CONTRACTS,
            module: "hr.contracts",
          },
          {
            title: "Congés",
            description: "Gestion des congés et absences",
            href: `/apps/${slug}/hr/leaves`,
            icon: HiOutlineBriefcase,
            module: "hr.leave",
          },
          {
            title: "Pointage",
            description: "Gestion du pointage",
            href: `/apps/${slug}/hr/attendance`,
            icon: HiOutlineClock,
            module: "hr.attendance",
          },
        ],
      },
      // MODULE INVENTAIRE
      {
        title: "Gestion des Stocks",
        icon: HiOutlineCube,
        module: "inventory",
        sections: [
          {
            title: "Tableau de bord Inventaire",
            description: "Vue d'ensemble des stocks",
            href: `/apps/${slug}/inventory`,
            icon: HiOutlineSquares2X2,
            module: "inventory.products",
          },
          {
            title: "Caisse",
            description: "Point de vente rapide",
            href: `/apps/${slug}/inventory/sales/quick`,
            icon: HiOutlineShoppingCart,
            permission: COMMON_PERMISSIONS.INVENTORY.CREATE_SALES,
            module: "inventory.sales",
          },
          {
            title: "Ventes",
            description: "Historique et gestion des ventes",
            href: `/apps/${slug}/inventory/sales`,
            icon: HiOutlineReceiptPercent,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_SALES,
            module: "inventory.sales",
          },
          {
            title: "Créances",
            description: "Gestion des crédits clients",
            href: `/apps/${slug}/inventory/credit-sales`,
            icon: HiOutlineBanknotes,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_SALES,
            module: "inventory.sales",
          },
          {
            title: "Approvisionnement",
            description: "Commandes fournisseurs",
            href: `/apps/${slug}/inventory/orders`,
            icon: HiOutlineTruck,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_ORDERS,
            module: "inventory.purchases",
          },
          {
            title: "Dépenses",
            description: "Suivi des dépenses",
            href: `/apps/${slug}/inventory/expenses`,
            icon: HiOutlineCurrencyDollar,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_EXPENSES,
            module: "inventory.purchases",
          },
          {
            title: "Produits",
            description: "Catalogue de produits",
            href: `/apps/${slug}/inventory/products`,
            icon: HiOutlineCube,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
            module: "inventory.products",
          },
          {
            title: "Catégories",
            description: "Classification des produits",
            href: `/apps/${slug}/inventory/categories`,
            icon: HiOutlineTag,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_CATEGORIES,
            module: "inventory.products",
          },
          {
            title: "Entrepôts",
            description: "Gestion des entrepôts",
            href: `/apps/${slug}/inventory/warehouses`,
            icon: HiOutlineArchiveBox,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_WAREHOUSES,
            module: "inventory.warehouses",
          },
          {
            title: "Mouvements de Stock",
            description: "Suivi des mouvements",
            href: `/apps/${slug}/inventory/movements`,
            icon: HiOutlineArrowPath,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK,
            module: "inventory.movements",
          },
          {
            title: "Clients",
            description: "Base de données clients",
            href: `/apps/${slug}/inventory/customers`,
            icon: HiOutlineUsers,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_CUSTOMERS,
            module: "inventory.sales",
          },
          {
            title: "Fournisseurs",
            description: "Gestion des fournisseurs",
            href: `/apps/${slug}/inventory/suppliers`,
            icon: HiOutlineBriefcase,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_SUPPLIERS,
            module: "inventory.purchases",
          },
          {
            title: "Documents",
            description: "Proforma et factures",
            href: `/apps/${slug}/inventory/documents`,
            icon: HiOutlineDocumentText,
            permission: COMMON_PERMISSIONS.INVENTORY.MANAGE_DOCUMENTS,
            module: "inventory.sales",
          },
          {
            title: "Bons de livraison",
            description: "Gestion des livraisons",
            href: `/apps/${slug}/inventory/documents/delivery-notes`,
            icon: HiOutlineTruck,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_SALES,
            module: "inventory.sales",
          },
          {
            title: "Inventaire",
            description: "Comptage des stocks",
            href: `/apps/${slug}/inventory/stock-counts`,
            icon: HiOutlineDocumentText,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK_COUNTS,
            module: "inventory.movements",
          },
          {
            title: "Alertes",
            description: "Alertes de stock",
            href: `/apps/${slug}/inventory/alerts`,
            icon: HiOutlineExclamationTriangle,
            allPermissions: [
              COMMON_PERMISSIONS.INVENTORY.VIEW_STOCK,
              COMMON_PERMISSIONS.INVENTORY.VIEW_SALES,
            ],
            module: "inventory.reports",
          },
          {
            title: "Rapports",
            description: "Analyses et statistiques",
            href: `/apps/${slug}/inventory/reports`,
            icon: HiOutlineChartBar,
            permission: COMMON_PERMISSIONS.INVENTORY.VIEW_REPORTS,
            module: "inventory.reports",
          },
        ],
      },
    ],
    [slug]
  );

  // Filtrer les sections en fonction des permissions et modules
  const filterSection = (section: DashboardSection): boolean => {
    // Vérifier les permissions
    let hasAccess = true;
    if (section.permission) {
      hasAccess = hasPermission(section.permission);
    } else if (section.anyPermissions && section.anyPermissions.length > 0) {
      hasAccess = hasAnyPermission(section.anyPermissions);
    } else if (section.allPermissions && section.allPermissions.length > 0) {
      hasAccess = hasAllPermissions(section.allPermissions);
    }

    // Si pas d'accès par permission, retourner false
    if (!hasAccess) return false;

    // Vérifier le module
    if (section.module && !modulesLoading) {
      return isModuleActive(section.module);
    }

    return true;
  };

  // Filtrer les modules et leurs sections
  const visibleModules = useMemo(() => {
    return allModules
      .map((mod) => ({
        ...mod,
        sections: mod.sections.filter(filterSection),
      }))
      .filter((mod) => mod.sections.length > 0);
  }, [allModules, hasPermission, hasAnyPermission, hasAllPermissions, isModuleActive, modulesLoading]);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="w-32 h-32 rounded-2xl border-2 border-border bg-background flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {loading ? (
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              ) : logoUrl ? (
                <img src={logoUrl} alt={orgName} className="w-full h-full object-contain p-4" />
              ) : (
                <span className="text-4xl font-bold text-foreground">
                  {orgName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">{orgName}</h1>
              <p className="text-base text-muted-foreground">{greeting}</p>
              <p className="text-sm text-muted-foreground capitalize flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {currentTime}
              </p>
            </div>
          </div>

          <Link href={`/apps/${slug}/dashboard/settings`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings className="h-4 w-4" />
              Paramètres
            </Button>
          </Link>
        </div>

        {/* Modules et leurs sections */}
        {modulesLoading ? (
          <div className="flex items-center justify-center h-60">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Chargement des modules...</p>
            </div>
          </div>
        ) : visibleModules.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-2">Aucun module accessible</p>
            <p className="text-sm text-muted-foreground">
              Contactez votre administrateur pour obtenir des accès.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleModules.map((module) => (
              <div key={module.title}>
                {/* Module Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <module.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">{module.title}</h2>
                  <div className="flex-1 h-px bg-border ml-4" />
                </div>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {module.sections.map((section) => (
                    <Link key={section.href} href={section.href} className="group">
                      <Card className="p-4 h-full border hover:border-primary/50 hover:shadow-sm transition-all bg-card">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <section.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                              {section.title}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {section.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
