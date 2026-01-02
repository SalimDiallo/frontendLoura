"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Alert, Button, Card, Form } from "@/components/ui";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/ui/form-fields";
import { createDepartment, getDepartments } from "@/lib/services/hr/department.service";
import { getEmployees } from "@/lib/services/hr/employee.service";
import type { Department, Employee } from "@/lib/types/hr";
import {
  HiOutlineBriefcase,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from "react-icons/hi2";

// Schema de validation
const departmentSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  code: z.string().min(2, "Le code doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  manager: z.string().optional(),
  parent_department: z.string().optional(),
  is_active: z.boolean(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface EmployeeOption extends Employee {
  // Adding flexible properties to satisfy type checks if needed,
  // but casting is better
}

export default function CreateDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      code:"",
      is_active: true,
    },
  });

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [employeesData, depts] = await Promise.all([
        getEmployees(slug, { employment_status: 'active' }),
        getDepartments({ is_active: true, organization_subdomain: slug }),
      ]);
      // Type assertion or mapping if structures differ slightly
      setEmployees(employeesData.results as unknown as Employee[]);
      setDepartments(depts);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données du formulaire");
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      setLoading(true);
      setError(null);

      await createDepartment(data);
      router.push(`/apps/${slug}/hr/departments`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la création du département");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/departments`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HiOutlineBriefcase className="size-7" />
              Nouveau Département
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            Créer un nouveau département
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
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
                    {...form.register('code')}
                    placeholder="DEP-241224-ABCD"
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const prefix = 'DEP';
                      const date = now.toISOString().slice(2, 10).replace(/-/g, '');
                      // Heure: HHMMSS - prendre juste HHMM pour raccourcir un peu par rapport à l'employé
                      const time = now.toTimeString().slice(0, 5).replace(/:/g, ''); 
                      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
                      const code = `${prefix}-${date}-${time}-${random}`;
                      form.setValue('code', code);
                    }}
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
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: emp.first_name && emp.last_name 
                    ? `${emp.first_name} ${emp.last_name}` 
                    : (emp as any).full_name || emp.email || "Utilisateur sans nom",
                }))}
              />
              <FormSelectField
                name="parent_department"
                label="Département parent"
                placeholder="Sélectionner un département parent"
                options={departments.map((dept) => ({
                  value: dept.id,
                  label: dept.name,
                }))}
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
              <Link href={`/apps/${slug}/hr/departments`}>
                Annuler
              </Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Création en cours...</>
              ) : (
                <>
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                  Créer le département
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
