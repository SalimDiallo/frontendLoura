"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineDocument,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";
import { Button, Card, Alert, Badge } from "@/components/ui";
import { contractService } from "@/lib/services/hr";
import type { Contract } from "@/lib/types/hr";
import { ProtectedRoute, Can } from "@/components/apps/common";
import { HR_ROUTE_PERMISSIONS } from "@/lib/config/route-permissions";
import { ResourceType, PermissionAction } from "@/lib/types/shared";
import { API_CONFIG } from "@/lib/api/config";

const CONTRACT_TYPE_INFO: Record<string, { label: string; description: string; color: string }> = {
  permanent: { label: "CDI", description: "Contrat à Durée Indéterminée", color: "bg-green-100 text-green-800 border-green-200" },
  temporary: { label: "CDD", description: "Contrat à Durée Déterminée", color: "bg-blue-100 text-blue-800 border-blue-200" },
  contract: { label: "Contractuel", description: "Contrat de prestation", color: "bg-purple-100 text-purple-800 border-purple-200" },
  internship: { label: "Stage", description: "Convention de stage", color: "bg-orange-100 text-orange-800 border-orange-200" },
  freelance: { label: "Freelance", description: "Consultant indépendant", color: "bg-pink-100 text-pink-800 border-pink-200" },
};

const SALARY_PERIOD_LABELS: Record<string, string> = {
  hourly: "h",
  daily: "jour",
  monthly: "mois",
  annual: "an",
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadContract();
  }, [slug, id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractService.getContract(slug, id);
      setContract(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement du contrat";
      setError(errorMessage);
      console.error('Error loading contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("⚠️ Supprimer ce contrat ?\n\nCette action est irréversible.")) return;

    try {
      setDeleting(true);
      await contractService.deleteContract(slug, id);
      router.push(`/apps/${slug}/hr/contracts`);
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
      setDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!contract) return;

    try {
      setToggling(true);
      if (contract.is_active) {
        if (!confirm("Désactiver ce contrat ?")) return;
        await contractService.deactivateContract(slug, id);
      } else {
        const confirmMessage = `Activer ce contrat ?\n\n⚠️ Les autres contrats actifs de ${contract.employee_name || "cet employé"} seront automatiquement désactivés.`;
        if (!confirm(confirmMessage)) return;
        await contractService.activateContract(slug, id);
      }
      await loadContract();
    } catch (err: any) {
      alert(err?.message || "Erreur lors de la modification du statut");
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${API_CONFIG.baseURL}/hr/contracts/${id}/export-pdf/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Contrat_${contract?.employee_name?.replace(' ', '_')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert("Erreur lors de l'export PDF");
    }
  };

  const contractTypeInfo = contract ? CONTRACT_TYPE_INFO[contract.contract_type] : null;
  const isExpired = contract?.is_expired || (contract?.end_date && new Date(contract.end_date) < new Date());

  // Calcul de la durée du contrat
  const getDuration = () => {
    if (!contract) return null;
    const start = new Date(contract.start_date);
    const end = contract.end_date ? new Date(contract.end_date) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} jours`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`;
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return months > 0 ? `${years} an${years > 1 ? 's' : ''} et ${months} mois` : `${years} an${years > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-48 bg-muted rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="error">{error || "Contrat non trouvé"}</Alert>
        <Button asChild>
          <Link href={`/apps/${slug}/hr/contracts`}>
            <HiOutlineArrowLeft className="size-4 mr-2" />
            Retour à la liste
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute config={HR_ROUTE_PERMISSIONS['/hr/contracts/:id']}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" asChild className="mt-1">
              <Link href={`/apps/${slug}/hr/contracts`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`text-sm px-3 py-1 ${contractTypeInfo?.color || ''}`}>
                  {contractTypeInfo?.label || contract.contract_type}
                </Badge>
                {contract.is_active ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <HiOutlineCheckCircle className="size-3 mr-1" />
                    Actif
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">
                    <HiOutlineXCircle className="size-3 mr-1" />
                    Inactif
                  </Badge>
                )}
                {isExpired && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    Expiré
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Contrat de {contract.employee_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {contractTypeInfo?.description} • Créé le {new Date(contract.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Can permission={`${ResourceType.CONTRACT}.${PermissionAction.UPDATE}`}>
              <Button 
                variant="outline" 
                onClick={handleToggleActive}
                disabled={toggling}
                className={contract.is_active ? "text-amber-600 border-amber-300" : "text-green-600 border-green-300"}
              >
                {toggling ? (
                  <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : contract.is_active ? (
                  <HiOutlineXCircle className="size-4 mr-2" />
                ) : (
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                )}
                {contract.is_active ? "Désactiver" : "Activer"}
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/apps/${slug}/hr/contracts/${id}/edit`}>
                  <HiOutlinePencil className="size-4 mr-2" />
                  Modifier
                </Link>
              </Button>
            </Can>
          </div>
        </div>

        {/* Main Card - Résumé */}
        <Card className={`p-6 border-0 shadow-sm ${contract.is_active ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Salaire */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground mb-1">
                <HiOutlineBanknotes className="size-4" />
                Salaire
              </div>
              <div className="text-3xl font-bold">
                {contract.base_salary?.toLocaleString('fr-FR')}
                <span className="text-lg font-normal text-muted-foreground ml-1">
                  {contract.currency}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                par {SALARY_PERIOD_LABELS[contract.salary_period || 'monthly']}
              </div>
            </div>

            {/* Durée */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                <HiOutlineCalendar className="size-4" />
                Durée
              </div>
              <div className="text-3xl font-bold">
                {getDuration()}
              </div>
              <div className="text-sm text-muted-foreground">
                depuis le {new Date(contract.start_date).toLocaleDateString('fr-FR')}
              </div>
            </div>

            {/* Heures */}
            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end gap-2 text-sm text-muted-foreground mb-1">
                <HiOutlineClock className="size-4" />
                Temps de travail
              </div>
              <div className="text-3xl font-bold">
                {contract.hours_per_week || 40}
                <span className="text-lg font-normal text-muted-foreground ml-1">h</span>
              </div>
              <div className="text-sm text-muted-foreground">
                par semaine
              </div>
            </div>
          </div>
        </Card>

        {/* Détails */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employé */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <HiOutlineUser className="size-4" />
              EMPLOYÉ
            </div>
            <Link 
              href={`/apps/${slug}/hr/employees/${contract.employee}`}
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                {contract.employee_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{contract.employee_name}</div>
                <div className="text-sm text-muted-foreground">Voir le profil</div>
              </div>
              <HiOutlineArrowTopRightOnSquare className="size-4 text-muted-foreground" />
            </Link>
          </Card>

          {/* Période */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <HiOutlineCalendar className="size-4" />
              PÉRIODE
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date de début</span>
                <span className="font-medium">
                  {new Date(contract.start_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date de fin</span>
                <span className="font-medium">
                  {contract.end_date ? (
                    new Date(contract.end_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  ) : (
                    <span className="text-green-600">Indéterminée (CDI)</span>
                  )}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Description */}
        {contract.description && (
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <HiOutlineDocumentText className="size-4" />
              NOTES
            </div>
            <p className="text-sm whitespace-pre-wrap">{contract.description}</p>
          </Card>
        )}

        {/* Document & Actions */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HiOutlineDocument className="size-4" />
              DOCUMENT
            </div>
            <div className="flex gap-2">
              {contract.contract_file_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={contract.contract_file_url} target="_blank" rel="noopener noreferrer">
                    <HiOutlineArrowTopRightOnSquare className="size-4 mr-2" />
                    Voir le document
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <HiOutlineDocument className="size-4 mr-2" />
                Exporter en PDF
              </Button>
            </div>
          </div>
          
          {!contract.contract_file_url && (
            <p className="text-sm text-muted-foreground mt-4">
              Aucun document attaché à ce contrat.
            </p>
          )}
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Dernière modification : {new Date(contract.updated_at).toLocaleDateString('fr-FR')} à {new Date(contract.updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          <Can permission={`${ResourceType.CONTRACT}.${PermissionAction.DELETE}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <HiOutlineTrash className="size-4 mr-2" />
              {deleting ? "Suppression..." : "Supprimer ce contrat"}
            </Button>
          </Can>
        </div>
      </div>
    </ProtectedRoute>
  );
}
