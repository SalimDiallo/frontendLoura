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
  HiOutlineBanknotes,
  HiOutlineArrowLeft,
  HiOutlinePlusCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import { getPayroll, patchPayroll } from "@/lib/services/hr";
import type { Payroll, PayrollUpdate, PayrollItem } from "@/lib/types/hr";

export default function EditPayrollPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payroll, setPayroll] = useState<Payroll | null>(null);

  const [formData, setFormData] = useState<PayrollUpdate>({
    base_salary: 0,
    allowances: [],
    deductions: [],
    payment_method: "",
    notes: "",
  });

  useEffect(() => {
    loadPayroll();
  }, [id]);

  const loadPayroll = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const data = await getPayroll(id);
      setPayroll(data);

      // Pré-remplir le formulaire
      setFormData({
        base_salary: data.base_salary,
        allowances: data.allowances || [],
        deductions: data.deductions || [],
        payment_method: data.payment_method,
        notes: data.notes,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((formData.base_salary || 0) <= 0) {
      setError("Le salaire de base doit être supérieur à 0");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await patchPayroll(id, formData);
      router.push(`/apps/${slug}/hr/payroll/${id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la mise à jour";
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addAllowance = () => {
    setFormData({
      ...formData,
      allowances: [
        ...(formData.allowances || []),
        { name: "", amount: 0, is_deduction: false },
      ],
    });
  };

  const addDeduction = () => {
    setFormData({
      ...formData,
      deductions: [
        ...(formData.deductions || []),
        { name: "", amount: 0, is_deduction: true },
      ],
    });
  };

  const removeAllowance = (index: number) => {
    const newAllowances = [...(formData.allowances || [])];
    newAllowances.splice(index, 1);
    setFormData({ ...formData, allowances: newAllowances });
  };

  const removeDeduction = (index: number) => {
    const newDeductions = [...(formData.deductions || [])];
    newDeductions.splice(index, 1);
    setFormData({ ...formData, deductions: newDeductions });
  };

  const updateAllowance = (index: number, field: keyof PayrollItem, value: string | number) => {
    const newAllowances = [...(formData.allowances || [])];
    newAllowances[index] = { ...newAllowances[index], [field]: value };
    setFormData({ ...formData, allowances: newAllowances });
  };

  const updateDeduction = (index: number, field: keyof PayrollItem, value: string | number) => {
    const newDeductions = [...(formData.deductions || [])];
    newDeductions[index] = { ...newDeductions[index], [field]: value };
    setFormData({ ...formData, deductions: newDeductions });
  };

  const calculateGrossSalary = () => {
    const baseSalary = formData.base_salary || 0;
    const allowancesTotal = (formData.allowances || []).reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    return baseSalary + allowancesTotal;
  };

  const calculateNetSalary = () => {
    const grossSalary = calculateGrossSalary();
    const deductionsTotal = (formData.deductions || []).reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    return grossSalary - deductionsTotal;
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !payroll) {
    return (
      <div className="space-y-6">
        <Alert variant="error">{error}</Alert>
        <Button asChild>
          <Link href={`/apps/${slug}/hr/payroll`}>
            <HiOutlineArrowLeft className="size-4 mr-2" />
            Retour
          </Link>
        </Button>
      </div>
    );
  }

  if (payroll?.status === "paid") {
    return (
      <div className="space-y-6">
        <Alert variant="warning">
          Cette fiche de paie a déjà été payée et ne peut plus être modifiée.
        </Alert>
        <Button asChild>
          <Link href={`/apps/${slug}/hr/payroll/${id}`}>
            <HiOutlineArrowLeft className="size-4 mr-2" />
            Retour au détail
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/apps/${slug}/hr/payroll/${id}`}>
              <HiOutlineArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineBanknotes className="size-7" />
              Modifier la fiche de paie
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {payroll?.employee_details?.full_name || 'N/A'}
            </p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informations générales</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Employé</Label>
                <Input
                  value={payroll?.employee_details?.full_name || 'N/A'}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_salary">
                  Salaire de base <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="base_salary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_salary}
                  onChange={(e) =>
                    setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Période</Label>
                <Input
                  value={`${new Date(payroll?.start_date || '').toLocaleDateString("fr-FR")} - ${new Date(payroll?.end_date || '').toLocaleDateString("fr-FR")}`}
                  disabled
                  className="bg-muted"
                />
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
            </div>
          </Card>

          {/* Allowances */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Primes et indemnités</h2>
              <Button type="button" variant="outline" size="sm" onClick={addAllowance}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Ajouter
              </Button>
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
              <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Ajouter
              </Button>
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

          {/* Summary */}
          <Card className="p-6 border-0 shadow-sm bg-muted/50">
            <h2 className="text-lg font-semibold mb-4">Résumé</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Salaire de base</span>
                <span className="font-medium">{(formData.base_salary || 0).toFixed(2)} GNF</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total primes</span>
                <span className="font-medium text-green-600">
                  +{(formData.allowances || []).reduce((sum, a) => sum + (Number(a.amount) || 0), 0).toFixed(2)} GNF
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Salaire brut</span>
                <span className="font-semibold">{calculateGrossSalary().toFixed(2)} GNF</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total déductions</span>
                <span className="font-medium text-red-600">
                  -{(formData.deductions || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0).toFixed(2)} GNF
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-lg font-semibold">Salaire net</span>
                <span className="text-xl font-bold text-primary">
                  {calculateNetSalary().toFixed(2)} GNF
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
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
    </div>
  );
}
