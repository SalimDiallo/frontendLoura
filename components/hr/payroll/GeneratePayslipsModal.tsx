"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HiOutlineSparkles,
  HiOutlineMagnifyingGlass,
  HiOutlineUsers,
  HiOutlineBuildingOffice2,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDocumentCheck,
  HiOutlineClipboardDocumentList,
  HiOutlineCheck,
} from "react-icons/hi2";
import { formatCurrency, cn } from "@/lib/utils";
import { getEmployees } from "@/lib/services/hr/employee.service";
import { getDepartments } from "@/lib/services/hr/department.service";
import { getPositions } from "@/lib/services/hr/position.service";
import type { PayrollPeriod, EmployeeListItem, Department, Position } from "@/lib/types/hr";

interface GeneratePayslipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  periods: PayrollPeriod[];
  currentPeriod: PayrollPeriod | null;
  organizationSlug: string;
  onGenerate: (config: GenerateConfig) => Promise<void>;
}

export interface GenerateConfig {
  periodId: string;
  employeeIds: string[];
  autoApprove: boolean;
  autoDeductAdvances: boolean;
}

interface EmployeeWithSalary extends EmployeeListItem {
  selected: boolean;
}

// Simple Checkbox component
const Checkbox = ({ checked, onChange, id, className }: { 
  checked: boolean; 
  onChange?: () => void; 
  id?: string;
  className?: string;
}) => (
  <button
    type="button"
    id={id}
    onClick={onChange}
    className={cn(
      "size-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
      checked 
        ? "bg-primary border-primary text-white" 
        : "border-muted-foreground/30 hover:border-primary/50",
      className
    )}
  >
    {checked && <HiOutlineCheck className="size-3.5" />}
  </button>
);

export function GeneratePayslipsModal({
  isOpen,
  onClose,
  periods,
  currentPeriod,
  organizationSlug,
  onGenerate,
}: GeneratePayslipsModalProps) {
  // States
  const [step, setStep] = useState<"config" | "select" | "confirm">("config");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [employees, setEmployees] = useState<EmployeeWithSalary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Config
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [autoDeductAdvances, setAutoDeductAdvances] = useState(true);

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("config");
      setError(null);
      setSelectedPeriodId(currentPeriod?.id || periods[0]?.id || "");
      loadData();
    }
  }, [isOpen, currentPeriod, periods]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [empData, deptData, posData] = await Promise.all([
        getEmployees(organizationSlug, { is_active: true, page_size: 500 }),
        getDepartments({ organization_subdomain: organizationSlug, is_active: true }),
        getPositions({ is_active: true }),
      ]);

      // Add selected property to employees and filter those with contracts (base_salary)
      const employeesWithSelection = empData.results
        .filter((emp) => emp.base_salary && emp.base_salary > 0)
        .map((emp) => ({
          ...emp,
          selected: true, // Select all by default
        }));

      setEmployees(employeesWithSelection);
      setDepartments(deptData || []);
      setPositions(posData || []);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Department filter
      if (filterDepartment !== "all" && emp.department !== filterDepartment) {
        return false;
      }
      // Position filter - we need to use position_title for comparison
      if (filterPosition !== "all") {
        const position = positions.find((p) => p.id === filterPosition);
        if (position && emp.position_title !== position.title) {
          return false;
        }
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          emp.full_name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          (emp.employee_id && emp.employee_id.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [employees, filterDepartment, filterPosition, searchQuery, positions]);

  // Selected employees
  const selectedEmployees = useMemo(() => {
    return employees.filter((emp) => emp.selected);
  }, [employees]);

  // Total salary
  const totalSalary = useMemo(() => {
    return selectedEmployees.reduce((sum, emp) => sum + (emp.base_salary || 0), 0);
  }, [selectedEmployees]);

  // Toggle employee selection
  const toggleEmployee = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? { ...emp, selected: !emp.selected } : emp
      )
    );
  };

  // Select/deselect all filtered
  const toggleAllFiltered = () => {
    const allSelected = filteredEmployees.every((emp) => emp.selected);
    const filteredIds = new Set(filteredEmployees.map((emp) => emp.id));

    setEmployees((prev) =>
      prev.map((emp) =>
        filteredIds.has(emp.id) ? { ...emp, selected: !allSelected } : emp
      )
    );
  };

  // Handle generation
  const handleGenerate = async () => {
    if (selectedEmployees.length === 0) {
      setError("Veuillez sélectionner au moins un employé");
      return;
    }

    if (!selectedPeriodId) {
      setError("Veuillez sélectionner une période de paie");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      await onGenerate({
        periodId: selectedPeriodId,
        employeeIds: selectedEmployees.map((emp) => emp.id),
        autoApprove,
        autoDeductAdvances,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HiOutlineSparkles className="size-6 text-primary" />
            Générer les fiches de paie
          </DialogTitle>
          <DialogDescription>
            {step === "config" && "Configurez les paramètres de génération"}
            {step === "select" && "Sélectionnez les employés concernés"}
            {step === "confirm" && "Confirmez la génération des fiches de paie"}
          </DialogDescription>
        </DialogHeader>

        {/* Error message */}
        {error && (
          <Alert variant="error" className="flex justify-between items-center">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <HiOutlineXCircle className="size-4" />
            </Button>
          </Alert>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement des données...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Step Progress */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg">
              <div
                className={cn(
                  "flex items-center gap-2 text-sm font-medium",
                  step === "config" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className={cn(
                  "size-6 rounded-full flex items-center justify-center text-xs",
                  step === "config" ? "bg-primary text-white" : "bg-muted"
                )}>
                  1
                </span>
                Configuration
              </div>
              <div className="flex-1 h-px bg-border" />
              <div
                className={cn(
                  "flex items-center gap-2 text-sm font-medium",
                  step === "select" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className={cn(
                  "size-6 rounded-full flex items-center justify-center text-xs",
                  step === "select" ? "bg-primary text-white" : "bg-muted"
                )}>
                  2
                </span>
                Sélection
              </div>
              <div className="flex-1 h-px bg-border" />
              <div
                className={cn(
                  "flex items-center gap-2 text-sm font-medium",
                  step === "confirm" ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className={cn(
                  "size-6 rounded-full flex items-center justify-center text-xs",
                  step === "confirm" ? "bg-primary text-white" : "bg-muted"
                )}>
                  3
                </span>
                Confirmation
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto min-h-[400px]">
              {/* Step 1: Configuration */}
              {step === "config" && (
                <div className="space-y-6 p-4">
                  {/* Period Selection */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <HiOutlineClipboardDocumentList className="size-5" />
                      Période de paie
                    </Label>
                    <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner une période" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            <div className="flex items-center gap-2">
                              <span>{period.name}</span>
                              <span className="text-muted-foreground text-xs">
                                ({new Date(period.start_date).toLocaleDateString("fr-FR")} - {new Date(period.end_date).toLocaleDateString("fr-FR")})
                              </span>
                              {period.payslip_count && period.payslip_count > 0 && (
                                <Badge variant="outline" className="ml-2">
                                  {period.payslip_count} fiche(s)
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {periods.length === 0 && (
                      <p className="text-sm text-amber-600">
                        ⚠️ Aucune période de paie. Créez-en une d'abord.
                      </p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Options</Label>
                    
                    <Card className="p-4 space-y-4">
                      {/* Auto approve option */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="autoApprove"
                          checked={autoApprove}
                          onChange={() => setAutoApprove(!autoApprove)}
                        />
                        <div>
                          <Label htmlFor="autoApprove" className="cursor-pointer font-medium">
                            Approuver automatiquement les fiches
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {autoApprove
                              ? "Les fiches seront créées avec le statut 'Approuvé'"
                              : "Les fiches seront en 'Brouillon' pour vérification"}
                          </p>
                        </div>
                      </div>

                      {/* Auto deduct advances */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="autoDeductAdvances"
                          checked={autoDeductAdvances}
                          onChange={() => setAutoDeductAdvances(!autoDeductAdvances)}
                        />
                        <div>
                          <Label htmlFor="autoDeductAdvances" className="cursor-pointer font-medium">
                            Déduire les avances approuvées
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Les avances sur salaire approuvées seront automatiquement déduites
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Stats preview */}
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-4">
                      <HiOutlineUsers className="size-8 text-primary" />
                      <div>
                        <p className="font-semibold">
                          {employees.length} employé(s) éligible(s)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Seuls les employés avec un contrat actif et un salaire défini sont affichés
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Step 2: Employee Selection */}
              {step === "select" && (
                <div className="space-y-4 p-4">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher par nom, email, matricule..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
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

                  {/* Select all */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="selectAll"
                        checked={filteredEmployees.length > 0 && filteredEmployees.every((emp) => emp.selected)}
                        onChange={toggleAllFiltered}
                      />
                      <Label htmlFor="selectAll" className="cursor-pointer">
                        Sélectionner tous les employés affichés ({filteredEmployees.length})
                      </Label>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {selectedEmployees.length} sélectionné(s)
                    </Badge>
                  </div>

                  {/* Employee list */}
                  <div className="border rounded-lg divide-y max-h-[350px] overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <HiOutlineUsers className="size-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun employé trouvé</p>
                      </div>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <div
                          key={emp.id}
                          className={cn(
                            "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer",
                            emp.selected && "bg-primary/5"
                          )}
                          onClick={() => toggleEmployee(emp.id)}
                        >
                          <Checkbox checked={emp.selected} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{emp.full_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{emp.employee_id}</span>
                              {emp.department_name && (
                                <>
                                  <span>•</span>
                                  <span>{emp.department_name}</span>
                                </>
                              )}
                              {emp.position_title && (
                                <>
                                  <span>•</span>
                                  <span>{emp.position_title}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatCurrency(emp.base_salary || 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {emp.salary_period_display || "mensuel"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === "confirm" && (
                <div className="space-y-6 p-4">
                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <HiOutlineDocumentCheck className="size-5" />
                      Récapitulatif
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Période</p>
                        <p className="font-semibold">{selectedPeriod?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPeriod && (
                            <>
                              {new Date(selectedPeriod.start_date).toLocaleDateString("fr-FR")} - {new Date(selectedPeriod.end_date).toLocaleDateString("fr-FR")}
                            </>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Employés</p>
                        <p className="font-semibold text-2xl">{selectedEmployees.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Masse salariale brute</p>
                        <p className="font-bold text-2xl text-green-600">
                          {formatCurrency(totalSalary)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Options</p>
                        <div className="space-y-1">
                          <Badge variant={autoApprove ? "success" : "outline"}>
                            {autoApprove ? "Approbation auto" : "Vérification manuelle"}
                          </Badge>
                          {autoDeductAdvances && (
                            <Badge variant="default" className="ml-2">
                              Déduction avances
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Selected employees preview */}
                  <div>
                    <h4 className="font-medium mb-2">Employés sélectionnés ({selectedEmployees.length})</h4>
                    <div className="border rounded-lg max-h-[200px] overflow-y-auto divide-y">
                      {selectedEmployees.map((emp) => (
                        <div key={emp.id} className="flex items-center justify-between p-3">
                          <div>
                            <p className="font-medium">{emp.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {emp.department_name} • {emp.position_title}
                            </p>
                          </div>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(emp.base_salary || 0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert variant="info">
                    <HiOutlineCheckCircle className="size-4" />
                    <span>
                      {autoApprove
                        ? "Les fiches de paie seront créées et approuvées automatiquement."
                        : "Les fiches de paie seront créées en brouillon. Vous pourrez les vérifier et les approuver individuellement."}
                    </span>
                  </Alert>
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="flex-shrink-0">
              <div className="flex items-center justify-between w-full">
                <div>
                  {step !== "config" && (
                    <Button
                      variant="ghost"
                      onClick={() => setStep(step === "confirm" ? "select" : "config")}
                    >
                      ← Retour
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Annuler
                  </Button>
                  {step === "config" && (
                    <Button
                      onClick={() => setStep("select")}
                      disabled={!selectedPeriodId || periods.length === 0}
                    >
                      Continuer →
                    </Button>
                  )}
                  {step === "select" && (
                    <Button
                      onClick={() => setStep("confirm")}
                      disabled={selectedEmployees.length === 0}
                    >
                      Continuer ({selectedEmployees.length} sélectionné{selectedEmployees.length > 1 ? "s" : ""}) →
                    </Button>
                  )}
                  {step === "confirm" && (
                    <Button
                      onClick={handleGenerate}
                      disabled={generating || selectedEmployees.length === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {generating ? (
                        <>
                          <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <HiOutlineSparkles className="size-4 mr-2" />
                          Générer {selectedEmployees.length} fiche{selectedEmployees.length > 1 ? "s" : ""}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
