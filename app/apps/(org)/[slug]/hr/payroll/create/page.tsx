"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  HiOutlineBanknotes,
  HiOutlineArrowLeft,
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiOutlineCalendar,
} from "react-icons/hi2";
import { createPayroll, getPayrollPeriods, contractService, getPayrollAdvances, createPayrollPeriod } from "@/lib/services/hr";
import { getEmployees } from "@/lib/services/hr";
import type { PayrollCreate, PayrollItem, EmployeeListItem, PayrollPeriod, Contract, PayrollAdvance } from "@/lib/types/hr";
import { PayrollAdvanceStatus } from "@/lib/types/hr";
import { DEFAULT_ALLOWANCE_TEMPLATES, DEFAULT_DEDUCTION_TEMPLATES } from "@/lib/types/hr";
import { PayrollAdvancesSummary } from "@/components/hr/payroll-advances-summary";

export default function CreatePayrollPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [selectedEmployeeContract, setSelectedEmployeeContract] = useState<Contract | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);

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

  const [formData, setFormData] = useState<PayrollCreate>({
    employee: "",
    payroll_period: "",
    base_salary: 0,
    allowances: [],
    deductions: [],
    currency: "GNF",
    worked_hours: 160,
    overtime_hours: 0,
    leave_days_taken: 0,
    payment_method: "bank_transfer",
    notes: "",
  });

  useEffect(() => {
    loadEmployees();
    loadPayrollPeriods();
  }, [slug]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await getEmployees(slug, { page_size: 100, employment_status: 'active' });
      setEmployees(data.results);
    } catch (err) {
      console.error('Error loading employees:', err);
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
      console.error('Error loading payroll periods:', err);
    } finally {
      setLoadingPeriods(false);
    }
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
      await loadPayrollPeriods();

      // Auto-select the newly created period
      setFormData({ ...formData, payroll_period: newPeriod.id });

      // Close dialog and reset form
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
      const errorMessage = err?.data?.detail || err?.message || "Erreur lors de la création de la période";
      setError(errorMessage);
    } finally {
      setCreatingPeriod(false);
    }
  };

  const openQuickPeriodDialog = () => {
    // Pre-fill with current month
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

    setPeriodDialog(true);
  };

  const loadEmployeeContract = async (employeeId: string) => {
    try {
      setLoadingContract(true);
      const contract = await contractService.getActiveContract(slug, employeeId);
      setSelectedEmployeeContract(contract);

      // Auto-fill base salary from contract
      if (contract && contract.base_salary) {
        setFormData(prev => ({
          ...prev,
          base_salary: contract.base_salary,
        }));
      }
    } catch (err) {
      console.error('Error loading employee contract:', err);
      setSelectedEmployeeContract(null);
    } finally {
      setLoadingContract(false);
    }
  };

  // Load advances for selected employee (PAID status, not yet linked to payroll)
  const loadEmployeeAdvances = async (employeeId: string) => {
    try {
      setLoadingAdvances(true);
      setSelectedAdvances([]);
      console.log('Loading advances for employee:', employeeId);

      const advances = await getPayrollAdvances({
        organization_subdomain: slug,
        employee: employeeId,
        status: 'paid', // Use lowercase string instead of enum
      });

      console.log('All advances received:', advances);

      // Filter advances that don't have a payslip linked yet
      const availableAdvances = advances.filter((adv: PayrollAdvance) => !adv.payslip);
      console.log('Available advances (not yet linked):', availableAdvances);

      setEmployeeAdvances(availableAdvances);
    } catch (err) {
      console.error('Error loading employee advances:', err);
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
    } else {
      setSelectedEmployeeContract(null);
      setEmployeeAdvances([]);
      setSelectedAdvances([]);
    }
  };

  // Toggle advance selection
  const toggleAdvanceSelection = (advanceId: string) => {
    setSelectedAdvances(prev => {
      if (prev.includes(advanceId)) {
        return prev.filter(id => id !== advanceId);
      } else {
        return [...prev, advanceId];
      }
    });
  };

  // Calculate total advances to deduct
  const calculateAdvancesTotal = () => {
    return employeeAdvances
      .filter(adv => selectedAdvances.includes(adv.id))
      .reduce((sum, adv) => sum + (Number(adv.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee) {
      setError("Veuillez sélectionner un employé");
      return;
    }

    if (!formData.payroll_period) {
      setError("Veuillez sélectionner une période de paie");
      return;
    }

    if (formData.base_salary <= 0) {
      setError("Le salaire de base doit être supérieur à 0");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Clean data before sending (remove is_deduction from items)
      // Add selected advances as deductions
      const advanceDeductions = employeeAdvances
        .filter(adv => selectedAdvances.includes(adv.id))
        .map(adv => ({
          name: `Remboursement avance - ${adv.reason || 'Avance sur salaire'}`,
          amount: Number(adv.amount) || 0,
          is_deduction: true,
          advance_id: adv.id, // Keep track of which advance this is
        }));

      const cleanedData: PayrollCreate = {
        ...formData,
        allowances: (formData.allowances || []).map(({ name, amount }) => ({
          name,
          amount,
          is_deduction: false
        })),
        deductions: [
          ...(formData.deductions || []).map(({ name, amount }) => ({
            name,
            amount,
            is_deduction: true
          })),
          ...advanceDeductions,
        ],
        // Pass selected advance IDs to backend for linking
        advance_ids: selectedAdvances,
      };

      // Log data being sent for debugging
      console.log('Payroll data being sent:', JSON.stringify(cleanedData, null, 2));

      await createPayroll(cleanedData);
      router.push(`/apps/${slug}/hr/payroll`);
    } catch (err: any) {
      let errorMessage = "Erreur lors de la création";

      // Handle API errors with detailed messages
      if (err.data) {
        // Check for non_field_errors (unique constraint)
        if (err.data.non_field_errors) {
          const uniqueError = err.data.non_field_errors.find((msg: string) =>
            msg.includes('employee, payroll_period must make a unique set')
          );
          if (uniqueError) {
            errorMessage = "Une fiche de paie existe déjà pour cet employé pour cette période.";
          } else {
            errorMessage = err.data.non_field_errors.join(', ');
          }
        }
        // Check for field-specific errors
        else if (typeof err.data === 'object') {
          const errors = Object.entries(err.data)
            .map(([field, messages]) => {
              const fieldLabel = field === 'employee' ? 'Employé' :
                                field === 'payroll_period' ? 'Période de paie' :
                                field === 'base_salary' ? 'Salaire de base' : field;
              return `${fieldLabel}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
            });
          errorMessage = errors.join('\n');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error('Payroll creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Allowances management
  const addAllowance = () => {
    setFormData({
      ...formData,
      allowances: [...(formData.allowances || []), { name: "", amount: 0, is_deduction: false }],
    });
  };

  const removeAllowance = (index: number) => {
    const newAllowances = [...(formData.allowances || [])];
    newAllowances.splice(index, 1);
    setFormData({ ...formData, allowances: newAllowances });
  };

  const updateAllowance = (index: number, field: keyof PayrollItem, value: any) => {
    const newAllowances = [...(formData.allowances || [])];
    newAllowances[index] = { ...newAllowances[index], [field]: value };
    setFormData({ ...formData, allowances: newAllowances });
  };

  const addAllowanceFromTemplate = (template: typeof DEFAULT_ALLOWANCE_TEMPLATES[0]) => {
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
  };

  // Deductions management
  const addDeduction = () => {
    setFormData({
      ...formData,
      deductions: [...(formData.deductions || []), { name: "", amount: 0, is_deduction: true }],
    });
  };

  const removeDeduction = (index: number) => {
    const newDeductions = [...(formData.deductions || [])];
    newDeductions.splice(index, 1);
    setFormData({ ...formData, deductions: newDeductions });
  };

  const updateDeduction = (index: number, field: keyof PayrollItem, value: any) => {
    const newDeductions = [...(formData.deductions || [])];
    newDeductions[index] = { ...newDeductions[index], [field]: value };
    setFormData({ ...formData, deductions: newDeductions });
  };

  const addDeductionFromTemplate = (template: typeof DEFAULT_DEDUCTION_TEMPLATES[0]) => {
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
  };

  const calculateGrossSalary = () => {
    const baseSalary = Number(formData.base_salary) || 0;
    const allowancesTotal = (formData.allowances || []).reduce(
      (sum, a) => sum + (Number(a.amount) || 0),
      0
    );
    return baseSalary + allowancesTotal;
  };

  const calculateTotalDeductions = () => {
    const manualDeductions = (formData.deductions || []).reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );
    return manualDeductions + calculateAdvancesTotal();
  };

  const calculateNetSalary = () => {
    return calculateGrossSalary() - calculateTotalDeductions();
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/apps/${slug}/hr/payroll`}>
            <HiOutlineArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HiOutlineBanknotes className="size-7" />
            Nouvelle fiche de paie
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Créez une nouvelle fiche de paie pour un employé
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Informations générales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="employee">
                Employé <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.employee}
                onValueChange={handleEmployeeChange}
                disabled={loadingEmployees || loadingContract}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payroll_period">
                Période de paie <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.payroll_period}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payroll_period: value })
                  }
                  disabled={loadingPeriods}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingPeriods ? "Chargement..." : "Sélectionner une période"} />
                  </SelectTrigger>
                  <SelectContent>
                    {payrollPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name} ({new Date(period.start_date).toLocaleDateString("fr-FR")} - {new Date(period.end_date).toLocaleDateString("fr-FR")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={openQuickPeriodDialog}
                  title="Créer une nouvelle période rapidement"
                >
                  <HiOutlinePlusCircle className="size-4" />
                </Button>
              </div>
              {payrollPeriods.length === 0 && !loadingPeriods && (
                <p className="text-sm text-muted-foreground">
                  Aucune période disponible. Cliquez sur + pour créer une période rapidement.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Méthode de paiement</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_salary">
                Salaire de base <span className="text-destructive">*</span>
              </Label>
              <Input
                id="base_salary"
                type="number"
                step="0.01"
                value={formData.base_salary || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData({ ...formData, base_salary: isNaN(value) ? 0 : value });
                }}
                required
                disabled={loadingContract}
              />
              {selectedEmployeeContract && (
                <p className="text-xs text-muted-foreground">
                  Salaire chargé automatiquement depuis le contrat actif ({selectedEmployeeContract.contract_type_display})
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Additional Details */}
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Détails supplémentaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Input
                id="currency"
                value={formData.currency || 'GNF'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="GNF"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worked_hours">Heures travaillées</Label>
              <Input
                id="worked_hours"
                type="number"
                step="0.5"
                value={formData.worked_hours || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 160 : parseFloat(e.target.value);
                  setFormData({ ...formData, worked_hours: isNaN(value) ? 160 : value });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Défaut: 160h/mois
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtime_hours">Heures supplémentaires</Label>
              <Input
                id="overtime_hours"
                type="number"
                step="0.5"
                value={formData.overtime_hours || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData({ ...formData, overtime_hours: isNaN(value) ? 0 : value });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leave_days_taken">Jours de congé pris</Label>
              <Input
                id="leave_days_taken"
                type="number"
                step="0.5"
                value={formData.leave_days_taken || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setFormData({ ...formData, leave_days_taken: isNaN(value) ? 0 : value });
                }}
              />
            </div>
          </div>
        </Card>

        {/* Allowances */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Primes et indemnités</h2>
            <div className="flex gap-2">
              <select
                className="px-3 py-1.5 text-sm border rounded-md"
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  if (!isNaN(index)) {
                    addAllowanceFromTemplate(DEFAULT_ALLOWANCE_TEMPLATES[index]);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Choisir un template</option>
                {DEFAULT_ALLOWANCE_TEMPLATES.map((template, index) => (
                  <option key={index} value={index}>
                    {template.name} {template.description && `- ${template.description}`}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={addAllowance}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>

          {(formData.allowances || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune prime ajoutée
            </p>
          ) : (
            <div className="space-y-3">
              {(formData.allowances || []).map((allowance, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`allowance-name-${index}`}>Nom</Label>
                    <Input
                      id={`allowance-name-${index}`}
                      value={allowance.name}
                      onChange={(e) =>
                        updateAllowance(index, "name", e.target.value)
                      }
                      placeholder="Ex: Prime de transport"
                    />
                  </div>
                  <div className="w-40">
                    <Label htmlFor={`allowance-amount-${index}`}>Montant</Label>
                    <Input
                      id={`allowance-amount-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={allowance.amount}
                      onChange={(e) =>
                        updateAllowance(index, "amount", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAllowance(index)}
                    className="text-destructive"
                  >
                    <HiOutlineTrash className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Deductions */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Déductions</h2>
            <div className="flex gap-2">
              <select
                className="px-3 py-1.5 text-sm border rounded-md"
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  if (!isNaN(index)) {
                    addDeductionFromTemplate(DEFAULT_DEDUCTION_TEMPLATES[index]);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Choisir un template</option>
                {DEFAULT_DEDUCTION_TEMPLATES.map((template, index) => (
                  <option key={index} value={index}>
                    {template.name} {template.description && `- ${template.description}`}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>

          {(formData.deductions || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune déduction ajoutée
            </p>
          ) : (
            <div className="space-y-3">
              {(formData.deductions || []).map((deduction, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`deduction-name-${index}`}>Nom</Label>
                    <Input
                      id={`deduction-name-${index}`}
                      value={deduction.name}
                      onChange={(e) =>
                        updateDeduction(index, "name", e.target.value)
                      }
                      placeholder="Ex: Cotisation sociale"
                    />
                  </div>
                  <div className="w-40">
                    <Label htmlFor={`deduction-amount-${index}`}>Montant</Label>
                    <Input
                      id={`deduction-amount-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={deduction.amount}
                      onChange={(e) =>
                        updateDeduction(index, "amount", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDeduction(index)}
                    className="text-destructive"
                  >
                    <HiOutlineTrash className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Salary Advances - Only show if employee is selected */}
        {formData.employee && (
          loadingAdvances ? (
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm text-muted-foreground">Chargement des avances...</span>
              </div>
            </Card>
          ) : employeeAdvances.length > 0 ? (
            <PayrollAdvancesSummary
              advances={employeeAdvances}
              employeeName={employees.find(e => e.id === formData.employee)?.full_name}
              selectedAdvanceIds={selectedAdvances}
              onAdvanceSelect={setSelectedAdvances}
            />
          ) : (
            <Card className="p-6 border-0 shadow-sm bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
                  <HiOutlinePlusCircle className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Aucune avance en attente
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                    Cet employé n'a pas d'avances à déduire pour cette période
                  </p>
                </div>
              </div>
            </Card>
          )
        )}


        {/* Summary */}
        <Card className="p-6 border-0 shadow-sm bg-muted/50">
          <h2 className="text-lg font-semibold mb-4">Résumé</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Salaire de base</span>
              <span className="font-medium">{formatCurrency(formData.base_salary)} GNF</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total primes</span>
              <span className="font-medium text-green-600">
                +{formatCurrency((formData.allowances || []).reduce((sum, a) => sum + (Number(a.amount) || 0), 0))} GNF
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-y">
              <span className="font-semibold">Salaire brut</span>
              <span className="font-bold">{formatCurrency(calculateGrossSalary())} GNF</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Déductions manuelles</span>
              <span className="font-medium text-red-600">
                -{formatCurrency((formData.deductions || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0))} GNF
              </span>
            </div>
            {selectedAdvances.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Remboursement avances ({selectedAdvances.length})
                </span>
                <span className="font-medium text-amber-600">
                  -{formatCurrency(calculateAdvancesTotal())} GNF
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total déductions</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(calculateTotalDeductions())} GNF
              </span>
            </div>
            <div className="border-t-2 pt-4 flex justify-between items-center">
              <span className="text-lg font-bold">Salaire net</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(calculateNetSalary())} GNF
              </span>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <textarea
              id="notes"
              className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Ajoutez des notes supplémentaires..."
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Création..." : "Créer la fiche de paie"}
          </Button>
        </div>
      </form>

      {/* Quick Period Creation Dialog */}
      <Dialog open={periodDialog} onOpenChange={setPeriodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HiOutlineCalendar className="size-5" />
              Créer une Période de Paie Rapidement
            </DialogTitle>
            <DialogDescription>
              Créez une nouvelle période de paie. Les champs sont pré-remplis avec le mois en cours.
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
                placeholder="Ex: Janvier 2025"
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
              <Label htmlFor="period-payment">Date de paiement prévue (optionnel)</Label>
              <Input
                id="period-payment"
                type="date"
                value={periodForm.payment_date}
                onChange={(e) => setPeriodForm({ ...periodForm, payment_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Date à laquelle les salaires seront payés
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPeriodDialog(false)}
              disabled={creatingPeriod}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleCreatePeriod}
              disabled={creatingPeriod}
            >
              {creatingPeriod ? "Création..." : "Créer la période"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
