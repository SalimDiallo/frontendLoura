
import { Button, Card, Form } from "@/components/ui";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/ui/form-fields";
import type { Department, Employee } from "@/lib/types/hr";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { HiOutlineCheckCircle, HiOutlineSparkles } from "react-icons/hi2";
import * as z from "zod";

export const departmentSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  code: z.string().min(2, "Le code doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  manager: z.string().optional(),
  parent_department: z.string().optional(),
  is_active: z.boolean(),
});

export type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  formMode: "create" | "edit";
  initialValues?: Partial<DepartmentFormData>;
  employees: Employee[];
  departments: Department[];
  loading: boolean;
  error?: string | null;
  onSubmit: (data: DepartmentFormData) => Promise<void> | void;
  cancelUrl: string;
  submitLabel?: React.ReactNode;
}

export default function DepartmentForm({
  formMode,
  initialValues,
  employees,
  departments,
  loading,
  onSubmit,
  cancelUrl,
  submitLabel,
}: DepartmentFormProps) {
  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: initialValues?.name || "",
      code: initialValues?.code || "",
      description: initialValues?.description || "",
      manager:  initialValues?.manager?.trim() === "" ? undefined : (initialValues?.manager || undefined),
      parent_department: initialValues?.parent_department || "",
      is_active: typeof initialValues?.is_active === "boolean" ? initialValues.is_active : true,
    },
  });

    useEffect(() => {
    form.reset({
      name: initialValues?.name || "",
      code: initialValues?.code || "",
      description: initialValues?.description ,
      manager:  initialValues?.manager?.trim() === "" ? undefined : (initialValues?.manager || undefined),
      parent_department: initialValues?.parent_department || "",
      is_active: typeof initialValues?.is_active === "boolean" ? initialValues.is_active : true,
    });
  }, [JSON.stringify(initialValues)]);

  const handleGenerateCode = () => {
    const now = new Date();
    const prefix = "DEP";
    const date = now.toISOString().slice(2, 10).replace(/-/g, "");
    const time = now.toTimeString().slice(0, 5).replace(/:/g, "");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${prefix}-${date}-${time}-${random}`;
    form.setValue("code", code);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Informations générales */}
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInputField
              name="name"
              label="Nom du département"
              placeholder="Ex: Ressources Humaines"
              required
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Code *</label>
              <div className="flex gap-2">
                <input
                  {...form.register("code")}
                  placeholder="DEP-241224-ABCD"
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCode}
                  className="h-10 gap-1"
                >
                  <HiOutlineSparkles className="size-4" />
                  Auto
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Cliquez sur Auto pour générer automatiquement</p>
            </div>
            <FormTextareaField
              className="md:col-span-2"
              name="description"
              label="Description"
              placeholder="Description du département..."
              rows={3}
            />
          </div>
        </Card>

        {/* Organisation */}
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Organisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelectField
              name="manager"
              label="Manager"
              placeholder="Sélectionner un manager"
              options={employees.map(emp => ({
                value: emp.id,
                label: emp.first_name && emp.last_name
                  ? `${emp.first_name} ${emp.last_name}`
                  : (emp as any).full_name || emp.email || "Utilisateur sans nom",
              }))}
              // Sélectionner par défaut si déjà un manager dans initialValues ou form
              defaultValue={form.getValues("manager") || undefined}
            />
            <FormSelectField
              name="parent_department"
              label="Département parent"
              placeholder="Sélectionner un département parent"
              options={departments.map(dept => ({
                value: dept.id,
                label: dept.name,
              }))}
              // Sélectionner par défaut si déjà un parent dans initialValues ou form
              defaultValue={form.getValues("parent_department") || undefined}
            />
          </div>
        </Card>

        {/* Statut */}
        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Statut</h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              {...form.register("is_active")}
              className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Département actif
            </label>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={cancelUrl}>
              Annuler
            </Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              formMode === "create"
                ? <>Création en cours...</>
                : <>Enregistrement...</>
            ) : (
              submitLabel ||
              <>
                <HiOutlineCheckCircle className="size-4 mr-2" />
                {formMode === "create"
                  ? "Créer le département"
                  : "Enregistrer les modifications"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
