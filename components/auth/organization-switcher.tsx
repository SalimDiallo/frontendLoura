'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { useUser } from '@/lib/hooks';
import { authService } from '@/lib/services/auth/auth.service';
import { cn } from '@/lib/utils';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  is_primary: boolean;
}

export function OrganizationSwitcher() {
  const router = useRouter();
  const user = useUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Charger les organisations au montage
  useEffect(() => {
    loadOrganizations();
  }, []);

  // Mettre à jour l'organisation courante quand l'utilisateur change
  useEffect(() => {
    if (user?.organization && organizations.length > 0) {
      const current = organizations.find(
        (org) => org.id === user.organization?.id
      );
      if (current) {
        setCurrentOrg(current);
      }
    }
  }, [user, organizations]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await authService.getMyOrganizations();
      setOrganizations(response.organizations);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchOrganization = async (org: Organization) => {
    if (org.id === currentOrg?.id) return;

    try {
      setSwitching(true);
      await authService.switchOrganization(org.id);

      toast.success(`Basculement vers ${org.name} réussi`);

      // Rediriger vers le dashboard de la nouvelle organisation
      router.push(`/apps/${org.subdomain}/dashboard`);

      // Forcer le rechargement de la page pour rafraîchir toutes les données
      router.refresh();
    } catch (error: any) {
      console.error('Error switching organization:', error);
      toast.error(
        error.message || 'Erreur lors du changement d\'organisation'
      );
    } finally {
      setSwitching(false);
    }
  };

  // Si une seule organisation, ne pas afficher le switcher
  if (organizations.length <= 1) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2',
          'hover:bg-muted transition-colors',
          'border border-border',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring',
          switching && 'pointer-events-none opacity-50'
        )}
        disabled={switching}
      >
        {currentOrg?.logo_url ? (
          <div className="h-6 w-6 rounded overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={currentOrg.logo_url}
              alt={currentOrg.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
        )}
        <span className="text-sm font-medium truncate max-w-[150px]">
          {currentOrg?.name || 'Organisation'}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Mes organisations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrganization(org)}
            className="flex items-center gap-3 cursor-pointer"
          >
            {org.logo_url ? (
              <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{org.name}</span>
                {org.is_primary && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 flex-shrink-0">
                    Principal
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate block">
                @{org.subdomain}
              </span>
            </div>

            {org.id === currentOrg?.id && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
