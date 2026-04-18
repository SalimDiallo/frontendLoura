'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services/auth/auth.service';
import { OrganizationSelector } from '@/components/auth/organization-selector';
import { Alert } from '@/components/ui';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  is_primary: boolean;
  employment_status?: string;
  hire_date?: string;
  department?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    title: string;
  };
  assigned_role?: {
    id: string;
    code: string;
    name: string;
  };
}

export default function SelectOrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Charger les organisations au montage
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.getMyOrganizations();
      setOrganizations(response.organizations);

      // Auto-sélectionner l'organisation primaire
      const primaryOrg = response.organizations.find((org) => org.is_primary);
      if (primaryOrg) {
        setSelectedId(primaryOrg.id);
      }

      // Si une seule organisation, auto-sélection
      if (response.organizations.length === 1) {
        handleSelectOrganization(response.organizations[0].id);
      }
    } catch (err: any) {
      console.error('Error loading organizations:', err);
      setError(
        err.message ||
          'Erreur lors du chargement des organisations. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganization = async (organizationId: string) => {
    try {
      setSelecting(true);
      setSelectedId(organizationId);

      const response = await authService.selectOrganization(organizationId);

      // Trouver l'organisation sélectionnée pour le message
      const selectedOrg = organizations.find((org) => org.id === organizationId);

      toast.success(
        `Bienvenue dans ${selectedOrg?.name || 'votre organisation'} !`
      );

      // Rediriger vers le dashboard de l'organisation
      const subdomain = response.user.organization?.subdomain;
      if (subdomain) {
        router.push(`/apps/${subdomain}/dashboard`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Error selecting organization:', err);
      toast.error(
        err.message || 'Erreur lors de la sélection de l\'organisation'
      );
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Chargement de vos organisations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-4xl">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <OrganizationSelector
          organizations={organizations}
          onSelect={handleSelectOrganization}
          selectedId={selectedId || undefined}
          loading={selecting}
          title="Sélectionnez votre organisation"
          description="Vous êtes membre de plusieurs organisations. Choisissez celle dans laquelle vous souhaitez vous connecter."
        />

        {selecting && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="font-medium">Connexion en cours...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Veuillez patienter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
