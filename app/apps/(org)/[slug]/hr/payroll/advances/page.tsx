"use client";

import { Can } from "@/components/apps/common";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { Label, Textarea } from "@/components/ui";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  approvePayrollAdvance,
  createPayrollAdvance,
  deletePayrollAdvance,
  getMyPayrollAdvances,
  getPayrollAdvances,
  rejectPayrollAdvance,
} from "@/lib/services/hr/payroll-advance.service";
import type { PayrollAdvance } from "@/lib/types/hr";
import { PayrollAdvanceStatus } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { formatCurrency } from "@/lib/utils";
import { getStatusBadgeNode } from "@/lib/utils/BadgeStatus";
import { parseApiError } from "@/lib/utils/format-api-errors";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocument,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineMagnifyingGlass,
  HiOutlinePlusCircle,
  HiOutlineXCircle
} from "react-icons/hi2";

// =================================================================================
// COMPONENTS
// =================================================================================

// Gestion du chargement et des erreurs centralisé
function PageStateNotice({ loading, error, success, onClearError, onClearSuccess }: {
  loading?: boolean,
  error?: string | null,
  success?: string | null,
  onClearError?: () => void,
  onClearSuccess?: () => void
}) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }
  return (
    <>
      {error && (
        <Alert variant="error" className="flex justify-between items-center">
          <span className="whitespace-pre-line">{error}</span>
          <Button variant="ghost" size="sm" onClick={onClearError}>
            <HiOutlineXCircle className="size-4" />
          </Button>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="flex justify-between items-center">
          <span>{success}</span>
          <Button variant="ghost" size="sm" onClick={onClearSuccess}>
            <HiOutlineCheckCircle className="size-4" />
          </Button>
        </Alert>
      )}
    </>
  );
}

// Statistiques sur les avances utilisateur (calculé à l'intérieur)
function MyStatsCards({ advances }: { advances: PayrollAdvance[] }) {
  const myStats = (() => {
    return {
      total: advances.length,
      pending: advances.filter(a => a.status === PayrollAdvanceStatus.PENDING).length,
      approved: advances.filter(a => a.status === PayrollAdvanceStatus.APPROVED).length,
      rejected: advances.filter(a => a.status === PayrollAdvanceStatus.REJECTED).length,
      deducted: advances.filter(a => a.status === PayrollAdvanceStatus.DEDUCTED).length,
      totalAmount: advances.reduce((sum, a) => sum + Number(a.amount), 0),
    };
  })();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <HiOutlineClipboardDocument className="size-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{myStats.total}</p>
            <p className="text-xs text-muted-foreground">Mes demandes</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
            <HiOutlineClock className="size-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{myStats.pending}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <HiOutlineCheckCircle className="size-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{myStats.approved + myStats.deducted}</p>
            <p className="text-xs text-muted-foreground">Approuvées</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <HiOutlineBanknotes className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold">{formatCurrency(myStats.totalAmount)}</p>
            <p className="text-xs text-muted-foreground">Total demandé</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Tableau des avances de l'utilisateur connecté (avec suppression possible)
function MyAdvancesTable({
  advances,
  loadingId,
  onDelete
}: {
  advances: PayrollAdvance[],
  loadingId?: string | null,
  onDelete: (adv: PayrollAdvance) => void,
}) {
  if (!advances.length)
    return (
      <div className="p-12 text-center">
        <HiOutlineCurrencyDollar className="size-16 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-lg font-medium mb-2">Aucune demande d'avance</p>
        <p className="text-muted-foreground mb-6">
          Vous n'avez encore fait aucune demande d'avance sur salaire
        </p>
      </div>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead>Motif</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Traité par</TableHead>
          <TableHead>Détails</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {advances.map((advance) => (
          <TableRow key={advance.id}>
            <TableCell>
              {new Date(advance.request_date).toLocaleDateString("fr-FR")}
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatCurrency(advance.amount)}
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {advance.reason}
            </TableCell>
            <TableCell>{getStatusBadgeNode(advance.status)}</TableCell>
            <TableCell className="max-w-xs truncate">
              {advance.approved_by_name}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {advance.status === PayrollAdvanceStatus.APPROVED && advance.approved_by_name && (
                <span>Approuvée par {advance.approved_by_name}</span>
              )}
              {advance.status === PayrollAdvanceStatus.REJECTED && (
                <span className="text-destructive">{advance.rejection_reason} </span>
              )}
              {advance.status === PayrollAdvanceStatus.DEDUCTED && (
                <span className="text-green-600">
                  Déduite le {advance.deduction_month ? new Date(advance.deduction_month).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "-"}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right">
              {advance.status === PayrollAdvanceStatus.PENDING && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(advance)}
                  disabled={loadingId === advance.id}
                >
                  Annuler
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Table des avances à traiter (pour gestionnaires) + actions d'approbation/rejet
function AdvancesToApproveTable({
  advances,
  loadingId,
  onApprove,
  onReject
}: {
  advances: PayrollAdvance[],
  loadingId?: string | null,
  onApprove: (adv: PayrollAdvance) => void,
  onReject: (adv: PayrollAdvance) => void,
}) {
  if (!advances.length)
    return (
      <div className="p-12 text-center">
        <HiOutlineCheckCircle className="size-16 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-lg font-medium mb-2">Aucune demande</p>
        <p className="text-muted-foreground">
          Il n'y a aucune demande d'avance à traiter
        </p>
      </div>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employé</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead>Motif</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {advances.map((advance) => (
          <TableRow key={advance.id}>
            <TableCell>
              <div>
                <p className="font-medium">{advance.employee_name}</p>
                <p className="text-xs text-muted-foreground">{advance.employee_id_number}</p>
              </div>
            </TableCell>
            <TableCell>
              {new Date(advance.request_date).toLocaleDateString("fr-FR")}
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatCurrency(advance.amount)}
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {advance.reason}
            </TableCell>
            <TableCell>{getStatusBadgeNode(advance.status)}</TableCell>
            <TableCell className="text-right">
              {advance.status === PayrollAdvanceStatus.PENDING && (
                <div className="flex justify-end gap-1">
                  <Button
                    size="sm"
                    onClick={() => onApprove(advance)}
                    disabled={loadingId === advance.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <HiOutlineCheckCircle className="size-4 mr-1" />
                    Approuver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject(advance)}
                  >
                    Rejeter
                  </Button>
                </div>
              )}
              {advance.status === PayrollAdvanceStatus.APPROVED && (
                <span className="text-sm text-muted-foreground italic">
                  {advance.approved_by_name ? "Par "+ advance.approved_by_name : "Aucun"}
                </span>
              )}
              {advance.status === PayrollAdvanceStatus.REJECTED && (
                <span className="text-sm text-muted-foreground italic">
                  {advance.approved_by_name ? "Par "+ advance.approved_by_name : "Aucun"}
                </span>
              )}
              {advance.status === PayrollAdvanceStatus.DEDUCTED && (
                <span className="text-sm text-muted-foreground italic">
                  {advance.deduction_month ? "le "+ advance.deduction_month : "Aucun"}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Boite de création d'une demande (logique isolée)
function CreateAdvanceDialog({ open, onClose, onCreated }: { open: boolean, onClose: () => void, onCreated?: () => void }) {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", reason: "" });

  const handleSubmit = async () => {
    setError(null);
    if (!form.amount || !form.reason) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    try {
      setProcessing(true);
      await createPayrollAdvance({
        employee: user?.id || "",
        amount: Number(form.amount),
        reason: form.reason,
      });
      setForm({ amount: "", reason: "" });
      onCreated && onCreated();
      onClose();
    } catch (err: any) {
      setError(parseApiError(err).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HiOutlineCurrencyDollar className="size-5" />
            Nouvelle demande d'avance
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert variant="info" className="text-sm">
            Cette demande sera créée pour vous-même et soumise à approbation.
          </Alert>
          {error && <Alert variant="error" className="text-sm">{error}</Alert>}
          <div>
            <Label>Montant *</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder="Ex: 500000"
              className="mt-2"
              min="0"
            />
            <span className="text-sm">{formatCurrency(Number(form.amount)?? 0)}</span>
          </div>
          <div>
            <Label>Motif de la demande *</Label>
            <Textarea
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Expliquez la raison de votre demande d'avance..."
              className="mt-2"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.amount || !form.reason || processing}
          >
            {processing ? "Création..." : "Soumettre la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialogue d'approbation d'une avance
function ApproveAdvanceDialog({
  open,
  advance,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  advance?: PayrollAdvance | null;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title="Approuver la demande d'avance"
      confirmLabel="Approuver"
      loading={loading}
      onConfirm={onConfirm}
      description={
        advance ? (
          <div className="space-y-2">
            <div>
              <span className="font-semibold">{advance.employee_name}</span>
              {" - "}
              <span className="text-primary font-bold">{formatCurrency(advance.amount)}</span>
            </div>
            <div className="text-muted-foreground text-sm">{advance.reason}</div>
          </div>
        ) : null
      }
    />
  );
}

// Dialogue de rejet d'une avance (avec raison)
function RejectAdvanceDialog({
  open,
  advance,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  advance?: PayrollAdvance | null;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title="Rejeter la demande d'avance"
      confirmLabel="Rejeter"
      loading={loading}
      onConfirm={() => onConfirm(reason)}
      description={
        advance ? (
          <div className="space-y-2 py-1">
            <div>
              <span className="font-semibold">{advance.employee_name}</span>
              {" - "}
              <span className="text-primary font-bold">{formatCurrency(advance.amount)}</span>
            </div>
            <div className="text-muted-foreground text-sm mb-2">{advance.reason}</div>
            <div>
              <Label>Raison du rejet *</Label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                rows={3}
                className="mt-2"
                required
                autoFocus
              />
            </div>
          </div>
        ) : null
      }
    />
  );
}

// =================================================================================
// MAIN PAGE COMPONENT
// =================================================================================

export default function PayrollAdvancesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { user, isEmployee } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myAdvances, setMyAdvances] = useState<PayrollAdvance[]>([]);
  const [allAdvances, setAllAdvances] = useState<PayrollAdvance[]>([]);
  const [activeTab, setActiveTab] = useState("my-advances");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Dialogs states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<PayrollAdvance | null>(null);

  // Rechargement des données
  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const myAdvancesData = await getMyPayrollAdvances().catch(() => []);
      setMyAdvances(myAdvancesData || []);
      try {
        const allAdvancesData = await getPayrollAdvances({
          organization_subdomain: slug,
          exclude_own: true
        });
        setAllAdvances(allAdvancesData || []);
      } catch {
        setAllAdvances([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [slug]);
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Statut de "À approuver"
  const pendingToApprove = allAdvances.filter(a => a.status === PayrollAdvanceStatus.PENDING);
  // Search/Filter dans "à traiter"
  const filteredAllAdvances = !searchQuery
    ? allAdvances
    : allAdvances.filter(a =>
      a.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // HANDLERS
  async function handleDeleteAdvance(a: PayrollAdvance) {
    if (!confirm("Supprimer cette demande d'avance ?")) return;
    try {
      setProcessingId(a.id);
      await deletePayrollAdvance(a.id);
      setSuccess("✅ Demande supprimée");
      await loadData();
    } catch (err: any) {
      setError(parseApiError(err).message);
    } finally {
      setProcessingId(null);
    }
  }
  function handleApproveAdvance(advance: PayrollAdvance) {
    setSelectedAdvance(advance);
    setShowApproveDialog(true);
  }
  function handleRejectAdvance(advance: PayrollAdvance) {
    setSelectedAdvance(advance);
    setShowRejectDialog(true);
  }
  async function confirmApproveAdvance() {
    if (!selectedAdvance) return;
    try {
      setProcessingId(selectedAdvance.id);
      await approvePayrollAdvance(selectedAdvance.id);
      setSuccess(`✅ Avance de ${formatCurrency(selectedAdvance.amount)} approuvée pour ${selectedAdvance.employee_name}`);
      setShowApproveDialog(false);
      setSelectedAdvance(null);
      await loadData();
    } catch (err: any) {
      setError(parseApiError(err).message);
    } finally {
      setProcessingId(null);
    }
  }
  async function confirmRejectAdvance(reason: string) {
    if (!selectedAdvance || !reason) {
      setError("Veuillez fournir une raison de rejet");
      return;
    }
    try {
      setProcessingId(selectedAdvance.id);
      await rejectPayrollAdvance(selectedAdvance.id, reason);
      setSuccess("✅ Demande rejetée");
      setShowRejectDialog(false);
      setSelectedAdvance(null);
      await loadData();
    } catch (err: any) {
      setError(parseApiError(err).message);
    } finally {
      setProcessingId(null);
    }
  }

  // =================================================================================
  // RENDER
  // =================================================================================

  return (
    <div className="space-y-6">
      {/* State: Loading/Errors/Success */}
      <PageStateNotice
        loading={loading}
        error={error}
        success={success}
        onClearError={() => setError(null)}
        onClearSuccess={() => setSuccess(null)}
      />

      {/* Approve Dialog */}
      <ApproveAdvanceDialog
        open={showApproveDialog}
        advance={selectedAdvance}
        loading={processingId === selectedAdvance?.id}
        onConfirm={confirmApproveAdvance}
        onClose={() => {
          setShowApproveDialog(false);
          setSelectedAdvance(null);
        }}
      />

      {/* Reject Dialog */}
      <RejectAdvanceDialog
        open={showRejectDialog}
        advance={selectedAdvance}
        loading={processingId === selectedAdvance?.id}
        onConfirm={confirmRejectAdvance}
        onClose={() => {
          setShowRejectDialog(false);
          setSelectedAdvance(null);
        }}
      />

      {/* Create Advance Dialog */}
      <CreateAdvanceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={loadData}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HiOutlineCurrencyDollar className="size-7" />
            Avances sur Salaire
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos demandes d'avances et suivez leur statut
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadData}>
            <HiOutlineArrowPath className="size-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <HiOutlinePlusCircle className="size-4 mr-2" />
            Demander une avance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <MyStatsCards advances={myAdvances} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="my-advances" className="flex items-center gap-2">
            <HiOutlineClipboardDocument className="size-4" />
            Mes demandes
          </TabsTrigger>
          <Can permission={COMMON_PERMISSIONS.HR.APPROVE_PAYROLL}>
            <TabsTrigger value="to-approve" className="flex items-center gap-2 relative">
              <HiOutlineCheckCircle className="size-4" />
              À traiter
              {pendingToApprove.length > 0 && (
                <Badge variant="warning" className="ml-1 size-5 p-0 justify-center text-xs">
                  {pendingToApprove.length}
                </Badge>
              )}
            </TabsTrigger>
          </Can>
        </TabsList>

        {/* Tab 1: Mes demandes */}
        <TabsContent value="my-advances" className="mt-6">
          <Card>
            {myAdvances.length === 0 ? (
              <div className="p-12 text-center">
                <HiOutlineCurrencyDollar className="size-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium mb-2">Aucune demande d'avance</p>
                <p className="text-muted-foreground mb-6">
                  Vous n'avez encore fait aucune demande d'avance sur salaire
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <HiOutlinePlusCircle className="size-4 mr-2" />
                  Faire ma première demande
                </Button>
              </div>
            ) : (
              <MyAdvancesTable
                advances={myAdvances}
                loadingId={processingId}
                onDelete={handleDeleteAdvance}
              />
            )}
          </Card>
        </TabsContent>

        {/* Tab 2: À traiter (pour gestionnaires) */}
        <TabsContent value="to-approve" className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Card>
            {!filteredAllAdvances.length ? (
              <div className="p-12 text-center">
                <HiOutlineCheckCircle className="size-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium mb-2">
                  {allAdvances.length === 0 ? "Aucune demande" : "Aucun résultat"}
                </p>
                <p className="text-muted-foreground">
                  {allAdvances.length === 0
                    ? "Il n'y a aucune demande d'avance à traiter"
                    : "Aucune demande ne correspond à votre recherche"
                  }
                </p>
              </div>
            ) : (
              <AdvancesToApproveTable
                advances={filteredAllAdvances}
                loadingId={processingId}
                onApprove={handleApproveAdvance}
                onReject={handleRejectAdvance}
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lien retour vers paie */}
      <div className="flex justify-center pt-4">
        <Link
          href={`/apps/${slug}/hr/payroll`}
          className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
        >
          ← Retour à la gestion de la paie
        </Link>
      </div>
    </div>
  );
}
