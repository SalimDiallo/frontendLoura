"use client";

import { Can } from "@/components/apps/common";
import { ActionConfirmation, DeleteConfirmation } from "@/components/common/confirmation-dialog";
import { Alert, Button, Card } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useUser } from "@/lib/hooks";
import { getEmployees } from "@/lib/services/hr/employee.service";
import {
  deleteLeaveBalance,
  getLeaveBalances,
  initializeLeaveBalances,
  updateLeaveBalance,
} from "@/lib/services/hr/leave-balance.service";
import type { Employee, LeaveBalance } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineMagnifyingGlass,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineXCircle,
  HiOutlineXMark,
} from "react-icons/hi2";

interface EmployeeWithBalance extends Employee {
  balance?: LeaveBalance;
}

export default function LeaveBalancesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const user = useUser();

  const [employees, setEmployees] = useState<EmployeeWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [defaultDays, setDefaultDays] = useState<string>("25");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [initializing, setInitializing] = useState(false);

  // Confirmation dialogs
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; balanceId: string; employeeName: string }>({
    open: false,
    balanceId: "",
    employeeName: "",
  });
  const [bulkInitDialog, setBulkInitDialog] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesRes, balancesRes] = await Promise.all([
        getEmployees(slug, { page_size: 500 }),
        getLeaveBalances({ year: selectedYear, page_size: 500, organization_subdomain: slug }),
      ]);

      const employeesList = employeesRes.results || [];
      const balancesList = balancesRes.results || [];

      const employeesWithBalances: EmployeeWithBalance[] = employeesList.map((emp) => {
        const matchingBalance = balancesList.find((b) => b.employee === emp.id);
        // Spread all Employee fields, but ensure missing required fields for EmployeeWithBalance are present (fallback as needed)
        return {
          ...emp,
          organization: slug, // fallback, or adjust if available
          first_name: emp.full_name?.split(" ")[0] ?? "",
          last_name: emp.full_name?.split(" ").slice(1).join(" ") ?? "",
          balance: matchingBalance,
        };
      });

      setEmployees(employeesWithBalances);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erreur lors du chargement des données");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditBalance = (balance: LeaveBalance) => {
    setEditingBalanceId(balance.id);
    setEditValue(String(balance.allocated_days));
  };

  const handleSaveBalance = async (balanceId: string) => {
    try {
      setError(null);
      setSuccess(null);

      const allocated = parseFloat(editValue);
      if (isNaN(allocated) || allocated < 0) {
        setError("Valeur invalide. Veuillez entrer un nombre positif.");
        return;
      }

      await updateLeaveBalance(balanceId, { allocated_days: allocated });
      await loadData();
      setEditingBalanceId(null);
      setSuccess("Solde mis à jour avec succès");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erreur lors de la mise à jour du solde");
      }
    }
  };

  const handleDeleteBalance = (balanceId: string, employeeName: string) => {
    setDeleteDialog({ open: true, balanceId, employeeName });
  };

  const confirmDeleteBalance = async () => {
    try {
      setError(null);
      setSuccess(null);

      await deleteLeaveBalance(deleteDialog.balanceId);
      await loadData();
      setSuccess("Solde supprimé avec succès");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erreur lors de la suppression du solde");
      }
    }
  };

  const handleInitializeBalance = async (employeeId: string) => {
    const days = parseFloat(defaultDays);
    if (isNaN(days) || days <= 0) {
      setError("Veuillez saisir un nombre de jours valide");
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await initializeLeaveBalances({
        employee: employeeId,
        year: selectedYear,
        default_days: days,
      });

      await loadData();
      setSuccess("Solde initialisé avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  const handleBulkInitialize = () => {
    if (selectedEmployees.length === 0) {
      setError("Veuillez sélectionner au moins un employé");
      return;
    }

    const days = parseFloat(defaultDays);
    if (isNaN(days) || days <= 0) {
      setError("Veuillez saisir un nombre de jours valide");
      return;
    }

    setBulkInitDialog(true);
  };

  const confirmBulkInitialize = async () => {
    const days = parseFloat(defaultDays);

    try {
      setInitializing(true);
      setError(null);
      setSuccess(null);

      let successCount = 0;
      let errorCount = 0;

      for (const empId of selectedEmployees) {
        try {
          await initializeLeaveBalances({
            employee: empId,
            year: selectedYear,
            default_days: days,
          });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      await loadData();

      if (errorCount === 0) {
        setSuccess(`Soldes initialisés pour ${successCount} employé(s)`);
        setSelectedEmployees([]);
      } else {
        setSuccess(`${successCount} réussi(s), ${errorCount} échec(s)`);
      }

      setTimeout(() => setSuccess(null), 5000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erreur lors de l'initialisation en masse");
      }
    } finally {
      setInitializing(false);
    }
  };

  const handleToggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((e) => e.id));
    }
  };

  // Exclure l'utilisateur courant de la liste filtrée
  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    // On retire l'utilisateur courant d'après son id
    if (emp.id === user?.id) {
      return false;
    }
    return (
      emp.full_name?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.employee_id?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-in fade-in">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-muted rounded w-64" />
            <div className="h-10 bg-muted rounded w-48" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const employeesWithBalance = filteredEmployees.filter((e) => e.balance);
  const employeesWithoutBalance = filteredEmployees.filter((e) => !e.balance);
  const totalAllocated = employeesWithBalance.reduce((sum, e) => sum + Number(e.balance?.allocated_days || 0), 0);
  const totalUsed = employeesWithBalance.reduce((sum, e) => sum + Number(e.balance?.used_days || 0), 0);

  return (
   <Can permission={COMMON_PERMISSIONS.HR.APPROVE_LEAVE_REQUESTS} showMessage>
     <div className="min-h-screen from-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href={`/apps/${slug}/hr/leaves`}>
                <HiOutlineArrowLeft className="size-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Soldes de congés</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gérez les quotas annuels de congés par employé
              </p>
            </div>
          </div>

          {/* Year Navigation */}
          <div className="flex items-center gap-2 bg-background border rounded-lg p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => setSelectedYear(selectedYear - 1)}
            >
              <HiOutlineChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2 px-3 min-w-[120px] justify-center">
              <HiOutlineCalendar className="size-4 text-muted-foreground" />
              <span className="font-semibold text-lg tabular-nums">{selectedYear}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => setSelectedYear(selectedYear + 1)}
            >
              <HiOutlineChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="error" className="animate-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <HiOutlineXMark className="size-4" />
              </button>
            </div>
          </Alert>
        )}

        {success && (
          <Alert className="animate-in slide-in-from-top-2 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <HiOutlineCheckCircle className="size-5 text-green-600 dark:text-green-400 shrink-0" />
                <span className="text-sm text-green-800 dark:text-green-200">{success}</span>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="shrink-0 p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
              >
                <HiOutlineXMark className="size-4 text-green-600" />
              </button>
            </div>
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<HiOutlineUserGroup className="size-5" />}
            label="Total employés"
            value={employees.length}
            color="blue"
          />
          <StatCard
            icon={<HiOutlineCheckCircle className="size-5" />}
            label="Avec solde"
            value={employeesWithBalance.length}
            color="green"
            subtitle={`${Math.round((employeesWithBalance.length / employees.length) * 100 || 0)}%`}
          />
          <StatCard
            icon={<HiOutlineXCircle className="size-5" />}
            label="Sans solde"
            value={employeesWithoutBalance.length}
            color="orange"
            subtitle={selectedEmployees.length > 0 ? `${selectedEmployees.length} sélectionné(s)` : undefined}
          />
          <StatCard
            icon={<HiOutlineCalendar className="size-5" />}
            label="Total jours"
            value={totalAllocated}
            color="purple"
            subtitle={`${totalUsed} utilisés`}
          />
        </div>

        {/* Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={defaultDays}
                onChange={(e) => setDefaultDays(e.target.value)}
                className="w-20 h-11 text-center"
                min="0"
                step="0.5"
                placeholder="25"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">jours par défaut</span>
            </div>
          </div>
        </Card>

        {/* Main Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={handleSelectAll}
                      className="size-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Employé
                  </th>
                  <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Alloués
                  </th>
                  <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Utilisés
                  </th>
                  <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    En attente
                  </th>
                  <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Disponibles
                  </th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.map((emp, index) => {
                  const isSelected = selectedEmployees.includes(emp.id);
                  const balance = emp.balance;
                  const hasBalance = !!balance;
                  const rawRemaining = hasBalance ? Number(balance.remaining_days) : 0;
                  const remaining = Math.max(0, rawRemaining); // Ne jamais afficher de valeur négative
                  const isLow = remaining <= 5 && remaining > 0;
                  const isZero = remaining <= 0;

                  return (
                    <tr
                      key={emp.id}
                      className={`
                        transition-colors
                        ${isSelected ? 'bg-primary/5' : index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                        hover:bg-muted/40
                      `}
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleEmployee(emp.id)}
                          className="size-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-primary">
                              {emp.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{emp.full_name || "Sans nom"}</p>
                            <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      {hasBalance ? (
                        <>
                          <td className="py-4 px-4 text-center">
                            {editingBalanceId === balance.id ? (
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-20 mx-auto text-center h-9"
                                step="0.5"
                                min="0"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveBalance(balance.id);
                                  if (e.key === 'Escape') setEditingBalanceId(null);
                                }}
                              />
                            ) : (
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-sm font-semibold tabular-nums">
                                {balance.allocated_days}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 text-sm font-semibold tabular-nums">
                              {balance.used_days}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-sm font-semibold tabular-nums">
                              {balance.pending_days}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md text-sm font-bold tabular-nums ${
                                isZero
                                  ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                                  : isLow
                                  ? "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
                                  : "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                              }`}
                            >
                              {remaining}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-1">
                              {editingBalanceId === balance.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveBalance(balance.id)}
                                    className="size-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <HiOutlineCheckCircle className="size-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingBalanceId(null)}
                                    className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <HiOutlineXMark className="size-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditBalance(balance)}
                                    className="size-8 p-0 hover:bg-muted"
                                    title="Modifier"
                                  >
                                    <HiOutlinePencil className="size-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteBalance(balance.id, emp.full_name || emp.email || 'cet employé')}
                                    className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Supprimer"
                                  >
                                    <HiOutlineTrash className="size-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td colSpan={4} className="py-4 px-4 text-center">
                            <span className="text-sm text-muted-foreground italic">
                              Aucun solde configuré
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleInitializeBalance(emp.id)}
                                className="h-8 text-xs"
                              >
                                Initialiser
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-16">
                <HiOutlineMagnifyingGlass className="size-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">Aucun employé trouvé</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Essayez de modifier votre recherche
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Floating Action Bar */}
      {selectedEmployees.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 pb-6 px-6 pointer-events-none z-50">
          <div className="max-w-7xl mx-auto">
            <Card className="pointer-events-auto shadow-2xl border-2 animate-in slide-in-from-bottom-4">
              <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <HiOutlineCheckCircle className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {selectedEmployees.length} employé{selectedEmployees.length > 1 ? 's' : ''} sélectionné{selectedEmployees.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Jours à allouer : {defaultDays} jours pour {selectedYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEmployees([])}
                    className="flex-1 sm:flex-initial"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleBulkInitialize}
                    disabled={initializing}
                    size="sm"
                    className="flex-1 sm:flex-initial"
                  >
                    {initializing ? "Initialisation..." : "Initialiser les soldes"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <DeleteConfirmation
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Supprimer le solde"
        description={
          <div className="space-y-2">
            <p>
              Êtes-vous sûr de vouloir supprimer le solde de <strong>{deleteDialog.employeeName}</strong> pour l'année <strong>{selectedYear}</strong> ?
            </p>
            <p className="text-sm text-muted-foreground">
              Cette action est irréversible. L'employé devra initialiser un nouveau solde.
            </p>
          </div>
        }
        onConfirm={confirmDeleteBalance}
      />

      <ActionConfirmation
        open={bulkInitDialog}
        onOpenChange={setBulkInitDialog}
        action={{
          label: "Initialiser les soldes",
          variant: "default",
          icon: "info",
        }}
        description={
          <div className="space-y-2">
            <p>
              Initialiser les soldes pour <strong>{selectedEmployees.length} employé{selectedEmployees.length > 1 ? 's' : ''}</strong> avec <strong>{defaultDays} jour{Number(defaultDays) > 1 ? 's' : ''}</strong> pour l'année <strong>{selectedYear}</strong> ?
            </p>
            <p className="text-sm text-muted-foreground">
              Les soldes existants seront écrasés par cette nouvelle valeur.
            </p>
          </div>
        }
        onConfirm={confirmBulkInitialize}
        loading={initializing}
      />
    </div>
   </Can>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "green" | "orange" | "purple";
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/5 text-blue-600 dark:text-blue-400",
    green: "from-green-500/10 to-green-600/5 text-green-600 dark:text-green-400",
    orange: "from-orange-500/10 to-orange-600/5 text-orange-600 dark:text-orange-400",
    purple: "from-purple-500/10 to-purple-600/5 text-purple-600 dark:text-purple-400",
  };

  return (
    <Card className="p-5 transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
