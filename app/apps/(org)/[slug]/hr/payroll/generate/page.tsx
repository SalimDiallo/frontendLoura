"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HiOutlineSparkles,
  HiOutlineArrowLeft,
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineUsers,
  HiOutlineBuildingOffice2,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineCheck,
  HiOutlineCurrencyDollar,
} from "react-icons/hi2";
import { formatCurrency, cn } from "@/lib/utils";
import { getPayrollPeriods, createPayrollPeriod, generateBulkPayslips, contractService } from "@/lib/services/hr";
import { getEmployees } from "@/lib/services/hr/employee.service";
import { getDepartments } from "@/lib/services/hr/department.service";
import { getPositions } from "@/lib/services/hr/position.service";
import type { PayrollPeriod, EmployeeListItem, Department, Position, Contract } from "@/lib/types/hr";

// ============================================
// Types
// ============================================

interface EmployeeWithContract extends EmployeeListItem {
  selected: boolean;
  contract: Contract | null;
  loadingContract: boolean;
  error: string | null;
  hasExistingPayslip?: boolean;
}

// ============================================
// Simple Checkbox component
// ============================================
const Checkbox = ({ checked, onChange, id, className, disabled }: { 
  checked: boolean; 
  onChange?: () => void; 
  id?: string;
  className?: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    id={id}
    onClick={disabled ? undefined : onChange}
    disabled={disabled}
    className={cn(
      "size-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
      disabled && "opacity-50 cursor-not-allowed",
      checked 
        ? "bg-primary border-primary text-white" 
        : "border-muted-foreground/30 hover:border-primary/50",
      className
    )}
  >
    {checked && <HiOutlineCheck className="size-3.5" />}
  </button>
);

// ============================================
// Main Component
// ============================================

export default function GeneratePayslipsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // ============================================
  // States
  // ============================================
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithContract[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Form state
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [autoApprove, setAutoApprove] = useState(false);
  const [autoDeductAdvances, setAutoDeductAdvances] = useState(true);

  // Period creation dialog
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [periodForm, setPeriodForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    payment_date: "",
  });

  // ============================================
  // Load Data
  // ============================================

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [periodsData, employeesData, departmentsData, positionsData] = await Promise.all([
        getPayrollPeriods(slug, { page_size: 100 }),
        getEmployees(slug, { page_size: 200, employment_status: 'active' }),
        getDepartments({ organization_subdomain: slug, is_active: true }),
        getPositions({ is_active: true }),
      ]);

      setPeriods(periodsData.results);
      setDepartments(departmentsData);
      setPositions(positionsData);

      // Initialize employees with contract loading
      const employeesWithContracts: EmployeeWithContract[] = employeesData.results.map(emp => ({
        ...emp,
        selected: false,
        contract: null,
        loadingContract: true,
        error: null,
      }));
      
      setEmployees(employeesWithContracts);

      // Load contracts for each employee
      await loadContractsForEmployees(employeesWithContracts);

      // Auto-select current period
      const activePeriod = periodsData.results.find(p => p.status === "draft" || p.status === "processing");
      if (activePeriod) {
        setSelectedPeriod(activePeriod.id);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadContractsForEmployees = async (employeesList: EmployeeWithContract[]) => {
    const updatedEmployees = await Promise.all(
      employeesList.map(async (emp) => {
        try {
          const contract = await contractService.getActiveContract(slug, emp.id);
          return {
            ...emp,
            contract,
            loadingContract: false,
            error: contract ? null : "Pas de contrat actif",
          };
        } catch (err) {
          return {
            ...emp,
            contract: null,
            loadingContract: false,
            error: "Pas de contrat actif",
          };
        }
      })
    );

    setEmployees(updatedEmployees);
  };

  // ============================================
  // Filtered employees
  // ============================================

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());

      // Department filter
      const matchesDepartment = filterDepartment === "all" || 
        emp.department === filterDepartment;

      // Position filter - using position_title since position ID is not available in EmployeeListItem
      const matchesPosition = filterPosition === "all" || 
        (positions.find(p => p.id === filterPosition)?.title === emp.position_title);

      return matchesSearch && matchesDepartment && matchesPosition;
    });
  }, [employees, searchQuery, filterDepartment, filterPosition]);

  // Selectable employees (with valid contracts)
  const selectableEmployees = useMemo(() => {
    return filteredEmployees.filter(emp => emp.contract !== null && !emp.error);
  }, [filteredEmployees]);

  // Selected employees count
  const selectedCount = employees.filter(emp => emp.selected && emp.contract).length;
  const selectedTotal = employees.filter(emp => emp.selected && emp.contract)
    .reduce((sum, emp) => sum + (emp.contract?.base_salary || 0), 0);

  // ============================================
  // Actions
  // ============================================

  const toggleEmployee = (id: string) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === id && emp.contract ? { ...emp, selected: !emp.selected } : emp
    ));
  };

  const toggleAll = () => {
    const allSelectableSelected = selectableEmployees.every(emp => emp.selected);
    
    setEmployees(prev => prev.map(emp => {
      const isInFiltered = selectableEmployees.some(f => f.id === emp.id);
      if (isInFiltered && emp.contract) {
        return { ...emp, selected: !allSelectableSelected };
      }
      return emp;
    }));
  };

  const handleGenerate = async () => {
    if (!selectedPeriod) {
      setError("Veuillez sélectionner une période de paie");
      return;
    }

    const selectedEmployeeIds = employees
      .filter(emp => emp.selected && emp.contract)
      .map(emp => emp.id);

    if (selectedEmployeeIds.length === 0) {
      setError("Veuillez sélectionner au moins un employé");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const result = await generateBulkPayslips(selectedPeriod, {
        auto_deduct_advances: autoDeductAdvances,
        auto_approve: autoApprove,
        employee_ids: selectedEmployeeIds,
      });

      let message = `✅ ${result.created} fiche(s) de paie créée(s)`;
      if (result.skipped > 0) {
        message += ` • ${result.skipped} ignorée(s) (déjà existantes)`;
      }
      if (result.advances_deducted > 0) {
        message += ` • ${result.advances_deducted} avance(s) déduite(s)`;
      }
      if (result.auto_approved) {
        message += ` • Auto-approuvées`;
      }
      if (result.errors.length > 0) {
        message += `\n⚠️ Erreurs: ${result.errors.join(', ')}`;
      }

      setSuccess(message);

      // Redirect after success
      setTimeout(() => {
        router.push(`/apps/${slug}/hr/payroll`);
      }, 2000);

    } catch (err: any) {
      setError(err?.data?.detail || err?.data?.error || err?.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  // ============================================
  // Period Creation
  // ============================================

  const openPeriodDialog = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const paymentDate = new Date(year, month, 5);

    setPeriodForm({
      name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      payment_date: paymentDate.toISOString().split('T')[0],
    });

    setShowPeriodDialog(true);
  };

  const handleCreatePeriod = async () => {
    if (!periodForm.name || !periodForm.start_date || !periodForm.end_date) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setCreatingPeriod(true);
      setError(null);

      const newPeriod = await createPayrollPeriod(slug, periodForm);

      // Refresh periods list
      const periodsData = await getPayrollPeriods(slug, { page_size: 100 });
      setPeriods(periodsData.results);

      // Auto-select the newly created period
      setSelectedPeriod(newPeriod.id);

      // Close dialog
      setShowPeriodDialog(false);
      
      setSuccess(`Période "${newPeriod.name}" créée avec succès !`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || "Erreur lors de la création de la période");
    } finally {
      setCreatingPeriod(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/apps/${slug}/hr/payroll`}>
              <HiOutlineArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineSparkles className="size-7" />
              Générer les fiches de paie
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Génération en masse des fiches de paie pour une période
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Period Selection */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HiOutlineCalendar className="size-5" />
              Période de paie
            </h2>

            <div className="flex gap-3">
              <div className="flex-1">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une période" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        <div className="flex items-center gap-2">
                          <span>{period.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({new Date(period.start_date).toLocaleDateString("fr-FR")} - {new Date(period.end_date).toLocaleDateString("fr-FR")})
                          </span>
                          <Badge variant={period.status === "draft" ? "secondary" : period.status === "processing" ? "default" : "outline"} className="ml-2 text-xs">
                            {period.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={openPeriodDialog}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Nouvelle période
              </Button>
            </div>

            {periods.length === 0 && (
              <Alert variant="info" className="mt-4">
                <HiOutlineExclamationTriangle className="size-4" />
                Aucune période de paie disponible. Créez une nouvelle période pour commencer.
              </Alert>
            )}
          </Card>

          {/* Filters */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HiOutlineUsers className="size-5" />
              Sélection des employés
            </h2>

            <div className="flex flex-wrap gap-4 mb-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un employé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Department filter */}
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[180px]">
                  <HiOutlineBuildingOffice2 className="size-4 mr-2" />
                  <SelectValue placeholder="Département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Position filter */}
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger className="w-[180px]">
                  <HiOutlineBriefcase className="size-4 mr-2" />
                  <SelectValue placeholder="Poste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les postes</SelectItem>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary row */}
            <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Checkbox 
                    checked={selectableEmployees.length > 0 && selectableEmployees.every(emp => emp.selected)} 
                    onChange={toggleAll}
                  />
                  {selectableEmployees.every(emp => emp.selected) ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
                <span className="text-sm text-muted-foreground">
                  {filteredEmployees.length} employé(s) affiché(s)
                </span>
              </div>
              <span className="text-sm">
                <span className="font-semibold text-green-600">{selectableEmployees.filter(e => !e.error).length}</span> éligibles • 
                <span className="font-semibold text-orange-600 ml-2">{filteredEmployees.filter(e => e.error).length}</span> avec problèmes
              </span>
            </div>

            {/* Employees Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Employé</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Poste</TableHead>
                      <TableHead className="text-right">Salaire de base</TableHead>
                      <TableHead className="w-32">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun employé trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <TableRow 
                          key={employee.id}
                          className={cn(
                            employee.error && "bg-orange-50 dark:bg-orange-950/20",
                            employee.selected && "bg-primary/5"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={employee.selected}
                              onChange={() => toggleEmployee(employee.id)}
                              disabled={!!employee.error || employee.loadingContract}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{employee.full_name}</p>
                              <p className="text-xs text-muted-foreground">{employee.employee_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {employee.department_name || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {employee.position_title || "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {employee.loadingContract ? (
                              <span className="text-muted-foreground text-xs">Chargement...</span>
                            ) : employee.contract ? (
                              <span className="font-medium">
                                {formatCurrency(employee.contract.base_salary, employee.contract.currency || "GNF")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {employee.loadingContract ? (
                              <Badge variant="secondary" className="text-xs">
                                <div className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                                Vérification...
                              </Badge>
                            ) : employee.error ? (
                              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <HiOutlineXCircle className="size-3 mr-1" />
                                {employee.error}
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs bg-green-500">
                                <HiOutlineCheckCircle className="size-3 mr-1" />
                                Éligible
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Summary & Options */}
        <div className="space-y-6">
          {/* Options */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Options de génération</h3>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={autoDeductAdvances}
                  onChange={() => setAutoDeductAdvances(!autoDeductAdvances)}
                />
                <div>
                  <p className="font-medium text-sm">Déduire les avances</p>
                  <p className="text-xs text-muted-foreground">
                    Les avances approuvées seront automatiquement déduites du salaire
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={autoApprove}
                  onChange={() => setAutoApprove(!autoApprove)}
                />
                <div>
                  <p className="font-medium text-sm">Approuver automatiquement</p>
                  <p className="text-xs text-muted-foreground">
                    Les fiches seront créées avec le statut "Approuvé"
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* Summary */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Récapitulatif</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Employés sélectionnés</span>
                <span className="font-semibold">{selectedCount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total salaires bruts</span>
                <span className="font-semibold">{formatCurrency(selectedTotal, "GNF")}</span>
              </div>

              {selectedPeriod && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Période</span>
                  <span className="font-medium text-sm">
                    {periods.find(p => p.id === selectedPeriod)?.name || "-"}
                  </span>
                </div>
              )}
            </div>

            <hr className="my-4" />

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleGenerate}
              disabled={generating || !selectedPeriod || selectedCount === 0}
            >
              {generating ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <HiOutlineSparkles className="size-5 mr-2" />
                  Générer {selectedCount} fiche(s)
                </>
              )}
            </Button>

            {selectedCount === 0 && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Sélectionnez au moins un employé pour continuer
              </p>
            )}
          </Card>

          {/* Legend */}
          <Card className="p-4">
            <h4 className="text-sm font-medium mb-3">Légende</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500 text-xs">
                  <HiOutlineCheckCircle className="size-3" />
                </Badge>
                <span>Employé éligible (contrat actif trouvé)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  <HiOutlineXCircle className="size-3" />
                </Badge>
                <span>Pas de contrat actif - fiche impossible</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Period Creation Dialog */}
      <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HiOutlineCalendar className="size-5" />
              Nouvelle période de paie
            </DialogTitle>
            <DialogDescription>
              Créez une nouvelle période de paie pour la génération des fiches
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="period-name">
                Nom de la période <span className="text-destructive">*</span>
              </Label>
              <Input
                id="period-name"
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                placeholder="Ex: Janvier 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period-start">
                  Date de début <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="period-start"
                  type="date"
                  value={periodForm.start_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-end">
                  Date de fin <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="period-end"
                  type="date"
                  value={periodForm.end_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period-payment">Date de paiement prévue</Label>
              <Input
                id="period-payment"
                type="date"
                value={periodForm.payment_date}
                onChange={(e) => setPeriodForm({ ...periodForm, payment_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreatePeriod} disabled={creatingPeriod}>
              {creatingPeriod ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <HiOutlinePlusCircle className="size-4 mr-2" />
                  Créer la période
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
