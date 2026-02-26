"use client";

import { Can } from "@/components/apps/common";
import { ActionConfirmation, DeleteConfirmation } from "@/components/common/confirmation-dialog";
import { ContractDocumentActions } from "@/components/hr/contracts/contract/ContractDocumentActions";
import { ContractEmployeeCard } from "@/components/hr/contracts/contract/ContractEmployeeCard";
import { ContractFooterActions } from "@/components/hr/contracts/contract/ContractFooterActions";
import { ContractHeader } from "@/components/hr/contracts/contract/ContractHeader";
import { ContractNotes } from "@/components/hr/contracts/contract/ContractNotes";
import { ContractPeriodCard } from "@/components/hr/contracts/contract/ContractPeriodCard";
import { ContractSummary } from "@/components/hr/contracts/contract/ContractSummuray";
import { Alert, Button } from "@/components/ui";
import { PDFPreviewWrapper } from "@/components/ui/pdf-preview";
import { usePDF } from "@/lib/hooks/usePDF";
import { contractService } from "@/lib/services/hr";
import type { Contract } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi2";

const CONTRACT_TYPE_INFO: Record<string, { label: string; description: string; color: string }> = {
  permanent: { label: "CDI", description: "Contrat à Durée Indéterminée", color: "bg-green-100 text-green-800 border-green-200" },
  temporary: { label: "CDD", description: "Contrat à Durée Déterminée", color: "bg-blue-100 text-blue-800 border-blue-200" },
  contract: { label: "Contractuel", description: "Contrat de prestation", color: "bg-purple-100 text-purple-800 border-purple-200" },
  internship: { label: "Stage", description: "Convention de stage", color: "bg-orange-100 text-orange-800 border-orange-200" },
  freelance: { label: "Freelance", description: "Consultant indépendant", color: "bg-pink-100 text-pink-800 border-pink-200" },
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirmation dialog state for delete and toggle active
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [toggleType, setToggleType] = useState<"deactivate" | "activate" | null>(null);

  const { preview, download, previewState, closePreview } = usePDF();

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

  // Open delete confirmation dialog
  const handleDeleteRequest = () => setDeleteDialogOpen(true);

  // Open activate/deactivate confirmation dialog
  const handleToggleRequest = () => {
    if (!contract) return;
    setToggleType(contract.is_active ? "deactivate" : "activate");
    setToggleDialogOpen(true);
  };

  // Confirmed delete logic
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await contractService.deleteContract(slug, id);
      router.push(`/apps/${slug}/hr/contracts`);
    } catch (err) {
      // Optionally could show an Alert UI here.
      alert("Erreur lors de la suppression");
      console.error(err);
      setDeleting(false);
    }
  };

  // Confirmed toggle logic
  const handleConfirmToggleActive = async () => {
    if (!contract) return;
    try {
      setToggling(true);
      if (contract.is_active) {
        await contractService.deactivateContract(slug, id);
      } else {
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

  const handlePreviewPDF = () => {
    if (!contract) return;
    preview(
      `/hr/contracts/${id}/export-pdf/`,
      `Contrat - ${contract.employee_name}`,
      `Contrat_${contract.employee_name?.replace(/\s+/g, '_')}.pdf`
    );
  };

  const handleDownloadPDF = () => {
    if (!contract) return;
    download(
      `/hr/contracts/${id}/export-pdf/`,
      `Contrat_${contract.employee_name?.replace(/\s+/g, '_')}.pdf`
    );
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
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS} showMessage>
      <div className="max-w-4xl mx-auto space-y-6">
        <ContractHeader
          contract={contract}
          contractTypeInfo={contractTypeInfo}
          isExpired={!!isExpired}
          slug={slug}
          id={id}
          toggling={toggling}
          // Use request handler for opening action dialog
          handleToggleActive={handleToggleRequest}
        />

        <ContractSummary contract={contract} getDuration={getDuration} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ContractEmployeeCard
            employeeId={contract.employee}
            employeeName={contract.employee_name}
            slug={slug}
          />
          <ContractPeriodCard
            startDate={contract.start_date}
            endDate={contract.end_date}
          />
        </div>

        <ContractNotes description={contract.description} />

        <ContractDocumentActions
          contract={contract}
          handlePreviewPDF={handlePreviewPDF}
          handleDownloadPDF={handleDownloadPDF}
        />

        <Can permission={COMMON_PERMISSIONS.HR.DELETE_CONTRACTS}>
          <ContractFooterActions
            updatedAt={contract.updated_at}
            canDelete={true}
            handleDelete={handleDeleteRequest}
            deleting={deleting}
          />
        </Can>
      </div>

      {/* PDF Preview Modal */}
      <PDFPreviewWrapper
        previewState={previewState}
        onClose={closePreview}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteDialogOpen}
        onOpenChange={open => setDeleteDialogOpen(open)}
        itemName={contract.employee_name || ""}
        onConfirm={async () => {
          await handleConfirmDelete();
          setDeleteDialogOpen(false);
        }}
        loading={deleting}
        title="Confirmer la suppression"
        description={
          contract.employee_name
            ? `Êtes-vous sûr de vouloir supprimer le contrat de "${contract.employee_name}" ? Cette action est irréversible.`
            : `Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.`
        }
      />

      {/* Toggle Activate/Deactivate Confirmation Dialog */}
      <ActionConfirmation
        open={toggleDialogOpen}
        onOpenChange={open => setToggleDialogOpen(open)}
        action={{
          label: contract.is_active
            ? "Désactiver"
            : "Activer",
          variant: contract.is_active ? "destructive" : "default",
          icon: contract.is_active ? "warning" : "info"
        }}
        target={contract.employee_name || ""}
        description={
          !contract.is_active
            ? `Activer ce contrat ?\n\n⚠️ Les autres contrats actifs de ${contract.employee_name || "cet employé"} seront automatiquement désactivés.`
            : undefined
        }
        onConfirm={async () => {
          await handleConfirmToggleActive();
          setToggleDialogOpen(false);
        }}
        loading={toggling}
      />

    </Can>
  );
}
