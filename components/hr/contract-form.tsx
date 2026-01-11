"use client";

import { useState, useEffect } from "react";
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
import { 
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

interface ContractFormProps {
  orgSlug: string;
  employeeId?: string;
  contract?: Contract;
  onSuccess?: (contract: Contract) => void;
  onCancel?: () => void;
}

// Types de contrats avec descriptions
const CONTRACT_TYPES = [
  { value: ContractType.PERMANENT, label: "CDI", description: "Contrat à Durée Indéterminée" },
  { value: ContractType.TEMPORARY, label: "CDD", description: "Contrat à Durée Déterminée" },
  { value: ContractType.CONTRACT, label: "Contractuel", description: "Contrat de prestation" },
  { value: ContractType.INTERNSHIP, label: "Stage", description: "Convention de stage" },
  { value: ContractType.FREELANCE, label: "Freelance", description: "Consultant indépendant" },
];

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

  const isEditing = !!contract;

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <Alert variant="error">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        {/* Section 1: Type de contrat */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <HiOutlineDocumentText className="size-4" />
            TYPE DE CONTRAT
          </div>
          
          <FormField
            control={form.control}
            name="contract_type"
            rules={{ required: "Le type de contrat est requis" }}
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {CONTRACT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => field.onChange(type.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        field.value === type.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{type.label}</span>
                        {field.value === type.value && (
                          <HiOutlineCheckCircle className="size-4 text-primary" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Section 2: Période */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <HiOutlineCalendar className="size-4" />
            PÉRIODE DU CONTRAT
          </div>
          
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

            <FormField
              control={form.control}
              name="end_date"
              rules={{
                required: contractType === ContractType.TEMPORARY
                  ? "La date de fin est requise pour un CDD"
                  : false,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Date de fin {contractType === ContractType.TEMPORARY ? "*" : "(optionnel)"}
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  {contractType !== ContractType.TEMPORARY && (
                    <FormDescription>
                      CDI = pas de date de fin
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 3: Rémunération */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <HiOutlineBanknotes className="size-4" />
            RÉMUNÉRATION
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
                <FormItem className="md:col-span-1">
                  <FormLabel>Salaire de base *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      placeholder="0"
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GNF">GNF (Franc Guinéen)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="XOF">XOF (Franc CFA)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salary_period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Période</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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

          {/* Aperçu du salaire */}
          {form.watch("base_salary") > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="text-sm text-muted-foreground mb-1">Salaire</div>
              <div className="text-2xl font-bold">
                {form.watch("base_salary")?.toLocaleString('fr-FR')} {form.watch("currency")}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {SALARY_PERIOD_LABELS[form.watch("salary_period") as SalaryPeriod] || 'mois'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Temps de travail */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <HiOutlineClock className="size-4" />
            TEMPS DE TRAVAIL
          </div>
          
          <FormField
            control={form.control}
            name="hours_per_week"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heures par semaine</FormLabel>
                <div className="flex items-center gap-4">
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      className="w-32"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 40 : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 40 : value);
                      }}
                    />
                  </FormControl>
                  <span className="text-sm text-muted-foreground">heures/semaine</span>
                  
                  {/* Boutons rapides */}
                  <div className="flex gap-2">
                    {[35, 40, 45].map((hours) => (
                      <Button
                        key={hours}
                        type="button"
                        variant={field.value === hours ? "default" : "outline"}
                        size="sm"
                        onClick={() => field.onChange(hours)}
                      >
                        {hours}h
                      </Button>
                    ))}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Section 5: Informations complémentaires (Collapsible) */}
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <span className="group-open:rotate-90 transition-transform">▸</span>
              Informations complémentaires (optionnel)
            </div>
          </summary>
          
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-muted">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Description</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                      placeholder="Conditions particulières, avantages, notes..."
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
                  <FormLabel>Lien vers le document signé</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      {...field}
                      placeholder="https://drive.google.com/..."
                    />
                  </FormControl>
                  <FormDescription>
                    URL du contrat signé (Google Drive, Dropbox, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </details>

        {/* Boutons d'action */}
        <div className="flex gap-3 justify-end pt-6 border-t">
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
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading
              ? "Enregistrement..."
              : contract
              ? "Mettre à jour le contrat"
              : "Créer le contrat"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
