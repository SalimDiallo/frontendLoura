"use client";

import { Can } from "@/components/apps/common";
import { ActionConfirmation, DeleteConfirmation } from "@/components/common/confirmation-dialog";
import { ContractsHeader } from "@/components/hr/contracts/ContractsHeader";
import { ContractsSearchFilter } from "@/components/hr/contracts/ContractsSearchFilter";
import { ContractsStatsCards } from "@/components/hr/contracts/ContractsStatsCards";
import { ContractsTable } from "@/components/hr/contracts/ContractsTable";
import { Alert, PDFPreviewWrapper } from "@/components/ui";
import { KeyboardHint, ShortcutsHelpModal } from "@/components/ui/shortcuts-help";
import { usePDF, useUser } from '@/lib/hooks';
import { KeyboardShortcut, commonShortcuts, useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { contractService } from "@/lib/services/hr";
import type { Contract } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function ContractsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const user = useUser();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  // Confirmation dialogs states for activate/deactivate
  const [actDialogOpen, setActDialogOpen] = useState(false);
  const [actTarget, setActTarget] = useState<Contract | null>(null);
  const [actLoading, setActLoading] = useState(false);

  const { preview, previewState, closePreview, } = usePDF({
    onSuccess: () => {},
    onError: (err) => setError(err),
  });

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractService.getContracts(slug, {
        contract_type: filterType || undefined,
        is_active: filterActive !== null ? filterActive : undefined,
      });
      setContracts(data.results || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des contrats";
      setError(errorMessage);
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name?: string) => {
    setDeleting(id);
    setDeletingName(name || "");
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await contractService.deleteContract(slug, deleting);
      await loadContracts();
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
      setDeletingName(null);
    }
  };

  const handleToggleActive = (contract: Contract) => {
    setActTarget(contract);
    setActDialogOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!actTarget) return;
    setActLoading(true);
    try {
      if (actTarget.is_active) {
        await contractService.deactivateContract(slug, actTarget.id);
      } else {
        await contractService.activateContract(slug, actTarget.id);
      }
      await loadContracts();
    } catch (err: any) {
      const message = err?.message || "Erreur lors de la modification du statut";
      alert(message);
      console.error(err);
    } finally {
      setActLoading(false);
      setActDialogOpen(false);
      setActTarget(null);
    }
  };

  const handlePreviewPDF = async (contractId: string, employeeName: string) => {
    preview(
      `/hr/contracts/${contractId}/export-pdf/`,
      `Contrat - ${employeeName}`,
      `Contrat_${employeeName.replace(/\s+/g, '_')}.pdf`,
    );
  };

  const filteredContracts = contracts.filter((contract) => {
    // Exclure le contrat si l'employé est l'utilisateur courant
    if (contract.employee === user?.id) return false;
    const searchString = `${contract.employee_name || ''} ${contract.contract_type_display || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return searchString.includes(query);
  });

  const activeContracts = contracts.filter(c => c.is_active);
  const inactiveContracts = contracts.filter(c => !c.is_active);

  // Raccourcis clavier
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    commonShortcuts.search(() => searchInputRef.current?.focus()),
    commonShortcuts.new(() => router.push(`/apps/${slug}/hr/contracts/create`)),
    commonShortcuts.help(() => setShowShortcuts(true)),
    commonShortcuts.escape(() => {
      if (showShortcuts) {
        setShowShortcuts(false);
      } else if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setSearchQuery("");
      } else {
        setSelectedIndex(-1);
      }
    }),
    commonShortcuts.arrowDown(() => {
      setSelectedIndex((prev) => Math.min(prev + 1, filteredContracts.length - 1));
    }),
    commonShortcuts.arrowUp(() => {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }),
    commonShortcuts.enter(() => {
      if (selectedIndex >= 0 && filteredContracts[selectedIndex]) {
        router.push(`/apps/${slug}/hr/contracts/${filteredContracts[selectedIndex].id}`);
      }
    }),
    { key: "e", action: () => {
      if (selectedIndex >= 0 && filteredContracts[selectedIndex]) {
        router.push(`/apps/${slug}/hr/contracts/${filteredContracts[selectedIndex].id}/edit`);
      }
    }, description: "Éditer le contrat sélectionné" },
    { key: "a", action: () => {
      setFilterActive(filterActive === true ? null : true);
      loadContracts();
    }, description: "Filtrer les actifs" },
    { key: "i", action: () => {
      setFilterActive(filterActive === false ? null : false);
      loadContracts();
    }, description: "Filtrer les inactifs" },
  ], [slug, router, showShortcuts, selectedIndex, filteredContracts, filterActive]);

  useKeyboardShortcuts({ shortcuts });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS} showMessage>
      <div className="space-y-6">
        {/* Modals: Delete & (De)Activate */}
        <DeleteConfirmation
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) {
              setDeleting(null);
              setDeletingName(null);
            }
          }}
          itemName={deletingName || ""}
          onConfirm={confirmDelete}
          loading={deleteLoading}
          title="Confirmer la suppression du contrat"
          description={
            deletingName
              ? `Êtes-vous sûr de vouloir supprimer le contrat de "${deletingName}" ? Cette action est irréversible.`
              : 'Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.'
          }
        />

        <ActionConfirmation
          open={actDialogOpen}
          onOpenChange={(open) => {
            setActDialogOpen(open);
            if (!open) setActTarget(null);
          }}
          action={{
            label: actTarget
              ? actTarget.is_active
                ? 'Désactiver'
                : 'Activer'
              : '',
            variant: actTarget?.is_active ? 'destructive' : 'default',
            icon: actTarget?.is_active ? 'warning' : 'info',
          }}
          target={actTarget?.employee_name || ''}
          description={
            actTarget
              ? actTarget.is_active
                ? "Êtes-vous sûr de vouloir désactiver ce contrat ?"
                : `Êtes-vous sûr de vouloir activer ce contrat ?\n\n⚠️ Important : Si ${actTarget.employee_name || "cet employé"} a d'autres contrats actifs, ils seront automatiquement désactivés.\n\nUn employé ne peut avoir qu'un seul contrat actif à la fois.`
              : undefined
          }
          onConfirm={confirmToggleActive}
          loading={actLoading}
        />

        {/* Modal des raccourcis */}
        <ShortcutsHelpModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          shortcuts={shortcuts}
          title="Raccourcis clavier - Contrats"
        />

        {error && <Alert variant="error">{error}</Alert>}

        {/* Header */}
        <ContractsHeader slug={slug} onShowShortcuts={() => setShowShortcuts(true)} shortcuts={shortcuts}/>

        {/* Stats Cards - Cliquables pour filtrer */}
        <ContractsStatsCards
          contracts={contracts}
          activeContracts={activeContracts}
          inactiveContracts={inactiveContracts}
          filterActive={filterActive}
          setFilterActive={setFilterActive}
          filterType={filterType}
          setFilterType={setFilterType}
        />

        {/* Search and Filters */}
        <ContractsSearchFilter
          searchInputRef={searchInputRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterActive={filterActive}
          setFilterActive={setFilterActive}
          loadContracts={loadContracts}
        />
        
        {/* Contracts Table */}
        <ContractsTable
          contracts={contracts}
          filteredContracts={filteredContracts}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          router={router}
          slug={slug}
          deleting={deleting}
          handlePreviewPDF={handlePreviewPDF}
          handleToggleActive={handleToggleActive}
          handleDelete={(id: string, name: string) => handleDelete(id, name)}
          searchQuery={searchQuery}
        />

      </div>

      {/* Hint */}
      <KeyboardHint />

      {/* PDF Preview Modal */}
      <PDFPreviewWrapper previewState={previewState} onClose={closePreview} />
    </Can>
  );
}
