"use client";

import { Can } from "@/components/apps/common";
import DepartmentForm, { DepartmentFormData } from "@/components/hr/departements/departement/forms/DepartementForm";
import { Alert, Button } from "@/components/ui";
import { getDepartment, getDepartments, updateDepartment } from "@/lib/services/hr/department.service";
import { getEmployees } from "@/lib/services/hr/employee.service";
import type { Department, Employee } from "@/lib/types/hr";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

export default function EditDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [department, setDepartment] = useState<Department | null>(null);

  useEffect(() => {
    loadFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setEmployees(employeesData.results as unknown as Employee[]);
      setDepartments(depts.filter((d: Department) => d.id !== id)); // Exclure le département actuel
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
      // Envoyer null si vidé pour permettre la suppression
      payload.manager_write = data.manager || null;
      // parent_department (envoyer null si vidé)
      payload.parent_department = data.parent_department || null;
      
      await updateDepartment(id, payload);
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
  <Can permission={COMMON_PERMISSIONS.HR.UPDATE_DEPARTMENTS} showMessage>
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

      <DepartmentForm
        formMode="edit"
        initialValues={{
          name: department.name,
          code: department.code,
          description: department.description || "",
          manager: department.manager || "",
          parent_department: department.parent_department || "",
          is_active: department.is_active,
        }}
        employees={employees}
        departments={departments}
        loading={loading}
        onSubmit={onSubmit}
        cancelUrl={`/apps/${slug}/hr/departments`}
        submitLabel={
          <>
            <HiOutlineCheckCircle className="size-4 mr-2" />
            Enregistrer les modifications
          </>
        }
      />
    </div>
  </Can>
  );
}
