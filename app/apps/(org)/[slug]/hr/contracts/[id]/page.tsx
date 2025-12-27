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
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineDocument,
} from "react-icons/hi2";
import { Button, Card, Alert, Badge } from "@/components/ui";
import { contractService } from "@/lib/services/hr";
import type { Contract } from "@/lib/types/hr";
import { ProtectedRoute, Can } from "@/components/apps/common";
import { HR_ROUTE_PERMISSIONS } from "@/lib/config/route-permissions";
import { ResourceType, PermissionAction } from "@/lib/types/shared";

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  permanent: "CDI - Contrat à Durée Indéterminée",
  temporary: "CDD - Contrat à Durée Déterminée",
  contract: "Contractuel",
  internship: "Stage",
  freelance: "Freelance/Consultant",
};

const CONTRACT_TYPE_COLORS: Record<string, string> = {
  permanent: "bg-green-100 text-green-800 border-green-200",
  temporary: "bg-blue-100 text-blue-800 border-blue-200",
  contract: "bg-purple-100 text-purple-800 border-purple-200",
  internship: "bg-orange-100 text-orange-800 border-orange-200",
  freelance: "bg-pink-100 text-pink-800 border-pink-200",
};

const SALARY_PERIOD_LABELS: Record<string, string> = {
  hourly: "Horaire",
  daily: "Journalier",
  monthly: "Mensuel",
  annual: "Annuel",
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

  useEffect(() => {
    loadContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce contrat ?")) return;

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
      if (contract.is_active) {
        await contractService.deactivateContract(slug, id);
      } else {
        await contractService.activateContract(slug, id);
      }
      await loadContract();
    } catch (err) {
      alert("Erreur lors de la modification du statut");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-6">
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/contracts`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <HiOutlineDocumentText className="size-7" />
                Détails du contrat
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {contract.employee_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Can permission={`${ResourceType.CONTRACT}.${PermissionAction.UPDATE}`}>
              <Button variant="outline" onClick={handleToggleActive}>
                {contract.is_active ? (
                  <>
                    <HiOutlineXCircle className="size-4 mr-2" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle className="size-4 mr-2" />
                    Activer
                  </>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/apps/${slug}/hr/contracts/${id}/edit`}>
                  <HiOutlinePencil className="size-4 mr-2" />
                  Modifier
                </Link>
              </Button>
            </Can>
            <Can permission={`${ResourceType.CONTRACT}.${PermissionAction.DELETE}`}>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <HiOutlineTrash className="size-4 mr-2" />
                {deleting ? "Suppression..." : "Supprimer"}
              </Button>
            </Can>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <Badge className={CONTRACT_TYPE_COLORS[contract.contract_type] || ""}>
            {CONTRACT_TYPE_LABELS[contract.contract_type] || contract.contract_type}
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
        </div>

        {/* Main Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee & Contract Info */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HiOutlineUser className="size-5" />
              Informations générales
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Employé</label>
                <div className="font-medium mt-1">
                  <Link
                    href={`/apps/${slug}/hr/employees/${contract.employee}`}
                    className="text-primary hover:underline"
                  >
                    {contract.employee_name}
                  </Link>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Type de contrat</label>
                <div className="font-medium mt-1">
                  {CONTRACT_TYPE_LABELS[contract.contract_type] || contract.contract_type}
                </div>
              </div>
              {contract.description && (
                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <div className="text-sm mt-1 whitespace-pre-wrap">
                    {contract.description}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Dates */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HiOutlineCalendar className="size-5" />
              Période
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Date de début</label>
                <div className="font-medium mt-1">
                  {new Date(contract.start_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
              {contract.end_date && (
                <div>
                  <label className="text-sm text-muted-foreground">Date de fin</label>
                  <div className="font-medium mt-1">
                    {new Date(contract.end_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              )}
              {!contract.end_date && (
                <div>
                  <label className="text-sm text-muted-foreground">Durée</label>
                  <div className="font-medium mt-1">
                    Contrat à durée indéterminée
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Salary Information */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HiOutlineCurrencyDollar className="size-5" />
              Rémunération
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Salaire de base</label>
                <div className="text-2xl font-bold mt-1">
                  {contract.base_salary?.toLocaleString('fr-FR')} {contract.currency}
                </div>
                <div className="text-sm text-muted-foreground">
                  {SALARY_PERIOD_LABELS[contract.salary_period || 'monthly']}
                </div>
              </div>
            </div>
          </Card>

          {/* Work Hours */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HiOutlineClock className="size-5" />
              Temps de travail
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Heures par semaine</label>
                <div className="text-2xl font-bold mt-1">
                  {contract.hours_per_week || '-'} heures
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Contract File */}
        {contract.contract_file_url && (
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HiOutlineDocument className="size-5" />
              Document du contrat
            </h2>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Fichier du contrat signé
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={contract.contract_file_url} target="_blank" rel="noopener noreferrer">
                  <HiOutlineDocument className="size-4 mr-2" />
                  Voir le document
                </a>
              </Button>
            </div>
          </Card>
        )}

        {/* Metadata */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Créé le: </span>
              <span className="font-medium">
                {contract.created_at ? new Date(contract.created_at).toLocaleDateString('fr-FR') : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Modifié le: </span>
              <span className="font-medium">
                {contract.updated_at ? new Date(contract.updated_at).toLocaleDateString('fr-FR') : '-'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
