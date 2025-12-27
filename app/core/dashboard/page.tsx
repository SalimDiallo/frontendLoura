"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePlus,
} from "react-icons/hi2";
import {
  authService,
  organizationService,
  categoryService,
} from "@/lib/services/core";
import type { Organization, Category, AdminUser } from "@/lib/types/core";
import { ApiError } from "@/lib/api/client";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { OrganizationCard } from "@/components/core/organization-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push(siteConfig.core.auth.login);
      return;
    }

    // Récupérer le message de l'URL
    const message = searchParams.get('message');
    if (message) {
      setInfoMessage(decodeURIComponent(message));
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [userData, orgsData, catsData] = await Promise.all([
        authService.getCurrentUser(),
        organizationService.getAll(),
        categoryService.getAll(),
      ]);

      setUser(userData);
      setOrganizations(orgsData);
      setCategories(catsData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.status === 401) {
          router.push(siteConfig.core.auth.login);
        }
      } else {
        setError("Erreur lors du chargement des données");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (org: Organization) => {
    try {
      if (org.is_active) {
        await organizationService.deactivate(org.id);
      } else {
        await organizationService.activate(org.id);
      }
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Erreur: ${err.message}`);
      }
    }
  };

  const handleEdit = (org: Organization) => {
    router.push(siteConfig.core.dashboard.organizations.edit(org.id));
  };

  const handleDelete = async (org: Organization) => {
    if (!confirm("Voulez-vous vraiment supprimer cette organisation ?")) {
      return;
    }

    try {
      await organizationService.delete(org.id);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Erreur: ${err.message}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 border-0 shadow-sm">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>

        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="size-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeOrgs = organizations.filter((o) => o.is_active).length;
  const inactiveOrgs = organizations.filter((o) => !o.is_active).length;

  return (
    <div className="space-y-6">
      {infoMessage && (
        <Alert variant="warning" onClose={() => setInfoMessage(null)}>
          {infoMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border bg-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Organisations
              </p>
              <p className="text-3xl font-semibold text-foreground mt-2">
                {organizations.length}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <HiOutlineBuildingOffice2 className="size-6 text-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border bg-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Actives
              </p>
              <p className="text-3xl font-semibold text-foreground mt-2">
                {activeOrgs}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <HiOutlineCheckCircle className="size-6 text-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border bg-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Inactives
              </p>
              <p className="text-3xl font-semibold text-muted-foreground mt-2">
                {inactiveOrgs}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <HiOutlineXCircle className="size-6 text-muted-foreground" />
            </div>
          </div>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Mes Organisations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos organisations et accédez à leurs tableaux de bord
          </p>
        </div>
        <Button
          onClick={() => router.push(siteConfig.core.dashboard.organizations.create)}
          className="gap-2"
        >
          <HiOutlinePlus className="size-4" />
          Nouvelle Organisation
        </Button>
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <Card className="p-12 text-center border bg-background">
          <div className="flex size-16 items-center justify-center rounded-lg bg-muted mx-auto mb-4">
            <HiOutlineBuildingOffice2 className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Aucune organisation
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Commencez par créer votre première organisation pour gérer vos activités
          </p>
          <Button
            onClick={() => router.push(siteConfig.core.dashboard.organizations.create)}
            className="gap-2"
          >
            <HiOutlinePlus className="size-4" />
            Créer une organisation
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
