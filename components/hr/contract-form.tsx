"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { ContractType, type ContractCreate, type Contract, SalaryPeriod } from "@/lib/types/hr";
import { contractService } from "@/lib/services/hr";
import { Alert } from "@/components/ui/alert";

interface ContractFormProps {
  orgSlug: string;
  employeeId?: string;
  contract?: Contract;
  onSuccess?: (contract: Contract) => void;
  onCancel?: () => void;
}

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.PERMANENT]: "CDI - Contrat à Durée Indéterminée",
  [ContractType.TEMPORARY]: "CDD - Contrat à Durée Déterminée",
  [ContractType.CONTRACT]: "Contractuel",
  [ContractType.INTERNSHIP]: "Stage",
  [ContractType.FREELANCE]: "Freelance/Consultant",
};

const SALARY_PERIOD_LABELS: Record<SalaryPeriod, string> = {
  hourly: "Horaire",
  daily: "Journalier",
  monthly: "Mensuel",
  annual: "Annuel",
};

export function ContractForm({
  orgSlug,
  employeeId,
  contract,
  onSuccess,
  onCancel,
}: ContractFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ContractCreate>({
    defaultValues: contract
      ? {
          employee: contract.employee,
          contract_type: contract.contract_type,
          start_date: contract.start_date,
          end_date: contract.end_date || undefined,
          base_salary: contract.base_salary,
          currency: contract.currency || "GNF",
          salary_period: contract.salary_period || "monthly",
          hours_per_week: contract.hours_per_week || 40,
          description: contract.description || "",
          contract_file_url: contract.contract_file_url || "",
          is_active: contract.is_active !== undefined ? contract.is_active : true,
        }
      : {
          employee: employeeId || "",
          contract_type: ContractType.PERMANENT,
          start_date: new Date().toISOString().split("T")[0],
          base_salary: 0,
          currency: "GNF",
          salary_period: "monthly",
          hours_per_week: 40,
          is_active: true,
        },
  });

  const contractType = form.watch("contract_type");

  const onSubmit = async (data: ContractCreate) => {
    setIsLoading(true);
    setError(null);

    try {
      let result: Contract;
      if (contract) {
        result = await contractService.updateContract(orgSlug, contract.id, data);
      } else {
        result = await contractService.createContract(orgSlug, data);
      }
      onSuccess?.(result);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="error">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="contract_type"
          rules={{ required: "Le type de contrat est requis" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de contrat *</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type de contrat" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            rules={{ required: "La date de début est requise" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de début *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {contractType === ContractType.TEMPORARY && (
            <FormField
              control={form.control}
              name="end_date"
              rules={{
                required:
                  contractType === ContractType.TEMPORARY
                    ? "La date de fin est requise pour un CDD"
                    : false,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Date de fin {contractType === ContractType.TEMPORARY && "*"}
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {contractType !== ContractType.TEMPORARY && (
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de fin (optionnel)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Laisser vide pour un contrat sans date de fin
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="base_salary"
            rules={{
              required: "Le salaire de base est requis",
              min: { value: 0, message: "Le salaire doit être positif" },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salaire de base *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Devise</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="GNF" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salary_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Période de salaire</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(SALARY_PERIOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="hours_per_week"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heures par semaine</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 40 : parseFloat(e.target.value);
                    field.onChange(isNaN(value) ? 40 : value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Nombre d'heures de travail par semaine (défaut: 40)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Détails additionnels sur le contrat..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contract_file_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL du fichier du contrat</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  {...field}
                  placeholder="https://..."
                />
              </FormControl>
              <FormDescription>
                Lien vers le document du contrat signé
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Enregistrement..."
              : contract
              ? "Mettre à jour"
              : "Créer le contrat"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
