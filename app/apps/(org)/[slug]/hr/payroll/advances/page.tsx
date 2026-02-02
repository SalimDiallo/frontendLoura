"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineCurrencyDollar,
  HiOutlinePlusCircle,
  HiOutlineClipboardDocument,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { formatCurrency } from "@/lib/utils";
import { 
  getPayrollAdvances, 
  getMyPayrollAdvances,
  createPayrollAdvance, 
  approvePayrollAdvance, 
  rejectPayrollAdvance,
  deletePayrollAdvance,
} from "@/lib/services/hr/payroll-advance.service";
import type { PayrollAdvance } from "@/lib/types/hr";
import { PayrollAdvanceStatus } from "@/lib/types/hr";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import { parseApiError } from "@/lib/utils/format-api-errors";
import { useAuth } from "@/lib/hooks/use-auth";
import Link from "next/link";
import { getStatusBadgeNode } from "@/lib/utils/BadgeStatus";


// ============================================
// MAIN COMPONENT
// ============================================

export default function PayrollAdvancesPage() {
  const params = useParams();
  const slug = params.slug as string;
  

  // Auth - utilisateur connecté
  const { user, isEmployee } = useAuth();
  const currentUserId = user?.id;

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data
  const [myAdvances, setMyAdvances] = useState<PayrollAdvance[]>([]);  // Mes propres avances
  const [allAdvances, setAllAdvances] = useState<PayrollAdvance[]>([]);  // Toutes les avances (pour gestionnaires)
  
  // UI States
  const [activeTab, setActiveTab] = useState("my-advances");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<PayrollAdvance | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Form
  const [advanceForm, setAdvanceForm] = useState({ amount: "", reason: "" });

  // ============================================
  // DATA LOADING
  // ============================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger mes avances
      const myAdvancesData = await getMyPayrollAdvances().catch(() => []);
      setMyAdvances(myAdvancesData || []);
      
      // Charger toutes les avances (si permission) - on exclut les nôtres car on les a déjà
      try {
        const allAdvancesData = await getPayrollAdvances({ 
          organization_subdomain: slug,
          exclude_own: true 
        });
        setAllAdvances(allAdvancesData || []);
      } catch {
        // Pas de permission, c'est OK
        setAllAdvances([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Statistiques de mes avances
  const myStats = useMemo(() => ({
    total: myAdvances.length,
    pending: myAdvances.filter(a => a.status === PayrollAdvanceStatus.PENDING).length,
    approved: myAdvances.filter(a => a.status === PayrollAdvanceStatus.APPROVED).length,
    rejected: myAdvances.filter(a => a.status === PayrollAdvanceStatus.REJECTED).length,
    deducted: myAdvances.filter(a => a.status === PayrollAdvanceStatus.DEDUCTED).length,
    totalAmount: myAdvances.reduce((sum, a) => sum + Number(a.amount), 0),
  }), [myAdvances]);

  // Statistiques des avances à traiter
  const pendingToApprove = useMemo(() => 
    allAdvances.filter(a => a.status === PayrollAdvanceStatus.PENDING),
    [allAdvances]
  );

  // Filtrer les avances dans l'onglet "Toutes les avances"
  const filteredAllAdvances = useMemo(() => {
    if (!searchQuery) return allAdvances;
    const query = searchQuery.toLowerCase();
    return allAdvances.filter(a =>
      a.employee_name?.toLowerCase().includes(query) ||
      a.reason?.toLowerCase().includes(query)
    );
  }, [allAdvances, searchQuery]);

  // ============================================
  // ACTIONS
  // ============================================

  // Créer une demande d'avance pour soi-même
  const handleCreateAdvance = async () => {
    if (!advanceForm.amount || !advanceForm.reason) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      setProcessingId("create");
      
      // On ne spécifie pas l'employee car le backend le définira automatiquement
      await createPayrollAdvance({
        employee: currentUserId || "",  // Pour soi-même
        amount: Number(advanceForm.amount),
        reason: advanceForm.reason,
      });
      
      setSuccess("✅ Demande d'avance créée avec succès");
      setShowCreateDialog(false);
      setAdvanceForm({ amount: "", reason: "" });
      await loadData();
    } catch (err: any) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Supprimer une demande (seulement si pending et la mienne)
  const handleDeleteAdvance = async (advance: PayrollAdvance) => {
    if (!confirm("Supprimer cette demande d'avance ?")) return;
    
    try {
      setProcessingId(advance.id);
      await deletePayrollAdvance(advance.id);
      setSuccess("✅ Demande supprimée");
      await loadData();
    } catch (err: any) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Approuver une demande
  const handleApproveAdvance = async (advance: PayrollAdvance) => {
    try {
      setProcessingId(advance.id);
      await approvePayrollAdvance(advance.id);
      setSuccess(`✅ Avance de ${formatCurrency(advance.amount)} approuvée pour ${advance.employee_name}`);
      await loadData();
    } catch (err: any) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Rejeter une demande
  const handleRejectAdvance = async () => {
    if (!selectedAdvance || !rejectionReason) {
      setError("Veuillez fournir une raison de rejet");
      return;
    }

    try {
      setProcessingId(selectedAdvance.id);
      await rejectPayrollAdvance(selectedAdvance.id, rejectionReason);
      setSuccess("✅ Demande rejetée");
      setShowRejectDialog(false);
      setSelectedAdvance(null);
      setRejectionReason("");
      await loadData();
    } catch (err: any) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================
  // RENDER - LOADING
  // ============================================

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande d'avance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAdvance && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedAdvance.employee_name}</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(selectedAdvance.amount)}</p>
                <p className="text-sm text-muted-foreground">{selectedAdvance.reason}</p>
              </div>
            )}
            <div>
              <Label>Raison du rejet *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectAdvance}
              disabled={!rejectionReason || processingId === selectedAdvance?.id}
            >
              {processingId === selectedAdvance?.id ? "Rejet..." : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog - Demande pour soi-même uniquement */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
            <div>
              <Label>Montant *</Label>
              <Input
                type="number"
                value={advanceForm.amount}
                onChange={(e) => setAdvanceForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Ex: 500000"
                className="mt-2"
                min="0"
              />
              <span className="text-sm">{formatCurrency(Number(advanceForm.amount)?? 0)}</span>
            </div>
            <div>
              <Label>Motif de la demande *</Label>
              <Textarea
                value={advanceForm.reason}
                onChange={(e) => setAdvanceForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Expliquez la raison de votre demande d'avance..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateAdvance}
              disabled={!advanceForm.amount || !advanceForm.reason || processingId === "create"}
            >
              {processingId === "create" ? "Création..." : "Soumettre la demande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messages */}
      {error && (
        <Alert variant="error" className="flex justify-between items-center">
          <span className="whitespace-pre-line">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <HiOutlineXCircle className="size-4" />
          </Button>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="flex justify-between items-center">
          <span>{success}</span>
          <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
            <HiOutlineCheckCircle className="size-4" />
          </Button>
        </Alert>
      )}

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

      {/* Main Content */}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAdvances.map((advance) => (
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
                      <TableCell className="text-sm text-muted-foreground">
                        {advance.status === PayrollAdvanceStatus.APPROVED && advance.approved_by_name && (
                          <span>Approuvée par {advance.approved_by_name}</span>
                        )}
                        {advance.status === PayrollAdvanceStatus.REJECTED && (
                          <span className="text-destructive">{advance.rejection_reason}</span>
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
                            onClick={() => handleDeleteAdvance(advance)}
                            disabled={processingId === advance.id}
                          >
                            Annuler
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            {filteredAllAdvances.length === 0 ? (
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
                  {filteredAllAdvances.map((advance) => (
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
                              onClick={() => handleApproveAdvance(advance)}
                              disabled={processingId === advance.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <HiOutlineCheckCircle className="size-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAdvance(advance);
                                setShowRejectDialog(true);
                              }}
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
