"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  HiChevronDown,
  HiChevronUp,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineBanknotes,
} from "react-icons/hi2";
import { formatCurrency, cn } from "@/lib/utils";
import { getPayrollPeriods, createPayrollPeriod, generateBulkPayslips, contractService, getPayrollAdvances } from "@/lib/services/hr";
import { getEmployees } from "@/lib/services/hr/employee.service";
import { getDepartments } from "@/lib/services/hr/department.service";
import { getPositions } from "@/lib/services/hr/position.service";
import type { PayrollPeriod, EmployeeListItem, Department, Position, Contract, PayrollAdvance } from "@/lib/types/hr";

// ============================================
// Types
// ============================================

interface PayrollItem {
  id: string;
  name: string;
  amount: number;
  is_deduction: boolean;
}

interface EmployeeWithContract extends EmployeeListItem {
  selected: boolean;
  contract: Contract | null;
  loadingContract: boolean;
  error: string | null;
  hasExistingPayslip?: boolean;
  // Personnalisation par employé
  customBaseSalary: number | null;  // Si null, utilise le salaire du contrat
  notes: string;  // Note/description pour cet employé
  // Primes et déductions personnalisées
  allowances: PayrollItem[];
  deductions: PayrollItem[];
  // Avances sur salaire
  advances: PayrollAdvance[];
  selectedAdvanceIds: string[];
  loadingAdvances: boolean;
  showDetails: boolean;
}

// ============================================
// Simple Checkbox component
// ============================================
// Make sure Checkbox never creates a button inside a button (use a span if needed)
const Checkbox = ({ checked, onChange, id, className, disabled }: { 
  checked: boolean; 
  onChange?: () => void; 
  id?: string;
  className?: string;
  disabled?: boolean;
}) => (
  <span
    role="checkbox"
    aria-checked={checked}
    aria-disabled={disabled}
    id={id}
    tabIndex={disabled ? -1 : 0}
    onClick={disabled ? undefined : onChange}
    onKeyPress={disabled ? undefined : (e) => {
      if (onChange && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onChange();
      }
    }}
    className={cn(
      "size-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 select-none",
      disabled && "opacity-50 cursor-not-allowed",
      checked 
        ? "bg-primary border-primary text-white" 
        : "border-muted-foreground/30 hover:border-primary/50",
      className,
      "cursor-pointer"
    )}
  >
    {checked && <HiOutlineCheck className="size-3.5 pointer-events-none" />}
  </span>
);

// ============================================
// AddItemButton component for adding allowances/deductions
// ============================================
const AddItemButton = ({ 
  onAdd, 
  type 
}: { 
  onAdd: (name: string, amount: number) => void; 
  type: 'allowance' | 'deduction';
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (name && amount && Number(amount) > 0) {
      onAdd(name, Number(amount));
      setName('');
      setAmount('');
      setIsOpen(false);
    }
  };

  const suggestions = type === 'allowance' 
    ? ['Prime de transport', 'Prime de logement', 'Prime de performance', 'Prime de risque', 'Indemnité repas']
    : ['Prêt employé', 'Pénalité retard', 'Cotisation syndicale', 'Assurance complémentaire'];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors",
          type === 'allowance' 
            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
        )}
        type="button"
      >
        <HiOutlinePlus className="size-3" />
        Ajouter
      </button>
    );
  }

  return (
    <div className="p-3 bg-white dark:bg-gray-800 border rounded-lg shadow-lg absolute z-20 right-0 min-w-[250px]">
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Libellé</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'allowance' ? "Ex: Prime de transport" : "Ex: Prêt employé"}
            className="h-8 text-sm mt-1"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {suggestions.slice(0, 3).map(s => (
              <button
                key={s}
                onClick={() => setName(s)}
                className="text-xs px-2 py-0.5 bg-muted rounded hover:bg-muted/80"
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Montant (GNF)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ex: 100000"
            className="h-8 text-sm mt-1"
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setName('');
              setAmount('');
            }}
            className="flex-1 h-7 text-xs"
            type="button"
          >
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!name || !amount || Number(amount) <= 0}
            className={cn(
              "flex-1 h-7 text-xs",
              type === 'allowance' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            )}
            type="button"
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
};

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

  // Period creation dialog
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [periodForm, setPeriodForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    payment_date: "",
  });

  // --------------------------------------------
  // Utility: Get effective base salary (custom or from contract)
  // To fix ReferenceError, declare this before code that needs it (e.g., in useMemo below).
  // --------------------------------------------
  const getEffectiveBaseSalary = (emp: EmployeeWithContract): number => {
    return emp.customBaseSalary !== null ? emp.customBaseSalary : (emp.contract?.base_salary ? emp.contract.base_salary : 0);
  };

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
        customBaseSalary: null,
        notes: "",
        allowances: [],
        deductions: [],
        advances: [],
        selectedAdvanceIds: [],
        loadingAdvances: false,
        showDetails: false,
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

  // Load advances for a specific employee
  const loadAdvancesForEmployee = async (employeeId: string) => {
    // Mark as loading
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, loadingAdvances: true } : emp
    ));

    try {
      const advances = await getPayrollAdvances({
        organization_subdomain: slug,
        employee: employeeId,
        status: "approved",
      });
      // Only keep advances not already linked to a payslip
      const availableAdvances = advances.filter((adv: PayrollAdvance) => !adv.payslip);
      
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, advances: availableAdvances, loadingAdvances: false }
          : emp
      ));
    } catch (err) {
      console.error("Error loading advances:", err);
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, advances: [], loadingAdvances: false } : emp
      ));
    }
  };

  // Toggle advance selection for an employee (with net salary check)
  const toggleAdvanceSelection = (employeeId: string, advanceId: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== employeeId) return emp;
      
      const isSelected = emp.selectedAdvanceIds.includes(advanceId);
      
      // Si on désélectionne, pas de problème
      if (isSelected) {
        return { ...emp, selectedAdvanceIds: emp.selectedAdvanceIds.filter(id => id !== advanceId) };
      }
      
      // Si on sélectionne, vérifier que le net ne devient pas négatif
      const advance = emp.advances.find(a => a.id === advanceId);
      if (!advance) return emp;
      
      const baseSalary = getEffectiveBaseSalary(emp);
      const totalAllowances = emp.allowances.reduce((sum, a) => sum + a.amount, 0);
      const totalDeductions = emp.deductions.reduce((sum, d) => sum + d.amount, 0);
      const currentAdvances = emp.advances
        .filter(a => emp.selectedAdvanceIds.includes(a.id))
        .reduce((sum, a) => sum + Number(a.amount), 0);
      
      const gross = baseSalary + totalAllowances;
      const currentNet = gross - totalDeductions - currentAdvances;
      const newAdvanceAmount = Number(advance.amount);
      
      // Vérifier si l'ajout de cette avance rendrait le net négatif
      if (currentNet - newAdvanceAmount < 0) {
        // Ne pas sélectionner cette avance
        return emp;
      }
      
      return { ...emp, selectedAdvanceIds: [...emp.selectedAdvanceIds, advanceId] };
    }));
  };

  // Check if an advance can be selected (won't make net negative)
  const canSelectAdvance = (emp: EmployeeWithContract, advanceId: string): boolean => {
    const advance = emp.advances.find(a => a.id === advanceId);
    if (!advance) return false;
    
    // If already selected, can always toggle off
    if (emp.selectedAdvanceIds.includes(advanceId)) return true;
    
    const baseSalary = getEffectiveBaseSalary(emp);
    const totalAllowances = emp.allowances.reduce((sum, a) => sum + a.amount, 0);
    const totalDeductions = emp.deductions.reduce((sum, d) => sum + d.amount, 0);
    const currentAdvances = emp.advances
      .filter(a => emp.selectedAdvanceIds.includes(a.id))
      .reduce((sum, a) => sum + Number(a.amount), 0);
    
    const gross = baseSalary + totalAllowances;
    const currentNet = gross - totalDeductions - currentAdvances;
    
    return currentNet - Number(advance.amount) >= 0;
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
    .reduce((sum, emp) => sum + getEffectiveBaseSalary(emp), 0);

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

  // Toggle details panel for an employee
  const toggleDetails = (id: string) => {
    const employee = employees.find(e => e.id === id);
    
    // If opening details and advances not loaded yet, load them
    if (employee && !employee.showDetails && employee.advances.length === 0 && !employee.loadingAdvances) {
      loadAdvancesForEmployee(id);
    }
    
    setEmployees(prev => prev.map(emp => 
      emp.id === id ? { ...emp, showDetails: !emp.showDetails } : emp
    ));
  };

  // Update custom base salary for an employee
  const updateCustomBaseSalary = (employeeId: string, value: number | null) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, customBaseSalary: value } : emp
    ));
  };

  // Update notes for an employee
  const updateNotes = (employeeId: string, notes: string) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, notes } : emp
    ));
  };

  // Add an allowance to an employee
  const addAllowance = (employeeId: string, name: string, amount: number) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          allowances: [...emp.allowances, { 
            id: crypto.randomUUID(), 
            name, 
            amount, 
            is_deduction: false 
          }]
        };
      }
      return emp;
    }));
  };

  // Add a deduction to an employee (with net check)
  const addDeduction = (employeeId: string, name: string, amount: number) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        // Vérifier que l'ajout ne rend pas le net négatif
        const baseSalary = getEffectiveBaseSalary(emp);
        const totalAllowances = emp.allowances.reduce((sum, a) => sum + a.amount, 0);
        const currentDeductions = emp.deductions.reduce((sum, d) => sum + d.amount, 0);
        const currentAdvances = emp.advances
          .filter(a => emp.selectedAdvanceIds.includes(a.id))
          .reduce((sum, a) => sum + Number(a.amount), 0);
        
        const gross = baseSalary + totalAllowances;
        const currentNet = gross - currentDeductions - currentAdvances;
        
        if (currentNet - amount < 0) {
          // Ne pas ajouter cette déduction
          return emp;
        }
        
        return {
          ...emp,
          deductions: [...emp.deductions, { 
            id: crypto.randomUUID(), 
            name, 
            amount, 
            is_deduction: true 
          }]
        };
      }
      return emp;
    }));
  };

  // Remove an item (allowance or deduction) from an employee
  const removeItem = (employeeId: string, itemId: string, isDeduction: boolean) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        if (isDeduction) {
          return { ...emp, deductions: emp.deductions.filter(d => d.id !== itemId) };
        } else {
          return { ...emp, allowances: emp.allowances.filter(a => a.id !== itemId) };
        }
      }
      return emp;
    }));
  };

  // Calculate totals for an employee
  const calculateEmployeeTotals = (emp: EmployeeWithContract) => {
    const baseSalary = getEffectiveBaseSalary(emp);
    const totalAllowances = emp.allowances.reduce((sum, a) => sum + a.amount, 0);
    const totalDeductions = emp.deductions.reduce((sum, d) => sum + d.amount, 0);
    
    // Avances sélectionnées
    const totalAdvances = emp.advances
      .filter(a => emp.selectedAdvanceIds.includes(a.id))
      .reduce((sum, a) => sum + Number(a.amount), 0);
    
    const gross = baseSalary + totalAllowances;
    const totalDed = totalDeductions + totalAdvances;
    const net = gross - totalDed;
    
    return { gross, totalDeductions: totalDed, net, totalAdvances, baseSalary };
  };

  const handleGenerate = async () => {
    // La période est maintenant optionnelle

    const selectedEmployees = employees.filter(emp => emp.selected && emp.contract);
    const selectedEmployeeIds = selectedEmployees.map(emp => emp.id);

    if (selectedEmployeeIds.length === 0) {
      setError("Veuillez sélectionner au moins un employé");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      // Construire les données personnalisées par employé
      const employeeCustomData: Record<string, {
        base_salary?: number;
        notes?: string;
        allowances?: { name: string; amount: number }[];
        deductions?: { name: string; amount: number }[];
        advance_ids?: string[];
      }> = {};

      for (const emp of selectedEmployees) {
        const hasCustomData = 
          emp.customBaseSalary !== null ||
          emp.notes !== "" ||
          emp.allowances.length > 0 ||
          emp.deductions.length > 0 ||
          emp.selectedAdvanceIds.length > 0;

        if (hasCustomData) {
          employeeCustomData[emp.id] = {};
          
          if (emp.customBaseSalary !== null) {
            employeeCustomData[emp.id].base_salary = emp.customBaseSalary;
          }
          if (emp.notes) {
            employeeCustomData[emp.id].notes = emp.notes;
          }
          if (emp.allowances.length > 0) {
            employeeCustomData[emp.id].allowances = emp.allowances.map(a => ({
              name: a.name,
              amount: a.amount
            }));
          }
          if (emp.deductions.length > 0) {
            employeeCustomData[emp.id].deductions = emp.deductions.map(d => ({
              name: d.name,
              amount: d.amount
            }));
          }
          if (emp.selectedAdvanceIds.length > 0) {
            employeeCustomData[emp.id].advance_ids = emp.selectedAdvanceIds;
          }
        }
      }

      const result = await generateBulkPayslips(selectedPeriod || null, {
        organizationSlug: slug,
        auto_approve: autoApprove,
        employee_ids: selectedEmployeeIds,
        employee_custom_data: employeeCustomData,
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
      if (result.ad_hoc_mode) {
        message += ` • Mode ad-hoc`;
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
              Configuration de la paie
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Période */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Période de paie <span className="text-xs text-muted-foreground">(optionnel)</span>
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedPeriod} 
                    onValueChange={(value) => setSelectedPeriod(value === "_none" ? "" : value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sans période (ad-hoc)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">
                        <span className="text-muted-foreground">📝 Sans période (ad-hoc)</span>
                      </SelectItem>
                      {periods.length > 0 && (
                        <div className="py-1 px-2 text-xs text-muted-foreground border-t mt-1">
                          Périodes disponibles
                        </div>
                      )}
                      {periods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          <div className="flex items-center gap-2">
                            <span>{period.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({new Date(period.start_date).toLocaleDateString("fr-FR")} - {new Date(period.end_date).toLocaleDateString("fr-FR")})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={openPeriodDialog} title="Créer une nouvelle période">
                    <HiOutlinePlusCircle className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {!selectedPeriod && (
              <Alert variant="info" className="mt-4">
                <HiOutlineDocumentText className="size-4" />
                <div className="ml-2">
                  <p className="font-medium">Mode ad-hoc (sans période)</p>
                  <p className="text-sm mt-1">
                    Les fiches de paie seront créées sans rattachement à une période. 
                    Vous pouvez ajouter des notes personnalisées pour chaque employé.
                  </p>
                </div>
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
                <span
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline cursor-pointer"
                  tabIndex={0}
                  role="button"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleAll();
                    }
                  }}
                >
                  <Checkbox 
                    checked={selectableEmployees.length > 0 && selectableEmployees.every(emp => emp.selected)} 
                    onChange={toggleAll}
                  />
                  {selectableEmployees.every(emp => emp.selected) ? "Tout désélectionner" : "Tout sélectionner"}
                </span>
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
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Employé</TableHead>
                      <TableHead className="hidden md:table-cell">Département</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">Net estimé</TableHead>
                      <TableHead className="w-32">Statut</TableHead>
                      <TableHead className="w-20 text-center">Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Aucun employé trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((employee) => {
                        const totals = calculateEmployeeTotals(employee);
                        const hasCustomItems = employee.allowances.length > 0 || employee.deductions.length > 0;
                        
                        return (
                          <React.Fragment key={employee.id}>
                            <TableRow 
                              className={cn(
                                employee.error && "bg-orange-50 dark:bg-orange-950/20",
                                employee.selected && "bg-primary/5",
                                employee.showDetails && "border-b-0"
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
                                  <p className="text-xs text-muted-foreground">{employee.position_title || employee.employee_id}</p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {employee.department_name || "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {employee.loadingContract ? (
                                  <span className="text-muted-foreground text-xs">...</span>
                                ) : employee.contract ? (
                                  formatCurrency(employee.contract.base_salary)
                                ) : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                {employee.contract && (
                                  <div>
                                    <span className="font-bold text-green-600">{formatCurrency(totals.net)}</span>
                                    {(hasCustomItems || employee.selectedAdvanceIds.length > 0) && (
                                      <div className="text-xs text-muted-foreground">
                                        {employee.allowances.length > 0 && <span className="text-blue-500">+{employee.allowances.length}</span>}
                                        {employee.deductions.length > 0 && <span className="text-red-500 ml-1">-{employee.deductions.length}</span>}
                                        {employee.selectedAdvanceIds.length > 0 && <span className="text-amber-500 ml-1">📌{employee.selectedAdvanceIds.length}</span>}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {employee.loadingContract ? (
                                  <Badge variant="secondary" className="text-xs">
                                    <div className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                                    ...
                                  </Badge>
                                ) : employee.error ? (
                                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    <HiOutlineXCircle className="size-3 mr-1" />
                                    Non éligible
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs bg-green-500">
                                    <HiOutlineCheckCircle className="size-3 mr-1" />
                                    OK
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {employee.contract && !employee.error && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleDetails(employee.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    {employee.showDetails ? (
                                      <HiChevronUp className="size-4" />
                                    ) : (
                                      <HiChevronDown className="size-4" />
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                            
                            {/* Expandable Details Row */}
                            {employee.showDetails && employee.contract && (
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={7} className="p-4">
                                  {/* Salaire de base et Notes */}
                                  <div className="grid md:grid-cols-2 gap-4 mb-4 pb-4 border-b">
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Salaire de base</Label>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          value={employee.customBaseSalary !== null ? employee.customBaseSalary : employee.contract.base_salary}
                                          onChange={(e) => {
                                            const val = e.target.value === "" ? null : parseFloat(e.target.value);
                                            updateCustomBaseSalary(employee.id, val);
                                          }}
                                          className="w-40"
                                        />
                                        {employee.customBaseSalary !== null && (
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => updateCustomBaseSalary(employee.id, null)}
                                            title="Réinitialiser au salaire du contrat"
                                          >
                                            <HiOutlineTrash className="size-4 text-muted-foreground" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Contrat: {formatCurrency(employee.contract.base_salary)}
                                        {employee.customBaseSalary !== null && (
                                          <span className="text-amber-600 ml-2">• Modifié</span>
                                        )}
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Notes / Description</Label>
                                      <Input
                                        value={employee.notes}
                                        onChange={(e) => updateNotes(employee.id, e.target.value)}
                                        placeholder="Ex: Prime exceptionnelle, Régularisation..."
                                      />
                                      <p className="text-xs text-muted-foreground">
                                        Cette note apparaîtra sur la fiche de paie
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid md:grid-cols-3 gap-4">
                                    {/* Primes */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-green-700 dark:text-green-400">
                                          Primes (+)
                                        </h4>
                                        <AddItemButton
                                          onAdd={(name, amount) => addAllowance(employee.id, name, amount)}
                                          type="allowance"
                                        />
                                      </div>
                                      {employee.allowances.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic">Aucune prime ajoutée</p>
                                      ) : (
                                        <div className="space-y-1">
                                          {employee.allowances.map(item => (
                                            <div key={item.id} className="flex items-center justify-between text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                              <span>{item.name}</span>
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium text-green-600">+{formatCurrency(item.amount)}</span>
                                                <button 
                                                  onClick={() => removeItem(employee.id, item.id, false)}
                                                  className="text-red-500 hover:text-red-700"
                                                  type="button"
                                                >
                                                  <HiOutlineTrash className="size-3" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Déductions */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-red-700 dark:text-red-400">
                                          Déductions (-)
                                        </h4>
                                        <AddItemButton 
                                          onAdd={(name, amount) => addDeduction(employee.id, name, amount)}
                                          type="deduction"
                                        />
                                      </div>
                                      {/* Standard deductions */}
                                      {employee.deductions.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic">Aucune déduction supplémentaire</p>
                                      ) : (
                                        <div className="space-y-1">
                                          {employee.deductions.map(item => (
                                            <div key={item.id} className="flex items-center justify-between text-sm bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                              <span>{item.name}</span>
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium text-red-600">-{formatCurrency(item.amount)}</span>
                                                <button 
                                                  onClick={() => removeItem(employee.id, item.id, true)}
                                                  className="text-red-500 hover:text-red-700"
                                                  type="button"
                                                >
                                                  <HiOutlineTrash className="size-3" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Avances sur salaire */}
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                        <HiOutlineBanknotes className="size-4" />
                                        Avances à déduire
                                      </h4>
                                      {employee.loadingAdvances ? (
                                        <p className="text-xs text-muted-foreground italic">Chargement...</p>
                                      ) : employee.advances.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic">Aucune avance en attente</p>
                                      ) : (
                                        <div className="space-y-1">
                                          {employee.advances.map(advance => {
                                            const isSelected = employee.selectedAdvanceIds.includes(advance.id);
                                            const canSelect = canSelectAdvance(employee, advance.id);
                                            return (
                                              <label 
                                                key={advance.id} 
                                                className={cn(
                                                  "flex items-center justify-between text-sm px-2 py-1.5 rounded transition-colors",
                                                  isSelected 
                                                    ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-300 cursor-pointer" 
                                                    : canSelect 
                                                      ? "bg-muted/50 hover:bg-muted cursor-pointer"
                                                      : "bg-muted/30 opacity-50 cursor-not-allowed"
                                                )}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => canSelect && toggleAdvanceSelection(employee.id, advance.id)}
                                                    className="size-4"
                                                    disabled={!canSelect}
                                                  />
                                                  <div className="flex flex-col">
                                                    <span className="truncate max-w-[120px]">
                                                      {advance.reason || "Avance"}
                                                    </span>
                                                    {!canSelect && !isSelected && (
                                                      <span className="text-[10px] text-red-500">Net insuffisant</span>
                                                    )}
                                                  </div>
                                                </div>
                                                <span className={cn(
                                                  "font-medium",
                                                  isSelected ? "text-amber-700" : "text-muted-foreground"
                                                )}>
                                                  -{formatCurrency(Number(advance.amount))}
                                                </span>
                                              </label>
                                            );
                                          })}
                                          {employee.selectedAdvanceIds.length > 0 && (
                                            <div className="text-xs text-amber-600 font-medium pt-1 border-t">
                                              Total avances: -{formatCurrency(
                                                employee.advances
                                                  .filter(a => employee.selectedAdvanceIds.includes(a.id))
                                                  .reduce((sum, a) => sum + Number(a.amount), 0)
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Summary */}
                                  <div className="mt-4 pt-3 border-t flex justify-end gap-6 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Brut:</span>
                                      <span className="ml-2 font-medium">{formatCurrency(totals.gross)}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Déductions:</span>
                                      <span className="ml-2 font-medium text-red-600">-{formatCurrency(totals.totalDeductions)}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Net:</span>
                                      <span className="ml-2 font-bold text-green-600">{formatCurrency(totals.net)}</span>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })
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
                <span className="font-semibold">{formatCurrency(selectedTotal)}</span>
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
              disabled={generating || selectedCount === 0}
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
