"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, Button } from "@/components/ui";
import { createDepartment, getDepartments } from "@/lib/services/hr/department.service";
import { getEmployees } from "@/lib/services/hr/employee.service";
import type { Department, Employee } from "@/lib/types/hr";
import {
  HiOutlineBriefcase,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import DepartmentForm, { DepartmentFormData } from "@/components/hr/departements/departement/forms/DepartementForm";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";

export default function CreateDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [employeesData, depts] = await Promise.all([
        getEmployees(slug, { employment_status: "active" }),
        getDepartments({ is_active: true, organization_subdomain: slug }),
      ]);
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
      // Map frontend field names to backend API field names
      const payload: Record<string, any> = {
        name: data.name,
        code: data.code,
        description: data.description,
        is_active: data.is_active,
      };
      // manager → manager_write (alias write-only pour head)
      if (data.manager) {
        payload.manager_write = data.manager;
      }
      // parent_department (envoyer seulement si non vide)
      if (data.parent_department) {
        payload.parent_department = data.parent_department;
      }
      await createDepartment(payload as any);
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
 <Can permission={COMMON_PERMISSIONS.HR.CREATE_DEPARTMENTS} showMessage>
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

      <DepartmentForm
        formMode="create"
        initialValues={{
          // Let the form auto-generate the code if not provided
          name: "",
          code: "",
          description: "",
          parent_department: "",
          is_active: true,
        }}
        employees={employees}
        departments={departments}
        loading={loading}
        onSubmit={onSubmit}
        cancelUrl={`/apps/${slug}/hr/departments`}
        submitLabel={
          <>
            <HiOutlineCheckCircle className="size-4 mr-2" />
            Créer le département
          </>
        }
      />
    </div>
 </Can>
  );
}
