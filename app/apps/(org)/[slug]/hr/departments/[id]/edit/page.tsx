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
import {
  getDepartment,
  updateDepartment,
  getDepartments,
} from "@/lib/services/hr/department.service";
import { getEmployees } from "@/lib/services/hr/employee.service";
import type { Department, Employee } from "@/lib/types/hr";
import {
  HiOutlineBriefcase,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const departmentSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  code: z.string().min(2, "Le code doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  manager: z.string().optional(),
  parent_department: z.string().optional(),
  is_active: z.boolean(),
});

type DepartmentFormData = {
  name: string;
  code: string;
  description?: string;
  manager?: string;
  parent_department?: string;
  is_active: boolean;
};

export default function EditDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [department, setDepartment] = useState<Department | null>(null);

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      is_active: true,
    },
  });

  useEffect(() => {
    loadFormData();
  }, [id]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [deptData, employeesData, depts] = await Promise.all([
        getDepartment(id),
        getEmployees(slug),
        getDepartments({ is_active: true, organization_subdomain: slug }),
      ]);

      setDepartment(deptData);
      setEmployees(employeesData.results.map((e: any) => ({ id: e.id, first_name: e.first_name || '', last_name: e.last_name || '' })));
      setDepartments(depts.filter(d => d.id !== id)); // Exclure le département actuel

      form.reset({
        name: deptData.name,
        code: deptData.code,
        description: deptData.description || "",
        manager: deptData.manager || "",
        parent_department: deptData.parent_department || "",
        is_active: deptData.is_active,
      });
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

      await updateDepartment(id, data);
      router.push(`/apps/${slug}/hr/departments`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la mise à jour du département");
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

  if (!department) {
    return (
      <div className="space-y-6">
        <Alert variant="error">Département non trouvé</Alert>
        <Button asChild>
          <Link href={`/apps/${slug}/hr/departments`}>
            <HiOutlineArrowLeft className="size-4 mr-2" />
            Retour à la liste
          </Link>
        </Button>
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
              Modifier Département
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-10">
            {department.name}
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informations générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputField
                name="name"
                label="Nom du département"
                placeholder="Ex: Ressources Humaines"
                required
              />
              <FormInputField
                name="code"
                label="Code"
                placeholder="Ex: RH"
                required
              />
              <FormTextareaField
                className="md:col-span-2"
                name="description"
                label="Description"
                placeholder="Description du département..."
                rows={3}
              />
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Organisation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelectField
                name="manager"
                label="Manager"
                placeholder="Sélectionner un manager"
                options={employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.first_name} ${emp.last_name}`,
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

          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/apps/${slug}/hr/departments`}>
                Annuler
              </Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Enregistrement...</>
              ) : (
                <>
                  <HiOutlineCheckCircle className="size-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
