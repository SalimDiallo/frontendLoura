"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import { Button, Card, Alert } from "@/components/ui";
import { ContractForm } from "@/components/hr/contract-form";
import { getEmployees } from "@/lib/services/hr";
import type { EmployeeListItem, Contract } from "@/lib/types/hr";
import { ProtectedRoute } from "@/components/apps/common";
import { HR_ROUTE_PERMISSIONS } from "@/lib/config/route-permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateContractPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const preselectedEmployeeId = searchParams.get('employee');

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preselectedEmployeeId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployees(slug, { page_size: 1000 });
      setEmployees(data.results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des employés";
      setError(errorMessage);
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (contract: Contract) => {
    router.push(`/apps/${slug}/hr/contracts/${contract.id}`);
  };

  const handleCancel = () => {
    router.push(`/apps/${slug}/hr/contracts`);
  };

  if (loading) {
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
    <ProtectedRoute config={HR_ROUTE_PERMISSIONS['/hr/contracts/create']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/contracts`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <HiOutlineDocumentText className="size-7" />
                Nouveau contrat
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Créez un nouveau contrat pour un employé
              </p>
            </div>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <Card className="p-6 border-0 shadow-sm">
          <div className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Employé *
              </label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name || employee.email} ({employee.employee_id || 'Sans matricule'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sélectionnez l'employé pour lequel vous souhaitez créer un contrat
              </p>
            </div>

            {/* Contract Form */}
            {selectedEmployeeId ? (
              <div className="pt-4 border-t">
                <ContractForm
                  orgSlug={slug}
                  employeeId={selectedEmployeeId}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Veuillez sélectionner un employé pour continuer
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
