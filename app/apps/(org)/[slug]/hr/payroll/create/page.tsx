"use client";

import { Can } from "@/components/apps/common";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib";
import {
  contractService,
  createPayroll,
  createPayrollPeriod,
  getEmployees,
  getPayrollAdvances,
  getPayrollPeriods,
} from "@/lib/services/hr";
import type {
  Contract,
  EmployeeListItem,
  PayrollAdvance,
  PayrollCreate,
  PayrollItem,
  PayrollPeriod,
} from "@/lib/types/hr";
import {
  DEFAULT_ALLOWANCE_TEMPLATES,
  DEFAULT_DEDUCTION_TEMPLATES,
} from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  HiChevronDown,
  HiMagnifyingGlass,
  HiOutlineArrowLeft,
  HiOutlineBanknotes,
  HiOutlineCalendar,
  HiOutlinePlusCircle,
  HiOutlineTrash,
} from "react-icons/hi2";

export default function CreatePayrollPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const preselectedEmployeeId = searchParams.get("employee");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [selectedEmployeeContract, setSelectedEmployeeContract] =
    useState<Contract | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);

  // Pour la sélection/recherche d'employé
  const [employeeSearch, setEmployeeSearch] = useState("");
  const employeeSearchInputRef = useRef<HTMLInputElement>(null);

  // Quick period creation
  const [periodDialog, setPeriodDialog] = useState(false);
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [periodForm, setPeriodForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    payment_date: "",
  });

  // Advances state
  const [employeeAdvances, setEmployeeAdvances] = useState<PayrollAdvance[]>([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [selectedAdvances, setSelectedAdvances] = useState<string[]>([]);

  // Mask for optionals, open by default if base salary, else closed.
  const [showOptionals, setShowOptionals] = useState(false);

  const [formData, setFormData] = useState<PayrollCreate>({
    employee: "",
    payroll_period: null,
    description: "",
    base_salary: 0,
    allowances: [],
    deductions: [],
    worked_hours: 160,
    overtime_hours: 0,
    leave_days_taken: 0,
    payment_method: "cash",
    notes: "",
  });

  useEffect(() => {
    loadEmployees();
    loadPayrollPeriods();
  }, [slug]);

  useEffect(() => {
    if (
      preselectedEmployeeId &&
      employees.length > 0 &&
      !formData.employee
    ) {
      const employeeExists = employees.some(
        (emp) => emp.id === preselectedEmployeeId
      );
      if (employeeExists) {
        handleEmployeeChange(preselectedEmployeeId);
      }
    }
  }, [preselectedEmployeeId, employees]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await getEmployees(slug, {
        page_size: 100,
        employment_status: "active",
      });
      setEmployees(data.results);
    } catch (err) {
      setError("Erreur lors du chargement des employés");
      console.error("Error loading employees:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadPayrollPeriods = async () => {
    try {
      setLoadingPeriods(true);
      const data = await getPayrollPeriods(slug, { page_size: 50 });
      setPayrollPeriods(data.results);
    } catch (err) {
      setError("Erreur lors du chargement des périodes de paie");
      console.error("Error loading payroll periods:", err);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const handleCreatePeriod = async () => {
    if (
      !periodForm.name ||
      !periodForm.start_date ||
      !periodForm.end_date
    ) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    try {
      setCreatingPeriod(true);
      setError(null);

      const newPeriod = await createPayrollPeriod(slug, periodForm);
      await loadPayrollPeriods();
      setFormData({ ...formData, payroll_period: newPeriod.id });

      setPeriodDialog(false);
      setPeriodForm({
        name: "",
        start_date: "",
        end_date: "",
        payment_date: "",
      });

      setSuccess(`Période "${newPeriod.name}" créée avec succès !`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage =
        err?.data?.detail ||
        err?.message ||
        "Erreur lors de la création de la période";
      setError(errorMessage);
    } finally {
      setCreatingPeriod(false);
    }
  };

  const openQuickPeriodDialog = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthName = now.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const paymentDate = new Date(year, month, 5);

    setPeriodForm({
      name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      payment_date: paymentDate.toISOString().split("T")[0],
    });

    setPeriodDialog(true);
  };

  const loadEmployeeContract = async (employeeId: string) => {
    try {
      setLoadingContract(true);
      const contract = await contractService.getActiveContract(slug, employeeId);
      setSelectedEmployeeContract(contract);
      if (contract && contract.base_salary) {
        setFormData((prev) => ({
          ...prev,
          base_salary: contract.base_salary,
        }));
        setShowOptionals(true);
      }
    } catch (err) {
      setError("Erreur lors du chargement du contrat de l'employé");
      console.error("Error loading employee contract:", err);
      setSelectedEmployeeContract(null);
    } finally {
      setLoadingContract(false);
    }
  };

  const loadEmployeeAdvances = async (employeeId: string) => {
    try {
      setLoadingAdvances(true);
      setSelectedAdvances([]);
      const advances = await getPayrollAdvances({
        organization_subdomain: slug,
        employee: employeeId,
        status: "approved",
      });
      const availableAdvances = advances.filter(
        (adv: PayrollAdvance) => !adv.payslip
      );
      setEmployeeAdvances(availableAdvances);
    } catch (err) {
      setError("Erreur lors du chargement des avances");
      setEmployeeAdvances([]);
    } finally {
      setLoadingAdvances(false);
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    setFormData({ ...formData, employee: employeeId });
    if (employeeId) {
      loadEmployeeContract(employeeId);
      loadEmployeeAdvances(employeeId);
      setShowOptionals(true);
    } else {
      setSelectedEmployeeContract(null);
      setEmployeeAdvances([]);
      setSelectedAdvances([]);
    }
  };

  // --- UX: Restrict advance selection so net never goes negative
  const calculateGrossSalary = () => {
    const baseSalary = Number(formData.base_salary) || 0;
    const allowancesTotal = (formData.allowances || []).reduce(
      (sum, a) => sum + (Number(a.amount) || 0),
      0
    );
    return baseSalary + allowancesTotal;
  };

  const manualDeductionSum = () =>
    (formData.deductions || []).reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );

  const calculateAdvancesTotal = (customSelection?: string[]) =>
    employeeAdvances
      .filter((adv) =>
        (customSelection || selectedAdvances).includes(adv.id)
      )
      .reduce((sum, adv) => sum + (Number(adv.amount) || 0), 0);

  const calculateTotalDeductions = (customSelected?: string[]) =>
    manualDeductionSum() + calculateAdvancesTotal(customSelected);

  const calculateNetSalary = (customSelected?: string[]) =>
    calculateGrossSalary() - calculateTotalDeductions(customSelected);

  // Disable advance if its selection would push net < 0
  const isAdvanceDisabled = (advanceId: string) => {
    let testSelected = [...selectedAdvances];
    if (!testSelected.includes(advanceId)) testSelected.push(advanceId);
    return calculateNetSalary(testSelected) < 0;
  };

  const toggleAdvanceSelection = (advanceId: string) => {
    const willAdd = !selectedAdvances.includes(advanceId);
    let newSelection: string[];
    if (willAdd) {
      if (isAdvanceDisabled(advanceId)) {
        setError(
          "Impossible de sélectionner l'avance : le salaire net ne peut pas être négatif."
        );
        setTimeout(() => setError(null), 3000);
        return;
      }
      newSelection = [...selectedAdvances, advanceId];
    } else {
      newSelection = selectedAdvances.filter((id) => id !== advanceId);
    }
    setSelectedAdvances(newSelection);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee) {
      setError("Veuillez sélectionner un employé");
      return;
    }

    if (!formData.payroll_period && !formData.description?.trim()) {
      const now = new Date();
      const monthName = now.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      setFormData({
        ...formData,
        description: `Paie ${monthName}`,
      });
      setError(
        "Veuillez ajouter une description pour cette fiche de paie hors période."
      );
      return;
    }

    if (formData.base_salary <= 0) {
      setError("Le salaire de base doit être supérieur à 0");
      return;
    }

    if (calculateNetSalary() < 0) {
      setError(
        "Le salaire net ne peut pas être négatif. Veuillez ajuster déductions ou avances."
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const advanceDeductions = employeeAdvances
        .filter((adv) => selectedAdvances.includes(adv.id))
        .map((adv) => ({
          name: `Remboursement avance - ${adv.reason || "Avance sur salaire"}`,
          amount: Number(adv.amount) || 0,
          is_deduction: true,
          advance_id: adv.id,
        }));

      const cleanedData: PayrollCreate = {
        ...formData,
        allowances: (formData.allowances || []).map(({ name, amount }) => ({
          name,
          amount,
          is_deduction: false,
        })),
        deductions: [
          ...(formData.deductions || []).map(({ name, amount }) => ({
            name,
            amount,
            is_deduction: true,
          })),
          ...advanceDeductions,
        ],
        advance_ids: selectedAdvances,
      };

      await createPayroll(cleanedData);

      setSuccess("Fiche de paie créée avec succès !");
      setTimeout(() => {
        router.push(`/apps/${slug}/hr/payroll`);
      }, 800);
    } catch (err: any) {
      let errorMessage = "Erreur lors de la création";
      console.log(err.data);
      
      if (err.data) {
        if (err.data.non_field_errors) {
          const uniqueError = err.data.non_field_errors.find((msg: string) =>
            msg.includes("UNIQUE constraint failed")
          );
          if (uniqueError) {
            errorMessage =
              "Une fiche de paie existe déjà pour cet employé pour cette période.";
          } else {
            errorMessage = err.data.non_field_errors.join(", ");
          }
        } else if (typeof err.data === "object") {
          const errors = Object.entries(err.data).map(([field, messages]) => {
            const fieldLabel =
              field === "employee"
                ? "Employé"
                : field === "payroll_period"
                ? "Période de paie"
                : field === "base_salary"
                ? "Salaire de base"
                : field;
            return `${fieldLabel}: ${
              Array.isArray(messages) ? messages.join(", ") : messages
            }`;
          });
          errorMessage = errors.join("\n");
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      if (errorMessage.includes("Internal Server Error")) {
        errorMessage = "Une fiche de paie existe déjà pour cet employé et cette période. Vous pouvez soit choisir une autre période, prendre l'option 'sans période' si cela est permis, ou consulter la liste des fiches existantes avant de créer une nouvelle fiche.";
      }
      setError(errorMessage);
      console.error("Payroll creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Allowances management
  const addAllowance = () => {
    setFormData({
      ...formData,
      allowances: [
        ...(formData.allowances || []),
        { name: "", amount: 0, is_deduction: false },
      ],
    });
    setShowOptionals(true);
  };

  const removeAllowance = (index: number) => {
    const newAllowances = [...(formData.allowances || [])];
    newAllowances.splice(index, 1);
    setFormData({ ...formData, allowances: newAllowances });
  };

  const updateAllowance = (
    index: number,
    field: keyof PayrollItem,
    value: any
  ) => {
    const newAllowances = [...(formData.allowances || [])];
    newAllowances[index] = { ...newAllowances[index], [field]: value };
    setFormData({ ...formData, allowances: newAllowances });
  };

  const addAllowanceFromTemplate = (
    template: typeof DEFAULT_ALLOWANCE_TEMPLATES[0]
  ) => {
    let amount = template.amount || 0;
    if (template.is_percentage && template.percentage) {
      amount = (formData.base_salary * template.percentage) / 100;
    }
    setFormData({
      ...formData,
      allowances: [
        ...(formData.allowances || []),
        {
          name: template.name,
          amount: amount,
          is_deduction: false,
        },
      ],
    });
    setShowOptionals(true);
  };

  // Deductions management
  const addDeduction = () => {
    setFormData({
      ...formData,
      deductions: [
        ...(formData.deductions || []),
        { name: "", amount: 0, is_deduction: true },
      ],
    });
    setShowOptionals(true);
  };

  const removeDeduction = (index: number) => {
    const newDeductions = [...(formData.deductions || [])];
    newDeductions.splice(index, 1);
    setFormData({ ...formData, deductions: newDeductions });
  };

  const updateDeduction = (
    index: number,
    field: keyof PayrollItem,
    value: any
  ) => {
    const newDeductions = [...(formData.deductions || [])];
    newDeductions[index] = { ...newDeductions[index], [field]: value };
    setFormData({ ...formData, deductions: newDeductions });
  };

  const addDeductionFromTemplate = (
    template: typeof DEFAULT_DEDUCTION_TEMPLATES[0]
  ) => {
    let amount = template.amount || 0;
    if (template.is_percentage && template.percentage) {
      const grossSalary = calculateGrossSalary();
      amount = (grossSalary * template.percentage) / 100;
    }

    setFormData({
      ...formData,
      deductions: [
        ...(formData.deductions || []),
        {
          name: template.name,
          amount: amount,
          is_deduction: true,
        },
      ],
    });
    setShowOptionals(true);
  };

  // Mask header, add chevron anim & bigger click area
  // --- Helper Components ---

  function SectionHeader({
    title,
    icon: Icon,
    isOpen,
    toggle,
    summary,
  }: {
    title: string;
    icon?: any;
    isOpen: boolean;
    toggle: () => void;
    summary?: string;
  }) {
    return (
      <div
        onClick={toggle}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="size-5 text-primary" />}
          <div>
            <h3 className="font-semibold text-base">{title}</h3>
            {summary && (
              <p className="text-xs text-muted-foreground mt-0.5">{summary}</p>
            )}
          </div>
        </div>
        <HiChevronDown
          className={`size-5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>
    );
  }

  function EmployeeSearchSelect() {
    const [showDropdown, setShowDropdown] = useState(false);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredEmployees =
      employeeSearch.trim().length === 0
        ? employees
        : employees.filter((emp) =>
            (emp.full_name + " " + emp.employee_id)
              .toLowerCase()
              .includes(employeeSearch.trim().toLowerCase())
          );

    const open = showDropdown && !loadingEmployees && employees.length > 0;

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          inputContainerRef.current &&
          !inputContainerRef.current.contains(event.target as Node)
        ) {
          setShowDropdown(false);
        }
      }
      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [open]);

    useEffect(() => {
        if(!formData.employee) {
            setEmployeeSearch("");
        }
    }, [formData.employee]);

    const handleSelect = (emp: EmployeeListItem) => {
      handleEmployeeChange(emp.id);
      setShowDropdown(false);
      setEmployeeSearch("");
    };

    const selectedEmployee = employees.find(
      (emp) => emp.id === formData.employee
    );

    return (
      <div ref={inputContainerRef} className="relative group">
        <div
          className={`flex items-center border rounded-lg px-3 py-2.5 bg-background transition-all ring-offset-background
            ${
              loadingEmployees || loadingContract
                ? "opacity-60 pointer-events-none cursor-not-allowed"
                : "cursor-text hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring focus-within:border-primary"
            }
          `}
          onClick={() => {
            if (!(loadingEmployees || loadingContract)) {
                setShowDropdown(true);
                inputRef.current?.focus();
            }
          }}
        >
          <HiMagnifyingGlass className="text-muted-foreground mr-2 size-4 shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 outline-none border-0 bg-transparent text-sm py-0 placeholder:text-muted-foreground/70"
            placeholder={
              loadingEmployees
                ? "Chargement des employés..."
                : selectedEmployee 
                    ? "Changer d'employé..." 
                    : "Rechercher par nom ou matricule..."
            }
            value={
                open 
                ? employeeSearch 
                : (selectedEmployee ? `${selectedEmployee.full_name} (${selectedEmployee.employee_id})` : employeeSearch)
            }
            onChange={(e) => {
              setEmployeeSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
                setShowDropdown(true);
            }}
          />
          {selectedEmployee && !loadingEmployees && (
             <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handleEmployeeChange("");
                    setEmployeeSearch("");
                    inputRef.current?.focus();
                }}
                className="opacity-50 hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
             >
                 <HiOutlineTrash className="size-4" />
             </button>
          )}
        </div>

        {/* Dropdown Results */}
        {open && (
            <div className="absolute z-50 mt-1 left-0 right-0 max-h-60 overflow-y-auto overflow-x-hidden bg-popover rounded-md border shadow-md animate-in fade-in-0 zoom-in-95 duration-100">
                {filteredEmployees.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        Aucun employé trouvé.
                    </div>
                ) : (
                    <div className="p-1">
                        {filteredEmployees.slice(0, 50).map((emp) => (
                         <div
                            key={emp.id}
                            onClick={() => handleSelect(emp)}
                            className={`flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer text-sm transition-colors
                                ${formData.employee === emp.id 
                                    ? "bg-primary/10 text-primary" 
                                    : "hover:bg-muted"
                                }
                            `}
                         >
                            <div className="flex flex-col">
                                <span className="font-medium truncate">{emp.full_name}</span>
                                <span className="text-xs text-muted-foreground">{emp.position_title || "Sans poste"}</span>
                            </div>
                            <span className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                                {emp.employee_id}
                            </span>
                         </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    );
  }

  return (
    <Can permission={COMMON_PERMISSIONS.HR.CREATE_PAYROLL} showMessage>

<div className="container mx-auto max-w-7xl animate-in fade-in-50 duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shrink-0" asChild>
                <Link href={`/apps/${slug}/hr/payroll`}>
                    <HiOutlineArrowLeft className="size-5" />
                </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Nouvelle Fiche de Paie
                </h1>
                <p className="text-muted-foreground mt-1">
                    Configurez la rémunération, les primes et les déductions.
                </p>
            </div>
        </div>
      </div>

      {(error || success) && (
        <div className="mb-6 space-y-2">
            {error && <Alert variant="error" className="animate-in slide-in-from-top-2">{error}</Alert>}
            {success && <Alert variant="success" className="animate-in slide-in-from-top-2">{success}</Alert>}
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Inputs */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* 1. Main Context Card */}
                <Card className="border-border/50 border overflow-hidden">
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Employee Select */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground/80">
                                    Employé <span className="text-destructive">*</span>
                                </Label>
                                <EmployeeSearchSelect />
                            </div>

                            {/* Base Salary */}
                            <div className="space-y-2">
                                <Label htmlFor="base_salary" className="text-sm font-semibold text-foreground/80">
                                    Salaire de base  <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="base_salary"
                                        type="number"
                                        className="font-mono text-lg pl-3 pr-12 h-11"
                                        placeholder="0"
                                        min={0}
                                        value={formData.base_salary || ""}
                                        onChange={(e) =>
                                            setFormData({ 
                                                ...formData, 
                                                base_salary: parseFloat(e.target.value) || 0 
                                            })
                                        }
                                        disabled={loadingContract}
                                    />
                                   
                                </div>
                                {selectedEmployeeContract && (
                                    <p className="text-xs text-primary/80 flex items-center gap-1">
                                        <span className="inline-block size-1.5 rounded-full bg-primary/80"></span>
                                        Contrat: {selectedEmployeeContract.contract_type_display}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {/* Period Select */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="payroll_period" className="text-sm font-semibold text-foreground/80">Période de Paie</Label>
                                    <button 
                                        type="button" 
                                        onClick={openQuickPeriodDialog}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <HiOutlinePlusCircle /> Créer
                                    </button>
                                </div>
                                <Select
                                    value={formData.payroll_period || ""}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            payroll_period: value === "_none" ? null : value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Sélectionner une période" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none" className="text-muted-foreground italic">
                                            Pas de période (Paiement ponctuel)
                                        </SelectItem>
                                        {payrollPeriods.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                <span className="font-medium">{p.name}</span>
                                                <span className="text-muted-foreground ml-2 text-xs">
                                                    ({new Date(p.start_date).toLocaleDateString("fr-FR")} - {new Date(p.end_date).toLocaleDateString("fr-FR")})
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                             {/* Payment Method */}
                             <div className="space-y-2">
                                <Label htmlFor="payment_method" className="text-sm font-semibold text-foreground/80">Moyen de paiement</Label>
                                <Select
                                    value={formData.payment_method}
                                    onValueChange={(v) => setFormData({...formData, payment_method: v})}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Espèces</SelectItem>
                                        <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                                        <SelectItem value="check">Chèque</SelectItem>
                                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Optional Description if no period */}
                        {!formData.payroll_period && (
                            <div className="p-4 rounded-lg border space-y-2 animate-in fade-in transition-all">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <HiOutlineCalendar className="size-4" />
                                    <span>Paiement hors période</span>
                                </div>
                                <Input 
                                    placeholder="Description requise (ex: Prime exceptionnelle, Solde de tout compte...)"
                                    className="bg-transparent"
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        )}
                    </div>
                </Card>

                {/* 2. Details Accordion (The "Dynamic" part) */}
                <Card className="border-border/50 border overflow-hidden">
                     {/* Header toggler */}
                     <SectionHeader 
                        title="Détails, Primes & Déductions"
                        icon={HiOutlineBanknotes}
                        isOpen={showOptionals}
                        toggle={() => setShowOptionals(!showOptionals)}
                        summary={showOptionals ? undefined : "Heures, congés, primes, avances..."}
                     />
                    
                     {showOptionals && (
                        <div className="p-6 space-y-8 animate-in slide-in-from-top-2 duration-300">
                            
                            {/* Hours & Time */}
                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Temps de travail</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="worked_hours" className="text-xs">H. Travaillées</Label>
                                        <Input
                                            id="worked_hours"
                                            type="number"
                                            className="h-9 font-mono text-sm"
                                            value={formData.worked_hours}
                                            onChange={(e) => setFormData({...formData, worked_hours: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="overtime" className="text-xs">H. Supplémentaires</Label>
                                        <Input
                                            id="overtime"
                                            type="number"
                                            className="h-9 font-mono text-sm"
                                            value={formData.overtime_hours}
                                            onChange={(e) => setFormData({...formData, overtime_hours: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="leave" className="text-xs">Jours Congés</Label>
                                        <Input
                                            id="leave"
                                            type="number"
                                            className="h-9 font-mono text-sm"
                                            value={formData.leave_days_taken}
                                            onChange={(e) => setFormData({...formData, leave_days_taken: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Allowances */}
                            <section className="space-y-3">
                                <div className="flex justify-between items-center border-b pb-1">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Primes & Indemnités</h4>
                                    <div className="flex gap-2">
                                        <select
                                            className="h-8 text-xs border rounded px-2 bg-transparent"
                                            onChange={(e) => {
                                                if(e.target.value !== "") addAllowanceFromTemplate(DEFAULT_ALLOWANCE_TEMPLATES[parseInt(e.target.value)]);
                                                e.target.value = "";
                                            }}
                                        >
                                            <option value="">+ Modèle</option>
                                            {DEFAULT_ALLOWANCE_TEMPLATES.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
                                        </select>
                                        <Button size="sm" variant="outline" onClick={addAllowance} className="h-8 gap-1">
                                            <HiOutlinePlusCircle /> Autre
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {(formData.allowances || []).map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center group">
                                            <Input 
                                                value={item.name} 
                                                onChange={(e) => updateAllowance(idx, "name", e.target.value)}
                                                className="flex-1 h-9 text-sm"
                                                placeholder="Nom de la prime"
                                            />
                                            <div className="relative w-32 shrink-0">
                                                <Input 
                                                    type="number" 
                                                    value={item.amount} 
                                                    onChange={(e) => updateAllowance(idx, "amount", parseFloat(e.target.value) || 0)}
                                                    className="h-9 text-sm font-mono text-right pr-8 text-green-600 font-medium"
                                                />
                                                </div>
                                            <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeAllowance(idx)}>
                                                <HiOutlineTrash className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(formData.allowances || []).length === 0 && (
                                        <div className="text-center py-4 bg-muted/20 rounded-lg text-sm text-muted-foreground italic border border-dashed">
                                            Aucune prime ajoutée
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Deductions */}
                            <section className="space-y-3">
                                <div className="flex justify-between items-center border-b pb-1">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Déductions</h4>
                                    <div className="flex gap-2">
                                        <select
                                            className="h-8 text-xs border rounded px-2 bg-transparent"
                                            onChange={(e) => {
                                                if(e.target.value !== "") addDeductionFromTemplate(DEFAULT_DEDUCTION_TEMPLATES[parseInt(e.target.value)]);
                                                e.target.value = "";
                                            }}
                                        >
                                            <option value="">+ Modèle</option>
                                            {DEFAULT_DEDUCTION_TEMPLATES.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
                                        </select>
                                        <Button size="sm" variant="outline" onClick={addDeduction} className="h-8 gap-1">
                                            <HiOutlinePlusCircle /> Autre
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {(formData.deductions || []).map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center group">
                                            <Input 
                                                value={item.name} 
                                                onChange={(e) => updateDeduction(idx, "name", e.target.value)}
                                                className="flex-1 h-9 text-sm"
                                                placeholder="Nom de la déduction"
                                            />
                                            <div className="relative w-32 shrink-0">
                                                <Input 
                                                    type="number" 
                                                    value={item.amount} 
                                                    onChange={(e) => updateDeduction(idx, "amount", parseFloat(e.target.value) || 0)}
                                                    className="h-9 text-sm font-mono text-right pr-8 text-destructive font-medium"
                                                />
                                               </div>
                                            <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeDeduction(idx)}>
                                                <HiOutlineTrash className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(formData.deductions || []).length === 0 && (
                                        <div className="text-center py-4 bg-muted/20 rounded-lg text-sm text-muted-foreground italic border border-dashed">
                                            Aucune déduction manuelle
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Advances */}
                            {formData.employee && (
                                <section className="space-y-3">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Avances sur Salaire</h4>
                                    
                                    {loadingAdvances ? (
                                        <div className="py-2 text-sm text-muted-foreground animate-pulse">Chargement des avances...</div>
                                    ) : employeeAdvances.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            {employeeAdvances.map((adv) => {
                                                const isSelected = selectedAdvances.includes(adv.id);
                                                const disabled = isAdvanceDisabled(adv.id) && !isSelected;
                                                return (
                                                    <div key={adv.id} className={`
                                                        flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer
                                                        ${isSelected 
                                                            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900" 
                                                            : "bg-background hover:bg-muted border-border/60"}
                                                        ${disabled ? "opacity-50 pointer-events-none" : ""}
                                                    `}
                                                    onClick={() => !disabled && toggleAdvanceSelection(adv.id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`
                                                                size-5 rounded border flex items-center justify-center transition-colors
                                                                ${isSelected ? "bg-amber-500 border-amber-500 text-white" : "border-muted-foreground/30"}
                                                            `}>
                                                                {isSelected && <span className="text-xs">✓</span>}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{adv.reason || "Avance"}</p>
                                                                <p className="text-xs text-muted-foreground">{new Date(adv.request_date).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold font-mono text-sm">-{formatCurrency(adv.amount)}</p>
                                                             {disabled && <p className="text-[10px] text-destructive">Solde insuffisant</p>}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                       <div className="flex items-center gap-2 py-3 px-4 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-lg text-sm border border-green-100 dark:border-green-900">
                                            <HiOutlineBanknotes className="size-4" />
                                            Pas d'avance en cours pour cet employé.
                                       </div>
                                    )}
                                </section>
                            )}

                             {/* Notes */}
                            <section className="space-y-2 pt-2">
                                <Label htmlFor="notes">Notes Internes / Commentaire sur la fiche</Label>
                                <textarea
                                    id="notes"
                                    className="w-full min-h-[80px] p-3 text-sm rounded-md border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-y"
                                    placeholder="Note visible sur le bulletin de paie..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                />
                            </section>

                        </div>
                     )}
                </Card>

            </div>

             {/* RIGHT COLUMN: Sticky Summary */}
             <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 h-fit">
                <Card className="border-border/50 border overflow-hidden flex flex-col">
                    <div className="p-4 bg-muted/40 border-b">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <HiOutlineBanknotes className="text-primary" /> Résumé
                        </h2>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        {/* Breakdown */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Salaire Base</span>
                                <span className="font-mono">{formatCurrency(formData.base_salary)}</span>
                            </div>
                           
                            {/* Detailed breakdown for better visibility */}
                            {(formData.allowances || []).length > 0 && (
                                <div className="space-y-1 py-1">
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Total Primes</span>
                                        <span className="font-mono">+{formatCurrency(calculateGrossSalary() - formData.base_salary)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between border-t border-dashed pt-2 font-semibold">
                                <span>Salaire Brut</span>
                                <span className="font-mono">{formatCurrency(calculateGrossSalary())}</span>
                            </div>

                             {(formData.deductions || []).length > 0 && (
                                <div className="flex justify-between text-destructive">
                                    <span>Déductions</span>
                                    <span className="font-mono">-{formatCurrency(manualDeductionSum())}</span>
                                </div>
                             )}

                             {selectedAdvances.length > 0 && (
                                 <div className="flex justify-between text-amber-600">
                                    <span>Remb. Avances ({selectedAdvances.length})</span>
                                    <span className="font-mono">-{formatCurrency(calculateAdvancesTotal())}</span>
                                </div>
                             )}
                        </div>

                        {/* FINAL NET */}
                        <div className="pt-6 mt-2 border-t text-center space-y-1">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net à Payer</span>
                            <div className={`text-4xl font-extrabold font-mono tracking-tight transition-colors
                                ${calculateNetSalary() < 0 ? "text-destructive" : "text-primary"}
                            `}>
                                {formatCurrency(calculateNetSalary())} 
                            </div>
                            {calculateNetSalary() < 0 && (
                                <p className="text-xs text-destructive font-medium animate-pulse">
                                    Attention: Solde négatif
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {/* Action Bar inside the card for mobile stickiness context, or bottom */}
                    <div className="p-4 bg-muted/40 border-t flex flex-col gap-3">
                         <Button 
                            type="submit" 
                            size="lg" 
                            className="w-full font-bold"
                            disabled={loading}
                         >
                            {loading ? "Traitement..." : "Valider la Paie"}
                         </Button>
                         <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => router.back()}
                            disabled={loading}
                         >
                             Annuler
                         </Button>
                    </div>
                </Card>

                {/* Helper Tips Card */}
                {!formData.employee && (
                     <div className="hidden lg:block p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-300">
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                             <HiMagnifyingGlass className="size-4" /> Info
                        </h4>
                        Commencez par sélectionner un employé pour voir apparaître son contrat et ses avances en cours.
                     </div>
                )}
             </div>

        </div>
      </form>

      {/* Quick Period Creation Dialog */}
      <Dialog open={periodDialog} onOpenChange={setPeriodDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle Période de Paie</DialogTitle>
            <DialogDescription>
              Configuration rapide pour le mois en cours.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="period-name">Nom</Label>
              <Input
                id="period-name"
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                placeholder="Ex: Janvier 2024"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period-start">Début</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={periodForm.start_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-end">Fin</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={periodForm.end_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                />
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="period-payment">Paiement prévu</Label>
                <Input
                  id="period-payment"
                  type="date"
                  value={periodForm.payment_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, payment_date: e.target.value })}
                />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodDialog(false)}>Annuler</Button>
            <Button onClick={handleCreatePeriod} disabled={creatingPeriod}>
                {creatingPeriod ? "Création..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </Can>
  
  );
}
