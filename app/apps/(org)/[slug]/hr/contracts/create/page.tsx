"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { Button, Card, Alert, Badge, Input } from "@/components/ui";
import { ContractForm } from "@/components/hr/contract-form";
import { getEmployees } from "@/lib/services/hr";
import { contractService } from "@/lib/services/hr";
import type { EmployeeListItem, Contract } from "@/lib/types/hr";
import { ProtectedRoute } from "@/components/apps/common";
import { HR_ROUTE_PERMISSIONS } from "@/lib/config/route-permissions";

export default function CreateContractPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const preselectedEmployeeId = searchParams.get('employee');

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [checkingContract, setCheckingContract] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [slug]);

  // Si un employé est présélectionné, le charger
  useEffect(() => {
    if (preselectedEmployeeId && employees.length > 0) {
      const employee = employees.find(e => e.id === preselectedEmployeeId);
      if (employee) {
        handleSelectEmployee(employee);
      }
    }
  }, [preselectedEmployeeId, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployees(slug, { page_size: 1000, is_active: true });
      setEmployees(data.results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des employés";
      setError(errorMessage);
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = async (employee: EmployeeListItem) => {
    setSelectedEmployee(employee);
    setSearchQuery("");
    
    // Vérifier s'il a un contrat actif
    setCheckingContract(true);
    try {
      const contract = await contractService.getActiveContract(slug, employee.id);
      setActiveContract(contract);
    } catch (err) {
      console.error('Error checking active contract:', err);
      setActiveContract(null);
    } finally {
      setCheckingContract(false);
    }
  };

  const handleSuccess = (contract: Contract) => {
    router.push(`/apps/${slug}/hr/contracts/${contract.id}`);
  };

  const handleCancel = () => {
    if (selectedEmployee) {
      setSelectedEmployee(null);
      setActiveContract(null);
    } else {
      router.push(`/apps/${slug}/hr/contracts`);
    }
  };

  // Filtrer les employés par recherche
  const filteredEmployees = employees.filter(employee => {
    const query = searchQuery.toLowerCase();
    return (
      employee.full_name?.toLowerCase().includes(query) ||
      employee.email?.toLowerCase().includes(query) ||
      employee.employee_id?.toLowerCase().includes(query)
    );
  });

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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
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
              {selectedEmployee 
                ? `Créer un contrat pour ${selectedEmployee.full_name}`
                : "Sélectionnez un employé pour créer son contrat"
              }
            </p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Étape 1 : Sélection de l'employé */}
        {!selectedEmployee ? (
          <Card className="p-6 border-0 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg font-semibold">Sélectionner l'employé</h2>
              </div>

              {/* Barre de recherche */}
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou matricule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Liste des employés */}
              <div className="max-h-80 overflow-y-auto space-y-2">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <HiOutlineUser className="size-12 mx-auto opacity-50 mb-2" />
                    <p>Aucun employé trouvé</p>
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      onClick={() => handleSelectEmployee(employee)}
                      className="w-full p-4 text-left rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors flex items-center gap-4"
                    >
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                        {employee.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{employee.full_name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {employee.department_name || 'Aucun département'} • {employee.position_title || 'Aucun poste'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {employee.employee_id || 'Sans matricule'}
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Employé sélectionné */}
            <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-600 font-bold">
                  <HiOutlineCheckCircle className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-green-800 dark:text-green-200">
                    {selectedEmployee.full_name}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    {selectedEmployee.department_name || 'Aucun département'} • {selectedEmployee.employee_id || 'Sans matricule'}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedEmployee(null);
                    setActiveContract(null);
                  }}
                  className="text-green-700"
                >
                  Changer
                </Button>
              </div>
            </Card>

            {/* Avertissement contrat actif */}
            {checkingContract ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Vérification du contrat existant...
              </div>
            ) : activeContract ? (
              <Alert variant="warning" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <div className="space-y-2">
                  <div className="font-medium text-amber-800 dark:text-amber-200">
                    ⚠️ Cet employé a déjà un contrat actif
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>{activeContract.contract_type_display || activeContract.contract_type}</strong> depuis le {new Date(activeContract.start_date).toLocaleDateString('fr-FR')} 
                    {' '}• {activeContract.base_salary?.toLocaleString('fr-FR')} {activeContract.currency}/mois
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    Ce contrat sera automatiquement désactivé lors de la création du nouveau.
                  </div>
                </div>
              </Alert>
            ) : null}

            {/* Étape 2 : Formulaire du contrat */}
            <Card className="p-6 border-0 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-lg font-semibold">Informations du contrat</h2>
                </div>

                <ContractForm
                  orgSlug={slug}
                  employeeId={selectedEmployee.id}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
